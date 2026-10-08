/* Bộ icon SVG nhỏ (nét 2px, bo tròn) và mascot "Bé Cháo". */
(function (H) {
  'use strict';

  var P = {
    home: '<path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M5.5 9.6V19a1 1 0 0 0 1 1H10v-5.5h4V20h3.5a1 1 0 0 0 1-1V9.6"/>',
    wheel: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2"/><path d="M12 3.5V10M12 14v6.5M3.5 12H10M14 12h6.5M6 6l4.6 4.6M13.4 13.4 18 18M18 6l-4.6 4.6M10.6 13.4 6 18"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.6 8.4-2.2 5-5 2.2 2.2-5z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    book: '<path d="M12 6.6C10.3 5.2 8 4.6 4 4.6v12.8c4 0 6.3.6 8 2 1.7-1.4 4-2 8-2V4.6c-4 0-6.3.6-8 2z"/><path d="M12 6.6v12.8"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.3c2.2.7 3.5 2.7 3.5 5.7"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4.5v1.5A3.5 3.5 0 0 0 8 11M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11M12 13v4M8.5 20h7M9.5 17h5"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    gear: '<path d="M9.87 5.02 L10.33 2.55 L13.67 2.55 L14.13 5.02 L15.43 5.55 L17.51 4.14 L19.86 6.49 L18.45 8.57 L18.98 9.87 L21.45 10.33 L21.45 13.67 L18.98 14.13 L18.45 15.43 L19.86 17.51 L17.51 19.86 L15.43 18.45 L14.13 18.98 L13.67 21.45 L10.33 21.45 L9.87 18.98 L8.57 18.45 L6.49 19.86 L4.14 17.51 L5.55 15.43 L5.02 14.13 L2.55 13.67 L2.55 10.33 L5.02 9.87 L5.55 8.57 L4.14 6.49 L6.49 4.14 L8.57 5.55Z"/><circle cx="12" cy="12" r="3.1"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    'chev-l': '<path d="m14.5 6-6 6 6 6"/>',
    'chev-r': '<path d="m9.5 6 6 6-6 6"/>',
    'chev-d': '<path d="m6 9.5 6 6 6-6"/>',
    heart: '<path d="M12 20.3s-7.5-4.5-7.5-10.1A4.3 4.3 0 0 1 12 7.5a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.1-7.5 10.1z"/>',
    clock: '<circle cx="12" cy="12" r="8.8"/><path d="M12 7.2V12l3.2 2"/>',
    flame: '<path d="M12 21c3.9 0 6.4-2.5 6.4-6 0-3.3-2.3-4.8-3.3-7.8-1.7 1-2.6 2.5-2.9 4.1-.8-.7-1.2-1.7-1.2-2.8C8.3 9 5.6 11.4 5.6 15c0 3.4 2.5 6 6.4 6z"/>',
    coin: '<circle cx="12" cy="12" r="8.8"/><path d="M14.6 9.3c-.5-.8-1.5-1.3-2.6-1.3-1.5 0-2.6.8-2.6 2 0 2.9 5.4 1.4 5.4 4.2 0 1.2-1.2 2-2.8 2-1.3 0-2.4-.5-3-1.4M12 6.6V8M12 16v1.4"/>',
    cart: '<circle cx="9" cy="19.6" r="1.4"/><circle cx="17.2" cy="19.6" r="1.4"/><path d="M3 4.5h2.4l2 10.6h10.7L19.8 7H6.1"/>',
    fridge: '<rect x="5.5" y="2.8" width="13" height="18.4" rx="3"/><path d="M5.5 10.2h13M9 6.2v1.6M9 13v3"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    pin: '<path d="M12 21v-6.5M8 3.5h8l-1 5.2 3 3.3v1.8H6V12l3-3.3z"/>',
    refresh: '<path d="M20 5.5v5h-5"/><path d="M4 18.5v-5h5"/><path d="M5.8 9.5A7.3 7.3 0 0 1 19.4 10.5M18.2 14.5A7.3 7.3 0 0 1 4.6 13.5"/>',
    sparkle: '<path d="M12 3.5 14 9l5.5 2L14 13l-2 5.5L10 13l-5.5-2L10 9z"/><path d="M19 3.5v3M17.5 5h3"/>',
    info: '<circle cx="12" cy="12" r="8.8"/><path d="M12 11v5M12 8h.01"/>',
    warn: '<path d="M12 3.8 21.2 19.8H2.8z"/><path d="M12 10v4.4M12 17.2h.01"/>',
    play: '<path d="M8 5.5v13l11-6.5z"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="12" rx="2.5"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v9.5a2 2 0 0 0 2 2h2"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7M10 11v5M14 11v5"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4"/>',
    shuffle: '<path d="M3 7h3.5c5 0 5 10 10 10H21M3 17h3.5c1.6 0 2.7-.6 3.6-1.5M21 7h-4.5c-1.6 0-2.7.6-3.6 1.5"/><path d="m18.5 14.5 2.5 2.5-2.5 2.5M18.5 4.5 21 7l-2.5 2.5"/>',
    thumb: '<path d="M7 11v9H4.5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z"/><path d="m7 11 3.3-6.2A1.8 1.8 0 0 1 13.5 6v3.5h5a1.8 1.8 0 0 1 1.8 2.2l-1.6 7a1.8 1.8 0 0 1-1.8 1.3H7"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19c2-4 5-7 9-9"/>',
    shield: '<path d="M12 3.2 19.5 6v5.6c0 4.5-3.1 7.7-7.5 9.2-4.4-1.5-7.5-4.7-7.5-9.2V6z"/><path d="m8.8 12 2.4 2.4 4-4.4"/>',
    bowl: '<path d="M3.5 11h17c0 4.7-3.5 8-8.5 8s-8.5-3.3-8.5-8z"/><path d="M8 7c0-1.2 1-1.8 1-3M12 7c0-1.2 1-1.8 1-3M16 7c0-1.2 1-1.8 1-3"/>',
    edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    more: '<circle cx="5.5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
    list: '<path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20"/><circle cx="4.5" cy="6.5" r=".8"/><circle cx="4.5" cy="12" r=".8"/><circle cx="4.5" cy="17.5" r=".8"/>'
  };

  // icon('home', { size: 22, cls: 'x', label: 'Trang chủ' })
  H.icon = function (name, o) {
    o = o || {};
    var size = o.size || 22;
    var path = P[name];
    if (!path) return '';
    var a11y = o.label ? ' role="img" aria-label="' + H.util.esc(o.label) + '"' : ' aria-hidden="true" focusable="false"';
    var fill = o.fill ? ' fill="currentColor"' : ' fill="none"';
    return '<svg class="ic' + (o.cls ? ' ' + o.cls : '') + '" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24"' + fill + ' stroke="currentColor" stroke-width="' + (o.stroke || 2) +
      '" stroke-linecap="round" stroke-linejoin="round"' + a11y + '>' + path + '</svg>';
  };

  // Mascot "Bé Cháo": tô cháo có mặt cười, hơi nóng bốc lên.
  H.mascot = function (o) {
    o = o || {};
    var size = o.size || 96;
    var mood = o.mood || 'happy';
    var mouth = mood === 'wow'
      ? '<ellipse cx="60" cy="87" rx="5" ry="6" fill="#7A2E0E"/>'
      : '<path d="M51 84c2.5 6.5 15.5 6.5 18 0" fill="none" stroke="#7A2E0E" stroke-width="3.4" stroke-linecap="round"/>';
    return '<svg class="mascot' + (o.cls ? ' ' + o.cls : '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 120 120" role="img" aria-label="Bé Cháo, mascot của trang">' +
      '<g fill="none" stroke="#FFB27A" stroke-width="4" stroke-linecap="round" opacity=".9">' +
      '<path class="steam s1" d="M42 33c-4-5 4-8 0-14"/><path class="steam s2" d="M60 30c-4-5 4-8 0-14"/><path class="steam s3" d="M78 33c-4-5 4-8 0-14"/></g>' +
      '<path d="M12 56h96c0 30-21 50-48 50S12 86 12 56z" fill="#FF8A3D"/>' +
      '<path d="M18 74c8 22 25 32 42 32s34-10 42-32c-10 14-26 21-42 21S28 88 18 74z" fill="#E8590C" opacity=".35"/>' +
      '<ellipse cx="60" cy="56" rx="48" ry="11" fill="#FFE4B8"/>' +
      '<ellipse cx="60" cy="56" rx="41" ry="7.5" fill="#FFF8E6"/>' +
      '<ellipse cx="45" cy="75" rx="5" ry="7" fill="#3A1A08"/><ellipse cx="75" cy="75" rx="5" ry="7" fill="#3A1A08"/>' +
      '<circle cx="46.8" cy="72.4" r="1.9" fill="#fff"/><circle cx="76.8" cy="72.4" r="1.9" fill="#fff"/>' +
      '<ellipse cx="34" cy="85" rx="6.5" ry="4" fill="#FF6B6B" opacity=".55"/><ellipse cx="86" cy="85" rx="6.5" ry="4" fill="#FF6B6B" opacity=".55"/>' +
      mouth +
      '<path d="M96 50 112 30" stroke="#C9893D" stroke-width="5" stroke-linecap="round"/><ellipse cx="114" cy="26" rx="6.5" ry="4.2" transform="rotate(-50 114 26)" fill="#E3A957"/></svg>';
  };
})(window.HNAG = window.HNAG || {});
