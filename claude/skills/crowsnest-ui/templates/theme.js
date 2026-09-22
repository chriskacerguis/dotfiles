// Applies the stored theme before first paint so there is no flash of the
// wrong one. Kept as a file rather than an inline <script> so that the
// Content-Security-Policy in src/app.js can stay at script-src 'self' — no
// 'unsafe-inline', and no hash to keep in step with this code.
// Rename STORAGE_KEY per app, and keep it identical to the one in
// contexts/ThemeContext.jsx — the two must agree or the theme resets on load.
var STORAGE_KEY = 'app-theme';

(function () {
  try {
    var stored = localStorage.getItem(STORAGE_KEY);
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (err) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
