// Settings dropdown: the gear button reveals the language pills and theme
// toggle. Closes on outside click or Escape.
(() => {
  const toggle = document.querySelector('[data-settings-toggle]');
  const panel = document.querySelector('[data-settings-panel]');
  if (!toggle || !panel) return;

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(panel.hidden);
  });
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
})();
