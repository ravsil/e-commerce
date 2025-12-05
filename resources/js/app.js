import './components/user_dropdown';

window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('mobile-search-button');
  const dropdown = document.getElementById('mobile-search-dropdown');
  const input = document.getElementById('mobile-search-input');
  const desktopInput = document.getElementById('product-search');

  if (!btn || !dropdown) {
    return;
  }

  const open = () => {
    dropdown.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    if (input) input.focus();
  };

  const close = () => {
    dropdown.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdown.classList.contains('hidden')) open(); else close();
  });

  // Sync mobile dropdown input with the desktop (hidden) input so existing page search logic runs
  if (input && desktopInput) {
    input.addEventListener('input', (ev) => {
      desktopInput.value = input.value;
      // dispatch an input event on the desktop input so page scripts listening there react
      desktopInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // When pressing Enter in mobile input, also dispatch input (in case value didn't change)
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        desktopInput.value = input.value;
        desktopInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!dropdown.classList.contains('hidden') && !dropdown.contains(e.target) && e.target !== btn) {
      close();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dropdown.classList.contains('hidden')) {
      close();
    }
  });
});