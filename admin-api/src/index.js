// Admin API for house-engineering.com
// Staff log in with email + password; edits are committed to the GitHub repo,
// which triggers the GitHub Action that rebuilds and republishes the site.

const FILES = ['settings', 'services', 'projects', 'partners'];
const SESSION_HOURS = 12;
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const PBKDF2_ITERATIONS = 100000;

const enc = new TextEncoder();
const dec = new TextDecoder();

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// ---------------------------------------------------------------- encoding
function bytesToB64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
const b64ToBytes = b64 => Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0));
const b64url = bytes => bytesToB64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlToBytes = s => b64ToBytes(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));

// ---------------------------------------------------------------- crypto
async function hashPassword(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS }, key, 256);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToB64(salt)}$${bytesToB64(new Uint8Array(bits))}`;
}

async function verifyPassword(password, stored) {
  const [, , salt] = stored.split('$');
  const candidate = await hashPassword(password, b64ToBytes(salt));
  return timingSafeEqual(candidate, stored);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmac(env, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

async function signToken(env, payload) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  return `${body}.${b64url(await hmac(env, body))}`;
}

async function readToken(env, req) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const [body, sig] = token.split('.');
  if (!body || !sig) throw new HttpError(401, 'Please log in.');
  if (!timingSafeEqual(b64url(await hmac(env, body)), sig)) throw new HttpError(401, 'Please log in.');
  const payload = JSON.parse(dec.decode(b64urlToBytes(body)));
  if (payload.exp < Date.now()) throw new HttpError(401, 'Your session expired. Please log in again.');
  const user = await getUser(env, payload.email);
  if (!user) throw new HttpError(401, 'This account no longer exists.');
  return user;
}

// ---------------------------------------------------------------- users
const userKey = email => `user:${String(email).trim().toLowerCase()}`;
const getUser = async (env, email) => env.USERS.get(userKey(email), 'json');
const publicUser = u => ({ email: u.email, name: u.name, role: u.role });

function requireOwner(user) {
  if (user.role !== 'owner') throw new HttpError(403, 'Only the account owner can manage users.');
}

function checkPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');
}

// ---------------------------------------------------------------- github
async function gh(env, path, init = {}) {
  const res = await fetch(`https://api.github.com/repos/${env.REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'aeh-admin-api',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (res.status === 409 || res.status === 422) {
    throw new HttpError(409, 'Someone else saved changes at the same time. Reload the page and try again.');
  }
  if (!res.ok) throw new HttpError(502, `Could not reach the website storage (GitHub ${res.status}).`);
  return res.json();
}

async function readFile(env, name) {
  const f = await gh(env, `/contents/content/${name}.json?ref=${env.BRANCH}`);
  return { data: JSON.parse(dec.decode(b64ToBytes(f.content))), sha: f.sha };
}

async function commitFile(env, path, bytes, message, sha) {
  const body = { message, content: bytesToB64(bytes), branch: env.BRANCH };
  if (sha) body.sha = sha;
  const res = await gh(env, `/contents/${path}`, { method: 'PUT', body: JSON.stringify(body) });
  return res.content.sha;
}

// ---------------------------------------------------------------- routes
async function route(req, env, url) {
  const { pathname } = url;
  const method = req.method;
  const body = () => req.json().catch(() => { throw new HttpError(400, 'Invalid request.'); });

  if (pathname === '/api/login' && method === 'POST') {
    const { email, password } = await body();
    const failKey = `fail:${String(email).toLowerCase()}`;
    const fails = Number(await env.USERS.get(failKey)) || 0;
    if (fails >= 8) throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.');
    const user = await getUser(env, email);
    if (!user || !(await verifyPassword(String(password || ''), user.hash))) {
      await env.USERS.put(failKey, String(fails + 1), { expirationTtl: 900 });
      throw new HttpError(401, 'Wrong email or password.');
    }
    await env.USERS.delete(failKey);
    const token = await signToken(env, { email: user.email, exp: Date.now() + SESSION_HOURS * 3600e3 });
    return { token, user: publicUser(user) };
  }

  const user = await readToken(env, req);

  if (pathname === '/api/me' && method === 'GET') return { user: publicUser(user) };

  if (pathname === '/api/content' && method === 'GET') {
    const entries = await Promise.all(FILES.map(async f => [f, await readFile(env, f)]));
    return Object.fromEntries(entries);
  }

  const contentMatch = pathname.match(/^\/api\/content\/([a-z]+)$/);
  if (contentMatch && method === 'PUT') {
    const name = contentMatch[1];
    if (!FILES.includes(name)) throw new HttpError(404, 'Unknown section.');
    const { data, sha } = await body();
    if (data === null || typeof data !== 'object') throw new HttpError(400, 'Invalid content.');
    const bytes = enc.encode(JSON.stringify(data, null, 2) + '\n');
    const newSha = await commitFile(env, `content/${name}.json`, bytes, `Admin: update ${name} (by ${user.email})`, sha);
    return { sha: newSha };
  }

  if (pathname === '/api/upload' && method === 'POST') {
    const { name, type, data } = await body();
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type];
    if (!ext) throw new HttpError(400, 'Please upload a JPG, PNG or WEBP image.');
    const bytes = b64ToBytes(String(data || ''));
    if (bytes.length > MAX_UPLOAD_BYTES) throw new HttpError(413, 'Image is too large (max 6 MB).');
    const slug = String(name || 'image').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image';
    const file = `uploads/${Date.now()}-${slug}.${ext}`;
    await commitFile(env, `src/assets/img/${file}`, bytes, `Admin: upload image ${file} (by ${user.email})`);
    return { image: file };
  }

  if (pathname === '/api/deploy' && method === 'GET') {
    const runs = await gh(env, `/actions/runs?branch=${env.BRANCH}&per_page=1`);
    const run = runs.workflow_runs[0];
    return run
      ? { status: run.status, conclusion: run.conclusion, createdAt: run.created_at, updatedAt: run.updated_at }
      : { status: 'none' };
  }

  if (pathname === '/api/password' && method === 'POST') {
    const { current, next } = await body();
    if (!(await verifyPassword(String(current || ''), user.hash))) throw new HttpError(400, 'Current password is wrong.');
    checkPassword(next);
    await env.USERS.put(userKey(user.email), JSON.stringify({ ...user, hash: await hashPassword(next) }));
    return { ok: true };
  }

  if (pathname === '/api/users' && method === 'GET') {
    requireOwner(user);
    const list = await env.USERS.list({ prefix: 'user:' });
    const users = await Promise.all(list.keys.map(k => env.USERS.get(k.name, 'json')));
    return { users: users.filter(Boolean).map(publicUser) };
  }

  if (pathname === '/api/users' && method === 'POST') {
    requireOwner(user);
    const { email, name, password, role } = await body();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email || ''))) throw new HttpError(400, 'Enter a valid email address.');
    checkPassword(password);
    const existing = await getUser(env, email);
    if (existing && existing.role === 'owner' && existing.email !== user.email) throw new HttpError(400, 'That account is an owner.');
    const record = {
      email: String(email).trim().toLowerCase(),
      name: String(name || '').trim(),
      role: role === 'owner' ? 'owner' : 'editor',
      hash: await hashPassword(password),
    };
    await env.USERS.put(userKey(email), JSON.stringify(record));
    return { user: publicUser(record) };
  }

  const userMatch = pathname.match(/^\/api\/users\/(.+)$/);
  if (userMatch && method === 'DELETE') {
    requireOwner(user);
    const email = decodeURIComponent(userMatch[1]).toLowerCase();
    if (email === user.email) throw new HttpError(400, 'You cannot remove your own account.');
    await env.USERS.delete(userKey(email));
    return { ok: true };
  }

  throw new HttpError(404, 'Not found.');
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGINS.split(',').map(s => s.trim());
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(req.url);
    let status = 200, payload;
    try {
      payload = await route(req, env, url);
    } catch (err) {
      status = err instanceof HttpError ? err.status : 500;
      payload = { error: err instanceof HttpError ? err.message : 'Something went wrong. Please try again.' };
      if (!(err instanceof HttpError)) console.error(err);
    }
    return new Response(JSON.stringify(payload), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  },
};
