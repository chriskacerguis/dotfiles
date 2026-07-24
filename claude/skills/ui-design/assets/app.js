// Portable, dependency-free progressive-enhancement handlers for the UI design
// system. Copy into your project's static assets (e.g. public/js/app.js) and load
// once per page with: <script src="/js/app.js" defer></script>
//
// Everything is CSP-safe (no inline handlers, no inline <script>) and uses event
// delegation, so it works for elements rendered anywhere, at any time. Drive
// behavior with data-* attributes:
//   data-confirm="msg"        link/button/form -> styled confirm modal
//   data-menu / -button/-panel dropdown menu
//   data-disable-on-submit     form -> prevent double-submit (data-submitting-text optional)
//   data-file-names="targetId" file input -> mirror chosen filenames into #targetId
//
// NOTE: the modal's Tailwind classes are authored below, so if your build purges
// CSS via a `content` scan, include this file's glob (e.g. ./public/js/**/*.js)
// or those classes will be stripped from the compiled stylesheet.
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Confirmation modal (replaces native window.confirm / alert). Injected once.
  // ---------------------------------------------------------------------------
  var pendingAction = null;

  function ensureModal() {
    var m = document.getElementById('confirm-modal');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'confirm-modal';
    m.className = 'hidden fixed inset-0 z-50 items-center justify-center bg-gray-900/50 p-4';
    m.innerHTML =
      '<div class="w-full max-w-md rounded-xl bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">' +
        '<div class="p-6">' +
          '<h3 id="confirm-modal-title" class="text-base font-semibold text-gray-900">Please confirm</h3>' +
          '<p class="mt-2 text-sm text-gray-600" data-confirm-message></p>' +
        '</div>' +
        '<div class="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">' +
          '<button type="button" data-confirm-cancel class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>' +
          '<button type="button" data-confirm-ok class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Confirm</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(m);
    return m;
  }

  function openConfirm(message, onOk) {
    var m = ensureModal();
    var msgEl = m.querySelector('[data-confirm-message]');
    if (msgEl) msgEl.textContent = message || 'Are you sure?';
    pendingAction = onOk;
    m.classList.remove('hidden');
    m.classList.add('flex');
    var ok = m.querySelector('[data-confirm-ok]');
    if (ok) ok.focus();
  }

  function closeConfirm() {
    var m = document.getElementById('confirm-modal');
    if (m) {
      m.classList.add('hidden');
      m.classList.remove('flex');
    }
    pendingAction = null;
  }

  // Confirm runs the pending action; Cancel / overlay click / Escape dismiss it.
  document.addEventListener('click', function (e) {
    var m = document.getElementById('confirm-modal');
    if (!m || m.classList.contains('hidden')) return;
    if (e.target.closest('[data-confirm-ok]')) {
      var run = pendingAction;
      closeConfirm();
      if (run) run();
    } else if (e.target.closest('[data-confirm-cancel]') || e.target === m) {
      closeConfirm();
    }
  });
  document.addEventListener('keydown', function (e) {
    var m = document.getElementById('confirm-modal');
    if (m && !m.classList.contains('hidden') && e.key === 'Escape') closeConfirm();
  });

  // Forms confirmed via the modal are flagged so the re-dispatched submit passes
  // straight through instead of re-opening the modal.
  var confirmedForms = new WeakSet();

  function submitForm(form, submitter) {
    if (form.hasAttribute('data-confirm')) confirmedForms.add(form);
    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit(submitter || undefined);
    } else {
      // Legacy fallback: submit() bypasses submit handlers (so no re-confirm loop).
      form.submit();
    }
  }

  // Links / buttons carrying data-confirm: open the modal instead of acting now.
  document.addEventListener('click', function (e) {
    var el = e.target.closest('a[data-confirm], button[data-confirm]');
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    openConfirm(el.getAttribute('data-confirm'), function () {
      if (el.tagName === 'A') {
        var href = el.getAttribute('href');
        if (href) window.location.assign(href);
      } else {
        var form = el.form || el.closest('form');
        if (form) submitForm(form, el.type === 'submit' ? el : null);
      }
    });
  });

  // Form-level data-confirm on submit (catches Enter and any submit).
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.hasAttribute('data-confirm')) {
      if (confirmedForms.has(form)) {
        confirmedForms.delete(form); // already confirmed — let it through
      } else {
        e.preventDefault();
        openConfirm(form.getAttribute('data-confirm'), function () {
          submitForm(form, null);
        });
        return; // don't run disable-on-submit until actually submitting
      }
    }

    // Prevent double-submit: disable the submit button (optionally swapping its
    // label via data-submitting-text). Deferred so its value is still submitted.
    if (form.hasAttribute('data-disable-on-submit')) {
      var btn = form.querySelector('button[type=submit], input[type=submit], button:not([type])');
      if (btn) {
        window.setTimeout(function () {
          btn.disabled = true;
          var t = btn.getAttribute('data-submitting-text');
          if (t) btn.textContent = t;
        }, 0);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Dropdown menus. A [data-menu] wraps a [data-menu-button] and a hidden
  // [data-menu-panel]: click toggles; outside-click / Escape closes.
  // ---------------------------------------------------------------------------
  function closeMenus(except) {
    document.querySelectorAll('[data-menu-panel]').forEach(function (panel) {
      if (panel === except) return;
      panel.classList.add('hidden');
      var menu = panel.closest('[data-menu]');
      var btn = menu && menu.querySelector('[data-menu-button]');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-menu-button]');
    if (btn) {
      var menu = btn.closest('[data-menu]');
      var panel = menu && menu.querySelector('[data-menu-panel]');
      if (panel) {
        var willOpen = panel.classList.contains('hidden');
        closeMenus(willOpen ? panel : null);
        panel.classList.toggle('hidden', !willOpen);
        btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      }
      return;
    }
    if (!e.target.closest('[data-menu-panel]')) closeMenus(null);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenus(null);
  });

  // ---------------------------------------------------------------------------
  // File inputs: mirror chosen filenames into the element named in data-file-names.
  // ---------------------------------------------------------------------------
  document.addEventListener('change', function (e) {
    var input = e.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'file') return;
    var targetId = input.getAttribute('data-file-names');
    if (!targetId) return;
    var target = document.getElementById(targetId);
    if (!target) return;
    var files = Array.prototype.slice.call(input.files);
    target.textContent = files.length
      ? files.map(function (f) { return f.name; }).join(', ')
      : '';
  });
})();
