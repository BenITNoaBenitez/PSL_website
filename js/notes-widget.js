/* ============================================================
   PSL — Widget de notes de relecture
   ------------------------------------------------------------
   Ajoute un bouton flottant sur chaque page. Le relecteur écrit
   une note ; elle est commitée directement dans le dépôt GitHub
   sous notes/<nom-de-la-page>.md via l'API GitHub.

   Configuration :
   - Le dépôt (owner/repo) est détecté automatiquement depuis
     l'URL GitHub Pages (owner.github.io/repo/...).
   - Pour forcer manuellement, définir avant ce script :
       <script>window.NOTES_CONFIG = {
         owner: 'mon-user', repo: 'mon-repo', branch: 'main'
       };</script>
   - Le jeton GitHub (fine-grained PAT, droit "Contents: write")
     est saisi par le relecteur et stocké dans SON navigateur
     (localStorage) — il n'est jamais écrit dans le dépôt.
   ============================================================ */
(function () {
  'use strict';

  // ---------- Configuration ----------
  function detectRepo() {
    var host = location.hostname;             // ex: noa.github.io
    var out = { owner: '', repo: '', branch: 'main' };
    var m = host.match(/^([^.]+)\.github\.io$/i);
    if (m) {
      out.owner = m[1];
      var seg = location.pathname.split('/').filter(Boolean);
      if (seg.length && seg[0].indexOf('.') === -1) out.repo = seg[0];
      else out.repo = host;                   // page user/org (owner.github.io)
    }
    return out;
  }
  var CFG = Object.assign(detectRepo(), window.NOTES_CONFIG || {});
  var API = 'https://api.github.com/repos/' + CFG.owner + '/' + CFG.repo;

  // ---------- Stockage local (navigateur du relecteur) ----------
  var LS = {
    token: 'psl_notes_token',
    name: 'psl_notes_reviewer',
    draftPrefix: 'psl_notes_draft_'
  };
  var getToken = function () { return localStorage.getItem(LS.token) || ''; };
  var setToken = function (v) { localStorage.setItem(LS.token, v.trim()); };
  var getName = function () { return localStorage.getItem(LS.name) || ''; };
  var setName = function (v) { localStorage.setItem(LS.name, v.trim()); };

  // ---------- Identité de la page ----------
  function pageKey() {
    var p = (location.pathname.split('/').pop() || 'index').replace(/\.html?$/i, '');
    return decodeURIComponent(p || 'index');
  }
  function pageTitle() { return (document.title || pageKey()).trim(); }
  function notePath() { return 'notes/' + pageKey() + '.md'; }

  // ---------- Base64 (UTF-8 safe, accents FR) ----------
  function b64encode(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64decode(b64) { return decodeURIComponent(escape(atob(String(b64).replace(/\s/g, '')))); }

  // ---------- Appels API GitHub ----------
  function headers() {
    return {
      'Authorization': 'Bearer ' + getToken(),
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }
  function ghGet(path) {
    return fetch(API + '/contents/' + path + '?ref=' + encodeURIComponent(CFG.branch), { headers: headers() })
      .then(function (r) {
        if (r.status === 404) return { content: '', sha: null };
        if (!r.ok) return r.json().catch(function () { return {}; }).then(function (e) {
          throw new Error('Lecture (' + r.status + ') : ' + (e.message || r.statusText));
        });
        return r.json().then(function (j) { return { content: b64decode(j.content), sha: j.sha }; });
      });
  }
  function ghPut(path, content, sha, message) {
    var body = { message: message, content: b64encode(content), branch: CFG.branch };
    if (sha) body.sha = sha;
    return fetch(API + '/contents/' + path, {
      method: 'PUT', headers: headers(), body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (e) {
        throw new Error('Écriture (' + r.status + ') : ' + (e.message || r.statusText));
      });
      return r.json();
    });
  }

  // Ajoute une note (avec 1 réessai si conflit de version 409/422)
  function addNote(text, attempt) {
    attempt = attempt || 0;
    var path = notePath();
    return ghGet(path).then(function (file) {
      var base = file.content;
      if (!base.trim()) {
        base = '# Notes — ' + pageTitle() + '  \n`' + pageKey() + '.html`\n';
      }
      var stamp = new Date().toLocaleString('fr-FR');
      var reviewer = getName() || 'Anonyme';
      var entry = '\n---\n\n### ' + stamp + ' — ' + reviewer + '\n\n' + text.trim() + '\n';
      var msg = 'notes(' + pageKey() + ') : ' + reviewer + ' — ' + stamp;
      return ghPut(path, base + entry, file.sha, msg);
    }).catch(function (err) {
      if (attempt < 1 && /\(409\)|\(422\)/.test(err.message)) return addNote(text, attempt + 1);
      throw err;
    });
  }

  // ---------- Styles ----------
  var css = '' +
    '#psl-nw-btn{position:fixed;right:18px;bottom:18px;z-index:99998;background:#e2001a;color:#fff;border:none;border-radius:999px;padding:12px 18px;font:600 14px/1 Inter,system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer;display:flex;align-items:center;gap:8px}' +
    '#psl-nw-btn:hover{background:#c40016}' +
    '#psl-nw-panel{position:fixed;right:18px;bottom:74px;z-index:99999;width:360px;max-width:calc(100vw - 36px);max-height:78vh;background:#fff;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.3);display:none;flex-direction:column;overflow:hidden;font:14px/1.45 Inter,system-ui,sans-serif;color:#1a1a1a}' +
    '#psl-nw-panel.open{display:flex}' +
    '.psl-nw-head{background:#1a1a1a;color:#fff;padding:12px 14px;display:flex;align-items:center;justify-content:space-between}' +
    '.psl-nw-head b{font-size:14px}.psl-nw-head small{display:block;opacity:.7;font-weight:400;font-size:11px;margin-top:2px}' +
    '.psl-nw-x{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1}' +
    '.psl-nw-body{padding:12px 14px;overflow:auto}' +
    '.psl-nw-body textarea{width:100%;box-sizing:border-box;min-height:84px;border:1px solid #d0d0d0;border-radius:8px;padding:9px;font:inherit;resize:vertical}' +
    '.psl-nw-row{display:flex;gap:8px;margin-top:9px}' +
    '.psl-nw-btn1{flex:1;background:#e2001a;color:#fff;border:none;border-radius:8px;padding:10px;font:600 14px Inter,sans-serif;cursor:pointer}' +
    '.psl-nw-btn1:disabled{opacity:.5;cursor:default}' +
    '.psl-nw-link{background:none;border:none;color:#666;font-size:12px;cursor:pointer;text-decoration:underline;padding:0}' +
    '.psl-nw-msg{font-size:12px;margin-top:8px;min-height:16px}' +
    '.psl-nw-msg.ok{color:#0a8a3a}.psl-nw-msg.err{color:#c40016}' +
    '.psl-nw-set{border-top:1px solid #eee;margin-top:12px;padding-top:10px}' +
    '.psl-nw-set label{display:block;font-size:12px;color:#444;margin:8px 0 3px}' +
    '.psl-nw-set input{width:100%;box-sizing:border-box;border:1px solid #d0d0d0;border-radius:7px;padding:8px;font:inherit}' +
    '.psl-nw-set .hint{font-size:11px;color:#888;margin-top:6px}' +
    '.psl-nw-set a{color:#e2001a}' +
    '.psl-nw-existing{margin-top:12px;border-top:1px solid #eee;padding-top:10px;font-size:12px;color:#555;white-space:pre-wrap;word-break:break-word;max-height:160px;overflow:auto;background:#fafafa;border-radius:8px;padding:9px}';

  // ---------- Construction de l'UI ----------
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  function build() {
    if (!CFG.owner || !CFG.repo) {
      // Hors GitHub Pages (ex: ouverture locale) — widget inactif silencieusement
      return;
    }
    var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

    var btn = el('<button id="psl-nw-btn" title="Laisser une note sur cette page">📝 Notes</button>');
    var panel = el(
      '<div id="psl-nw-panel">' +
        '<div class="psl-nw-head"><div><b>Note de relecture</b><small>' + pageKey() + '.html</small></div>' +
          '<button class="psl-nw-x" title="Fermer">×</button></div>' +
        '<div class="psl-nw-body">' +
          '<textarea placeholder="Votre remarque sur cette page…"></textarea>' +
          '<div class="psl-nw-row">' +
            '<button class="psl-nw-btn1">Envoyer la note</button>' +
          '</div>' +
          '<div class="psl-nw-msg"></div>' +
          '<button class="psl-nw-link psl-nw-toggleset">⚙︎ Réglages (jeton & nom)</button>' +
          '<div class="psl-nw-set" style="display:none">' +
            '<label>Votre nom (apparaît dans les notes)</label>' +
            '<input class="psl-nw-name" type="text" placeholder="ex: Marie">' +
            '<label>Jeton GitHub (fine-grained PAT)</label>' +
            '<input class="psl-nw-token" type="password" placeholder="github_pat_…" autocomplete="off">' +
            '<div class="psl-nw-row"><button class="psl-nw-btn1 psl-nw-savecfg">Enregistrer</button></div>' +
            '<div class="hint">Le jeton reste dans votre navigateur. Demandez-le au propriétaire du site.</div>' +
          '</div>' +
          '<div class="psl-nw-existing" style="display:none"></div>' +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(btn); document.body.appendChild(panel);

    var ta = panel.querySelector('textarea');
    var sendBtn = panel.querySelector('.psl-nw-btn1');
    var msg = panel.querySelector('.psl-nw-msg');
    var setBox = panel.querySelector('.psl-nw-set');
    var nameI = panel.querySelector('.psl-nw-name');
    var tokenI = panel.querySelector('.psl-nw-token');
    var existing = panel.querySelector('.psl-nw-existing');
    var draftKey = LS.draftPrefix + pageKey();

    // Restaurer brouillon + réglages
    ta.value = localStorage.getItem(draftKey) || '';
    nameI.value = getName();
    tokenI.value = getToken();
    ta.addEventListener('input', function () { localStorage.setItem(draftKey, ta.value); });

    function setMsg(t, cls) { msg.textContent = t || ''; msg.className = 'psl-nw-msg ' + (cls || ''); }

    function openPanel() {
      panel.classList.add('open');
      if (!getToken()) { setBox.style.display = 'block'; setMsg('Configurez d’abord votre jeton GitHub ⬇', 'err'); }
      else loadExisting();
    }
    function loadExisting() {
      existing.style.display = 'block'; existing.textContent = 'Chargement des notes existantes…';
      ghGet(notePath()).then(function (f) {
        if (f.content.trim()) existing.textContent = f.content;
        else existing.textContent = '(Aucune note pour cette page pour l’instant.)';
      }).catch(function (e) { existing.textContent = '⚠ ' + e.message; });
    }

    btn.addEventListener('click', function () {
      if (panel.classList.contains('open')) panel.classList.remove('open'); else openPanel();
    });
    panel.querySelector('.psl-nw-x').addEventListener('click', function () { panel.classList.remove('open'); });
    panel.querySelector('.psl-nw-toggleset').addEventListener('click', function () {
      setBox.style.display = setBox.style.display === 'none' ? 'block' : 'none';
    });
    panel.querySelector('.psl-nw-savecfg').addEventListener('click', function () {
      setName(nameI.value); setToken(tokenI.value);
      setMsg('Réglages enregistrés ✓', 'ok');
      if (getToken()) loadExisting();
    });

    sendBtn.addEventListener('click', function () {
      var text = ta.value.trim();
      if (!text) { setMsg('Écrivez d’abord une note.', 'err'); return; }
      if (!getToken()) { setBox.style.display = 'block'; setMsg('Jeton GitHub manquant ⬇', 'err'); return; }
      sendBtn.disabled = true; setMsg('Envoi…', '');
      addNote(text).then(function () {
        ta.value = ''; localStorage.removeItem(draftKey);
        setMsg('Note enregistrée dans le dépôt ✓', 'ok');
        loadExisting();
      }).catch(function (e) {
        setMsg(e.message, 'err');
      }).then(function () { sendBtn.disabled = false; });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
