/* Kế hoạch tuần, danh sách đi chợ và tủ lạnh. */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;

  function slotInfo(id) { return H.SLOTS.filter(function (s) { return s.id === id; })[0]; }
  function viewStart() { return H.weekStartOf(H.ui.weekOffset); }
  function fmtK(n) { return new Intl.NumberFormat('vi-VN').format(Math.round(n)); }

  // ───────────── Tab 1: kế hoạch tuần ─────────────
  function mealRow(iso, sid) {
    var s = slotInfo(sid);
    var id = H.getMeal(iso, sid);
    var d = id ? H.DISH_BY_ID[id] : null;
    var label = '<p class="meal-label">' + s.emoji + ' ' + s.label.toUpperCase() + ' · ' + H.remind.timeOf(sid) + '</p>';
    if (!d) {
      return '<div class="meal">' + label + '<button type="button" class="mealrow empty" data-act="open-picker" data-date="' + iso + '" data-slot="' + sid + '">' +
        H.icon('plus', { size: 18 }) + 'Chọn món cho ' + s.label.toLowerCase() + '</button></div>';
    }
    var cooked = !!H.state.cooked[iso + ':' + sid];
    return '<div class="meal">' + label + '<div class="mealrow' + (cooked ? ' cooked' : '') + '">' +
      '<a class="mealrow-main" href="#dish-' + d.id + '">' + H.ui.tile(d, 'md') +
      '<span class="mealrow-t"><span class="tag ' + H.ui.kindClass(d.kind) + '">' + esc(d.kind) + '</span><strong>' + esc(d.name) + '</strong>' +
      '<small>' + U.vnd(d.cost) + (d.time ? ' · ' + d.time + ' phút' : '') + ' · ' + d.kcal + ' kcal</small></span></a>' +
      '<div class="mealrow-act">' +
      '<button type="button" class="btn-icon round' + (cooked ? ' on' : '') + '" data-act="cook" data-date="' + iso + '" data-slot="' + sid + '" aria-pressed="' + cooked + '" aria-label="Đánh dấu đã nấu ' + esc(d.name) + '">' + H.icon('check', { size: 16, stroke: 3 }) + '</button>' +
      '<button type="button" class="btn-icon round" data-act="meal-menu" data-date="' + iso + '" data-slot="' + sid + '" aria-label="Thêm tuỳ chọn cho ' + esc(d.name) + '">' + H.icon('more', { size: 18 }) + '</button>' +
      '</div></div></div>';
  }

  function dayCard(day) {
    var iso = U.iso(day);
    var st = H.dayStats(iso);
    var isToday = iso === U.iso(new Date());
    return '<article class="daycard' + (isToday ? ' today' : '') + '" aria-labelledby="d-' + iso + '">' +
      '<header class="daycard-head"><h3 id="d-' + iso + '">' + U.WD_LONG[day.getDay()].replace('Thứ ', 'Thứ ') + (isToday ? '<i class="today-dot">Hôm nay</i>' : '') + '<small>' + U.fmtDM(day) + '</small></h3>' +
      (st.n ? '<span class="kcal-chip">' + H.icon('flame', { size: 14 }) + 'Tổng ~' + fmtK(st.kcal) + ' kcal</span>' : '') + '</header>' +
      '<div class="daymeals">' + H.slotsOn().map(function (sid) { return mealRow(iso, sid); }).join('') + '</div>' +
      '<footer class="daycard-foot"><span>' + H.icon('coin', { size: 14 }) + 'Chi phí ' + U.vnd(st.cost) + '</span><span>' + H.icon('clock', { size: 14 }) + 'Nấu ~' + st.time + ' phút</span></footer></article>';
  }

  // Các giới hạn (thời gian, ngân sách, độ khó, mức vị) mà lần tự xếp thực đơn sẽ tuân theo.
  function limitsLine() {
    var pills = H.ui.filterPills('plan');
    return '<div class="limits"><p class="limits-t">' + H.icon('sliders', { size: 15 }) + (pills ? 'Tự xếp theo giới hạn của bạn' : 'Chưa đặt giới hạn thời gian hay giá') +
      '<button type="button" class="link-btn" data-act="open-filters" data-ctx="plan">' + (pills ? 'Sửa' : 'Đặt giới hạn') + '</button></p>' + pills + '</div>';
  }

  function weekTab() {
    var start = viewStart();
    var st = H.weekStats(start);
    var days = H.weekDays(start);
    var pct = st.total ? Math.round(st.planned / st.total * 100) : 0;
    var shown = H.ui.day === 'all' ? days : days.filter(function (d) { return String(d.getDay()) === H.ui.day; });
    var todayISO = U.iso(new Date());
    var n = st.total;
    var h = '<section class="weekcard" aria-labelledby="week-title">' +
      '<div class="weekcard-top"><div><h2 id="week-title">Tuần bắt đầu ' + U.fmtDM(start) + '</h2>' +
      '<p>Đã xếp <strong>' + st.planned + '/' + n + '</strong> bữa (' + st.cooked + ' đã nấu)</p></div>' +
      '<div class="weeknav"><button type="button" class="btn-icon round" data-act="week-prev" aria-label="Tuần trước">' + H.icon('chev-l', { size: 18 }) + '</button>' +
      '<button type="button" class="btn-icon round" data-act="week-next" aria-label="Tuần sau">' + H.icon('chev-r', { size: 18 }) + '</button>' +
      '<button type="button" class="btn-icon round gear" data-act="plan-settings" aria-label="Tuỳ chỉnh kế hoạch">' + H.icon('gear', { size: 18 }) + '</button></div></div>' +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + st.planned + '" aria-label="Số bữa đã xếp"><i style="width:' + pct + '%"></i></div>' +
      '<div class="weekcard-actions">' +
      '<button type="button" class="btn btn-green" data-act="plan-auto">' + H.icon('sparkle', { size: 18 }) + (st.planned >= n ? 'Xếp lại cả tuần' : 'Tự xếp thực đơn') + '</button>' +
      '<button type="button" class="btn btn-orange" data-act="goto-shop">' + H.icon('cart', { size: 18 }) + 'Đi chợ</button></div>' +
      limitsLine() +
      (st.planned ? '<p class="weekcard-sum">Tổng chi phí tuần khoảng <strong>' + U.vnd(st.cost) + '</strong> · trung bình ' + U.vnd(st.cost / 7) + '/ngày · ~' + fmtK(st.kcal / 7) + ' kcal/ngày</p>' : '') +
      '</section>';
    h += '<div class="daychips scroller" role="group" aria-label="Chọn ngày">' +
      '<button type="button" class="chip chip-green" aria-pressed="' + (H.ui.day === 'all') + '" data-act="plan-day" data-v="all">Tất cả</button>' +
      days.map(function (d) {
        var iso = U.iso(d);
        return '<button type="button" class="chip chip-green' + (iso === todayISO ? ' is-today' : '') + '" aria-pressed="' + (H.ui.day === String(d.getDay())) + '" data-act="plan-day" data-v="' + d.getDay() + '">' + U.WD_SHORT[d.getDay()] + '</button>';
      }).join('') + '</div>';
    h += '<div class="days">' + shown.map(dayCard).join('') + '</div>';
    return h;
  }

  // ───────────── Tab 2: đi chợ ─────────────
  function shopText(sh) {
    var lines = ['Danh sách đi chợ (tuần ' + U.fmtDMY(viewStart()) + ')'];
    H.CATEGORIES.forEach(function (c) {
      var its = sh.items.filter(function (x) { return x.it.cat === c.id && !x.inFridge; });
      if (!its.length) return;
      lines.push('', c.name.toUpperCase());
      its.forEach(function (x) { lines.push('- ' + x.it.name + ': ' + U.fmtQty(x.qty, x.it.unit) + ' (~' + U.vnd(x.cost) + ')'); });
    });
    lines.push('', 'Ước tính: ' + U.vnd(sh.total));
    return lines.join('\n');
  }

  function shopTab() {
    var start = viewStart();
    var sh = H.shopping(start);
    if (!sh.items.length) {
      return H.ui.empty({
        title: 'Chưa có gì để mua',
        text: 'Hãy xếp thực đơn cho tuần này, mình sẽ gộp nguyên liệu thành danh sách đi chợ cho bạn.',
        action: '<button type="button" class="btn btn-green" data-act="plan-auto-go">' + H.icon('sparkle', { size: 18 }) + 'Tự xếp thực đơn</button>'
      });
    }
    var toBuy = sh.items.filter(function (x) { return !x.inFridge; });
    var done = toBuy.filter(function (x) { return x.bought; }).length;
    var h = '<section class="weekcard shop-head"><div class="weekcard-top"><div><h2>Danh sách đi chợ</h2>' +
      '<p>Cho ' + sh.meals + ' bữa nấu tại nhà chưa nấu, tuần bắt đầu ' + U.fmtDM(start) + '</p></div>' +
      '<div class="weeknav"><button type="button" class="btn-icon round" data-act="week-prev" aria-label="Tuần trước">' + H.icon('chev-l', { size: 18 }) + '</button>' +
      '<button type="button" class="btn-icon round" data-act="week-next" aria-label="Tuần sau">' + H.icon('chev-r', { size: 18 }) + '</button></div></div>' +
      '<div class="shop-total"><span>Ước tính</span><strong>' + U.vnd(sh.total) + '</strong><small>đã trừ đồ có trong tủ lạnh · mua ' + done + '/' + toBuy.length + '</small></div>' +
      '<div class="weekcard-actions"><button type="button" class="btn btn-green" data-act="shop-copy">' + H.icon('copy', { size: 18 }) + 'Sao chép danh sách</button>' +
      '<button type="button" class="btn btn-soft" data-act="shop-buy">' + H.icon('ext', { size: 18 }) + 'Mua online</button>' +
      '<button type="button" class="btn btn-ghost" data-act="shop-clear">Bỏ tick hết</button></div></section>';
    H.CATEGORIES.forEach(function (c) {
      var its = sh.items.filter(function (x) { return x.it.cat === c.id; });
      if (!its.length) return;
      h += '<section class="shopgroup"><h3>' + c.emoji + ' ' + esc(c.name) + '</h3><ul class="shoplist">' + its.map(function (x) {
        var on = x.bought && !x.inFridge;
        return '<li><button type="button" class="checkrow' + (on ? ' on' : '') + (x.inFridge ? ' infridge' : '') + '" role="checkbox" aria-checked="' + on + '" data-act="toggle-bought" data-id="' + x.id + '" data-week="' + sh.week + '"' + (x.inFridge ? ' disabled' : '') + '>' +
          '<span class="box">' + (on ? H.icon('check', { size: 14, stroke: 3.2 }) : '') + '</span>' +
          '<span class="ing-e">' + x.it.emoji + '</span>' +
          '<span class="ing-n">' + esc(x.it.name) +
            (x.inFridge ? '<small>Đã có đủ trong tủ lạnh</small>'
              : x.bought && typeof H.state.bought[sh.week + ':' + x.id] === 'number' ? '<small>Đã mua và cho vào tủ lạnh</small>'
              : x.partial ? '<small>Cần ' + U.fmtQty(x.need, x.it.unit) + ', đã có ' + U.fmtQty(x.have, x.it.unit) + ', mua thêm</small>' : '') + '</span>' +
          '<span class="ing-q">' + U.fmtQty(x.qty, x.it.unit) + '</span>' +
          '<span class="ing-p">' + (x.inFridge ? '' : U.vnd(x.cost)) + '</span></button></li>';
      }).join('') + '</ul></section>';
    });
    h += '<p class="hint">Giá chỉ là ước tính theo lượng dùng. Khi đi chợ bạn thường mua theo gói nên thực tế có thể nhiều hơn, phần dư dùng cho các bữa sau.</p>';
    return h;
  }

  // ───────────── khung chung ─────────────
  H.views.plan = {
    title: 'Kế hoạch tuần',
    render: function (r) {
      var tab = r.tab || 'week';
      var n = H.slotsOn().length * 7;
      var tabs = [['week', 'Kế hoạch', 'calendar', 'plan'], ['shop', 'Đi chợ', 'cart', 'plan-shop'], ['fridge', 'Tủ lạnh', 'fridge', 'plan-fridge'], ['remind', 'Nhắc giờ', 'bell', 'plan-remind']];
      return '<div class="plan">' +
        H.ui.pageHead('<span class="k-ic">' + H.icon('calendar', { size: 14 }) + '</span>THỰC ĐƠN 7 NGÀY AN TOÀN', 'Kế hoạch bữa ăn trong tuần',
          'Tự động lập ' + n + ' bữa không lặp món, hợp với giai đoạn dạ dày và ngân sách của bạn.') +
        '<div class="seg four" role="tablist" aria-label="Chọn mục">' + tabs.map(function (t) {
          return '<a role="tab" class="seg-i' + (tab === t[0] ? ' on' : '') + '" aria-selected="' + (tab === t[0]) + '" href="#' + t[3] + '">' + H.icon(t[2], { size: 16 }) + '<span>' + t[1] + '</span></a>';
        }).join('') + '</div>' +
        '<div class="plan-body">' + (tab === 'shop' ? shopTab() : tab === 'fridge' ? H.pantry.tabHtml() : tab === 'remind' ? H.remind.tabHtml() : weekTab()) + '</div>' +
        H.ui.disclaimer() + '</div>';
    },
    mount: function (r) {
      H.centerActive('.daychips', '.chip[aria-pressed="true"]');
      // Lần đầu mở tab kế hoạch: tự xếp sẵn để người dùng thấy ngay một tuần đầy đủ.
      if ((r.tab || 'week') === 'week' && H.ui.weekOffset === 0 && !H.state.planSeeded) {
        H.state.planSeeded = true;
        var res = H.autoPlan(viewStart(), 'fill');   // chỉ điền ô trống, giữ nguyên món người dùng đã ghim
        H.save();
        if (res.filled) {
          H.toast('Mình đã xếp sẵn thực đơn tuần này, bạn đổi món tuỳ ý nhé', { icon: 'sparkle', ms: 3600 });
          H.render({ keepScroll: true });
        }
      }
    }
  };

  // ───────────── hành động ─────────────
  H.actions['week-prev'] = function () { H.ui.weekOffset--; H.ui.day = 'all'; H.render({ keepScroll: true }); };
  H.actions['week-next'] = function () { H.ui.weekOffset++; H.ui.day = 'all'; H.render({ keepScroll: true }); };
  H.actions['plan-day'] = function (el) { H.ui.day = el.dataset.v; H.render({ keepScroll: true }); };
  H.actions['goto-shop'] = function () { H.go('plan-shop'); };
  function runAutoPlan(mode) {
    var res = H.autoPlan(viewStart(), mode);
    var msg = res.filled ? 'Đã xếp ' + res.filled + ' bữa' : 'Không còn ô trống để xếp';
    if (res.repeats) msg += ' (có ' + res.repeats + ' món lặp vì ít món nằm trong giới hạn của bạn)';
    if (res.relaxed) msg += '. ' + res.relaxed + ' bữa phải vượt giới hạn thời gian, giá hoặc mức vị vì không còn món nào hợp hơn';
    if (res.missing.length) msg += '. Chưa có món hợp cho ' + res.missing.map(function (s) { return slotInfo(s).label.toLowerCase(); }).join(', ');
    H.toast(msg, { icon: 'sparkle', ms: 4200 });
    H.render({ keepScroll: true });
  }
  // Xếp lại cả tuần sẽ thay hết món đang có, nên hỏi lại trước.
  function confirmRedo(after) {
    H.confirm({
      title: 'Xếp lại cả tuần?',
      text: 'Thực đơn đang có sẽ được thay bằng thực đơn mới, các ô đã đánh dấu “đã nấu” cũng bị xoá.',
      ok: 'Xếp lại',
      onOk: function () { runAutoPlan('all'); if (after) after(); }
    });
  }
  H.actions['plan-auto'] = function () {
    var st = H.weekStats(viewStart());
    if (st.planned >= st.total) confirmRedo();
    else runAutoPlan('fill');
  };
  H.actions['plan-auto-go'] = function () { H.autoPlan(viewStart(), 'fill'); H.render({ keepScroll: true }); };
  H.actions.cook = function (el) {
    var on = H.toggleCooked(el.dataset.date, el.dataset.slot);
    var used = H.state.consumed[el.dataset.date + ':' + el.dataset.slot];
    H.toast(on ? (used ? 'Đã đánh dấu đã nấu và trừ nguyên liệu khỏi tủ lạnh' : 'Đã đánh dấu đã nấu') : 'Đã bỏ đánh dấu', { icon: 'check' });
    H.render({ keepScroll: true });
  };
  H.actions.reroll = function (el) {
    var pick = H.rerollMeal(el.dataset.date, el.dataset.slot, viewStart());
    if (pick) H.toast('Đổi sang: ' + pick.name, { icon: 'shuffle' });
    else H.toast('Chưa có món khác phù hợp cho bữa này', { icon: 'info' });
    H.render({ keepScroll: true });
  };
  H.actions['clear-meal'] = function (el) {
    H.setMeal(el.dataset.date, el.dataset.slot, null);
    H.render({ keepScroll: true });
  };
  // Menu tuỳ chọn cho một bữa trong kế hoạch.
  H.actions['meal-menu'] = function (el) {
    var date = el.dataset.date, slot = el.dataset.slot;
    var id = H.getMeal(date, slot);
    if (!id) return;
    var d = H.DISH_BY_ID[id];
    var day = U.parse(date);
    H.sheet.open({
      title: d.name,
      cls: 'overlay-dialog',
      render: function () {
        var cooked = !!H.state.cooked[date + ':' + slot];
        function item(act, icon, label, cls) {
          return '<li><button type="button" class="row pick' + (cls ? ' ' + cls : '') + '" data-act="' + act + '" data-date="' + date + '" data-slot="' + slot + '"><span class="row-ic">' + H.icon(icon, { size: 18 }) + '</span><span class="row-main"><strong>' + label + '</strong></span></button></li>';
        }
        return {
          body: '<p class="hint centered menu-sub">' + slotInfo(slot).label + ' · ' + U.WD_LONG[day.getDay()] + ' ' + U.fmtDM(day) + '</p><ul class="rows">' +
            item('menu-cook', 'check', cooked ? 'Bỏ đánh dấu đã nấu' : 'Đánh dấu đã nấu') +
            item('menu-reroll', 'shuffle', 'Đổi ngẫu nhiên sang món khác') +
            item('menu-pick', 'list', 'Chọn món khác trong danh sách') +
            '<li><a class="row pick" href="#dish-' + d.id + '" data-act="close-sheet"><span class="row-ic">' + H.icon('book', { size: 18 }) + '</span><span class="row-main"><strong>Xem công thức</strong></span></a></li>' +
            item('menu-clear', 'trash', 'Bỏ khỏi kế hoạch', 'danger') + '</ul>'
        };
      }
    });
  };
  function menuDo(el, fn) {
    var ds = { dataset: { date: el.dataset.date, slot: el.dataset.slot } };
    H.sheet.close();
    fn(ds);
  }
  H.actions['menu-cook'] = function (el) { menuDo(el, H.actions.cook); };
  H.actions['menu-reroll'] = function (el) { menuDo(el, H.actions.reroll); };
  H.actions['menu-clear'] = function (el) { menuDo(el, H.actions['clear-meal']); };
  H.actions['menu-pick'] = function (el) {
    var date = el.dataset.date, slot = el.dataset.slot;
    H.sheet.close();
    setTimeout(function () { H.openPicker(date, slot); }, 230);
  };
  H.actions['toggle-bought'] = function (el) { H.toggleBought(el.dataset.week, el.dataset.id); H.render({ keepScroll: true }); };
  H.actions['shop-buy'] = function () {
    var items = H.shopping(viewStart()).items.filter(function (x) { return !x.inFridge && !x.bought; }).map(function (x) { return { id: x.id, qty: x.qty }; });
    if (!items.length) { H.toast('Không còn gì cần mua', { icon: 'check' }); return; }
    H.openBuy(items, 'Mua online');
  };
  H.actions['shop-clear'] = function () {
    var wk = U.iso(viewStart());
    Object.keys(H.state.bought).forEach(function (k) {
      if (k.indexOf(wk + ':') !== 0) return;
      if (typeof H.state.bought[k] === 'number') H.addStock(k.slice(wk.length + 1), -H.state.bought[k]);   // lấy lại phần đã cộng vào tủ lạnh
      delete H.state.bought[k];
    });
    H.save();
    H.render({ keepScroll: true });
  };
  H.actions['shop-copy'] = function () {
    var sh = H.shopping(viewStart());
    U.copy(shopText(sh)).then(function (ok) {
      if (ok) H.toast('Đã sao chép danh sách đi chợ', { icon: 'copy' });
      else showTextSheet('Danh sách đi chợ', shopText(sh));
    });
  };

  // Khi không sao chép tự động được: cho người dùng chọn và sao chép tay.
  H.showTextSheet = showTextSheet;
  function showTextSheet(title, text) {
    H.sheet.open({
      title: title,
      render: function () {
        return { body: '<p class="hint">Trình duyệt không cho sao chép tự động. Hãy chọn toàn bộ văn bản bên dưới rồi sao chép.</p><textarea id="copy-box" class="textarea" rows="12" readonly aria-label="' + esc(title) + '">' + esc(text) + '</textarea>' };
      },
      onOpen: function (rec) { var t = U.$('#copy-box', rec.el); if (t) { t.focus(); t.select(); } }
    });
  }

  function planText() {
    var start = viewStart();
    var lines = ['Thực đơn tuần ' + U.fmtDMY(start)];
    H.weekDays(start).forEach(function (day) {
      var iso = U.iso(day);
      lines.push('', U.WD_LONG[day.getDay()] + ' ' + U.fmtDM(day));
      H.slotsOn().forEach(function (sid) {
        var id = H.getMeal(iso, sid);
        lines.push('- ' + slotInfo(sid).short + ': ' + (id ? H.DISH_BY_ID[id].name : '(chưa chọn)'));
      });
    });
    return lines.join('\n');
  }

  // ───────────── tuỳ chỉnh kế hoạch ─────────────
  H.openPlanSettings = function () {
    H.sheet.open({
      title: 'Tuỳ chỉnh kế hoạch',
      render: function () {
        var b = H.state.budget;
        return {
          body:
            '<section class="fgroup"><h3>Ngân sách mỗi ngày</h3>' +
            '<div class="range-row"><input id="budget-range" type="range" min="0" max="150000" step="5000" value="' + b + '" data-input="budget" aria-label="Ngân sách mỗi ngày" aria-describedby="budget-val"><output id="budget-val">' + (b ? U.vnd(b) : 'Không giới hạn') + '</output></div>' +
            '<p class="hint">Khi tự xếp, mình ưu tiên các món để tổng chi phí mỗi ngày không vượt mức này (kéo về 0 để bỏ giới hạn).</p></section>' +
            '<section class="fgroup"><h3>Bữa phụ</h3><div class="chips">' +
            H.ui.chip('Thêm bữa phụ mỗi ngày', H.state.snack, 'toggle-snack') + '</div>' +
            '<p class="hint">Ăn 4 đến 6 bữa nhỏ thường dễ chịu hơn với dạ dày. Bật lên để kế hoạch có thêm 7 bữa phụ.</p></section>' +
            '<section class="fgroup"><h3>Tuần này</h3><div class="stack">' +
            '<button type="button" class="btn btn-soft" data-act="plan-redo">' + H.icon('shuffle', { size: 18 }) + 'Xếp lại cả tuần</button>' +
            '<button type="button" class="btn btn-soft" data-act="plan-copy">' + H.icon('copy', { size: 18 }) + 'Sao chép thực đơn để gửi bạn bè</button>' +
            '<button type="button" class="btn btn-ghost btn-danger-ghost" data-act="plan-wipe">' + H.icon('trash', { size: 18 }) + 'Xoá cả tuần</button></div></section>'
        };
      },
      onClose: function () { H.render({ keepScroll: true }); }
    });
  };
  H.actions['plan-settings'] = function () { H.openPlanSettings(); };
  H.inputs.budget = function (el) {
    H.state.budget = Number(el.value) || 0;
    var out = document.getElementById('budget-val');
    if (out) out.textContent = H.state.budget ? U.vnd(H.state.budget) : 'Không giới hạn';
    H.save();
  };
  H.actions['toggle-snack'] = function () { H.state.snack = !H.state.snack; H.save(); H.sheet.refresh(); };
  H.actions['plan-redo'] = function () { confirmRedo(function () { H.sheet.closeAll(); }); };
  H.actions['plan-wipe'] = function () {
    H.confirm({
      title: 'Xoá cả tuần?', text: 'Toàn bộ món đã xếp trong tuần đang xem sẽ bị xoá.', ok: 'Xoá', danger: true,
      onOk: function () {
        H.weekDays(viewStart()).forEach(function (d) { H.clearDay(U.iso(d)); });
        H.save();
        H.sheet.closeAll();
        H.render({ keepScroll: true });
      }
    });
  };
  H.actions['plan-copy'] = function () {
    var t = planText();
    U.copy(t).then(function (ok) {
      if (ok) H.toast('Đã sao chép thực đơn', { icon: 'copy' });
      else showTextSheet('Thực đơn tuần', t);
    });
  };
})(window.HNAG = window.HNAG || {});
