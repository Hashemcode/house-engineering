#!/usr/bin/env python3
"""Static site builder for Advanced Engineering House.
English pages -> dist/, Arabic (RTL) pages -> dist/ar/.
Content lives in this file as (en, ar) pairs."""
import html, json, re, shutil
from pathlib import Path

ROOT = Path(__file__).parent
SRC, DIST = ROOT / "src", ROOT / "dist"
DOMAIN = "https://www.house-engineering.com"

CONTENT = ROOT / "content"

ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"/></svg>'

# ------------------------------------------------------------------ content
# Editable content lives in content/*.json (managed through /admin).
NAV = [
    ("index.html", ("Home", "الرئيسية")),
    ("about.html", ("About", "من نحن")),
    ("services.html", ("Services", "خدماتنا")),
    ("projects.html", ("Projects", "مشاريعنا")),
    ("contact.html", ("Contact", "تواصل معنا")),
]

CATS = {
    "hvac": ("HVAC", "التكييف"),
    "fire": ("Fire Protection", "الحماية من الحريق"),
    "electrical": ("Electrical", "الكهرباء"),
    "plumbing": ("Plumbing", "السباكة"),
    "security": ("Security & ELV", "الأمن والتيار الخفيف"),
}


def load(name):
    return json.loads((CONTENT / f"{name}.json").read_text(encoding="utf-8"))


def safe_url(u):
    u = str(u or "").strip()
    return html.escape(u) if u.startswith(("https://", "http://")) else ""


SETTINGS = load("settings")
PHONE = html.escape(SETTINGS.get("phone", ""))
PHONE_RAW = re.sub(r"\D", "", SETTINGS.get("phoneDigits") or SETTINGS.get("phone", ""))
EMAIL_1 = html.escape(SETTINGS.get("emailPrimary", ""))
EMAIL_2 = html.escape(SETTINGS.get("emailSecondary", ""))
LINKEDIN = safe_url(SETTINGS.get("linkedin"))
FACEBOOK = safe_url(SETTINGS.get("facebook"))
COMPANY, ADDRESS, HOURS = SETTINGS["company"], SETTINGS["address"], SETTINGS["hours"]

SERVICES = [dict(id=re.sub(r"[^a-z0-9-]", "", s["id"]), img=s["image"], pos=s.get("focus") or "50% 50%", t=s["title"], tags=s["tags"],
                 short=s["summary"], body=s.get("paragraphs", []), points=s.get("points", [])) for s in load("services")]


def _cats(p):
    return " ".join(c for c in p.get("categories", []) if c in CATS)


_projects = load("projects")
PROJECTS = [dict(n=p["name"], loc=p.get("location", {}), c=p.get("client", {}), s=p.get("tags", []), cats=_cats(p),
                 img=p["image"], d=p.get("scope", []), featured=p.get("featured", False)) for p in _projects if p.get("image")]
LEDGER = [(p["name"], p.get("client", {}),
           {lg: " · ".join(t.get(lg) or t.get("en", "") for t in p.get("tags", [])) for lg in ("en", "ar")}, _cats(p))
          for p in _projects if not p.get("image")]
PARTNERS = [(p["logo"], p["name"]) for p in load("partners") if p.get("logo")]
TOTAL_PROJECTS = len(_projects)

SECTORS = [
    ("commercial", ("Commercial", "تجاري"), ("Offices, retail & fuel stations", "مكاتب ومتاجر ومحطات وقود"),
     '<path d="M4 21V4h10v17M14 9h6v12M7 8h2M7 12h2M7 16h2M17 13h1M17 17h1M2 21h20"/>'),
    ("residential", ("Residential", "سكني"), ("Villas, palaces & compounds", "فلل وقصور ومجمعات"),
     '<path d="M3 11l9-7 9 7M5 9.5V21h14V9.5M10 21v-6h4v6"/>'),
    ("industrial", ("Industrial", "صناعي"), ("Factories, plants & power stations", "مصانع ومحطات طاقة"),
     '<path d="M2 21V11l6 3.5V11l6 3.5V7h3l1 -4h2l1 4v14zM2 21h20M6 18h2M11 18h2"/>'),
    ("hospitality", ("Hospitality", "ضيافة"), ("Hotels, restaurants & gyms", "فنادق ومطاعم وأندية رياضية"),
     '<path d="M3 18h18M5 18a7 7 0 0114 0M12 8v3M10 8h4M2 21h20"/>'),
    ("medical", ("Medical", "طبي"), ("Hospitals & critical care", "مستشفيات ورعاية حرجة"),
     '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>'),
    ("educational", ("Educational", "تعليمي"), ("Schools & institutions", "مدارس ومؤسسات"),
     '<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>'),
]

# ------------------------------------------------------------------ helpers
def tr(lang):
    """Pick a language. Dicts come from editable JSON (escaped, English fallback); tuples are trusted template copy."""
    i = 0 if lang == "en" else 1

    def L(p):
        if isinstance(p, dict):
            return html.escape(str(p.get(lang) or p.get("en") or ""))
        return p[i]
    return L


def head(lang, page, title, desc, a):
    L = tr(lang)
    path_en = f"{DOMAIN}/{page}" if page != "index.html" else f"{DOMAIN}/"
    path_ar = f"{DOMAIN}/ar/{page}" if page != "index.html" else f"{DOMAIN}/ar/"
    canon = path_en if lang == "en" else path_ar
    ld = {
        "@context": "https://schema.org", "@type": "Organization",
        "name": "Advanced Engineering House Co.", "alternateName": "بيت الهندسة المتقدمة",
        "url": DOMAIN + "/", "logo": DOMAIN + "/assets/img/logo-dark.png", "foundingDate": "2018",
        "email": EMAIL_1, "telephone": PHONE,
        "address": {"@type": "PostalAddress", "streetAddress": "Alghunaim Tower, 7th Floor, Office 31, Prince Mohammed bin Fahd St.",
                    "addressLocality": "Dammam", "addressCountry": "SA"},
        "sameAs": [LINKEDIN, FACEBOOK],
    }
    return f"""<!doctype html>
<html lang="{lang}" dir="{'rtl' if lang == 'ar' else 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canon}">
<link rel="alternate" hreflang="en" href="{path_en}">
<link rel="alternate" hreflang="ar" href="{path_ar}">
<link rel="alternate" hreflang="x-default" href="{path_en}">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{DOMAIN}/assets/img/og.jpg">
<meta property="og:url" content="{canon}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#070f16">
<link rel="icon" href="{a}assets/img/favicon.png">
<link rel="apple-touch-icon" href="{a}assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Manrope:wght@400;500;600;700&{'family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&' if lang == 'ar' else ''}display=swap" rel="stylesheet">
<link rel="stylesheet" href="{a}assets/css/main.css">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
<a class="skip" href="#main">{L(("Skip to content", "انتقل إلى المحتوى"))}</a>
"""


def header(lang, page, a):
    L = tr(lang)
    other = f"{'ar/' if lang == 'en' else '../'}{page}"
    current = ' aria-current="page"'
    links = "".join(
        f'<li><a href="{href}"{current if href == page else ""}>{L(lbl)}</a></li>' for href, lbl in NAV)
    mlinks = "".join(f'<a href="{href}">{L(lbl)}</a>' for href, lbl in NAV)
    return f"""<header class="site-header">
  <div class="wrap nav">
    <a class="brand" href="index.html" aria-label="{L(COMPANY)}"><img src="{a}assets/img/logo-light.png" alt="{L(COMPANY)}" width="796" height="219"></a>
    <nav aria-label="{L(('Primary', 'القائمة الرئيسية'))}"><ul class="nav-links">{links}</ul></nav>
    <div class="nav-actions">
      <a class="lang" href="{other}" hreflang="{'ar' if lang == 'en' else 'en'}" lang="{'ar' if lang == 'en' else 'en'}">{'العربية' if lang == 'en' else 'English'}</a>
      <a class="btn btn-primary nav-cta" href="contact.html">{L(('Request a proposal', 'اطلب عرض سعر'))}</a>
      <button class="burger" aria-label="{L(('Menu', 'القائمة'))}" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="mobile-menu" aria-label="{L(('Menu', 'القائمة'))}">
  {mlinks}
  <div class="mm-foot"><a class="ltr" href="tel:+{PHONE_RAW}" style="font-size:18px">{PHONE}</a><a href="mailto:{EMAIL_1}" style="font-size:18px">{EMAIL_1}</a></div>
</div>
"""


def cta(lang):
    L = tr(lang)
    return f"""<section class="cta">
  <div class="wrap cta-inner">
    <div class="reveal">
      <span class="eyebrow">{L(('Start a project', 'ابدأ مشروعك'))}</span>
      <h2 class="display h2" style="margin-top:22px">{L(('Your future<br>starts here.', 'مستقبلك<br>يبدأ هنا.'))}</h2>
    </div>
    <div class="cta-actions reveal" data-delay="1">
      <a class="big" href="tel:+{PHONE_RAW}">{PHONE}</a>
      <a class="big" href="mailto:{EMAIL_1}">{EMAIL_1}</a>
      <a class="btn btn-dark" href="contact.html" style="margin-top:14px">{L(('Request a proposal', 'اطلب عرض سعر'))} {ARROW}</a>
    </div>
  </div>
</section>
"""


def footer(lang, a):
    L = tr(lang)
    svc = "".join(f'<li><a href="services.html#{s["id"]}">{L(s["t"])}</a></li>' for s in SERVICES[:6])
    nav = "".join(f'<li><a href="{h}">{L(l)}</a></li>' for h, l in NAV)
    return f"""<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <img src="{a}assets/img/logo-light.png" alt="{L(COMPANY)}" width="796" height="219" loading="lazy">
        <p>{L(('Mechanical, electrical, plumbing, fire-safety and network engineering across the Kingdom — since 2018.', 'هندسة الأنظمة الميكانيكية والكهربائية والسباكة والسلامة من الحريق والشبكات في أنحاء المملكة — منذ 2018.'))}</p>
        <div class="socials">
          <a href="{LINKEDIN}" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 21 11.2 21 14.5V21h-4v-5.8c0-1.4-.03-3.2-1.95-3.2-1.95 0-2.25 1.52-2.25 3.1V21H9z"/></svg></a>
          <a href="{FACEBOOK}" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.8c0-.9.25-1.5 1.55-1.5h1.65V3.4c-.3-.04-1.27-.12-2.4-.12-2.38 0-4 1.45-4 4.1v2.4H7.6V13h2.7v8z"/></svg></a>
          <a href="https://wa.me/{PHONE_RAW}" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.3-.5 0-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg></a>
        </div>
      </div>
      <div><h4>{L(('Navigate', 'تصفح'))}</h4><ul>{nav}</ul></div>
      <div><h4>{L(('Services', 'الخدمات'))}</h4><ul>{svc}</ul></div>
      <div class="foot-contact"><h4>{L(('Head Office — Dammam', 'المقر الرئيسي — الدمام'))}</h4>
        <ul>
          <li>{L(ADDRESS)}</li>
          <li><a class="ltr" href="tel:+{PHONE_RAW}">{PHONE}</a></li>
          <li><a href="mailto:{EMAIL_1}">{EMAIL_1}</a></li>
          <li><a href="mailto:{EMAIL_2}">{EMAIL_2}</a></li>
          <li>{L(HOURS)}</li>
        </ul>
      </div>
    </div>
    <div class="foot-mega" aria-hidden="true">{L(('ADVANCED', 'بيت الهندسة'))}</div>
    <div class="foot-bar">
      <span>© <span data-year>2026</span> {L(('Advanced Engineering House Co. All rights reserved.', 'شركة بيت الهندسة المتقدمة. جميع الحقوق محفوظة.'))}</span>
      <span>{L(('Dammam · Dubai', 'الدمام · دبي'))}</span>
    </div>
  </div>
</footer>
<a class="wa" href="https://wa.me/{PHONE_RAW}" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.3-.5 0-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg></a>
<script src="{a}assets/js/main.js" defer></script>
</body>
</html>
"""


def page_hero(lang, a, img, eyebrow, title_html, lead, crumb, pos="50% 50%"):
    L = tr(lang)
    return f"""<section class="hero page-hero">
  <div class="hero-media"><img src="{a}assets/img/{img}.webp" alt="" style="object-position:{pos}" fetchpriority="high"></div>
  <div class="hero-slashes" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="wrap hero-content">
    <nav class="crumbs" aria-label="breadcrumb"><a href="index.html">{L(('Home', 'الرئيسية'))}</a><span>/</span><span>{crumb}</span></nav>
    <span class="eyebrow">{eyebrow}</span>
    <h1 class="display h1" style="margin-top:26px">{title_html}</h1>
    <p class="lead" style="margin-top:30px">{lead}</p>
  </div>
</section>
"""


def project_card(lang, a, p, detailed=False, lazy=True):
    L = tr(lang)
    chips = "".join(f"<li>{L(s)}</li>" for s in p["s"])
    scope = ""
    if detailed:
        scope = '<ul class="card-scope">' + "".join(f"<li>{L(d)}</li>" for d in p["d"]) + "</ul>"
    return f"""<article class="card" data-cats="{p['cats']}">
  <span class="client">{L(p['c'])}</span>
  <div class="card-media"><img src="{a}assets/img/{html.escape(p['img'])}" alt="{L(p['n'])}" loading="{'lazy' if lazy else 'eager'}"></div>
  <div class="card-body">
    <span class="card-loc">{L(p['loc'])}</span>
    <h3>{L(p['n'])}</h3>
    <ul class="chips">{chips}</ul>{scope}
  </div>
</article>"""


def partners_marquee(a):
    tiles = "".join(f'<div class="logo-tile"><img src="{a}assets/img/{html.escape(f)}" alt="{html.escape(n)}" loading="lazy"></div>' for f, n in PARTNERS)
    return f"""<div class="marquee" role="list"><div class="marquee-track">
  <div class="marquee-group">{tiles}</div><div class="marquee-group" aria-hidden="true">{tiles}</div>
</div></div>"""


def sectors_html(lang):
    L = tr(lang)
    return '<div class="sectors">' + "".join(
        f'<div class="sector reveal" data-delay="{i % 3}"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{icon}</svg><div><b>{L(t)}</b><span>{L(d)}</span></div></div>'
        for i, (_, t, d, icon) in enumerate(SECTORS)) + "</div>"


# ------------------------------------------------------------------ pages
def page_index(lang, a):
    L = tr(lang)
    disc_items = "".join(f"""<li class="disc-item" data-caption="{L(s['short'])}"><a href="services.html#{s['id']}">
  <span class="num">{i + 1:02d}</span><span><h3>{L(s['t'])}</h3><span class="tags">{L(s['tags'])}</span></span><span class="arrow">{ARROW}</span></a></li>"""
                         for i, s in enumerate(SERVICES))
    disc_imgs = "".join(f'<img src="{a}assets/img/{html.escape(s["img"])}" alt="" loading="lazy" style="object-position:{html.escape(s["pos"])}">' for s in SERVICES)
    rail = "".join(project_card(lang, a, p) for p in ([p for p in PROJECTS if p["featured"]] or PROJECTS)[:12])
    steps = [
        (("Engineer", "الهندسة"), ("We analyse every line of the specification and design for performance and economy.", "نحلل كل تفصيل في المواصفات ونصمم لتحقيق الأداء والجدوى الاقتصادية.")),
        (("Supply", "التوريد"), ("Equipment from world-class manufacturers — YORK, Daikin, GF and more.", "معدات من كبرى الشركات العالمية — يورك ودايكن وجي إف وغيرها.")),
        (("Execute", "التنفيذ"), ("Skilled crews and modern machinery install, test and commission on schedule.", "فرق ماهرة ومعدات حديثة تركّب وتختبر وتشغّل في الموعد المحدد.")),
        (("Sustain", "الاستدامة"), ("Planned and reactive maintenance keeps critical systems performing.", "صيانة وقائية وطارئة تحافظ على أداء الأنظمة الحيوية.")),
    ]
    steps_html = "".join(f'<div class="step reveal" data-delay="{i}"><h3>{L(t)}</h3><p>{L(d)}</p></div>' for i, (t, d) in enumerate(steps))

    body = f"""<main id="main">
<section class="hero">
  <div class="hero-media"><img src="{a}assets/img/hero-plant.webp" alt="" fetchpriority="high"></div>
  <div class="hero-slashes" aria-hidden="true"><i></i><i></i><i></i></div>
  <span class="scroll-cue" aria-hidden="true">{L(('Scroll', 'مرر'))}</span>
  <div class="wrap hero-content">
    <span class="eyebrow">{L(('MEP · Fire Protection · Networks — Dammam & Dubai', 'الأنظمة الكهروميكانيكية · الحماية من الحريق · الشبكات — الدمام ودبي'))}</span>
    <h1 class="display h1">
      <span class="line"><span>{L(('Engineering', 'نهندس'))}</span></span>
      <span class="line"><span class="outline">{L(('the invisible', 'العمود الفقري'))}</span></span>
      <span class="line"><span>{L(('backbone', 'الخفي'))}<span class="accent">.</span></span></span>
    </h1>
    <div class="hero-bottom">
      <p class="lead">{L(('We design, supply and install the mechanical, electrical, plumbing, fire-safety and network systems that keep the Kingdom’s hospitals, hotels, factories and palaces running.', 'نصمم ونورد ونركّب الأنظمة الميكانيكية والكهربائية والسباكة والسلامة من الحريق والشبكات التي تُبقي مستشفيات المملكة وفنادقها ومصانعها وقصورها تعمل بلا توقف.'))}</p>
      <div class="hero-cta">
        <a class="btn btn-primary" href="projects.html">{L(('Explore our projects', 'استكشف مشاريعنا'))} {ARROW}</a>
        <a class="btn btn-ghost" href="contact.html">{L(('Talk to an engineer', 'تحدث مع مهندس'))}</a>
      </div>
    </div>
    <div class="hero-stats">
      <div><b data-count="2018">2018</b><span>{L(('Established', 'سنة التأسيس'))}</span></div>
      <div><b data-count="{TOTAL_PROJECTS}" data-suffix="+">{TOTAL_PROJECTS}+</b><span>{L(('Projects delivered', 'مشروعاً منجزاً'))}</span></div>
      <div><b data-count="{len(SERVICES)}">{len(SERVICES)}</b><span>{L(('Engineering disciplines', 'تخصصات هندسية'))}</span></div>
      <div><b data-count="{len(PARTNERS)}">{len(PARTNERS)}</b><span>{L(('Industry partners', 'شركاء في القطاع'))}</span></div>
    </div>
  </div>
</section>

<section class="section light">
  <div class="wrap statement">
    <div class="statement-text reveal">
      <span class="eyebrow">{L(('Who we are', 'من نحن'))}</span>
      <h2 class="display h2">{L(('Built in the Kingdom.<br>Trusted by <span class="accent">its institutions.</span>', 'تأسسنا في المملكة.<br>وتثق بنا <span class="accent">مؤسساتها.</span>'))}</h2>
      <p>{L(('Advanced Engineering House is a Saudi-registered engineering contractor headquartered in Dammam, with a branch in Dubai. Since 2018 we have grown into one of the fastest-growing MEP companies in the region.', 'بيت الهندسة المتقدمة شركة مقاولات هندسية مسجلة في المملكة العربية السعودية، مقرها الرئيسي في الدمام ولها فرع في دبي. منذ عام 2018 أصبحنا من أسرع شركات الأنظمة الكهروميكانيكية نمواً في المنطقة.'))}</p>
      <p>{L(('Every client has distinct requirements. Our engineers stay with you from design and planning to successful handover — equipped with the latest machinery, materials and, above all, skilled and dedicated people.', 'لكل عميل متطلباته الخاصة. يرافقك مهندسونا من مرحلة التصميم والتخطيط حتى التسليم الناجح — مجهزين بأحدث المعدات والمواد، والأهم من ذلك، بكوادر ماهرة ومتفانية.'))}</p>
      <div class="sig-list">
        <div><b>{L(('Design', 'التصميم'))}</b><span>{L(('Feasible, economic engineering', 'هندسة مجدية واقتصادية'))}</span></div>
        <div><b>{L(('Supply', 'التوريد'))}</b><span>{L(('World-class equipment', 'معدات عالمية المستوى'))}</span></div>
        <div><b>{L(('Execution', 'التنفيذ'))}</b><span>{L(('Skilled in-house crews', 'فرق تنفيذ ماهرة'))}</span></div>
        <div><b>{L(('After-sales', 'ما بعد البيع'))}</b><span>{L(('Maintenance contracts', 'عقود الصيانة'))}</span></div>
      </div>
      <a class="btn btn-dark" href="about.html" style="margin-top:36px">{L(('Our story', 'قصتنا'))} {ARROW}</a>
    </div>
    <div class="statement-media reveal" data-delay="1">
      <div class="slash-mask"><img src="{a}assets/img/electrical.webp" alt="{L(('Engineer working on an electrical panel', 'مهندس يعمل على لوحة كهربائية'))}" loading="lazy" style="object-position:38% 30%"></div>
      <div class="slash-bar"></div>
      <div class="stamp"><b data-count="2018">2018</b><span>{L(('Operating since', 'نعمل منذ'))}</span></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="sec-head">
      <div class="reveal"><span class="eyebrow">{L(('What we do', 'ماذا نقدم'))}</span><h2 class="display h2">{L(('Every discipline.<br>One accountable team.', 'كل التخصصات.<br>فريق واحد مسؤول.'))}</h2></div>
      <p class="lead reveal" data-delay="1">{L(('From chilled-water plants to fiber backbones, we deliver the systems buildings cannot live without — engineered to fit both the objective and the budget.', 'من محطات المياه المبردة إلى شبكات الألياف البصرية، ننفذ الأنظمة التي لا يمكن للمباني الاستغناء عنها — بتصميم يحقق الهدف ويناسب الميزانية.'))}</p>
    </div>
    <div class="disciplines">
      <ul class="disc-list">{disc_items}</ul>
      <div class="disc-preview" aria-hidden="true">{disc_imgs}<span class="corner"></span><p class="disc-caption"></p></div>
    </div>
  </div>
</section>

<section class="section light">
  <div class="wrap">
    <div class="sec-head">
      <div class="reveal"><span class="eyebrow">{L(('Sectors', 'القطاعات'))}</span><h2 class="display h2">{L(('Where our work lives.', 'حيث تعمل أنظمتنا.'))}</h2></div>
      <p class="lead reveal" data-delay="1">{L(('Hospitals where air quality is life-critical. Factories where downtime is costly. Hotels where comfort is the product.', 'مستشفيات تكون فيها جودة الهواء مسألة حياة. مصانع يكون فيها التوقف مكلفاً. فنادق تكون فيها الراحة هي المنتج.'))}</p>
    </div>
    {sectors_html(lang)}
  </div>
</section>

<section class="section steel" style="padding-inline:0">
  <div class="wrap">
    <div class="sec-head">
      <div class="reveal"><span class="eyebrow">{L(('Selected projects', 'مشاريع مختارة'))}</span><h2 class="display h2">{L(('Proof, not promises.', 'إنجازات لا وعود.'))}</h2></div>
      <div class="reveal" data-delay="1" style="display:flex;justify-content:space-between;align-items:end;gap:20px;flex-wrap:wrap">
        <p class="lead" style="margin:0">{L(('Hospitals, hotels, factories, stations and palaces delivered across the Eastern Province and beyond.', 'مستشفيات وفنادق ومصانع ومحطات وقصور أنجزناها في المنطقة الشرقية وخارجها.'))}</p>
        <div class="rail-controls"><button data-rail="prev" aria-label="{L(('Previous', 'السابق'))}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12H4M10 6l-6 6 6 6"/></svg></button><button data-rail="next" aria-label="{L(('Next', 'التالي'))}">{ARROW}</button></div>
      </div>
    </div>
  </div>
  <div class="rail">{rail}</div>
  <div class="wrap" style="margin-top:40px"><a class="btn btn-ghost" href="projects.html">{L(('View all projects', 'عرض جميع المشاريع'))} {ARROW}</a></div>
</section>

<section class="section">
  <div class="wrap">
    <div class="sec-head">
      <div class="reveal"><span class="eyebrow">{L(('How we deliver', 'منهجية العمل'))}</span><h2 class="display h2">{L(('Turnkey,<br>end to end.', 'تسليم مفتاح،<br>من البداية للنهاية.'))}</h2></div>
      <p class="lead reveal" data-delay="1">{L(('One partner from the first drawing to the last maintenance visit — so nothing falls between contractors.', 'شريك واحد من أول مخطط حتى آخر زيارة صيانة — حتى لا يضيع شيء بين المقاولين.'))}</p>
    </div>
    <div class="process">{steps_html}</div>
  </div>
</section>

<section class="quote-band">
  <div class="bg" data-parallax style="background-image:url('{a}assets/img/team-future.webp')"></div>
  <div class="wrap reveal">
    <span class="eyebrow">{L(("Managing Director's statement", 'كلمة المدير العام'))}</span>
    <blockquote>
      <p>{L(('Our success has been achieved through the outstanding contribution of every member of our professional, experienced and motivated team. We are determined to keep expanding what we offer our clients.', 'تحقق نجاحنا بفضل الإسهام المتميز لكل فرد من فريقنا المحترف وذي الخبرة والشغف. ونحن عازمون على مواصلة توسيع ما نقدمه لعملائنا.'))}</p>
      <cite>{L(('Managing Director — Advanced Engineering House', 'المدير العام — بيت الهندسة المتقدمة'))}</cite>
    </blockquote>
  </div>
</section>

<section class="section light" style="padding-bottom:clamp(70px,9vw,130px)">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:50px">
      <div class="reveal"><span class="eyebrow">{L(('Partners & clients', 'الشركاء والعملاء'))}</span><h2 class="display h2">{L(('In good company.', 'في صحبة الكبار.'))}</h2></div>
      <p class="lead reveal" data-delay="1">{L(('We work alongside the region’s leading manufacturers, developers and consultants.', 'نعمل جنباً إلى جنب مع كبرى الشركات المصنعة والمطورين والاستشاريين في المنطقة.'))}</p>
    </div>
  </div>
  {partners_marquee(a)}
</section>
{cta(lang)}
</main>
"""
    title = L(("Advanced Engineering House — MEP, Fire Protection & Network Engineering | Dammam", "بيت الهندسة المتقدمة — الأنظمة الكهروميكانيكية والحماية من الحريق والشبكات | الدمام"))
    desc = L(("Saudi MEP contractor since 2018. HVAC, electrical, plumbing, firefighting, data center and security systems for hospitals, hotels and industry. Dammam & Dubai.",
              "مقاول أنظمة كهروميكانيكية سعودي منذ 2018. التكييف والكهرباء والسباكة ومكافحة الحريق ومراكز البيانات والأنظمة الأمنية للمستشفيات والفنادق والصناعة. الدمام ودبي."))
    return title, desc, body


def page_about(lang, a):
    L = tr(lang)
    values = [
        ('<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.8 5.8 21l1.4-7L2 9.3l7-.8z"/>', ("Exceed expectations", "تجاوز التوقعات"),
         ("We strive to exceed our clients’ expectations and guarantee premium service in everything we undertake.", "نسعى لتجاوز توقعات عملائنا ونضمن خدمة متميزة في كل ما نقوم به.")),
        ('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>', ("Precision in detail", "الدقة في التفاصيل"),
         ("We analyse and estimate every detail of the specification with passion, creativity and precision.", "نحلل ونقدّر كل تفصيل في المواصفات بشغف وإبداع ودقة.")),
        ('<path d="M3 12h4l3-8 4 16 3-8h4"/>', ("Function meets economy", "الأداء والجدوى معاً"),
         ("Our engineers design innovative solutions that deliver both functionality and economic value.", "يصمم مهندسونا حلولاً مبتكرة تجمع بين الكفاءة الوظيفية والجدوى الاقتصادية.")),
    ]
    vals = "".join(f'<div class="value reveal" data-delay="{i}"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ic}</svg><h3>{L(t)}</h3><p>{L(d)}</p></div>' for i, (ic, t, d) in enumerate(values))
    body = f"""<main id="main">
{page_hero(lang, a, 'team-future', L(('About us', 'من نحن')), L(('Your future<br><span class="outline">starts here.</span>', 'مستقبلك<br><span class="outline">يبدأ هنا.</span>')),
          L(('A Saudi engineering house built on precision, people and an uncompromising standard of delivery.', 'بيت هندسي سعودي قائم على الدقة والكفاءات ومعيار لا يقبل التهاون في التنفيذ.')), L(('About', 'من نحن')))}
<section class="section light">
  <div class="wrap statement">
    <div class="statement-text reveal">
      <span class="eyebrow">{L(('Our story', 'قصتنا'))}</span>
      <h2 class="display h2">{L(('From Dammam,<br>for the <span class="accent">region.</span>', 'من الدمام،<br>إلى <span class="accent">المنطقة.</span>'))}</h2>
      <p>{L(('Advanced Engineering House is registered in the Kingdom of Saudi Arabia, with its head office in Dammam and a branch in Dubai — so we can serve clients conveniently across the KSA and the Gulf.', 'بيت الهندسة المتقدمة شركة مسجلة في المملكة العربية السعودية، مقرها الرئيسي في الدمام ولها فرع في دبي — لنخدم عملاءنا بسهولة في أنحاء المملكة والخليج.'))}</p>
      <p>{L(('Established and in full operation since 2018, we have proven our position in interiors, MEP services, exhibitions and events — becoming one of the fastest-growing companies in the region.', 'تأسست الشركة وبدأت أعمالها بالكامل منذ عام 2018، وأثبتت مكانتها في مجالات التصميم الداخلي والأنظمة الكهروميكانيكية والمعارض والفعاليات — لتصبح من أسرع الشركات نمواً في المنطقة.'))}</p>
      <p>{L(('We provide full MEP design and engineered energy solutions as turnkey packages, with professional staff who guide each project from design and planning to successful implementation.', 'نقدم تصميماً متكاملاً للأنظمة الكهروميكانيكية وحلول طاقة هندسية بنظام تسليم المفتاح، مع كوادر محترفة ترافق كل مشروع من التصميم والتخطيط حتى التنفيذ الناجح.'))}</p>
    </div>
    <div class="statement-media reveal" data-delay="1">
      <div class="slash-mask"><img src="{a}assets/img/hvac-engineer.webp" alt="" loading="lazy" style="object-position:72% 50%"></div>
      <div class="slash-bar"></div>
      <div class="stamp"><b>2</b><span>{L(('Offices · Dammam & Dubai', 'مكتبان · الدمام ودبي'))}</span></div>
    </div>
  </div>
  <div class="wrap">
    <div class="timeline">
      <div class="tl reveal"><b>2018</b><span>{L(('Company established in Dammam', 'تأسيس الشركة في الدمام'))}</span></div>
      <div class="tl reveal" data-delay="1"><b>{L(('Dubai', 'دبي'))}</b><span>{L(('Branch opened to serve the Gulf', 'افتتاح فرع لخدمة الخليج'))}</span></div>
      <div class="tl reveal" data-delay="2"><b>{TOTAL_PROJECTS}+</b><span>{L(('Projects for hospitals, hotels & industry', 'مشروعاً للمستشفيات والفنادق والصناعة'))}</span></div>
      <div class="tl reveal" data-delay="3"><b>{len(SERVICES)}</b><span>{L(('Engineering disciplines under one roof', 'تخصصات هندسية تحت سقف واحد'))}</span></div>
    </div>
  </div>
</section>
<section class="section steel">
  <div class="wrap">
    <div class="sec-head">
      <div class="reveal"><span class="eyebrow">{L(('What drives us', 'ما يحركنا'))}</span><h2 class="display h2">{L(('Standards we<br>build on.', 'معايير<br>نبني عليها.'))}</h2></div>
      <p class="lead reveal" data-delay="1">{L(('Our vision and commitment to quality are fundamental to how we approach every project — and the reason our business keeps growing.', 'رؤيتنا والتزامنا بالجودة أساس نهجنا في كل مشروع — وسبب استمرار نمو أعمالنا.'))}</p>
    </div>
    <div class="values">{vals}</div>
  </div>
</section>
<section class="quote-band">
  <div class="bg" data-parallax style="background-image:url('{a}assets/img/hero-plant.webp')"></div>
  <div class="wrap reveal">
    <span class="eyebrow">{L(("Managing Director's statement", 'كلمة المدير العام'))}</span>
    <blockquote>
      <p>{L(('Advanced Engineering House is committed to providing our clients with the highest level of service on all current and future works — and we look forward to working with you.', 'تلتزم بيت الهندسة المتقدمة بتقديم أعلى مستويات الخدمة لعملائها في جميع الأعمال الحالية والمستقبلية — ونتطلع للعمل معكم.'))}</p>
      <cite>{L(('Managing Director', 'المدير العام'))}</cite>
    </blockquote>
  </div>
</section>
<section class="section light">
  <div class="wrap">
    <div class="sec-head">
      <div class="reveal"><span class="eyebrow">{L(('Sectors', 'القطاعات'))}</span><h2 class="display h2">{L(('Six sectors.<br>One standard.', 'ستة قطاعات.<br>معيار واحد.'))}</h2></div>
    </div>
    {sectors_html(lang)}
  </div>
</section>
<section class="section light" style="background:var(--paper-2)">
  <div class="wrap">
    <div class="sec-head"><div class="reveal"><span class="eyebrow">{L(('Offices', 'مكاتبنا'))}</span><h2 class="display h2">{L(('Find us.', 'تجدنا هنا.'))}</h2></div></div>
    <div class="offices">
      <div class="office reveal"><span class="tag">{L(('Head office', 'المقر الرئيسي'))}</span><h3>{L(('Dammam', 'الدمام'))}</h3><p>{L(ADDRESS)}</p><p style="margin-top:14px"><a class="ltr" href="tel:+{PHONE_RAW}">{PHONE}</a></p></div>
      <div class="office reveal" data-delay="1"><span class="tag">{L(('Branch', 'فرع'))}</span><h3>{L(('Dubai', 'دبي'))}</h3><p>{L(('United Arab Emirates', 'الإمارات العربية المتحدة'))}</p><p style="margin-top:14px"><a href="mailto:{EMAIL_1}">{EMAIL_1}</a></p></div>
    </div>
  </div>
</section>
<section class="section light" style="padding-block:clamp(60px,8vw,110px)">
  <div class="wrap"><div class="sec-head" style="margin-bottom:40px"><div><span class="eyebrow">{L(('Partners', 'الشركاء'))}</span></div></div></div>
  {partners_marquee(a)}
</section>
{cta(lang)}
</main>
"""
    return (L(("About Us — Advanced Engineering House", "من نحن — بيت الهندسة المتقدمة")),
            L(("Saudi engineering contractor established in 2018, headquartered in Dammam with a branch in Dubai.", "شركة مقاولات هندسية سعودية تأسست عام 2018، مقرها الدمام ولها فرع في دبي.")), body)


def page_services(lang, a):
    L = tr(lang)
    idx = "".join(f'<a href="#{s["id"]}">{L(s["t"])}</a>' for s in SERVICES)
    blocks = ""
    for i, s in enumerate(SERVICES):
        paras = "".join(f"<p>{L(p)}</p>" for p in s["body"])
        pts = "".join(f"<li>{L(p)}</li>" for p in s["points"])
        blocks += f"""<article class="svc" id="{s['id']}" style="scroll-margin-top:100px">
  <div class="svc-media reveal"><img src="{a}assets/img/{html.escape(s['img'])}" alt="{L(s['t'])}" loading="lazy" style="object-position:{html.escape(s['pos'])}"><span class="idx">{i + 1:02d}</span></div>
  <div class="svc-body reveal" data-delay="1">
    <span class="eyebrow">{L(s['tags'])}</span>
    <h2 class="display h3" style="font-size:clamp(32px,3.6vw,56px);font-weight:800">{L(s['t'])}</h2>
    {paras}
    <ul class="svc-points">{pts}</ul>
  </div>
</article>"""
    body = f"""<main id="main">
<section class="hero page-hero">
  <div class="hero-media"><img src="{a}assets/img/datacenter.webp" alt="" style="object-position:80% 50%" fetchpriority="high"></div>
  <div class="hero-slashes" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="wrap hero-content">
    <nav class="crumbs" aria-label="breadcrumb"><a href="index.html">{L(('Home', 'الرئيسية'))}</a><span>/</span><span>{L(('Services', 'الخدمات'))}</span></nav>
    <span class="eyebrow">{L(('Our services', 'خدماتنا'))}</span>
    <h1 class="display h1" style="margin-top:26px">{L(('Systems that<br><span class="outline">never sleep.</span>', 'أنظمة<br><span class="outline">لا تتوقف.</span>'))}</h1>
    <p class="lead" style="margin-top:30px">{L(('Feasible, economically viable designs for heating, ventilation, air conditioning, refrigeration, plumbing, fire protection, networks and utility distribution.', 'تصاميم مجدية واقتصادية للتدفئة والتهوية والتكييف والتبريد والسباكة والحماية من الحريق والشبكات وتوزيع المرافق.'))}</p>
    <div class="svc-index">{idx}</div>
  </div>
</section>
<section class="section light" style="padding-block:clamp(30px,5vw,60px)">
  <div class="wrap">{blocks}</div>
</section>
{cta(lang)}
</main>
"""
    return (L(("Services — HVAC, Electrical, Plumbing, Fire & Networks | Advanced Engineering House", "الخدمات — التكييف والكهرباء والسباكة والحريق والشبكات | بيت الهندسة المتقدمة")),
            L(("Engineering disciplines: HVAC, electrical, plumbing, full MEP design & build, firefighting, data center, security, unified communications and maintenance.", "تخصصات هندسية: التكييف والكهرباء والسباكة وتصميم وتنفيذ MEP ومكافحة الحريق ومراكز البيانات والأمن والاتصالات الموحدة والصيانة.")), body)


def page_projects(lang, a):
    L = tr(lang)
    btns = f'<button data-filter="all" aria-pressed="true">{L(("All projects", "جميع المشاريع"))}</button>' + "".join(
        f'<button data-filter="{k}" aria-pressed="false">{L(v)}</button>' for k, v in CATS.items())
    cards = "".join(project_card(lang, a, p, detailed=True) for p in PROJECTS)
    rows = "".join(f'<tr data-cats="{cats}"><td>{i + len(PROJECTS) + 1:02d}</td><td>{L(n)}</td><td>{L(c)}</td><td>{L(s)}</td></tr>'
                   for i, (n, c, s, cats) in enumerate(LEDGER))
    body = f"""<main id="main">
{page_hero(lang, a, 'p-kempinski', L(('Portfolio', 'أعمالنا')), L(('Delivered<br><span class="outline">with precision.</span>', 'مشاريع<br><span class="outline">نُفذت بدقة.</span>')),
          L(('A selection of hospitals, hotels, factories, stations and residences engineered by Advanced Engineering House.', 'مجموعة مختارة من المستشفيات والفنادق والمصانع والمحطات والمساكن التي نفذتها بيت الهندسة المتقدمة.')), L(('Projects', 'المشاريع')), pos="50% 35%")}
<section class="section steel">
  <div class="wrap">
    <div class="filters" role="group" aria-label="{L(('Filter projects', 'تصفية المشاريع'))}">{btns}</div>
    <div class="grid-projects">{cards}</div>
  </div>
</section>
<section class="section light">
  <div class="wrap">
    <div class="sec-head">
      <div class="reveal"><span class="eyebrow">{L(('Project register', 'سجل المشاريع'))}</span><h2 class="display h2">{L(('More of our work.', 'المزيد من أعمالنا.'))}</h2></div>
      <p class="lead reveal" data-delay="1">{L(('Including Aramco’s Al-Safaniyah project, SCECO power stations and Maaden’s Arar camp.', 'بما في ذلك مشروع السفانية لأرامكو ومحطات الشركة السعودية للكهرباء ومجمع معادن في عرعر.'))}</p>
    </div>
    <div class="table-scroll reveal">
      <table class="ledger">
        <thead><tr><th>#</th><th>{L(('Project', 'المشروع'))}</th><th>{L(('Client', 'العميل'))}</th><th>{L(('Scope of work', 'نطاق العمل'))}</th></tr></thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  </div>
</section>
{cta(lang)}
</main>
"""
    return (L(("Projects — Advanced Engineering House", "المشاريع — بيت الهندسة المتقدمة")),
            L(("MEP and fire protection projects including Kempinski Al Othman Hotel, King Fahad Hospital, Prince Sultan Cardiac Center and Aramco Al-Safaniyah.", "مشاريع الأنظمة الكهروميكانيكية والحماية من الحريق، منها فندق كمبينسكي العثمان ومستشفى الملك فهد ومركز الأمير سلطان للقلب ومشروع السفانية لأرامكو.")), body)


def page_contact(lang, a):
    L = tr(lang)
    opts = "".join(f"<option>{L(s['t'])}</option>" for s in SERVICES)
    ic_phone = '<svg viewBox="0 0 24 24"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 005 5L15 12l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2"/></svg>'
    ic_mail = '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/></svg>'
    ic_pin = '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>'
    ic_clock = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
    body = f"""<main id="main">
{page_hero(lang, a, 'plant-dark', L(('Contact', 'تواصل معنا')), L(('Let’s build<br><span class="outline">what’s next.</span>', 'لنبنِ<br><span class="outline">المستقبل معاً.</span>')),
          L(('Tell us about your project. An engineer will respond within one working day.', 'أخبرنا عن مشروعك، وسيتواصل معك أحد مهندسينا خلال يوم عمل واحد.')), L(('Contact', 'تواصل معنا')))}
<section class="section">
  <div class="wrap contact-grid">
    <div class="reveal">
      <div class="contact-cards">
        <a href="tel:+{PHONE_RAW}">{ic_phone}<div><small>{L(('Hotline', 'الخط الساخن'))}</small><b class="ltr">{PHONE}</b></div></a>
        <a href="mailto:{EMAIL_1}">{ic_mail}<div><small>{L(('General enquiries', 'الاستفسارات العامة'))}</small><b>{EMAIL_1}</b></div></a>
        <a href="mailto:{EMAIL_2}">{ic_mail}<div><small>{L(('Direct — Management', 'مباشر — الإدارة'))}</small><b>{EMAIL_2}</b></div></a>
        <div>{ic_pin}<div><small>{L(('Head office', 'المقر الرئيسي'))}</small><b>{L(ADDRESS)}</b></div></div>
        <div>{ic_clock}<div><small>{L(('Working hours', 'ساعات العمل'))}</small><b>{L(HOURS)}</b></div></div>
      </div>
      <iframe class="map" title="{L(('Office location map', 'خريطة موقع المكتب'))}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
        src="https://maps.google.com/maps?q=Alghunaim%20Tower%2C%20Prince%20Mohammed%20bin%20Fahd%20St%2C%20Dammam&z=15&output=embed"></iframe>
    </div>
    <form class="form reveal" data-delay="1" data-endpoint="https://formsubmit.co/ajax/{EMAIL_1}" data-mailto="{EMAIL_1},{EMAIL_2}"
      data-sending="{L(('Sending…', 'جارٍ الإرسال…'))}" data-ok="{L(('Thank you — your message has been sent. We will be in touch shortly.', 'شكراً لك — تم إرسال رسالتك وسنتواصل معك قريباً.'))}"
      data-err="{L(('Could not send automatically — opening your email app instead.', 'تعذر الإرسال تلقائياً — سيتم فتح تطبيق البريد لديك.'))}">
      <h2 class="display h3" style="font-size:clamp(30px,3vw,44px);font-weight:800">{L(('Request a proposal', 'اطلب عرض سعر'))}</h2>
      <input type="hidden" name="_subject" value="New website enquiry — house-engineering.com">
      <input type="hidden" name="_cc" value="{EMAIL_2}">
      <input type="hidden" name="_template" value="table">
      <input type="text" name="_honey" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="field"><label for="f-name">{L(('Full name', 'الاسم الكامل'))}</label><input id="f-name" name="name" required autocomplete="name"></div>
      <div class="field"><label for="f-company">{L(('Company', 'الشركة'))}</label><input id="f-company" name="company" autocomplete="organization"></div>
      <div class="field"><label for="f-email">{L(('Email', 'البريد الإلكتروني'))}</label><input id="f-email" name="email" type="email" required autocomplete="email"></div>
      <div class="field"><label for="f-phone">{L(('Phone', 'رقم الجوال'))}</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" dir="ltr"></div>
      <div class="field full"><label for="f-service">{L(('Service required', 'الخدمة المطلوبة'))}</label><select id="f-service" name="service">{opts}<option>{L(('Other / multiple', 'أخرى / متعددة'))}</option></select></div>
      <div class="field full"><label for="f-msg">{L(('Project details', 'تفاصيل المشروع'))}</label><textarea id="f-msg" name="message" required></textarea></div>
      <button class="btn btn-primary" type="submit">{L(('Send enquiry', 'إرسال الطلب'))} {ARROW}</button>
      <p class="form-status" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>
</main>
"""
    return (L(("Contact — Advanced Engineering House", "تواصل معنا — بيت الهندسة المتقدمة")),
            L(("Contact Advanced Engineering House in Dammam: +966 59 006 8070, info@house-engineering.com.", "تواصل مع بيت الهندسة المتقدمة في الدمام: ‎+966 59 006 8070، info@house-engineering.com.")), body)


PAGES = {
    "index.html": page_index,
    "about.html": page_about,
    "services.html": page_services,
    "projects.html": page_projects,
    "contact.html": page_contact,
}


def build():
    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(SRC / "assets", DIST / "assets")
    if (SRC / "admin").exists():
        shutil.copytree(SRC / "admin", DIST / "admin")
    for lang, out, a in (("en", DIST, ""), ("ar", DIST / "ar", "../")):
        out.mkdir(parents=True, exist_ok=True)
        for page, fn in PAGES.items():
            title, desc, body = fn(lang, a)
            html = head(lang, page, title, desc, a) + header(lang, page, a) + body + footer(lang, a)
            (out / page).write_text(html, encoding="utf-8")
    # keep old URL alive
    (DIST / "service-single.html").write_text(
        '<!doctype html><meta charset="utf-8"><title>Services</title><meta http-equiv="refresh" content="0; url=services.html">'
        '<link rel="canonical" href="https://www.house-engineering.com/services.html"><a href="services.html">Services</a>', encoding="utf-8")
    (DIST / "CNAME").write_text("www.house-engineering.com\n")
    (DIST / ".nojekyll").write_text("")
    (DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: {DOMAIN}/sitemap.xml\n")
    urls = "".join(f"<url><loc>{DOMAIN}/{p if p != 'index.html' else ''}</loc></url><url><loc>{DOMAIN}/ar/{p if p != 'index.html' else ''}</loc></url>" for p in PAGES)
    (DIST / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>')
    print("built", sum(1 for _ in DIST.rglob("*.html")), "pages")


if __name__ == "__main__":
    build()
