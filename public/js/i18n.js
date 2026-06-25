(function () {
  'use strict';

  var LANGS = [
    { code: 'es', label: 'Español',  flag: '🇭🇳', native: 'Español' },
    { code: 'en', label: 'English',  flag: '🇺🇸', native: 'English' },
    { code: 'de', label: 'Deutsch',  flag: '🇩🇪', native: 'Deutsch' },
    { code: 'fr', label: 'Français', flag: '🇫🇷', native: 'Français' },
    { code: 'ja', label: '日本語',   flag: '🇯🇵', native: '日本語' },
  ];
  var KEY = 'cohon_lang';

  /* ── helpers ───────────────────────────────────── */
  function t(key) {
    var lang = window.__COHON_LANG || 'es';
    var dict = (window.COHON_T || {})[lang] || {};
    return dict[key] !== undefined ? dict[key] : ((window.COHON_T || {})['es'] || {})[key] || '';
  }

  function applyTranslations() {
    /* text content */
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = t(el.dataset.i18n);
      if (v !== '') el.textContent = v;
    });
    /* innerHTML (allows HTML tags inside translations) */
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var v = t(el.dataset.i18nHtml);
      if (v !== '') el.innerHTML = v;
    });
    /* placeholder */
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var v = t(el.dataset.i18nPh);
      if (v !== '') el.placeholder = v;
    });
    /* select first option text */
    document.querySelectorAll('[data-i18n-opt]').forEach(function (el) {
      var v = t(el.dataset.i18nOpt);
      if (v !== '') el.textContent = v;
    });
    /* aria-label */
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var v = t(el.dataset.i18nAria);
      if (v !== '') el.setAttribute('aria-label', v);
    });
    /* page <title> — map current path to nav key */
    var pageTitleMap = {
      '/':                  'nav.home',
      '/nosotros/':         'nav.about',
      '/marcas/':           'nav.brands',
      '/contacto/':         'nav.contact',
      '/junta-directiva/':  'nav.board',
    };
    var path = window.location.pathname;
    /* normalise: ensure trailing slash */
    if (path !== '/' && path.slice(-1) !== '/') path += '/';
    var titleKey = pageTitleMap[path];
    if (titleKey) {
      document.title = t(titleKey) + ' | COHONDUCAFE';
    }
    /* update lang switcher active state */
    document.querySelectorAll('.lang-opt-btn').forEach(function (btn) {
      var isActive = btn.dataset.lang === (window.__COHON_LANG || 'es');
      btn.classList.toggle('lang-opt-btn--active', isActive);
    });
    /* html lang attribute */
    document.documentElement.lang = window.__COHON_LANG || 'es';
  }

  function setLang(code) {
    window.__COHON_LANG = code;
    try { localStorage.setItem(KEY, code); } catch(e) {}
    applyTranslations();
    window.dispatchEvent(new CustomEvent('cohonlangchange'));
  }

  /* ── lang switcher pill (nav) ──────────────────── */
  function buildSwitcher() {
    var wrap = document.getElementById('lang-switcher');
    if (!wrap) return;
    var cur = window.__COHON_LANG || 'es';
    var html = '<button class="lang-pill" id="langPillBtn" aria-label="Change language">' +
      '<svg class="lang-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>' +
      '<span id="langPillLabel">' + LANGS.find(function(l){ return l.code===cur; }).flag + '</span>' +
      '<svg class="lang-caret" viewBox="0 0 10 6" fill="currentColor"><path d="M0 0l5 6 5-6z"/></svg>' +
    '</button>' +
    '<div class="lang-dropdown" id="langDropdown" aria-hidden="true">';
    LANGS.forEach(function(l) {
      html += '<button class="lang-opt-btn' + (l.code === cur ? ' lang-opt-btn--active' : '') + '" data-lang="' + l.code + '">' +
        '<span class="lang-opt-flag">' + l.flag + '</span>' +
        '<span class="lang-opt-native">' + l.native + '</span>' +
      '</button>';
    });
    html += '</div>';
    wrap.innerHTML = html;

    var pill     = document.getElementById('langPillBtn');
    var dropdown = document.getElementById('langDropdown');
    var label    = document.getElementById('langPillLabel');

    pill.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = dropdown.classList.toggle('lang-dropdown--open');
      dropdown.setAttribute('aria-hidden', String(!open));
    });

    document.addEventListener('click', function () {
      dropdown.classList.remove('lang-dropdown--open');
      dropdown.setAttribute('aria-hidden', 'true');
    });

    wrap.querySelectorAll('.lang-opt-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        setLang(btn.dataset.lang);
        label.textContent = LANGS.find(function(l){ return l.code===btn.dataset.lang; }).flag;
        dropdown.classList.remove('lang-dropdown--open');
        dropdown.setAttribute('aria-hidden', 'true');
      });
    });
  }

  /* ── modal ─────────────────────────────────────── */
  function buildModal() {
    var overlay = document.createElement('div');
    overlay.id = 'lang-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Language selection');

    var html = '<div class="lang-modal-card">' +
      '<div class="lang-modal-logo">' +
        '<img src="/img/logos_varios/Logotipo_COHONDUCAFE_Blanco.png" alt="COHONDUCAFE" />' +
      '</div>' +
      '<div class="lang-modal-rule"></div>' +
      '<h2 class="lang-modal-title">¿En qué idioma prefieres ver el sitio?</h2>' +
      '<p class="lang-modal-sub">Puedes cambiar el idioma en cualquier momento desde el menú.</p>' +
      '<div class="lang-modal-grid">';
    LANGS.forEach(function (l) {
      html += '<button class="lang-modal-btn" data-lang="' + l.code + '">' +
        '<span class="lang-modal-flag">' + l.flag + '</span>' +
        '<span class="lang-modal-native">' + l.native + '</span>' +
      '</button>';
    });
    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    /* animate in */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('lang-modal--visible');
      });
    });

    overlay.querySelectorAll('.lang-modal-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLang(btn.dataset.lang);
        /* update modal title/subtitle to chosen lang */
        var card = overlay.querySelector('.lang-modal-title');
        var sub  = overlay.querySelector('.lang-modal-sub');
        if (card) card.textContent = t('lang.modal.title');
        if (sub)  sub.textContent  = t('lang.modal.subtitle');
        overlay.classList.add('lang-modal--exit');
        setTimeout(function () { overlay.remove(); }, 450);
      });
    });
  }

  /* expose setter for mobile clone */
  window.__cohonSetLang = setLang;

  /* ── init ───────────────────────────────────────── */
  function init() {
    var saved;
    try { saved = localStorage.getItem(KEY); } catch(e) {}

    if (saved && window.COHON_T && window.COHON_T[saved]) {
      window.__COHON_LANG = saved;
      applyTranslations();
      buildSwitcher();
    } else {
      window.__COHON_LANG = 'es';
      applyTranslations(); /* apply ES first so page looks correct */
      buildSwitcher();
      buildModal();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
