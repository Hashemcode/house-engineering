(() => {
  const API = (window.AEH_API || '').replace(/\/$/, '');
  const IMG = '../assets/img/';
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');

  const CATS = [
    ['hvac', 'HVAC', 'التكييف'],
    ['fire', 'Fire Protection', 'الحماية من الحريق'],
    ['electrical', 'Electrical', 'الكهرباء'],
    ['plumbing', 'Plumbing', 'السباكة'],
    ['security', 'Security & ELV', 'الأمن والتيار الخفيف'],
  ];

  // ------------------------------------------------------------ i18n
  const T = {
    en: {
      adminTitle: 'Website admin', loginHint: 'Sign in to update projects, services and company details.',
      email: 'Email', password: 'Password', login: 'Sign in', signingIn: 'Signing in…',
      projects: 'Projects', services: 'Services', partners: 'Partners', settings: 'Company info', users: 'Admins', account: 'My account',
      projectsIntro: 'Projects with a photo appear as cards. Projects without a photo appear in the project table.',
      servicesIntro: 'Each service gets its own section on the Services page and a line on the home page.',
      partnersIntro: 'Logos shown in the scrolling partners strip.',
      settingsIntro: 'Contact details shown across the whole website.',
      usersIntro: 'People who can sign in to this admin panel.',
      accountIntro: 'Change the password you use to sign in.',
      addNew: 'Add new', search: 'Search…', edit: 'Edit', delete: 'Delete', moveUp: 'Move up', moveDown: 'Move down',
      noPhoto: 'No photo', badgeHome: 'On home page', badgeTable: 'In table', empty: 'Nothing here yet.',
      back: 'Back', cancel: 'Cancel', savePublish: 'Save & publish', saving: 'Saving…',
      saved: 'Saved. The website updates in about a minute.', deleted: 'Deleted. The website updates in about a minute.',
      orderSaved: 'New order saved.', confirmDelete: 'Delete “{name}”? It will be removed from the website.',
      discard: 'You have unsaved changes. Leave without saving?', required: 'Please fill in: ',
      addRow: 'Add line', uploadImage: 'Upload photo', replaceImage: 'Replace photo', removeImage: 'Remove photo',
      noImage: 'No photo yet', uploading: 'Uploading…', badImage: 'This image could not be read. Please use a JPG or PNG photo.',
      viewSite: 'View website', logout: 'Sign out',
      live: 'Website is up to date', publishing: 'Publishing changes…', failed: 'Publishing failed — please contact support', unknown: 'Still publishing — check the website shortly',
      loading: 'Loading…', notConfigured: 'The admin panel is not connected yet.',
      f_name: 'Project name', f_client: 'Client', f_location: 'Location (city)', f_photo: 'Photo',
      h_photo: 'Landscape photos look best. Large photos are resized automatically. Without a photo, the project is listed in the table.',
      f_categories: 'Type of work', h_categories: 'Used for the filter buttons on the Projects page.',
      f_tags: 'Short labels', h_tags: 'Shown as small tags, e.g. “HVAC” or “Firefighting”.',
      f_scope: 'Scope of work', h_scope: 'What was delivered — one item per line.',
      f_featured: 'Show on home page', h_featured: 'Include this project in the slider on the home page.',
      f_title: 'Service name', f_keywords: 'Keywords', h_keywords: 'Shown under the name, e.g. “Chillers · VRV · Controls”.',
      f_summary: 'Short summary', h_summary: 'One sentence shown on the home page.',
      f_paragraphs: 'Description', h_paragraphs: 'Paragraphs shown on the Services page.',
      f_points: 'Key points', h_points: 'Short bullet points listed under the description.',
      f_partner: 'Company name', f_logo: 'Logo', h_logo: 'A PNG logo with a transparent background looks best.',
      f_company: 'Company name', f_phone: 'Phone / WhatsApp number', h_phone: 'Include the country code, e.g. +966 59 006 8070',
      f_email1: 'Main email', f_email2: 'Second email', f_address: 'Office address', f_hours: 'Working hours',
      f_linkedin: 'LinkedIn link', f_facebook: 'Facebook link',
      u_name: 'Name', u_role: 'Role', role_editor: 'Editor — can edit website content', role_owner: 'Owner — can also add and remove admins',
      u_add: 'Add admin', u_temp: 'Temporary password (at least 8 characters)',
      u_added: 'Admin added. Share the email and temporary password with them privately.',
      u_remove: 'Remove', u_confirm: 'Remove admin access for {name}?', u_removed: 'Access removed.', you: 'You',
      owner: 'Owner', editor: 'Editor',
      pw_current: 'Current password', pw_new: 'New password (at least 8 characters)', pw_change: 'Change password', pw_changed: 'Password changed.',
    },
    ar: {
      adminTitle: 'لوحة تحكم الموقع', loginHint: 'سجّل الدخول لتحديث المشاريع والخدمات وبيانات الشركة.',
      email: 'البريد الإلكتروني', password: 'كلمة المرور', login: 'تسجيل الدخول', signingIn: 'جارٍ تسجيل الدخول…',
      projects: 'المشاريع', services: 'الخدمات', partners: 'الشركاء', settings: 'بيانات الشركة', users: 'المشرفون', account: 'حسابي',
      projectsIntro: 'المشاريع التي لها صورة تظهر كبطاقات، والمشاريع بدون صورة تظهر في جدول المشاريع.',
      servicesIntro: 'لكل خدمة قسم خاص في صفحة الخدمات وسطر في الصفحة الرئيسية.',
      partnersIntro: 'الشعارات التي تظهر في شريط الشركاء المتحرك.',
      settingsIntro: 'بيانات التواصل التي تظهر في جميع صفحات الموقع.',
      usersIntro: 'الأشخاص الذين يمكنهم الدخول إلى لوحة التحكم.',
      accountIntro: 'غيّر كلمة المرور التي تستخدمها لتسجيل الدخول.',
      addNew: 'إضافة جديد', search: 'بحث…', edit: 'تعديل', delete: 'حذف', moveUp: 'تحريك لأعلى', moveDown: 'تحريك لأسفل',
      noPhoto: 'بدون صورة', badgeHome: 'في الصفحة الرئيسية', badgeTable: 'في الجدول', empty: 'لا يوجد شيء بعد.',
      back: 'رجوع', cancel: 'إلغاء', savePublish: 'حفظ ونشر', saving: 'جارٍ الحفظ…',
      saved: 'تم الحفظ. سيتم تحديث الموقع خلال دقيقة تقريباً.', deleted: 'تم الحذف. سيتم تحديث الموقع خلال دقيقة تقريباً.',
      orderSaved: 'تم حفظ الترتيب الجديد.', confirmDelete: 'حذف «{name}»؟ سيتم إزالته من الموقع.',
      discard: 'لديك تغييرات غير محفوظة. هل تريد المغادرة دون حفظ؟', required: 'يرجى تعبئة: ',
      addRow: 'إضافة سطر', uploadImage: 'رفع صورة', replaceImage: 'تغيير الصورة', removeImage: 'إزالة الصورة',
      noImage: 'لا توجد صورة بعد', uploading: 'جارٍ الرفع…', badImage: 'تعذرت قراءة الصورة. يرجى استخدام صورة JPG أو PNG.',
      viewSite: 'عرض الموقع', logout: 'تسجيل الخروج',
      live: 'الموقع محدّث', publishing: 'جارٍ نشر التغييرات…', failed: 'فشل النشر — يرجى التواصل مع الدعم', unknown: 'لا يزال النشر جارياً — تحقق من الموقع بعد قليل',
      loading: 'جارٍ التحميل…', notConfigured: 'لوحة التحكم غير متصلة بعد.',
      f_name: 'اسم المشروع', f_client: 'العميل', f_location: 'الموقع (المدينة)', f_photo: 'الصورة',
      h_photo: 'الصور الأفقية هي الأفضل، ويتم تصغير الصور الكبيرة تلقائياً. المشروع بدون صورة يظهر في الجدول.',
      f_categories: 'نوع العمل', h_categories: 'يُستخدم لأزرار التصفية في صفحة المشاريع.',
      f_tags: 'تسميات قصيرة', h_tags: 'تظهر كوسوم صغيرة، مثل «التكييف» أو «مكافحة الحريق».',
      f_scope: 'نطاق العمل', h_scope: 'ما تم تنفيذه — بند واحد في كل سطر.',
      f_featured: 'إظهار في الصفحة الرئيسية', h_featured: 'إضافة هذا المشروع إلى شريط المشاريع في الصفحة الرئيسية.',
      f_title: 'اسم الخدمة', f_keywords: 'كلمات مفتاحية', h_keywords: 'تظهر أسفل الاسم، مثل «المبردات · VRV · التحكم».',
      f_summary: 'ملخص قصير', h_summary: 'جملة واحدة تظهر في الصفحة الرئيسية.',
      f_paragraphs: 'الوصف', h_paragraphs: 'فقرات تظهر في صفحة الخدمات.',
      f_points: 'النقاط الرئيسية', h_points: 'نقاط قصيرة تظهر أسفل الوصف.',
      f_partner: 'اسم الشركة', f_logo: 'الشعار', h_logo: 'يفضل شعار PNG بخلفية شفافة.',
      f_company: 'اسم الشركة', f_phone: 'رقم الهاتف / واتساب', h_phone: 'مع رمز الدولة، مثل ‎+966 59 006 8070',
      f_email1: 'البريد الرئيسي', f_email2: 'البريد الثاني', f_address: 'عنوان المكتب', f_hours: 'ساعات العمل',
      f_linkedin: 'رابط لينكدإن', f_facebook: 'رابط فيسبوك',
      u_name: 'الاسم', u_role: 'الصلاحية', role_editor: 'محرر — يمكنه تعديل محتوى الموقع', role_owner: 'مالك — يمكنه أيضاً إضافة وإزالة المشرفين',
      u_add: 'إضافة مشرف', u_temp: 'كلمة مرور مؤقتة (8 أحرف على الأقل)',
      u_added: 'تمت إضافة المشرف. شارك البريد وكلمة المرور المؤقتة معه بشكل خاص.',
      u_remove: 'إزالة', u_confirm: 'إزالة صلاحية {name}؟', u_removed: 'تمت إزالة الصلاحية.', you: 'أنت',
      owner: 'مالك', editor: 'محرر',
      pw_current: 'كلمة المرور الحالية', pw_new: 'كلمة المرور الجديدة (8 أحرف على الأقل)', pw_change: 'تغيير كلمة المرور', pw_changed: 'تم تغيير كلمة المرور.',
    },
  };

  const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
  };

  let uiLang = store.get('aeh-ui-lang') === 'ar' ? 'ar' : 'en';
  const t = (k, vars) => {
    let s = T[uiLang][k] ?? T.en[k] ?? k;
    if (vars) for (const [key, v] of Object.entries(vars)) s = s.replace(`{${key}}`, v);
    return s;
  };
  const applyLang = () => {
    document.documentElement.lang = uiLang;
    document.documentElement.dir = uiLang === 'ar' ? 'rtl' : 'ltr';
  };

  // ------------------------------------------------------------ helpers
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));
  const bi = () => ({ en: '', ar: '' });
  const slug = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const setPath = (obj, path, value) => {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o[k] ??= /^\d+$/.test(k) ? [] : {}), obj);
    target[last] = value;
  };
  const imgSrc = p => S.previews[p] || IMG + p;
  const biText = v => (v && (v[uiLang] || v.en || v.ar)) || '';

  let toastTimer;
  function toast(msg, kind = '') {
    toastEl.textContent = msg;
    toastEl.className = `show ${kind}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.className = ''), 4800);
  }

  // ------------------------------------------------------------ state
  const S = {
    token: store.get('aeh-token'), user: null, content: null,
    view: 'projects', edit: null, draft: null, dirty: false, saving: false,
    previews: {}, users: null, deploy: 'live', queue: Promise.resolve(),
  };

  async function api(path, { method = 'GET', body } = {}) {
    let res;
    try {
      res = await fetch(API + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(S.token ? { Authorization: `Bearer ${S.token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error(uiLang === 'ar' ? 'تعذر الاتصال. تحقق من الإنترنت.' : 'Could not connect. Check your internet connection.');
    }
    const json = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== '/api/login') {
      signOut();
      throw new Error(json.error || 'Please sign in again.');
    }
    if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.');
    return json;
  }

  // ------------------------------------------------------------ schemas
  const COLL = {
    projects: {
      title: p => biText(p.name),
      sub: p => [biText(p.client), biText(p.location)].filter(Boolean).join(' · '),
      thumb: p => p.image,
      badges: p => [p.featured && p.image ? [t('badgeHome'), ''] : null, !p.image ? [t('badgeTable'), 'grey'] : null].filter(Boolean),
      blank: () => ({ id: '', name: bi(), location: bi(), client: bi(), tags: [], categories: [], image: '', scope: [], featured: true }),
      addToTop: true,
      searchable: true,
      fields: [
        { type: 'bi', key: 'name', label: 'f_name', required: true },
        { type: 'image', key: 'image', label: 'f_photo', hint: 'h_photo' },
        { type: 'bi', key: 'client', label: 'f_client' },
        { type: 'bi', key: 'location', label: 'f_location' },
        { type: 'checks', key: 'categories', label: 'f_categories', hint: 'h_categories' },
        { type: 'bilist', key: 'tags', label: 'f_tags', hint: 'h_tags' },
        { type: 'bilist', key: 'scope', label: 'f_scope', hint: 'h_scope' },
        { type: 'toggle', key: 'featured', label: 'f_featured', hint: 'h_featured' },
      ],
    },
    services: {
      title: s => biText(s.title),
      sub: s => biText(s.tags),
      thumb: s => s.image,
      badges: () => [],
      blank: () => ({ id: '', image: '', focus: '50% 50%', title: bi(), tags: bi(), summary: bi(), paragraphs: [], points: [] }),
      fields: [
        { type: 'bi', key: 'title', label: 'f_title', required: true },
        { type: 'image', key: 'image', label: 'f_photo', required: true },
        { type: 'bi', key: 'tags', label: 'f_keywords', hint: 'h_keywords' },
        { type: 'bi', key: 'summary', label: 'f_summary', hint: 'h_summary', multiline: true, required: true },
        { type: 'bilist', key: 'paragraphs', label: 'f_paragraphs', hint: 'h_paragraphs', multiline: true },
        { type: 'bilist', key: 'points', label: 'f_points', hint: 'h_points' },
      ],
    },
    partners: {
      title: p => p.name,
      sub: () => '',
      thumb: p => p.logo,
      logo: true,
      badges: () => [],
      blank: () => ({ name: '', logo: '' }),
      fields: [
        { type: 'text', key: 'name', label: 'f_partner', required: true },
        { type: 'image', key: 'logo', label: 'f_logo', hint: 'h_logo', logo: true, required: true },
      ],
    },
  };

  const SETTINGS_FIELDS = [
    { type: 'bi', key: 'company', label: 'f_company', required: true },
    { type: 'text', key: 'phone', label: 'f_phone', hint: 'h_phone', input: 'tel', required: true },
    { type: 'text', key: 'emailPrimary', label: 'f_email1', input: 'email', required: true },
    { type: 'text', key: 'emailSecondary', label: 'f_email2', input: 'email' },
    { type: 'bi', key: 'address', label: 'f_address', multiline: true },
    { type: 'bi', key: 'hours', label: 'f_hours' },
    { type: 'text', key: 'linkedin', label: 'f_linkedin', input: 'url' },
    { type: 'text', key: 'facebook', label: 'f_facebook', input: 'url' },
  ];

  // ------------------------------------------------------------ field renderers
  const hintHtml = f => (f.hint ? `<span class="hint">${esc(t(f.hint))}</span>` : '');
  const labelHtml = f => `<span class="field-label">${esc(t(f.label))}${f.required ? ' *' : ''}</span>${hintHtml(f)}`;

  function control(path, dir, multiline, ariaLabel) {
    const v = esc(getPath(S.draft, path) ?? '');
    const common = `data-path="${path}" dir="${dir}" aria-label="${esc(ariaLabel)}"`;
    return multiline ? `<textarea ${common} rows="4">${v}</textarea>` : `<input type="text" ${common} value="${v}">`;
  }

  const FIELD = {
    bi: f => `<div class="field">${labelHtml(f)}<div class="bi">
        <label class="bi-col"><span class="lang-tag">English</span>${control(`${f.key}.en`, 'ltr', f.multiline, `${t(f.label)} English`)}</label>
        <label class="bi-col"><span class="lang-tag">العربية</span>${control(`${f.key}.ar`, 'rtl', f.multiline, `${t(f.label)} Arabic`)}</label>
      </div></div>`,

    text: f => `<div class="field"><label>${labelHtml(f)}
        <input type="${f.input || 'text'}" dir="ltr" data-path="${f.key}" value="${esc(getPath(S.draft, f.key) ?? '')}"></label></div>`,

    bilist: f => {
      const rows = getPath(S.draft, f.key) || [];
      return `<div class="field">${labelHtml(f)}<div class="rows">${rows.map((_, j) => `<div class="row">
          <div class="bi">${control(`${f.key}.${j}.en`, 'ltr', f.multiline, `${t(f.label)} ${j + 1} English`)}${control(`${f.key}.${j}.ar`, 'rtl', f.multiline, `${t(f.label)} ${j + 1} Arabic`)}</div>
          <button type="button" class="icon danger" data-action="row-del" data-key="${f.key}" data-j="${j}" aria-label="${esc(t('delete'))}">✕</button>
        </div>`).join('')}</div>
        <button type="button" class="btn small" data-action="row-add" data-key="${f.key}">+ ${esc(t('addRow'))}</button></div>`;
    },

    image: f => {
      const v = getPath(S.draft, f.key);
      return `<div class="field">${labelHtml(f)}<div class="image-field">
          <div class="image-preview ${f.logo ? 'logo' : ''}">${v ? `<img src="${esc(imgSrc(v))}" alt="">` : `<span>${esc(t('noImage'))}</span>`}</div>
          <div class="image-actions">
            <label class="btn"><input type="file" accept="image/*" data-upload="${f.key}" data-kind="${f.logo ? 'logo' : 'photo'}" hidden>${esc(t(v ? 'replaceImage' : 'uploadImage'))}</label>
            ${v && !f.required ? `<button type="button" class="btn ghost" data-action="img-clear" data-key="${f.key}">${esc(t('removeImage'))}</button>` : ''}
            <span class="muted small" data-upload-status="${f.key}"></span>
          </div>
        </div></div>`;
    },

    checks: f => {
      const vals = getPath(S.draft, f.key) || [];
      return `<div class="field">${labelHtml(f)}<div class="checks">${CATS.map(([v, en, ar]) =>
        `<label class="check"><input type="checkbox" data-check="${f.key}" value="${v}" ${vals.includes(v) ? 'checked' : ''}>${esc(uiLang === 'ar' ? ar : en)}</label>`).join('')}</div></div>`;
    },

    toggle: f => `<div class="field"><label class="toggle">
        <input type="checkbox" data-path="${f.key}" data-bool ${getPath(S.draft, f.key) ? 'checked' : ''}><span class="switch"></span>
        <span><b>${esc(t(f.label))}</b>${f.hint ? `<span class="muted small">${esc(t(f.hint))}</span>` : ''}</span></label></div>`,
  };

  // ------------------------------------------------------------ views
  const langToggle = () => `<div class="lang-toggle" role="group" aria-label="Language">
      <button type="button" data-action="lang" data-lang="en" class="${uiLang === 'en' ? 'on' : ''}">English</button>
      <button type="button" data-action="lang" data-lang="ar" class="${uiLang === 'ar' ? 'on' : ''}">العربية</button></div>`;

  function renderLogin(error = '') {
    app.innerHTML = `<div class="login"><form class="login-card" data-form="login">
        <img class="login-logo" src="${IMG}logo-dark.png" alt="Advanced Engineering House">
        <h1>${esc(t('adminTitle'))}</h1>
        <p class="muted">${esc(t('loginHint'))}</p>
        <label class="stack">${esc(t('email'))}<input name="email" type="email" required autocomplete="username" dir="ltr"></label>
        <label class="stack">${esc(t('password'))}<input name="password" type="password" required autocomplete="current-password" dir="ltr"></label>
        <p class="err" role="alert">${esc(error)}</p>
        <button class="btn primary" type="submit">${esc(t('login'))}</button>
        ${langToggle()}
      </form></div>`;
    app.querySelector('input[name=email]').focus();
  }

  const pillHtml = () => `<span class="pill ${S.deploy}" data-pill>${esc(t(S.deploy))}</span>`;
  const renderPill = () => { const el = app.querySelector('[data-pill]'); if (el) el.outerHTML = pillHtml(); };

  function render() {
    if (!S.user) return renderLogin();
    const nav = [
      ['projects', S.content.projects.data.length], ['services', S.content.services.data.length],
      ['partners', S.content.partners.data.length], ['settings'],
      ...(S.user.role === 'owner' ? [['users']] : []), ['account'],
    ];
    app.innerHTML = `<div class="shell">
      <aside class="side">
        <img class="side-logo" src="${IMG}logo-light.png" alt="Advanced Engineering House">
        <nav>${nav.map(([v, n]) => `<button class="nav-item ${S.view === v ? 'active' : ''}" data-action="nav" data-view="${v}">${esc(t(v))}${n != null ? `<span class="count">${n}</span>` : ''}</button>`).join('')}</nav>
        <div class="side-foot">${langToggle()}
          <a class="side-link" href="../${uiLang === 'ar' ? 'ar/' : ''}" target="_blank" rel="noopener">${esc(t('viewSite'))} ↗</a>
          <button class="side-link" data-action="logout">${esc(t('logout'))}</button>
        </div>
      </aside>
      <main class="main">
        <header class="topbar"><span class="who">${esc(S.user.name || S.user.email)}</span>${pillHtml()}</header>
        <div class="content">${viewHtml()}</div>
      </main></div>`;
  }

  function viewHtml() {
    if (S.view === 'settings') return settingsHtml();
    if (S.view === 'users') return usersHtml();
    if (S.view === 'account') return accountHtml();
    return S.edit ? editorHtml() : listHtml();
  }

  const head = (title, intro, action = '') => `<div class="page-head"><div><h1>${esc(title)}</h1>${intro ? `<p class="muted">${esc(intro)}</p>` : ''}</div>${action}</div>`;

  function listHtml() {
    const c = COLL[S.view];
    const items = S.content[S.view].data;
    const rows = items.map((it, i) => {
      const thumb = c.thumb(it);
      const badges = c.badges(it).map(([b, cls]) => `<span class="badge ${cls}">${esc(b)}</span>`).join('');
      return `<li class="item" data-text="${esc([c.title(it), c.sub(it), it.name?.en, it.name?.ar].join(' ').toLowerCase())}">
        <div class="thumb ${c.logo ? 'logo' : ''}">${thumb ? `<img src="${esc(imgSrc(thumb))}" alt="" loading="lazy">` : esc(t('noPhoto'))}</div>
        <div class="item-main"><b>${esc(c.title(it))}</b>${c.sub(it) ? `<span class="muted">${esc(c.sub(it))}</span>` : ''}${badges ? `<div class="badges">${badges}</div>` : ''}</div>
        <div class="item-actions">
          <button class="icon" data-action="move" data-dir="-1" data-i="${i}" aria-label="${esc(t('moveUp'))}" title="${esc(t('moveUp'))}" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="icon" data-action="move" data-dir="1" data-i="${i}" aria-label="${esc(t('moveDown'))}" title="${esc(t('moveDown'))}" ${i === items.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn small" data-action="edit" data-i="${i}">${esc(t('edit'))}</button>
          <button class="btn small danger-ghost" data-action="delete" data-i="${i}">${esc(t('delete'))}</button>
        </div></li>`;
    }).join('');
    return head(t(S.view), t(`${S.view}Intro`), `<button class="btn primary" data-action="new">+ ${esc(t('addNew'))}</button>`) +
      (c.searchable ? `<input class="search" type="search" placeholder="${esc(t('search'))}" data-search>` : '') +
      (items.length ? `<ul class="items">${rows}</ul>` : `<div class="empty">${esc(t('empty'))}</div>`);
  }

  function editorHtml() {
    const c = COLL[S.view];
    const isNew = S.edit.i < 0;
    return `<div class="page-head"><div><button class="link" data-action="back">${uiLang === 'ar' ? '→' : '←'} ${esc(t('back'))}</button>
        <h1>${esc(isNew ? t('addNew') : c.title(S.content[S.view].data[S.edit.i]))}</h1></div></div>
      <form class="editor" data-form="edit" novalidate>${c.fields.map(f => FIELD[f.type](f)).join('')}
        <div class="savebar"><button type="button" class="btn" data-action="back">${esc(t('cancel'))}</button>
          <button class="btn primary" type="submit" ${S.saving ? 'disabled' : ''}>${esc(t(S.saving ? 'saving' : 'savePublish'))}</button></div>
      </form>`;
  }

  function settingsHtml() {
    return head(t('settings'), t('settingsIntro')) +
      `<form class="editor" data-form="settings" novalidate>${SETTINGS_FIELDS.map(f => FIELD[f.type](f)).join('')}
        <div class="savebar"><button class="btn primary" type="submit" ${S.saving ? 'disabled' : ''}>${esc(t(S.saving ? 'saving' : 'savePublish'))}</button></div>
      </form>`;
  }

  function usersHtml() {
    if (!S.users) return head(t('users'), t('usersIntro')) + `<p class="muted">${esc(t('loading'))}</p>`;
    const rows = S.users.map(u => `<div class="user-row"><div><b>${esc(u.name || u.email)}${u.email === S.user.email ? ` · ${esc(t('you'))}` : ''}</b>
        <span class="muted small">${esc(u.email)} · ${esc(t(u.role))}</span></div>
        ${u.email !== S.user.email ? `<button class="btn small danger-ghost" data-action="user-del" data-email="${esc(u.email)}" data-name="${esc(u.name || u.email)}">${esc(t('u_remove'))}</button>` : ''}</div>`).join('');
    return head(t('users'), t('usersIntro')) + `<div class="items">${rows}</div>
      <form class="panel" data-form="user-add"><h2>${esc(t('u_add'))}</h2>
        <div class="grid2">
          <label class="stack">${esc(t('u_name'))}<input name="name" required></label>
          <label class="stack">${esc(t('email'))}<input name="email" type="email" required dir="ltr" autocomplete="off"></label>
        </div>
        <label class="stack">${esc(t('u_temp'))}<input name="password" type="text" required minlength="8" dir="ltr" autocomplete="new-password"></label>
        <label class="stack">${esc(t('u_role'))}<select name="role"><option value="editor">${esc(t('role_editor'))}</option><option value="owner">${esc(t('role_owner'))}</option></select></label>
        <div><button class="btn primary" type="submit">${esc(t('u_add'))}</button></div>
      </form>`;
  }

  function accountHtml() {
    return head(t('account'), t('accountIntro')) + `<form class="panel" data-form="password" style="margin-top:0">
        <p><b>${esc(S.user.name || '')}</b> <span class="muted">${esc(S.user.email)}</span></p>
        <label class="stack">${esc(t('pw_current'))}<input name="current" type="password" required dir="ltr" autocomplete="current-password"></label>
        <label class="stack">${esc(t('pw_new'))}<input name="next" type="password" required minlength="8" dir="ltr" autocomplete="new-password"></label>
        <div><button class="btn primary" type="submit">${esc(t('pw_change'))}</button></div>
      </form>`;
  }

  // ------------------------------------------------------------ saving
  function saveFile(name, data, okMsg) {
    const run = async () => {
      S.saving = true;
      try {
        const res = await api(`/api/content/${name}`, { method: 'PUT', body: { data, sha: S.content[name].sha } });
        S.content[name] = { data, sha: res.sha };
        toast(okMsg, 'ok');
        watchDeploy();
        return true;
      } catch (err) {
        toast(err.message, 'err');
        return false;
      } finally {
        S.saving = false;
      }
    };
    const p = S.queue.then(run);
    S.queue = p.catch(() => {});
    return p;
  }

  let deployTimer;
  function watchDeploy() {
    const since = Date.now() - 15000;
    const started = Date.now();
    S.deploy = 'publishing';
    renderPill();
    clearInterval(deployTimer);
    deployTimer = setInterval(async () => {
      try {
        const d = await api('/api/deploy');
        const fresh = d.createdAt && new Date(d.createdAt).getTime() >= since;
        if (fresh && d.status === 'completed') {
          S.deploy = d.conclusion === 'success' ? 'live' : 'failed';
          clearInterval(deployTimer);
        } else if (Date.now() - started > 6 * 60e3) {
          S.deploy = 'unknown';
          clearInterval(deployTimer);
        }
        renderPill();
      } catch { /* keep polling */ }
    }, 8000);
  }

  function missingRequired(fields) {
    for (const f of fields) {
      if (!f.required) continue;
      const v = getPath(S.draft, f.key);
      const empty = f.type === 'bi' ? !(v?.en?.trim() || v?.ar?.trim()) : !String(v ?? '').trim();
      if (empty) return t(f.label);
    }
    return null;
  }

  function cleanDraft(fields) {
    for (const f of fields) {
      const v = getPath(S.draft, f.key);
      if (f.type === 'bi' && v) setPath(S.draft, f.key, { en: (v.en || '').trim(), ar: (v.ar || '').trim() });
      if (f.type === 'text' && typeof v === 'string') setPath(S.draft, f.key, v.trim());
      if (f.type === 'bilist') {
        setPath(S.draft, f.key, (v || []).map(r => ({ en: (r.en || '').trim(), ar: (r.ar || '').trim() })).filter(r => r.en || r.ar));
      }
    }
  }

  function uniqueId(base, list) {
    const taken = new Set(list.map(x => x.id));
    let id = base || 'item', n = 2;
    while (taken.has(id)) id = `${base || 'item'}-${n++}`;
    return id;
  }

  async function submitEdit() {
    const c = COLL[S.view];
    const miss = missingRequired(c.fields);
    if (miss) return toast(t('required') + miss, 'err');
    cleanDraft(c.fields);
    const list = clone(S.content[S.view].data);
    const item = S.draft;
    if (S.edit.i < 0) {
      if ('id' in item) item.id = uniqueId(slug(item.name?.en || item.title?.en) || `item-${Date.now()}`, list);
      c.addToTop ? list.unshift(item) : list.push(item);
    } else {
      list[S.edit.i] = item;
    }
    render();
    if (await saveFile(S.view, list, t('saved'))) {
      S.edit = null; S.draft = null; S.dirty = false;
      window.scrollTo(0, 0);
    }
    render();
  }

  async function submitSettings() {
    const miss = missingRequired(SETTINGS_FIELDS);
    if (miss) return toast(t('required') + miss, 'err');
    cleanDraft(SETTINGS_FIELDS);
    S.draft.phoneDigits = String(S.draft.phone || '').replace(/\D/g, '');
    const data = clone(S.draft);
    render();
    if (await saveFile('settings', data, t('saved'))) S.dirty = false;
    S.draft = clone(S.content.settings.data);
    render();
  }

  // ------------------------------------------------------------ images
  async function shrink(file, max, kind) {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const toBlob = (type, q) => new Promise(r => canvas.toBlob(r, type, q));
    let blob = await toBlob('image/webp', 0.82);
    if (!blob || blob.type !== 'image/webp') blob = kind === 'logo' ? await toBlob('image/png') : await toBlob('image/jpeg', 0.85);
    const dataUrl = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
    return { blob, dataUrl };
  }

  async function upload(input) {
    const file = input.files[0];
    if (!file) return;
    const key = input.dataset.upload;
    const kind = input.dataset.kind;
    const status = app.querySelector(`[data-upload-status="${key}"]`);
    status.textContent = t('uploading');
    let shrunk;
    try {
      shrunk = await shrink(file, kind === 'logo' ? 800 : 1800, kind);
    } catch {
      status.textContent = '';
      return toast(t('badImage'), 'err');
    }
    try {
      const res = await api('/api/upload', { method: 'POST', body: { name: file.name, type: shrunk.blob.type, data: shrunk.dataUrl.split(',')[1] } });
      S.previews[res.image] = shrunk.dataUrl;
      setPath(S.draft, key, res.image);
      S.dirty = true;
      render();
    } catch (err) {
      status.textContent = '';
      toast(err.message, 'err');
    }
  }

  // ------------------------------------------------------------ navigation
  const confirmLeave = () => !S.dirty || confirm(t('discard'));

  function go(view) {
    S.view = view; S.edit = null; S.dirty = false;
    S.draft = view === 'settings' ? clone(S.content.settings.data) : null;
    render();
    window.scrollTo(0, 0);
    if (view === 'users') loadUsers();
  }

  async function loadUsers() {
    try { S.users = (await api('/api/users')).users; } catch (err) { toast(err.message, 'err'); S.users = []; }
    if (S.view === 'users') render();
  }

  function signOut() {
    S.token = null; S.user = null; S.content = null; S.dirty = false;
    store.set('aeh-token', null);
    clearInterval(deployTimer);
    renderLogin();
  }

  let reorderTimer;
  const actions = {
    nav: b => confirmLeave() && go(b.dataset.view),
    lang: b => { uiLang = b.dataset.lang; store.set('aeh-ui-lang', uiLang); applyLang(); S.user ? render() : renderLogin(); },
    logout: () => confirmLeave() && signOut(),
    new: () => { S.edit = { i: -1 }; S.draft = COLL[S.view].blank(); S.dirty = false; render(); window.scrollTo(0, 0); },
    edit: b => { S.edit = { i: +b.dataset.i }; S.draft = clone(S.content[S.view].data[+b.dataset.i]); S.dirty = false; render(); window.scrollTo(0, 0); },
    back: () => { if (!confirmLeave()) return; S.edit = null; S.draft = null; S.dirty = false; render(); },
    delete: async b => {
      const i = +b.dataset.i;
      const name = COLL[S.view].title(S.content[S.view].data[i]);
      if (!confirm(t('confirmDelete', { name }))) return;
      const list = clone(S.content[S.view].data);
      list.splice(i, 1);
      await saveFile(S.view, list, t('deleted'));
      render();
    },
    move: b => {
      const i = +b.dataset.i, j = i + +b.dataset.dir;
      const view = S.view;
      const list = S.content[view].data;
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
      render();
      clearTimeout(reorderTimer);
      reorderTimer = setTimeout(() => saveFile(view, clone(S.content[view].data), t('orderSaved')), 1800);
    },
    'row-add': b => {
      const rows = getPath(S.draft, b.dataset.key) || [];
      rows.push(bi());
      setPath(S.draft, b.dataset.key, rows);
      S.dirty = true;
      render();
      const inputs = app.querySelectorAll(`[data-path^="${b.dataset.key}.${rows.length - 1}."]`);
      inputs[0]?.focus();
    },
    'row-del': b => { getPath(S.draft, b.dataset.key).splice(+b.dataset.j, 1); S.dirty = true; render(); },
    'img-clear': b => { setPath(S.draft, b.dataset.key, ''); S.dirty = true; render(); },
    'user-del': async b => {
      if (!confirm(t('u_confirm', { name: b.dataset.name }))) return;
      try { await api(`/api/users/${encodeURIComponent(b.dataset.email)}`, { method: 'DELETE' }); toast(t('u_removed'), 'ok'); loadUsers(); }
      catch (err) { toast(err.message, 'err'); }
    },
  };

  const forms = {
    login: async form => {
      const btn = form.querySelector('button[type=submit]');
      const errEl = form.querySelector('.err');
      btn.disabled = true; btn.textContent = t('signingIn'); errEl.textContent = '';
      try {
        const { token, user } = await api('/api/login', { method: 'POST', body: { email: form.email.value.trim(), password: form.password.value } });
        S.token = token; S.user = user;
        store.set('aeh-token', token);
        await loadContent();
        go('projects');
      } catch (err) {
        btn.disabled = false; btn.textContent = t('login'); errEl.textContent = err.message;
      }
    },
    edit: () => submitEdit(),
    settings: () => submitSettings(),
    'user-add': async form => {
      try {
        await api('/api/users', { method: 'POST', body: { name: form.name.value, email: form.email.value, password: form.password.value, role: form.role.value } });
        toast(t('u_added'), 'ok');
        form.reset();
        loadUsers();
      } catch (err) { toast(err.message, 'err'); }
    },
    password: async form => {
      try {
        await api('/api/password', { method: 'POST', body: { current: form.current.value, next: form.next.value } });
        toast(t('pw_changed'), 'ok');
        form.reset();
      } catch (err) { toast(err.message, 'err'); }
    },
  };

  app.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (b && !b.disabled) actions[b.dataset.action]?.(b, e);
  });
  app.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.path !== undefined && el.dataset.bool === undefined) { setPath(S.draft, el.dataset.path, el.value); S.dirty = true; }
    if (el.dataset.search !== undefined) {
      const q = el.value.trim().toLowerCase();
      app.querySelectorAll('.item').forEach(li => (li.hidden = q && !li.dataset.text.includes(q)));
    }
  });
  app.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.bool !== undefined) { setPath(S.draft, el.dataset.path, el.checked); S.dirty = true; }
    if (el.dataset.check) {
      const vals = new Set(getPath(S.draft, el.dataset.check) || []);
      el.checked ? vals.add(el.value) : vals.delete(el.value);
      setPath(S.draft, el.dataset.check, CATS.map(c => c[0]).filter(v => vals.has(v)));
      S.dirty = true;
    }
    if (el.dataset.upload) upload(el);
  });
  app.addEventListener('submit', e => {
    e.preventDefault();
    forms[e.target.dataset.form]?.(e.target);
  });
  addEventListener('beforeunload', e => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

  async function loadContent() {
    app.innerHTML = `<div class="loading">${esc(t('loading'))}</div>`;
    S.content = await api('/api/content');
  }

  async function boot() {
    applyLang();
    if (!API) {
      app.innerHTML = `<div class="login"><div class="login-card"><h1>${esc(t('adminTitle'))}</h1><p class="muted">${esc(t('notConfigured'))}</p></div></div>`;
      return;
    }
    if (!S.token) return renderLogin();
    try {
      S.user = (await api('/api/me')).user;
      await loadContent();
      go('projects');
    } catch (err) {
      renderLogin(S.token ? err.message : '');
    }
  }

  boot();
})();
