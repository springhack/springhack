document.addEventListener('DOMContentLoaded', () => {
  const headings = document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6');
  headings.forEach(h => {
    const level = parseInt(h.tagName.substring(1), 10) || 1;

    // Ensure heading has an id; generate one if missing
    let id = h.id;
    if (!id) {
      const text = h.textContent.trim();
      id = text
        .toLowerCase()
        // Keep letters/numbers/spaces/hyphens; allow unicode letters
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      if (!id) {
        id = 'heading-' + Math.random().toString(36).slice(2, 8);
      }
      h.id = id;
    }

    // Avoid duplicate anchors if script runs multiple times
    if (h.querySelector('.h-anchor')) return;

    const anchor = document.createElement('a');
    anchor.className = 'h-anchor';
    anchor.href = '#' + id;
    anchor.setAttribute('aria-label', `Anchor link to ${id}`);
    anchor.textContent = '#'.repeat(level);
    h.prepend(anchor);
  });
});

