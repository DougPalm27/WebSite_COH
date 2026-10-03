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
    /* aria-label ({n} se reemplaza por data-i18n-n, p. ej. un número o un nombre) */
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var v = t(el.dataset.i18nAria);
      if (v !== '') el.setAttribute('aria-label', v.replace('{n}', el.dataset.i18nN || ''));
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
    /* una página puede declarar su clave de título (p. ej. 404, cuya URL es cualquiera) */
    var titleEl  = document.querySelector('[data-i18n-title]');
    var titleKey = titleEl ? titleEl.dataset.i18nTitle : pageTitleMap[path];
    if (titleKey) {
      document.title = t(titleKey) + ' | COHONDUCAFE';
    }
    /* update lang switcher active state + pill flags (desktop y móvil) */
    document.querySelectorAll('.lang-opt-btn').forEach(function (btn) {
      var isActive = btn.dataset.lang === (window.__COHON_LANG || 'es');
      btn.classList.toggle('lang-opt-btn--active', isActive);
    });
    document.querySelectorAll('.lang-pill-label').forEach(function (el) {
      el.textContent = flagFor(window.__COHON_LANG || 'es');
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
  function flagFor(code) {
    return LANGS.find(function(l){ return l.code===code; }).flag;
  }

  /* Construye un selector en cada contenedor .lang-switcher (desktop y móvil) */
  function buildSwitcher() {
    document.querySelectorAll('.lang-switcher').forEach(buildSwitcherIn);
  }

  function buildSwitcherIn(wrap) {
    var cur = window.__COHON_LANG || 'es';
    var html = '<button class="lang-pill" data-i18n-aria="a11y.lang" aria-label="' + t('a11y.lang') + '" aria-expanded="false">' +
      '<svg class="lang-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>' +
      '<span class="lang-pill-label">' + flagFor(cur) + '</span>' +
      '<svg class="lang-caret" viewBox="0 0 10 6" fill="currentColor"><path d="M0 0l5 6 5-6z"/></svg>' +
    '</button>' +
    '<div class="lang-dropdown" aria-hidden="true">';
    LANGS.forEach(function(l) {
      html += '<button class="lang-opt-btn' + (l.code === cur ? ' lang-opt-btn--active' : '') + '" data-lang="' + l.code + '">' +
        '<span class="lang-opt-flag">' + l.flag + '</span>' +
        '<span class="lang-opt-native">' + l.native + '</span>' +
      '</button>';
    });
    html += '</div>';
    wrap.innerHTML = html;

    var pill     = wrap.querySelector('.lang-pill');
    var dropdown = wrap.querySelector('.lang-dropdown');

    function close() {
      dropdown.classList.remove('lang-dropdown--open');
      dropdown.setAttribute('aria-hidden', 'true');
      pill.setAttribute('aria-expanded', 'false');
    }

    pill.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = dropdown.classList.toggle('lang-dropdown--open');
      dropdown.setAttribute('aria-hidden', String(!open));
      pill.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', close);

    wrap.querySelectorAll('.lang-opt-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        setLang(btn.dataset.lang);
        close();
      });
    });
  }

  window.__cohonSetLang = setLang;

  /* Primer idioma del navegador que tengamos traducido (p. ej. "en-US" → "en") */
  function detectLang() {
    var prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'es'];
    for (var i = 0; i < prefs.length; i++) {
      var code = String(prefs[i]).toLowerCase().split('-')[0];
      if (window.COHON_T && window.COHON_T[code]) return code;
    }
    return 'es';
  }

  /* ── init ───────────────────────────────────────── */
  function init() {
    var saved;
    try { saved = localStorage.getItem(KEY); } catch(e) {}

    /* 1) idioma elegido antes por el usuario, 2) idioma del navegador, 3) español */
    window.__COHON_LANG = (saved && window.COHON_T && window.COHON_T[saved]) ? saved : detectLang();
    applyTranslations();
    buildSwitcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
