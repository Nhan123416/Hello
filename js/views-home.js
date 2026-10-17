/* Màn hình "Hôm nay": vòng quay, kết quả, bữa hôm nay, thẻ giới thiệu. */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;

  function slotInfo(id) { return H.SLOTS.filter(function (s) { return s.id === id; })[0]; }

  function currentDish() {
    var r = H.ui.result;
    if (r && H.DISH_BY_ID[r.id]) return { d: H.DISH_BY_ID[r.id], source: r.source };
    var s = H.suggest(H.ui.meal);
    return s ? { d: s, source: 'daily' } : null;
  }

  function resultInner() {
    var cur = currentDish();
    var slot = slotInfo(H.ui.meal);
    if (!cur) {
      return H.ui.empty({
        title: 'Chưa có món nào hợp',
        text: 'Với bộ lọc hiện tại mình chưa tìm được món cho ' + slot.label.toLowerCase() + '. Thử nới bộ lọc nhé.',
        action: '<button type="button" class="btn btn-primary" data-act="open-filters">Mở bộ lọc</button>'
      });
    }
    var d = cur.d;
    var eyebrow = (cur.source === 'spin' ? 'Kết quả vòng quay' : 'Gợi ý hôm nay') + ' · ' + slot.label;
    var why = d.why;
    return '<article class="result" aria-label="' + esc(d.name) + '">' +
      '<p class="eyebrow">' + (cur.source === 'spin' ? H.icon('sparkle', { size: 14 }) : H.icon('leaf', { size: 14 })) + eyebrow + '</p>' +
      '<div class="result-main">' + H.ui.tile(d, 'xl') +
      '<div class="result-info"><h2>' + esc(d.name) + '</h2>' +
      '<div class="tags">' + H.ui.kindTag(d) + H.ui.careBadge(d.care, true) + H.ui.extraTags(d) + '</div></div></div>' +
      H.ui.dishStats(d) +
      '<p class="why"><strong>Vì sao hợp dạ dày: </strong>' + esc(why) + '</p>' +
      '<div class="result-actions">' +
      '<button type="button" class="btn btn-primary btn-lg btn-block" data-act="pin" data-id="' + d.id + '">' + H.icon('pin', { size: 18 }) + 'Chốt món này</button>' +
      '<div class="result-sub">' +
      '<a class="btn btn-ghost" href="#dish-' + d.id + '">' + (d.mode === 'out' ? 'Cách gọi món' : 'Xem công thức') + '</a>' +
      '<button type="button" class="btn btn-dark" data-act="spin">' + H.icon('refresh', { size: 18 }) + 'Quay lại</button>' +
      '</div></div>' +
      '</article>';
  }

  function todayInner() {
    var iso = U.iso(new Date());
    var slots = H.slotsOn();
    return '<div class="today-head"><h2>Bữa hôm nay</h2><a class="link" href="#plan">Xem thực đơn tuần ' + H.icon('chev-r', { size: 14 }) + '</a></div>' +
      '<ul class="today-list">' + slots.map(function (sid) {
        var s = slotInfo(sid);
        var id = H.getMeal(iso, sid);
        var d = id ? H.DISH_BY_ID[id] : null;
        var cooked = d && H.state.cooked[iso + ':' + sid];
        if (d) {
          return '<li><a class="mealchip filled' + (cooked ? ' cooked' : '') + '" href="#dish-' + d.id + '">' +
            '<small>' + s.emoji + ' ' + s.short + '</small>' + H.ui.tile(d, 'sm') + '<strong>' + esc(d.name) + '</strong>' +
            (cooked ? '<i class="done">' + H.icon('check', { size: 12, stroke: 3 }) + 'Đã nấu</i>' : '') + '</a></li>';
        }
        return '<li><button type="button" class="mealchip empty" data-act="open-picker" data-date="' + iso + '" data-slot="' + sid + '">' +
          '<small>' + s.emoji + ' ' + s.short + '</small><span class="plus">' + H.icon('plus', { size: 20 }) + '</span><strong>Chọn món</strong></button></li>';
      }).join('') + '</ul>';
  }

  function wheelInner(pool) {
    if (pool.length < 2) {
      return '<div class="wheel-empty">' + H.mascot({ size: 80, mood: 'wow' }) +
        '<p>Cần ít nhất 2 món để quay. Hãy nới bộ lọc hoặc đưa lại món đã bỏ.</p></div>';
    }
    return '<div class="wheel-wrap">' + H.wheel.svg(pool) +
      '<button type="button" class="wheel-hub" data-act="spin" aria-label="Quay vòng quay">' + H.icon('sparkle', { size: 26, stroke: 2.2 }) + '</button></div>';
  }

  function tipCard() {
    var t = H.HABITS[U.hash(U.iso(new Date())) % H.HABITS.length];
    return '<section class="tipcard"><span class="tip-e" aria-hidden="true">' + t.emoji + '</span><div><p class="eyebrow">Mẹo hôm nay</p><h3>' + esc(t.title) + '</h3><p>' + esc(t.text) + '</p></div></section>';
  }

  // Hướng dẫn 3 bước cho người mới: chính là luồng chính của ứng dụng.
  function tourCard() {
    var steps = H.tourSteps(), n = steps.filter(function (x) { return x.done; }).length;
    var first = -1;
    steps.forEach(function (st, i) { if (!st.done && first < 0) first = i; });
    return '<section class="tour" aria-labelledby="tour-t"><div class="tour-head"><h2 id="tour-t">Làm quen trong 3 bước <small>' + n + '/3</small></h2>' +
      '<button type="button" class="link-btn" data-act="tour-hide">Ẩn</button></div><ol class="tour-steps">' + steps.map(function (st, i) {
        var inner = '<span class="tour-i" aria-hidden="true">' + (st.done ? H.icon('check', { size: 14, stroke: 3 }) : (i + 1)) + '</span><span class="tour-s">' + esc(st.text) + '</span>';
        var cls = st.done ? 'done' : (i === first ? 'cur' : '');
        if (st.done) return '<li class="' + cls + '">' + inner + '<span class="sr-only"> (đã xong)</span></li>';
        return '<li class="' + cls + '">' + (st.href ? '<a href="' + st.href + '">' + inner + '</a>' : '<button type="button" data-act="spin">' + inner + '</button>') + '</li>';
      }).join('') + '</ol></section>';
  }

  // Mỗi lần chỉ hiện MỘT thẻ ngữ cảnh để trang chủ không rối. Thứ tự ưu tiên: hướng dẫn cho người mới,
  // nhắc giờ ăn đã trễ hoặc sắp tới (trong 90 phút), đồ trong tủ lạnh cần chú ý, gợi ý bật nhắc giờ khi đang tắt, mẹo trong ngày.
  // urgent = đặt phía trên vòng quay, ngược lại đặt phía dưới bữa hôm nay.
  function pickContext() {
    if (H.tourVisible()) return { urgent: true, html: tourCard() };
    var u = H.remind.nextUp();
    if (u.kind === 'overdue' || (u.kind === 'next' && u.sameDay && u.in <= 5400000)) return { urgent: true, html: H.remind.cardBox() };
    var al = H.pantry.alertCard();
    if (al) return { urgent: H.expiredItems().length > 0, html: al };
    // nhắc giờ đang tắt: gợi ý bật lại, người dùng bấm "Để sau" thì không hỏi nữa trong ngày
    if (u.kind === 'off' && H.state.remind.bannerHiddenOn !== H.today()) return { urgent: false, html: H.remind.cardBox() };
    return { urgent: false, html: tipCard() };
  }

  H.views.home = {
    title: 'Hôm nay ăn gì?',
    render: function () {
      var pool = H.wheelPool(H.ui.meal);
      var pl = H.ui.profileLabel();
      var fit = H.countFit();
      var today = new Date();
      var ctx = pickContext();
      return '<div class="home">' +
        '<div class="home-grid">' +
        '<button type="button" class="profile-chip" data-act="open-filters" data-ctx="home">' +
        '<span class="pc-e" aria-hidden="true">' + pl.stage.emoji + '</span>' +
        '<span class="pc-t"><strong>' + esc(pl.text) + '</strong><small>' + fit + ' món hợp với bạn · ' + U.WD_LONG[today.getDay()] + ', ' + U.fmtDM(today) + '</small></span>' +
        H.icon('sliders', { size: 20 }) + '</button>' +
        H.ui.filterPills('home') +
        (ctx.urgent ? '<div id="ctx-box" class="ctx-box">' + ctx.html + '</div>' : '') +

        '<section class="hero" aria-labelledby="hero-title">' +
        '<div class="hero-head"><div><h1 id="hero-title">Chưa biết ăn gì?</h1><p>Để Bé Cháo chọn một món lành cho bữa này.</p></div>' +
        '<div class="hero-mascot">' + H.mascot({ size: 76 }) + '</div></div>' +
        '<div class="chips on-hero" role="group" aria-label="Chọn bữa">' + H.SLOTS.map(function (m) {
          return H.ui.chip(m.emoji + ' ' + m.short, H.ui.meal === m.id, 'home-meal', { v: m.id });
        }).join('') + '</div>' +
        '<div id="wheel-box">' + wheelInner(pool) + '</div>' +
        '<button type="button" class="btn btn-white btn-xl btn-block" data-act="spin"' + (pool.length < 2 ? ' disabled' : '') + '>' + H.icon('wheel', { size: 22 }) + 'Quay ngay!</button>' +
        '<div class="hero-links"><button type="button" data-act="open-wheel-list">' + H.icon('list', { size: 16 }) + 'Vòng quay (' + pool.length + ' món)</button></div>' +
        '<div class="confetti" aria-hidden="true"></div></section>' +

        '<section id="result-box" class="result-box" aria-live="polite">' + resultInner() + '</section>' +
        '<section id="today-box" class="today">' + todayInner() + '</section>' +
        (ctx.urgent ? '' : '<div id="ctx-box" class="ctx-box">' + ctx.html + '</div>') +
        '</div>' +
        H.ui.disclaimer() + '</div>';
    }
  };

  // ───────────── hành động ─────────────
  H.actions['tour-hide'] = function () {
    H.state.tour.hidden = true;
    H.save();
    H.render({ keepScroll: true });
  };

  H.actions['home-meal'] = function (el) {
    if (H.ui.spinning) return;
    H.ui.meal = el.dataset.v;
    H.ui.result = null;
    H.render();
  };

  function confetti() {
    var box = document.querySelector('.hero .confetti');
    if (!box || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var colors = ['#FFD166', '#FF8FAB', '#7DE2D1', '#9A8CFF', '#FFFFFF', '#FFC93C'];
    var html = '';
    for (var i = 0; i < 26; i++) {
      html += '<i style="--x:' + (Math.random() * 100).toFixed(1) + '%;--dx:' + ((Math.random() - 0.5) * 120).toFixed(0) + 'px;--r:' + U.rand(540) +
        'deg;--d:' + (0.9 + Math.random() * 0.9).toFixed(2) + 's;--del:' + (Math.random() * 0.25).toFixed(2) + 's;background:' + colors[i % colors.length] + '"></i>';
    }
    box.innerHTML = html;
    setTimeout(function () { box.innerHTML = ''; }, 2200);
  }

  H.actions.spin = function () {
    if (H.ui.spinning) return;
    if (H.route && H.route.name !== 'home') { H.go('home'); setTimeout(H.actions.spin, 260); return; }
    var pool = H.wheelPool(H.ui.meal);
    if (pool.length < 2) {
      H.toast('Cần ít nhất 2 món trên vòng quay.', { icon: 'info' });
      H.openFilters('home');
      return;
    }
    var rb = document.getElementById('result-box');
    if (rb) rb.classList.add('waiting');
    var started = H.wheel.spin(function (d) {
      H.ui.result = { id: d.id, source: 'spin' };
      var box = document.getElementById('result-box');
      if (box) {
        box.classList.remove('waiting');
        box.innerHTML = resultInner();
        box.classList.add('pop');
        setTimeout(function () { box.classList.remove('pop'); }, 800);
        var r = box.getBoundingClientRect();
        if (r.top > window.innerHeight * 0.62 || r.bottom < 0) {
          var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        }
      }
      var live = document.getElementById('sr-live');
      if (live) live.textContent = 'Kết quả vòng quay: ' + d.name;
      confetti();
      if (!H.state.tour.spun) {
        H.tourMark('spun');
        var cb = document.getElementById('ctx-box');
        if (cb && cb.querySelector('.tour')) { if (H.tourVisible()) cb.innerHTML = tourCard(); else cb.remove(); }
      }
    });
    if (!started && rb) rb.classList.remove('waiting');
  };
})(window.HNAG = window.HNAG || {});
