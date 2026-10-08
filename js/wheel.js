/* Vòng quay chọn món: vẽ bằng SVG, quay bằng requestAnimationFrame. */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;

  var COLORS = ['var(--w1)', 'var(--w2)', 'var(--w3)', 'var(--w4)', 'var(--w5)', 'var(--w6)', 'var(--w7)', 'var(--w8)'];
  var R = 146;           // bán kính phần quay
  var rotation = 0;      // góc hiện tại (độ)
  var items = [];        // các món đang trên vòng
  var raf = 0;

  function polar(r, deg) {
    var a = deg * Math.PI / 180;
    return [r * Math.sin(a), -r * Math.cos(a)];
  }
  function f(n) { return Math.round(n * 100) / 100; }

  function slicePath(a0, a1) {
    var p0 = polar(R, a0), p1 = polar(R, a1);
    var large = (a1 - a0) > 180 ? 1 : 0;
    return 'M0 0 L' + f(p0[0]) + ' ' + f(p0[1]) + ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + f(p1[0]) + ' ' + f(p1[1]) + ' Z';
  }

  function colorFor(i, n) {
    var c = i % COLORS.length;
    if (i === n - 1 && n > 1 && c === 0) c = 3;   // tránh trùng màu giữa ô cuối và ô đầu
    return COLORS[c];
  }

  // Trả về chuỗi SVG của vòng quay cho danh sách món.
  H.wheel = {
    items: function () { return items; },

    svg: function (pool) {
      items = pool.slice();
      var n = items.length;
      var step = n ? 360 / n : 360;
      var named = n <= 12;
      var base = n <= 6 ? 15 : (n <= 9 ? 14 : 12.5);
      var slices = '';
      items.forEach(function (d, i) {
        var a0 = i * step, a1 = (i + 1) * step;
        var mid = a0 + step / 2;
        var label;
        if (named) {
          // Tên món chạy dọc bán kính, đọc từ vành vào tâm; emoji nằm sát vành.
          var txt = d.name.split(' + ')[0];
          var fs = Math.min(base, 80 / (txt.length * 0.56));
          if (fs < 10) { fs = 10; txt = U.short(txt, Math.floor(80 / (10 * 0.56))); }
          label = '<g transform="rotate(' + f(mid + 90) + ')">' +
            '<text x="-112" y="' + f(fs * 0.35) + '" class="wl" font-size="' + f(fs) + '">' + esc(txt) + '</text></g>' +
            '<g transform="rotate(' + f(mid) + ')"><text x="0" y="-124" class="we" text-anchor="middle" font-size="19">' + d.emoji + '</text></g>';
        } else {
          var arc = step * Math.PI / 180 * 118;
          var size = U.clamp(Math.floor(arc * 0.78), 10, 22);
          label = '<g transform="rotate(' + f(mid) + ')"><text x="0" y="-' + (R - 26) + '" class="we" text-anchor="middle" font-size="' + size + '">' + d.emoji + '</text></g>';
        }
        var shape = n === 1
          ? 'M-' + R + ' 0a' + R + ' ' + R + ' 0 1 0 ' + (R * 2) + ' 0a' + R + ' ' + R + ' 0 1 0 -' + (R * 2) + ' 0'
          : slicePath(a0, a1);
        slices += '<g class="slice" data-i="' + i + '"><path d="' + shape + '" fill="' + colorFor(i, n) +
          '" stroke="rgba(255,255,255,.55)" stroke-width="1.5"/>' + label + '</g>';
      });

      // đèn trang trí quanh vành
      var bulbs = '';
      for (var b = 0; b < 24; b++) {
        var p = polar(R + 8, b * 15);
        bulbs += '<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="2.6" class="bulb' + (b % 2 ? ' alt' : '') + '"/>';
      }

      return '<svg class="wheel-svg" viewBox="-166 -190 332 356" role="img" aria-label="Vòng quay gồm ' + n + ' món">' +
        '<circle r="' + (R + 14) + '" class="wheel-rim"/>' + bulbs +
        '<g id="wheel-rot" transform="rotate(' + f(rotation) + ')">' + slices + '</g>' +
        '<circle r="' + R + '" fill="none" stroke="var(--wheel-edge)" stroke-width="3"/>' +
        '<g id="wheel-pointer"><path class="pointer" d="M0 -132 C-9 -144 -17 -153 -17 -168 A17 17 0 1 1 17 -168 C17 -153 9 -144 0 -132 Z"/>' +
        '<circle cy="-168" r="6" fill="#fff"/></g>' +
        '</svg>';
    },

    // Quay và gọi onDone(món trúng). Trả về false nếu không quay được.
    spin: function (onDone) {
      var n = items.length;
      if (n < 2 || H.ui.spinning) return false;
      var g = document.getElementById('wheel-rot');
      var pointer = document.getElementById('wheel-pointer');
      if (!g) return false;

      var step = 360 / n;
      var win = U.rand(n);
      var jitter = (Math.random() - 0.5) * step * 0.7;          // dừng lệch tâm ô một chút cho tự nhiên
      var centre = win * step + step / 2 + jitter;
      var cur = ((rotation % 360) + 360) % 360;
      var need = (((-centre - cur) % 360) + 360) % 360;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var turns = reduce ? 1 : 5 + U.rand(3);
      var from = rotation;
      var to = rotation + turns * 360 + need;
      var dur = reduce ? 700 : 4600;
      var t0 = performance.now();
      var lastIdx = -1;

      H.ui.spinning = true;
      document.documentElement.classList.add('is-spinning');

      function ease(t) { return 1 - Math.pow(1 - t, 4); }      // chậm dần ở cuối

      function frame(now) {
        var t = Math.min(1, (now - t0) / dur);
        rotation = from + (to - from) * ease(t);
        g.setAttribute('transform', 'rotate(' + f(rotation) + ')');
        // con trỏ "gõ" mỗi lần qua một ô
        var idx = Math.floor((((-rotation) % 360 + 360) % 360) / step);
        if (idx !== lastIdx) {
          lastIdx = idx;
          if (pointer && !reduce) {
            pointer.classList.remove('tick');
            void pointer.getBoundingClientRect();
            pointer.classList.add('tick');
          }
        }
        if (t < 1) raf = requestAnimationFrame(frame);
        else finish();
      }
      function finish() {
        rotation = ((rotation % 360) + 360) % 360;
        g.setAttribute('transform', 'rotate(' + f(rotation) + ')');
        H.ui.spinning = false;
        document.documentElement.classList.remove('is-spinning');
        var slice = g.querySelector('.slice[data-i="' + win + '"]');
        if (slice) slice.classList.add('win');
        if (onDone) onDone(items[win]);
      }
      raf = requestAnimationFrame(frame);
      return true;
    },

    reset: function () { rotation = 0; }
  };
})(window.HNAG = window.HNAG || {});
