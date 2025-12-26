(function () {
  const STORAGE_KEY = "theme";
  const DEFAULT_THEME = "dark";
  const root = document.documentElement;

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : DEFAULT_THEME;
  }

  function applyTheme(theme, persist = true) {
    root.setAttribute("data-theme", theme);
    if (persist) localStorage.setItem(STORAGE_KEY, theme);
    updateToggleIcon(theme);
  }

  function updateToggleIcon(theme) {
    const icon = document.querySelector(".theme-toggle i");
    if (!icon) return;

    icon.className = theme === "dark"
      ? "fas fa-sun"
      : "fas fa-moon";
  }

  function initTheme() {
    const theme = getPreferredTheme();
    applyTheme(theme, false);
  }

  window.toggleTheme = function () {
    const current = root.getAttribute("data-theme") || DEFAULT_THEME;
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
  };

  document.addEventListener("DOMContentLoaded", initTheme);
})();
