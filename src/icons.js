// Line icons (24×24, stroke-based). Routine tiles can use any key that doesn't start with "_".

const svg = (size, body) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  // routine tile icons
  sunrise: svg(28, '<path d="M3 17h18M7 17a5 5 0 0 1 10 0M12 6v2M5.6 9.6l1.4 1.4M18.4 9.6l-1.4 1.4M5 21h14"/>'),
  dumbbell: svg(26, '<path d="M2 12h2M20 12h2M7 12h10"/><rect x="4" y="8" width="3" height="8" rx="1"/><rect x="17" y="8" width="3" height="8" rx="1"/>'),
  kettlebell: svg(26, '<path d="M9 7a3 3 0 0 1 6 0"/><path d="M8 7h8l1.5 3a6 6 0 1 1-11 0z"/>'),
  run: svg(26, '<circle cx="14" cy="4.5" r="1.8"/><path d="M8 21l3-6l3 2v4M10.5 11l1.5-4l3 2l2.5 1M12 7l-3.5 1.5L7 11"/>'),
  lotus: svg(28, '<path d="M12 20c-4 0-7-2.5-7-6c2.5 0 5 1 7 3c2-2 4.5-3 7-3c0 3.5-3 6-7 6z"/><path d="M12 17c-1.6-1.8-2.2-4-1.4-6.6c.4-1.4 1-2.5 1.4-3.4c.4.9 1 2 1.4 3.4c.8 2.6.2 4.8-1.4 6.6z"/>'),
  heart: svg(26, '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'),
  moon: svg(26, '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>'),
  flame: svg(26, '<path d="M12 21c-3.5 0-6-2.4-6-5.6c0-3.6 3-5.4 3.4-9.4c2.6 1.6 4 3.6 4 5.6c.8-.6 1.4-1.6 1.6-2.6c1.9 1.6 3 3.8 3 6.4c0 3.2-2.5 5.6-6 5.6z"/>'),
  bike: svg(26, '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9l2 7h-1M14 6h2"/>'),
  stretch: svg(26, '<circle cx="12" cy="4.5" r="1.8"/><path d="M4 9l8 1l8-1M12 10v5l-4 6M12 15l4 6"/>'),
  star: svg(26, '<path d="M12 4l2.4 5l5.4.6l-4 3.7l1.1 5.4L12 16l-4.9 2.7l1.1-5.4l-4-3.7l5.4-.6z"/>'),

  // interface
  _back: svg(20, '<path d="M15 6l-6 6l6 6"/>'),
  _close: svg(20, '<path d="M6 6l12 12M18 6L6 18"/>'),
  _play: svg(22, '<path d="M8 5l11 7l-11 7z" fill="currentColor" stroke="none"/>'),
  _pause: svg(22, '<path d="M8 5v14M16 5v14" stroke-width="2.6"/>'),
  _prev: svg(20, '<path d="M18 6l-8 6l8 6zM6 6v12"/>'),
  _next: svg(20, '<path d="M6 6l8 6l-8 6zM18 6v12"/>'),
  _check: svg(18, '<path d="M5 12l5 5l9-10"/>'),
  _settings: svg(20, '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.2 7l2.6 1.5M17.2 15.5l2.6 1.5M4.2 17l2.6-1.5M17.2 8.5L19.8 7"/>'),
  _download: svg(18, '<path d="M12 4v11M7 10l5 5l5-5M5 20h14"/>'),
  _upload: svg(18, '<path d="M12 20V9M7 14l5-5l5 5M5 4h14"/>'),
  _trash: svg(18, '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>'),
  _external: svg(16, '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
};

/** Resize an icon (the original sizes suit the tiles). */
export function icon(name, size) {
  const s = ICONS[name] || ICONS.star;
  return size ? s.replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`) : s;
}
