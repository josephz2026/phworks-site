/* PH Works public projects gallery.
   On projects.html put:  <div id="projects"></div>  then  <script src="projects.js"></script>
   It reads published projects from Supabase (the anon key below is public by design). */
(function () {
  var BASE = 'https://gycuakdoskxmmdjoyqxw.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5Y3Vha2Rvc2t4bW1kam95cXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5MTQyOTEsImV4cCI6MjEwOTQ5MDI5MX0.6FZxvZLFD1ZEMGTTzsSYNn9e5gmSRpu1-lxkek1isZY';
  var box = document.getElementById('projects');
  if (!box) return;

  var css = document.createElement('style');
  css.textContent =
    '.pj-filters{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 20px}' +
    '.pj-filters button{font:inherit;color:inherit;background:transparent;border:1px solid rgba(128,128,128,.4);border-radius:99px;padding:7px 16px;cursor:pointer}' +
    '.pj-filters button[aria-pressed=true]{background:currentColor}' +
    '.pj-filters button[aria-pressed=true] span{color:#fff;mix-blend-mode:difference}' +
    '.pj-card{border:1px solid rgba(128,128,128,.3);border-radius:10px;padding:18px;margin:0 0 22px}' +
    '.pj-card h3{margin:0 0 4px}' +
    '.pj-tags{opacity:.7;font-size:.9rem;margin:0 0 10px}' +
    '.pj-desc{margin:0 0 14px;white-space:pre-wrap}' +
    '.pj-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 10px}' +
    '.pj-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}' +
    '.pj-fig{margin:0;position:relative}' +
    '.pj-fig img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;display:block}' +
    '.pj-lbl{position:absolute;left:8px;top:8px;background:rgba(0,0,0,.7);color:#fff;font-size:.75rem;padding:2px 8px;border-radius:99px}' +
    '@media(max-width:520px){.pj-pair{grid-template-columns:1fr}}';
  document.head.appendChild(css);

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function fig(photo, label) {
    var f = el('figure', 'pj-fig'), a = document.createElement('a'), im = document.createElement('img');
    im.src = BASE + '/storage/v1/object/public/project-photos/' + photo.path;
    im.alt = label || 'Project photo';
    im.loading = 'lazy';
    a.href = im.src; a.target = '_blank'; a.rel = 'noopener';
    a.appendChild(im); f.appendChild(a);
    if (label) f.appendChild(el('span', 'pj-lbl', label));
    return f;
  }
  function card(p) {
    var c = el('article', 'pj-card');
    c.appendChild(el('h3', '', p.title));
    var tags = [p.category, p.subtype, p.size].filter(Boolean).join(' · ');
    if (tags) c.appendChild(el('p', 'pj-tags', tags));
    if (p.description) c.appendChild(el('p', 'pj-desc', p.description));

    var pics = (p.project_photos || []).slice().sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; });
    var bef = pics.filter(function (x) { return x.kind === 'before'; });
    var aft = pics.filter(function (x) { return x.kind === 'after'; });
    var rest = pics.filter(function (x) { return x.kind === 'photo'; });
    var n = Math.min(bef.length, aft.length);
    for (var i = 0; i < n; i++) {
      var pair = el('div', 'pj-pair');
      pair.appendChild(fig(bef[i], 'Before'));
      pair.appendChild(fig(aft[i], 'After'));
      c.appendChild(pair);
    }
    var grid = el('div', 'pj-grid');
    bef.slice(n).forEach(function (x) { grid.appendChild(fig(x, 'Before')); });
    aft.slice(n).forEach(function (x) { grid.appendChild(fig(x, 'After')); });
    rest.forEach(function (x) { grid.appendChild(fig(x)); });
    if (grid.children.length) c.appendChild(grid);
    return c;
  }

  box.textContent = 'Loading projects…';
  fetch(BASE + '/rest/v1/projects?published=eq.true&select=*,project_photos(*)&order=created_at.desc', {
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
  }).then(function (r) {
    if (!r.ok) throw new Error('bad response');
    return r.json();
  }).then(function (rows) {
    box.textContent = '';
    if (!rows.length) { box.textContent = 'Projects coming soon.'; return; }
    var cats = [];
    rows.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
    var list = el('div');
    var filters = el('div', 'pj-filters');
    function show(cat) {
      list.textContent = '';
      rows.filter(function (p) { return !cat || p.category === cat; })
          .forEach(function (p) { list.appendChild(card(p)); });
      Array.prototype.forEach.call(filters.children, function (b) {
        b.setAttribute('aria-pressed', String((b.dataset.cat || '') === (cat || '')));
      });
    }
    if (cats.length > 1) {
      [''].concat(cats).forEach(function (c) {
        var b = el('button'); b.type = 'button'; b.dataset.cat = c;
        b.appendChild(el('span', '', c || 'All'));
        b.addEventListener('click', function () { show(c); });
        filters.appendChild(b);
      });
      box.appendChild(filters);
    }
    box.appendChild(list);
    show('');
  }).catch(function () {
    box.textContent = 'Projects could not be loaded right now. Please call us at (718) 414-1083.';
  });
})();
