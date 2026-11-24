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
        remember(id);
      }
    }

    /* A tabset that names itself (data-tabs="jurisdictions") remembers what
       the reader picked, so somebody in the US who wants the UK rules is
       asked once rather than every visit. A deliberate pick only: a locale
       guess is not a choice, and neither is following a link, or a link
       shared once would stick for good. Storage is per browser and can throw
       where a private window has it switched off, so it is wrapped and the
       tabs work without it. */
    var memory = root.getAttribute('data-tabs') || '';
    var KEY = memory ? 'wh.tab.' + memory : null;

    function remember(id) {
      if (!KEY || !id) return;
      try { localStorage.setItem(KEY, id); } catch (e) { /* nothing to do */ }
    }

    function indexRemembered() {
      if (!KEY) return -1;
      var id;
      try { id = localStorage.getItem(KEY); } catch (e) { return -1; }
      if (!id) return -1;
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].getAttribute('aria-controls') === id) return i;
      }
      return -1;   // a tab that no longer exists is not a choice
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

    /* Where a tabset says which regions each tab is for, open the one that
       fits the reader. The tax rules that apply to somebody in Ohio are not
       the ones that apply in Kent, and opening the wrong country first tells
       them the product is not for them.

       A tab claims regions with data-regions="GB", and one tab may claim "*"
       as the catch-all for a region nobody else claims. The address bar still
       wins: a link to #uk is a deliberate request and is honoured whatever
       the browser says. An unreadable locale falls through to the first tab,
       never to a guess. */
    function regionOfReader() {
      try {
        var tags = navigator.languages && navigator.languages.length
          ? navigator.languages : [navigator.language];
        for (var i = 0; i < tags.length; i++) {
          var m = /^[A-Za-z]{2,3}[-_]([A-Za-z]{2})\b/.exec(tags[i] || '');
          if (m) return m[1].toUpperCase();
        }
        // No region in the language tag ("en"), so fall back to the time zone.
        var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (/^Europe\/London$/.test(tz)) return 'GB';
        if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana|Kentucky|North_Dakota|Boise|Juneau|Sitka|Nome|Adak|Menominee)/.test(tz)) return 'US';
      } catch (e) { /* a browser that will not say is the same as not knowing */ }
      return null;
    }

    function indexForRegion() {
      var claimed = false, fallback = -1;
      for (var i = 0; i < tabs.length; i++) if (tabs[i].hasAttribute('data-regions')) claimed = true;
      if (!claimed) return -1;
      var region = regionOfReader();
      if (!region) return -1;
      for (var j = 0; j < tabs.length; j++) {
        var list = (tabs[j].getAttribute('data-regions') || '').toUpperCase().split(/[,\s]+/);
        if (list.indexOf(region) >= 0) return j;
        if (list.indexOf('*') >= 0) fallback = j;
      }
      return fallback;
    }

    var start = indexForHash();
    if (start < 0) start = indexRemembered();
    if (start < 0) start = indexForRegion();
    select(start >= 0 ? start : 0, false, false);
  });
})();
