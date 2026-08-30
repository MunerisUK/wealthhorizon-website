/* Copyright (c) 2026 Muneris Management Ltd. All rights reserved. */
/* Two behaviours, both progressive: the site is readable with JavaScript off. */

(function () {
  'use strict';

  /* --- Mobile navigation ------------------------------------------------ */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.hidden = false;
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* --- Tabs -------------------------------------------------------------
     Panels are plain sections in the markup and are only hidden once this
     runs, so a reader without JavaScript gets every edition in full rather
     than one panel and two blanks. The hash is honoured on load and written
     on change, so a tab can be linked to (…/#pro).                        */
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    var panels = tabs.map(function (t) {
      return document.getElementById(t.getAttribute('aria-controls'));
    });

    function select(index, focus, writeHash) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        if (panels[i]) {
          panels[i].hidden = !on;
          panels[i].classList.toggle('is-active', on);
        }
      });
      if (focus) tabs[index].focus();
      // Only written on a deliberate change: rewriting it on load would put a
      // fragment in the address bar the reader never asked for, and a browser
      // that acts on a fragment would jump the page past the section heading.
      if (writeHash) {
        var id = tabs[index].getAttribute('aria-controls');
        if (id && history.replaceState) history.replaceState(null, '', '#' + id);
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false, true); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next !== null) { e.preventDefault(); select(next, true, true); }
      });
    });

    function indexForHash() {
      var hash = (location.hash || '').replace('#', '');
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].getAttribute('aria-controls') === hash) return i;
      }
      return -1;
    }

    // Changing only the fragment does not reload the document, so without this
    // a link to #pro from the page you are already on would move the scroll
    // position and leave the wrong panel open.
    window.addEventListener('hashchange', function () {
      var i = indexForHash();
      if (i >= 0) select(i, false, false);
    });

    var start = indexForHash();
    select(start >= 0 ? start : 0, false, false);
  });
})();
