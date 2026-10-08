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
    return '<div class="today-head"><h2>Bữa hôm nay</h2><a class="link" href="#plan">Xem kế hoạch tuần ' + H.icon('chev-r', { size: 14 }) + '</a></div>' +
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

  function promoCards() {
    var rows = ['chao-thit-bam', 'canh-bi-xanh-thit-bam', 'trung-hap-thit-bam'].map(function (id) { return H.DISH_BY_ID[id]; });
    var mock = rows.map(function (d, i) {
      return '<li>' + H.ui.tile(d, 'xs') + '<span><b>' + ['Sáng', 'Trưa', 'Tối'][i] + '</b>' + esc(d.name) + '</span><em>' + U.vnd(d.cost) + '</em></li>';
    }).join('');
    return '<section class="promos" aria-label="Tính năng nổi bật"><h2 class="sr-only">Tính năng nổi bật</h2><div class="promo-row">' +
      '<a class="promo p-grape" href="#plan"><span class="pill">KẾ HOẠCH CẢ TUẦN</span><strong>21 bữa,<br>không trùng</strong><span>Tự động lên thực đơn 7 ngày và gộp sẵn danh sách đi chợ.</span><ul class="mock">' + mock + '</ul></a>' +
      '<button type="button" class="promo p-orange" data-act="open-filters"><span class="pill">BỘ LỌC THEO DẠ DÀY</span><strong>Lọc món theo giai đoạn đau</strong><span>Đợt cấp, đang đỡ hay ổn định? Mình chỉ đưa món vừa sức.</span>' +
      '<span class="mock-chips"><i class="on">Đang đỡ dần</i><i>Mức vừa</i><i class="on">Nấu tại nhà</i></span></button>' +
      '<a class="promo p-leaf" href="#guide-tra"><span class="pill">TRA NGUYÊN LIỆU</span><strong>Nên dùng hay nên tránh?</strong><span>Gõ tên nguyên liệu, mình nói vì sao và gợi ý đồ thay thế.</span>' +
      '<span class="mock-chips big"><i class="good">✓ Chuối chín</i><i class="limit">! Cà chua</i><i class="avoid">✕ Cà phê</i></span></a>' +
      '<a class="promo p-gold" href="#rank"><span class="pill">BẢNG XẾP HẠNG</span><strong>Món được chốt nhiều nhất</strong><span>Xem món nào bạn và mọi người hay chọn.</span>' +
      '<span class="mock-medals" aria-hidden="true"><i>🥇</i><i>🥈</i><i>🥉</i></span></a>' +
      '</div></section>';
  }

  function tipCard() {
    var t = H.HABITS[U.hash(U.iso(new Date())) % H.HABITS.length];
    return '<section class="tipcard"><span class="tip-e" aria-hidden="true">' + t.emoji + '</span><div><p class="eyebrow">Mẹo hôm nay</p><h3>' + esc(t.title) + '</h3><p>' + esc(t.text) + '</p></div>' +
      '<a class="link" href="#guide-luuy">Thói quen khác ' + H.icon('chev-r', { size: 14 }) + '</a></section>';
  }

  H.views.home = {
    title: 'Hôm nay ăn gì?',
    render: function () {
      var pool = H.wheelPool(H.ui.meal);
      var pl = H.ui.profileLabel();
      var fit = H.countFit();
      var today = new Date();
      return '<div class="home">' +
        '<div class="home-grid">' +
        '<button type="button" class="profile-chip" data-act="open-filters" data-ctx="home">' +
        '<span class="pc-e" aria-hidden="true">' + pl.stage.emoji + '</span>' +
        '<span class="pc-t"><strong>' + esc(pl.text) + '</strong><small>' + fit + ' món hợp với bạn · ' + U.WD_LONG[today.getDay()] + ', ' + U.fmtDM(today) + '</small></span>' +
        H.icon('sliders', { size: 20 }) + '</button>' +

        '<section class="hero" aria-labelledby="hero-title">' +
        '<div class="hero-head"><div><h1 id="hero-title">Chưa biết ăn gì?</h1><p>Để Bé Cháo chọn một món lành cho bữa này.</p></div>' +
        '<div class="hero-mascot">' + H.mascot({ size: 76 }) + '</div></div>' +
        '<div class="chips on-orange" role="group" aria-label="Chọn bữa">' + H.SLOTS.map(function (m) {
          return H.ui.chip(m.emoji + ' ' + m.short, H.ui.meal === m.id, 'home-meal', { v: m.id });
        }).join('') + '</div>' +
        '<div id="wheel-box">' + wheelInner(pool) + '</div>' +
        '<button type="button" class="btn btn-white btn-xl btn-block" data-act="spin"' + (pool.length < 2 ? ' disabled' : '') + '>' + H.icon('wheel', { size: 22 }) + 'Quay ngay!</button>' +
        '<div class="hero-links"><button type="button" data-act="open-filters" data-ctx="home">' + H.icon('sliders', { size: 16 }) + 'Bộ lọc</button>' +
        '<button type="button" data-act="open-wheel-list">' + H.icon('list', { size: 16 }) + 'Vòng quay (' + pool.length + ' món)</button></div>' +
        '<div class="confetti" aria-hidden="true"></div></section>' +

        '<section id="result-box" class="result-box" aria-live="polite">' + resultInner() + '</section>' +
        '<section id="today-box" class="today">' + todayInner() + '</section>' +
        '</div>' +
        promoCards() + tipCard() + H.ui.disclaimer() + '</div>';
    }
  };

  // ───────────── hành động ─────────────
  H.actions['home-meal'] = function (el) {
    if (H.ui.spinning) return;
    H.ui.meal = el.dataset.v;
    H.ui.result = null;
    H.render();
  };

  function confetti() {
    var box = document.querySelector('.hero .confetti');
    if (!box || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var colors = ['#FFD166', '#FF6B6B', '#4ECDC4', '#7B61FF', '#FFFFFF', '#FF9F1C'];
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
    });
    if (!started && rb) rb.classList.remove('waiting');
  };
})(window.HNAG = window.HNAG || {});
