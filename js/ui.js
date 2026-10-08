/* Thành phần giao diện dùng chung: ô minh hoạ món, sheet / hộp thoại, toast, điều hướng. */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;

  H.actions = H.actions || {};   // data-act="ten" -> function (el, event)
  H.inputs = H.inputs || {};     // data-input="ten" -> function (el, event)
  H.views = H.views || {};

  // ───────────── thành phần nhỏ ─────────────
  H.ui.kindClass = function (kind) { return H.KINDS[kind] || 'k-man'; };

  H.ui.tile = function (d, size) {
    return '<span class="tile ' + H.ui.kindClass(d.kind) + ' s-' + (size || 'md') + '" aria-hidden="true"><span class="tile-e">' + d.emoji + '</span></span>';
  };

  H.ui.careBadge = function (care, long) {
    var c = H.CARE[care];
    return '<span class="badge ' + c.cls + '"><i class="dot"></i>' + (long ? c.long : c.label) + '</span>';
  };

  H.ui.kindTag = function (d) {
    return '<span class="tag ' + H.ui.kindClass(d.kind) + '">' + esc(d.kind) + '</span>';
  };

  // Nhãn phụ: món chay (có trứng / sữa?) và món kèm cơm mềm.
  H.ui.extraTags = function (d) {
    var h = '';
    if (d.veg) h += '<span class="tag tag-veg">' + H.icon('leaf', { size: 12 }) + 'Chay' + (d.hasEgg ? ' (có trứng)' : '') + (d.hasDairy ? ' (có sữa)' : '') + '</span>';
    if (d.base === 'com') h += '<span class="tag tag-soft">Kèm cơm mềm</span>';
    return h;
  };

  H.ui.chip = function (label, pressed, act, data, extra) {
    var attrs = '';
    Object.keys(data || {}).forEach(function (k) { attrs += ' data-' + k + '="' + esc(data[k]) + '"'; });
    return '<button type="button" class="chip' + (extra ? ' ' + extra : '') + '" aria-pressed="' + (pressed ? 'true' : 'false') + '" data-act="' + act + '"' + attrs + '>' + label + '</button>';
  };

  H.ui.stat = function (icon, label, value) {
    return '<div class="stat">' + H.icon(icon, { size: 18 }) + '<span class="stat-v">' + value + '</span><span class="stat-l">' + label + '</span></div>';
  };

  H.ui.dishStats = function (d) {
    var cost = d.mode === 'out' ? '~' + U.vnd(d.cost) : U.vnd(d.cost);
    var time = d.time == null ? 'Không cần nấu' : d.time + ' phút';
    return '<div class="stats">' +
      H.ui.stat('coin', 'Chi phí', cost) +
      H.ui.stat('clock', d.time == null ? 'Thời gian' : 'Thời gian nấu', time) +
      H.ui.stat('flame', 'Năng lượng', '~' + d.kcal + ' kcal') +
      '</div>';
  };

  H.ui.pageHead = function (kicker, title, lead) {
    return '<header class="page-head">' +
      (kicker ? '<p class="kicker">' + kicker + '</p>' : '') +
      '<h1>' + title + '</h1>' +
      (lead ? '<p class="lead">' + lead + '</p>' : '') +
      '</header>';
  };

  H.ui.empty = function (o) {
    return '<div class="empty">' + H.mascot({ size: 88, mood: o.mood }) +
      '<h3>' + o.title + '</h3><p>' + o.text + '</p>' + (o.action || '') + '</div>';
  };

  H.ui.disclaimer = function () {
    return '<p class="disclaimer">' + H.icon('info', { size: 16 }) +
      '<span>Thông tin chỉ mang tính tham khảo, không thay thế chẩn đoán và điều trị của bác sĩ. ' +
      'Nếu đau kéo dài, nôn ra máu, đi ngoài phân đen hoặc sụt cân nhanh, hãy ' +
      '<a href="#guide-luuy">đi khám ngay</a>.</span></p>';
  };

  // Hồ sơ dạ dày dạng "chip" ngắn gọn.
  H.ui.profileLabel = function () {
    var p = H.state.profile;
    var st = H.STAGES.filter(function (s) { return s.id === p.stage; })[0];
    var sv = H.SEVERITIES.filter(function (s) { return s.id === p.severity; })[0];
    return { stage: st, sev: sv, text: st.short + ' · Mức ' + sv.name.toLowerCase() };
  };

  // Cuộn ngang một dải chip để mục đang chọn nằm giữa (không cuộn cả trang).
  H.centerActive = function (boxSel, itemSel) {
    var box = document.querySelector(boxSel), it = box && box.querySelector(itemSel);
    if (!box || !it) return;
    box.scrollLeft = it.offsetLeft - (box.clientWidth - it.offsetWidth) / 2;
  };

  // ───────────── điều hướng ─────────────
  H.go = function (hash) {
    if (location.hash === '#' + hash) { H.render(); return; }
    location.hash = hash;
  };
  H.navCount = 0;
  H.back = function (fallback) {
    if (H.navCount > 0 && history.length > 1) history.back();
    else H.go(fallback || 'explore');
  };

  // ───────────── giao diện sáng / tối ─────────────
  H.applyTheme = function () {
    var t = H.state.theme;
    var root = document.documentElement;
    // Nếu nơi nhúng trang (ví dụ trình xem artifact) đã đặt sẵn data-theme thì "theo thiết bị" giữ nguyên lựa chọn đó.
    if (H.hostTheme === undefined) H.hostTheme = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t);
    else if (H.hostTheme) root.setAttribute('data-theme', H.hostTheme);
    else root.removeAttribute('data-theme');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var dark = t === 'dark' || (t === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      meta.setAttribute('content', dark ? '#1B120B' : '#FFF6E9');
    }
  };

  // ───────────── toast ─────────────
  H.toast = function (msg, o) {
    o = o || {};
    var root = document.getElementById('toast-root');
    if (!root) return;
    var t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.innerHTML = (o.icon ? H.icon(o.icon, { size: 18 }) : '') + '<span>' + esc(msg) + '</span>';
    root.appendChild(t);
    setTimeout(function () {
      t.classList.add('out');
      setTimeout(function () { t.remove(); }, 260);
    }, o.ms || 2600);
    while (root.children.length > 3) root.removeChild(root.firstChild);
  };

  // ───────────── sheet / hộp thoại ─────────────
  var stack = [];

  function focusables(el) {
    return U.$$('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])', el)
      .filter(function (n) { return n.offsetParent !== null; });
  }

  function paint(rec) {
    var r = rec.o.render();
    var body = U.$('.sheet-body', rec.el);
    var foot = U.$('.sheet-foot', rec.el);
    var top = body.scrollTop;
    body.innerHTML = r.body || '';
    body.scrollTop = top;
    if (r.foot) { foot.innerHTML = r.foot; foot.hidden = false; } else { foot.innerHTML = ''; foot.hidden = true; }
    if (r.title) U.$('.sheet-title', rec.el).textContent = r.title;
  }

  // o: { title, render() -> {body, foot, title?}, cls, left, right, onClose, dismissible }
  H.sheet = {
    open: function (o) {
      var rec = { o: o, opener: document.activeElement };
      var wrap = document.createElement('div');
      wrap.className = 'overlay' + (o.cls ? ' ' + o.cls : '');
      var uid = 'sheet-' + Date.now().toString(36) + stack.length;
      wrap.innerHTML =
        '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="' + uid + '" tabindex="-1">' +
        '<div class="sheet-grab" aria-hidden="true"></div>' +
        '<header class="sheet-head">' +
        '<div class="sheet-side">' + (o.left || '') + '</div>' +
        '<h2 class="sheet-title" id="' + uid + '">' + esc(o.title || '') + '</h2>' +
        '<div class="sheet-side end">' + (o.right === undefined ? '<button type="button" class="btn-icon" data-act="close-sheet" aria-label="Đóng">' + H.icon('x', { size: 20 }) + '</button>' : o.right) + '</div>' +
        '</header>' +
        '<div class="sheet-body"></div><footer class="sheet-foot" hidden></footer></div>';
      rec.el = wrap;
      rec.refresh = function () { paint(rec); };
      document.getElementById('overlay-root').appendChild(wrap);
      paint(rec);
      stack.push(rec);
      document.documentElement.classList.add('has-sheet');
      wrap.addEventListener('mousedown', function (e) {
        if (e.target === wrap && o.dismissible !== false) H.sheet.close(rec);
      });
      var sheet = U.$('.sheet', wrap);
      requestAnimationFrame(function () {
        wrap.classList.add('in');
        var f = U.$('[data-autofocus]', sheet);
        (f || sheet).focus({ preventScroll: true });
      });
      if (o.onOpen) o.onOpen(rec);
      return rec;
    },
    top: function () { return stack[stack.length - 1] || null; },
    refresh: function () { var t = stack[stack.length - 1]; if (t) t.refresh(); },
    close: function (rec) {
      rec = rec || stack[stack.length - 1];
      if (!rec) return;
      var i = stack.indexOf(rec);
      if (i < 0) return;
      stack.splice(i, 1);
      rec.el.classList.remove('in');
      rec.el.classList.add('out');
      var el = rec.el;
      setTimeout(function () { el.remove(); }, 200);
      if (!stack.length) document.documentElement.classList.remove('has-sheet');
      if (rec.o.onClose) rec.o.onClose();
      if (rec.opener && rec.opener.focus && document.contains(rec.opener)) {
        try { rec.opener.focus({ preventScroll: true }); } catch (e) { /* bỏ qua */ }
      }
    },
    closeAll: function () { while (stack.length) H.sheet.close(); },
    count: function () { return stack.length; }
  };

  document.addEventListener('keydown', function (e) {
    var top = stack[stack.length - 1];
    if (!top) return;
    if (e.key === 'Escape' && top.o.dismissible !== false) { e.preventDefault(); H.sheet.close(top); return; }
    if (e.key === 'Tab') {
      var f = focusables(top.el);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === U.$('.sheet', top.el))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  H.actions['close-sheet'] = function (el) {
    var wrap = el.closest('.overlay');
    var rec = stack.filter(function (r) { return r.el === wrap; })[0];
    H.sheet.close(rec);
  };

  // Hộp xác nhận (viewer không hiện confirm() của trình duyệt nên tự dựng).
  H.confirm = function (o) {
    var rec = H.sheet.open({
      title: o.title, cls: 'overlay-dialog', right: '',
      render: function () {
        return {
          body: '<p class="dialog-text">' + o.text + '</p>',
          foot: '<div class="foot-actions"><button type="button" class="btn btn-ghost" data-act="close-sheet">' + (o.cancel || 'Huỷ') + '</button>' +
            '<button type="button" class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-act="confirm-ok">' + (o.ok || 'Đồng ý') + '</button></div>'
        };
      }
    });
    rec.onOk = o.onOk;
    return rec;
  };
  H.actions['confirm-ok'] = function (el) {
    var wrap = el.closest('.overlay');
    var rec = stack.filter(function (r) { return r.el === wrap; })[0];
    if (!rec) return;
    var fn = rec.onOk;
    H.sheet.close(rec);
    if (fn) fn();
  };
})(window.HNAG = window.HNAG || {});
