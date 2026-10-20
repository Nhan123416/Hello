/* Khởi động: điều hướng bằng hash, vẽ khung trang, gắn sự kiện chung. */
(function (H) {
  'use strict';

  var U = H.util;
  var main;

  // Ba màn hình chính, theo đúng quy trình của người dùng: Hôm nay (quay hoặc tự chọn món) -> Món ăn (xem món có hợp không,
  // chốt, đi chợ) -> Thực đơn (cả tuần, nhắc nhở, ghi cảm nhận sau khi ăn). Mọi thứ khác nằm trong ba màn này hoặc trong hộp thoại.
  var NAV = [
    { id: 'home', label: 'Hôm nay', icon: 'wheel', href: '#home' },
    { id: 'explore', label: 'Món ăn', icon: 'book', href: '#explore' },
    { id: 'plan', label: 'Thực đơn', icon: 'calendar', href: '#plan' }
  ];

  // Màn hình nào thì sáng mục điều hướng nào ("" là không sáng mục nào).
  var NAV_OF = { home: 'home', explore: 'explore', dish: 'explore', cook: 'explore', plan: 'plan', about: '' };

  // Địa chỉ cũ (từ các bản trước) được chuyển về màn hình mới. open: hộp thoại cần mở ngay; canon: địa chỉ sau khi chuyển.
  function parseHash() {
    var h = (location.hash || '').replace(/^#/, '');
    if (!h || h === 'home') return { name: 'home' };
    if (h.indexOf('dish-') === 0) return { name: 'dish', id: h.slice(5) };
    if (h.indexOf('cook-') === 0) return { name: 'cook', id: h.slice(5) };
    if (h === 'plan' || h === 'plan-week') return { name: 'plan', tab: 'week' };
    if (h === 'plan-shop') return { name: 'plan', tab: 'shop' };
    if (h === 'fridge' || h === 'plan-fridge') return { name: 'plan', tab: 'shop', open: 'fridge', canon: '#plan-shop' };
    if (h === 'remind' || h === 'plan-remind') return { name: 'plan', tab: 'week', open: 'remind', canon: '#plan' };
    if (h === 'diary' || h === 'community-diary') return { name: 'plan', tab: 'week', canon: '#plan' };
    if (h.indexOf('guide') === 0) {
      var t = h.slice(6);
      return { name: 'explore', open: 'guide', guideTab: { congthuc: 'congthuc', thaythe: 'thaythe', luuy: 'luuy', tuonglanh: 'luuy' }[t] || 'tra', canon: '#explore' };
    }
    if (h === 'explore' || h === 'about') return { name: h };
    return { name: 'home', canon: '#home' };   // địa chỉ không còn dùng nữa (cộng đồng, xếp hạng, trang Thêm...)
  }

  function chrome() {
    var top = document.getElementById('topbar');
    var bar = document.getElementById('tabbar');
    if (!top || top.dataset.ready) return;
    top.dataset.ready = '1';
    top.innerHTML =
      '<div class="topbar-in">' +
      '<a class="brand" href="#home" aria-label="Hôm nay ăn gì? Về trang chủ">' + H.mascot({ size: 40 }) +
      '<span class="brand-t"><strong>Hôm nay ăn gì?</strong><small id="brand-date"></small></span></a>' +
      '<nav class="topnav" aria-label="Điều hướng chính">' + NAV.map(function (n) {
        return '<a href="' + n.href + '" data-nav="' + n.id + '">' + H.icon(n.icon, { size: 18 }) + n.label + '</a>';
      }).join('') + '</nav>' +
      '<div class="topacts"><button type="button" class="btn-icon" data-act="open-settings" aria-label="Cài đặt">' + H.icon('gear', { size: 22 }) + '</button></div></div>';
    bar.innerHTML = NAV.map(function (n) {
      return '<a href="' + n.href + '" data-nav="' + n.id + '">' + H.icon(n.icon, { size: 22 }) + '<span>' + n.label + '</span></a>';
    }).join('');
  }

  function updateChrome(route) {
    var cur = NAV_OF[route.name] === undefined ? '' : NAV_OF[route.name];
    U.$$('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === cur) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    var d = new Date();
    var el = document.getElementById('brand-date');
    if (el) el.textContent = U.WD_LONG[d.getDay()] + ', ' + U.fmtDMY(d);
  }

  H.route = parseHash();

  H.render = function (opts) {
    opts = opts || {};
    var route = parseHash();
    // Địa chỉ cũ: đổi về địa chỉ mới ngay (không kích hoạt hashchange) để các lần vẽ lại sau không mở lại hộp thoại.
    if (route.canon && history.replaceState) { try { history.replaceState(null, '', route.canon); } catch (e) { /* bỏ qua */ } }
    var dialog = route.open ? route : null;
    // Không vẽ lại trang chủ khi vòng quay đang quay.
    if (H.ui.spinning && route.name === 'home' && H.route.name === 'home') return;
    if (H.route && H.route.name === 'cook' && route.name !== 'cook') H.cook.leave();   // rời chế độ nấu: tắt đọc to, micro, giữ màn hình sáng
    H.route = route;
    var view = H.views[route.name] || H.views.home;
    var y = window.pageYOffset || 0;
    main.innerHTML = view.render(route);
    if (view.mount) view.mount(route);
    var t = typeof view.title === 'function' ? view.title(route) : view.title;
    document.title = route.name === 'home' ? 'Hôm nay ăn gì?' : t + ' · Hôm nay ăn gì?';
    updateChrome(route);
    window.scrollTo(0, opts.keepScroll ? y : 0);
    if (view.after) view.after(route);   // việc cần làm sau khi đã đặt vị trí cuộn (ví dụ cuộn tới một phần của trang)
    // Mục cũ nay là hộp thoại (tủ lạnh, nhắc nhở, cẩm nang): mở ngay trên màn hình mới.
    if (dialog) {
      if (dialog.open === 'fridge') H.openFridge();
      else if (dialog.open === 'remind') H.remind.openSettings();
      else if (dialog.open === 'guide') H.guide.open(dialog.guideTab);
    }
  };

  // ───────────── sự kiện chung ─────────────
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!el || el.disabled) return;
    var fn = H.actions[el.getAttribute('data-act')];
    if (!fn) return;
    if (el.tagName !== 'A') e.preventDefault();
    fn(el, e);
  });

  document.addEventListener('input', function (e) {
    var el = e.target.closest ? e.target.closest('[data-input]') : null;
    if (!el) return;
    var fn = H.inputs[el.getAttribute('data-input')];
    if (fn) fn(el, e);
  });

  H.actions.skip = function () { main.focus(); };

  window.addEventListener('hashchange', function () {
    H.navCount++;
    H.sheet.closeAll();
    H.render();
    main.focus({ preventScroll: true });
  });

  function init() {
    main = document.getElementById('view');
    chrome();
    H.applyTheme();
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () { H.applyTheme(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
    H.render();
    H.remind.init();
    H.cook.init();
    if (!H.state.onboarded) setTimeout(H.openWelcome, 450);
    window.addEventListener('pagehide', H.saveNow);
    document.addEventListener('visibilitychange', function () { if (document.hidden) H.saveNow(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.HNAG = window.HNAG || {});
