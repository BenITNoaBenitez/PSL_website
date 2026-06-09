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
  // Jeton : priorité au localStorage, sinon jeton embarqué (window.NOTES_CONFIG.token)
  var getToken = function () { return localStorage.getItem(LS.token) || (window.NOTES_CONFIG && window.NOTES_CONFIG.token) || ''; };
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
  var BLUE = '#1666d6', BLUE2 = '#0f56b8';
  var css = '' +
    '#psl-nw-btn{position:fixed;left:18px;bottom:18px;z-index:99998;background:' + BLUE + ';color:#fff;border:none;border-radius:4px;width:66px;height:66px;font:700 12px/1.2 Arial,system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px}' +
    '#psl-nw-btn:hover{background:' + BLUE2 + '}' +
    '#psl-nw-btn .ico{font-size:22px}' +
    '#psl-nw-panel{position:fixed;left:18px;bottom:92px;z-index:99999;width:440px;max-width:calc(100vw - 36px);max-height:85vh;background:#fff;border:2px solid ' + BLUE + ';border-radius:6px;box-shadow:0 14px 44px rgba(0,0,0,.35);display:none;flex-direction:column;overflow:hidden;font:14px/1.5 Arial,system-ui,sans-serif;color:#1a1a1a}' +
    '#psl-nw-panel.open{display:flex}' +
    '.psl-nw-banner{background:#fff3cd;color:#7a5c00;font-size:11px;font-weight:700;letter-spacing:.3px;padding:6px 14px;border-bottom:1px solid #f0e0a0;text-align:center;text-transform:uppercase}' +
    '.psl-nw-head{background:' + BLUE + ';color:#fff;padding:12px 14px;display:flex;align-items:center;justify-content:space-between}' +
    '.psl-nw-head b{font-size:15px}.psl-nw-head small{display:block;opacity:.85;font-weight:400;font-size:12px;margin-top:2px}' +
    '.psl-nw-x{background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1}' +
    '.psl-nw-body{padding:14px 16px;overflow:auto}' +
    '.psl-nw-body textarea{width:100%;box-sizing:border-box;min-height:120px;border:1px solid #c8c8c8;border-radius:6px;padding:10px;font:inherit;resize:vertical}' +
    '.psl-nw-body input{width:100%;box-sizing:border-box;border:1px solid #c8c8c8;border-radius:6px;padding:10px;font:inherit;margin-top:4px}' +
    '.psl-nw-body label{display:block;font-size:13px;color:#333;margin:10px 0 2px;font-weight:700}' +
    '.psl-nw-row{display:flex;gap:8px;margin-top:12px}' +
    '.psl-nw-btn1{flex:1;background:' + BLUE + ';color:#fff;border:none;border-radius:6px;padding:12px;font:700 14px Arial,sans-serif;cursor:pointer}' +
    '.psl-nw-btn1:hover{background:' + BLUE2 + '}' +
    '.psl-nw-btn1:disabled{opacity:.5;cursor:default}' +
    '.psl-nw-link{background:none;border:none;color:' + BLUE + ';font-size:12px;cursor:pointer;text-decoration:underline;padding:0;margin-top:12px}' +
    '.psl-nw-msg{font-size:13px;margin-top:10px;min-height:16px}' +
    '.psl-nw-msg.ok{color:#0a8a3a}.psl-nw-msg.err{color:#c40016}' +
    '.psl-nw-hint{font-size:12px;color:#777;margin-top:8px}' +
    '.psl-nw-existing{margin-top:14px;border-top:1px solid #eee;padding-top:12px;font-size:12px;color:#555;white-space:pre-wrap;word-break:break-word;max-height:200px;overflow:auto;background:#f7f7f7;border-radius:6px;padding:10px}';

  // ---------- Construction de l'UI ----------
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  function build() {
    if (!CFG.owner || !CFG.repo) {
      // Hors GitHub Pages (ex: ouverture locale) — widget inactif silencieusement
      return;
    }
    var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

    var btn = el('<button id="psl-nw-btn" title="Laisser une note sur cette page"><span class="ico">📝</span>NOTES</button>');
    var panel = el(
      '<div id="psl-nw-panel">' +
        '<div class="psl-nw-banner">Outil de relecture — ne fait pas partie du site</div>' +
        '<div class="psl-nw-head"><div><b>Notes de relecture</b><small>Page : ' + pageKey() + '.html</small></div>' +
          '<button class="psl-nw-x" title="Fermer">×</button></div>' +
        '<div class="psl-nw-body">' +
          // Vue 1 : jeton seul (si pas de jeton)
          '<div class="psl-nw-tokenview">' +
            '<label>Jeton d’accès</label>' +
            '<input class="psl-nw-token" type="password" placeholder="Collez le jeton fourni…" autocomplete="off">' +
            '<div class="psl-nw-row"><button class="psl-nw-btn1 psl-nw-savetoken">Valider</button></div>' +
            '<div class="psl-nw-hint">Jeton fourni par le propriétaire du site. Il reste dans votre navigateur.</div>' +
          '</div>' +
          // Vue 2 : rédaction de note (si jeton présent)
          '<div class="psl-nw-noteview" style="display:none">' +
            '<label>Votre nom <span style="font-weight:400;color:#999">(optionnel)</span></label>' +
            '<input class="psl-nw-name" type="text" placeholder="ex : Marie">' +
            '<label>Votre note sur cette page</label>' +
            '<textarea placeholder="Votre remarque…"></textarea>' +
            '<div class="psl-nw-row"><button class="psl-nw-btn1 psl-nw-send">Envoyer la note</button></div>' +
            '<button class="psl-nw-link psl-nw-changetoken">Changer le jeton</button>' +
            '<div class="psl-nw-existing" style="display:none"></div>' +
          '</div>' +
          '<div class="psl-nw-msg"></div>' +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(btn); document.body.appendChild(panel);

    var tokenView = panel.querySelector('.psl-nw-tokenview');
    var noteView = panel.querySelector('.psl-nw-noteview');
    var ta = panel.querySelector('textarea');
    var sendBtn = panel.querySelector('.psl-nw-send');
    var msg = panel.querySelector('.psl-nw-msg');
    var nameI = panel.querySelector('.psl-nw-name');
    var tokenI = panel.querySelector('.psl-nw-token');
    var existing = panel.querySelector('.psl-nw-existing');
    var draftKey = LS.draftPrefix + pageKey();

    ta.value = localStorage.getItem(draftKey) || '';
    nameI.value = getName();
    ta.addEventListener('input', function () { localStorage.setItem(draftKey, ta.value); });

    function setMsg(t, cls) { msg.textContent = t || ''; msg.className = 'psl-nw-msg ' + (cls || ''); }

    // Bascule entre les deux vues selon la présence d'un jeton
    function showView() {
      setMsg('');
      if (getToken()) {
        tokenView.style.display = 'none'; noteView.style.display = 'block';
        loadExisting();
      } else {
        tokenView.style.display = 'block'; noteView.style.display = 'none';
        tokenI.value = '';
      }
    }
    function openPanel() { panel.classList.add('open'); showView(); }

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

    panel.querySelector('.psl-nw-savetoken').addEventListener('click', function () {
      var v = (tokenI.value || '').trim();
      if (!v) { setMsg('Collez d’abord le jeton.', 'err'); return; }
      setToken(v); showView();
    });
    panel.querySelector('.psl-nw-changetoken').addEventListener('click', function () {
      localStorage.removeItem(LS.token); showView();
    });

    sendBtn.addEventListener('click', function () {
      var text = ta.value.trim();
      if (!text) { setMsg('Écrivez d’abord une note.', 'err'); return; }
      setName(nameI.value);
      sendBtn.disabled = true; setMsg('Envoi…', '');
      addNote(text).then(function () {
        ta.value = ''; localStorage.removeItem(draftKey);
        setMsg('Note enregistrée ✓', 'ok');
        loadExisting();
      }).catch(function (e) {
        setMsg(e.message, 'err');
      }).then(function () { sendBtn.disabled = false; });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
