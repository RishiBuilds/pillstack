(function () {
  const STORAGE_KEY = "theme";
  const DEFAULT_THEME = "dark"; 

  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateToggleIcon(theme);
  }

  function updateToggleIcon(theme) {
    const icon = document.querySelector(".theme-toggle i");
    if (!icon) return;

    icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
  }

  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    const theme = savedTheme || DEFAULT_THEME;

    root.setAttribute("data-theme", theme);
    updateToggleIcon(theme);
  }

  window.toggleTheme = function () {
    const currentTheme = root.getAttribute("data-theme") || DEFAULT_THEME;
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
  };

  initTheme();
})();
