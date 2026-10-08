/* Các sheet dùng chung: bộ lọc, vòng quay của bạn, ghim vào lịch, chọn món, cài đặt, chào mừng. */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;

  function linkOut(url, icon, label) {
    return '<a class="btn btn-soft btn-sm" href="' + url + '" target="_blank" rel="noopener noreferrer">' + H.icon(icon, { size: 16 }) + label + ' <span class="sr-only">(mở tab mới)</span></a>';
  }
  H.mapsUrl = function (q) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q); };
  H.ytUrl = function (q) { return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q); };

  function onProfileChange() {
    H.ui.result = null;
    H.save();
    H.sheet.refresh();
  }

  // ───────────── Bộ lọc ─────────────
  var filterCtx = 'home';   // home | explore | plan (kế hoạch tuần chỉ dùng hồ sơ và các giới hạn)

  function optCards(list, cur, act) {
    return '<div class="opt-group" role="radiogroup">' + list.map(function (o) {
      var on = o.id === cur;
      return '<button type="button" class="opt" role="radio" aria-checked="' + on + '" data-act="' + act + '" data-v="' + o.id + '">' +
        (o.emoji ? '<span class="opt-emoji" aria-hidden="true">' + o.emoji + '</span>' : '') +
        '<span class="opt-text"><strong>' + esc(o.name) + '</strong><small>' + esc(o.desc) + '</small></span>' +
        '<span class="opt-check" aria-hidden="true">' + (on ? H.icon('check', { size: 16, stroke: 3 }) : '') + '</span></button>';
    }).join('') + '</div>';
  }

  // Khi đang đau cấp, nhắc rõ giới hạn của việc tự chọn món.
  function acuteNote(p) {
    if (p.stage !== 'cap') return '';
    return '<p class="note warn">' + H.icon('warn', { size: 16 }) + '<span>Đang đau cấp: nếu đau dữ dội, nôn nhiều hoặc không ăn uống được, hãy đi khám thay vì tự xử lý tại nhà. <a href="#guide-luuy">Xem dấu hiệu cần đi khám</a>.</span></p>';
  }

  function hasMoreActive() {
    var f = H.state.filters;
    return !!(f.maxLevel || f.proteins.length || f.mode !== 'home' || f.energy !== 'all' || H.state.profile.veg);
  }

  // Thang mức vị: bốn nấc, nấc nào vượt mức hồ sơ cho phép thì bị khoá (vẫn bấm được để đọc lý do).
  function flavorGroup() {
    var pl = H.ui.profileLabel();
    var anyLocked = H.FLAVORS.some(function (f) { return H.flavorCap(f.id) < 3; });
    var h = '<section class="fgroup"><h3>Mức vị tối đa</h3><div class="flavors">';
    H.FLAVORS.forEach(function (f) {
      var cap = H.flavorCap(f.id), lim = H.flavorLimit(f.id);
      h += '<div class="fl-row"><div class="fl-head"><span class="fl-name"><span aria-hidden="true">' + f.emoji + '</span> ' + esc(f.name) + '</span>' +
        '<span class="fl-val">' + esc(f.levels[lim]) + '</span></div>' +
        '<div class="fl-bar" role="radiogroup" aria-label="Mức ' + esc(f.name.toLowerCase()) + ' tối đa">';
      for (var i = 0; i <= 3; i++) {
        var locked = i > cap;
        h += '<button type="button" class="fl-step' + (i <= lim ? ' fill' : '') + (locked ? ' locked' : '') + '" role="radio" aria-checked="' + (i === lim) + '"' +
          (locked ? ' aria-disabled="true"' : '') + ' style="--i:' + i + '" data-act="set-flavor" data-k="' + f.id + '" data-v="' + i + '" aria-label="' +
          esc(f.levels[i]) + (locked ? ', đang bị khoá theo hồ sơ dạ dày' : '') + '"><i>' + (locked ? H.icon('lock', { size: 12, stroke: 2.4 }) : '') + '</i></button>';
      }
      h += '</div><p class="fl-why">' + esc(f.why) + (cap < 3 ? ' <strong>Các mức từ “' + esc(f.levels[cap + 1]) + '” trở lên đang khoá.</strong>' : '') + '</p></div>';
    });
    h += '</div>' + (anyLocked
      ? '<p class="note">' + H.icon('lock', { size: 16 }) + '<span>Các mức bị khoá được đặt theo hồ sơ của bạn (' + esc(pl.text) + '). Bạn chỉ hạ thấp thêm được, chưa nâng cao hơn. Muốn nới, hãy hỏi bác sĩ rồi cập nhật hồ sơ ở trên.</span></p>'
      : '<p class="hint">Bạn đang ở mức dạ dày ổn định nên các vị đều mở. Mình vẫn khuyên giữ nhẹ vị khi ăn món mới.</p>') +
      '</section>';
    return h;
  }

  function filterBody() {
    var S = H.state, p = S.profile, f = S.filters;
    var plan = filterCtx === 'plan';
    var mealList = [{ id: 'all', short: 'Tất cả', emoji: '' }].concat(H.SLOTS);
    var curMeal = filterCtx === 'explore' ? H.ui.exploreMeal : H.ui.meal;
    if (filterCtx !== 'explore') mealList = H.SLOTS;
    var h = '';
    h += '<section class="fgroup"><h3>Giai đoạn dạ dày</h3>' + optCards(H.STAGES.map(function (s) { return { id: s.id, name: s.name, emoji: s.emoji, desc: s.desc }; }), p.stage, 'set-stage') + acuteNote(p) + '</section>';
    h += '<section class="fgroup"><h3>Mức độ</h3><div class="chips cols-3">' + H.SEVERITIES.map(function (s) {
      return H.ui.chip(esc(s.name) + '<small>' + esc(s.desc) + '</small>', p.severity === s.id, 'set-sev', { v: s.id }, 'chip-2l');
    }).join('') + '</div><p class="hint">Mức càng nặng, mình càng ưu tiên món mềm, ít kích thích.</p></section>';
    if (!plan) {
      h += '<section class="fgroup"><h3>Loại bữa</h3><div class="chips">' + mealList.map(function (m) {
        return H.ui.chip((m.emoji ? m.emoji + ' ' : '') + m.short, curMeal === m.id, 'set-meal', { v: m.id });
      }).join('') + '</div></section>';
    }
    h += '<section class="fgroup"><h3>' + H.icon('clock', { size: 16 }) + ' Thời gian nấu tối đa</h3><div class="chips">' + H.TIME_STEPS.map(function (n) {
      return H.ui.chip(esc(H.timeLabel(n)), f.maxTime === n, 'set-time', { v: n });
    }).join('') + '</div><p class="hint">Chỉ tính thời gian đứng bếp. Món ăn ngoài không có thời gian nấu nên không bị lọc ở mục này.</p></section>';
    h += '<section class="fgroup"><h3>' + H.icon('coin', { size: 16 }) + ' Ngân sách cho một bữa</h3><div class="chips">' + H.COST_STEPS.map(function (n) {
      return H.ui.chip(esc(H.costLabel(n)), f.maxCost === n, 'set-cost', { v: n });
    }).join('') + '</div><p class="hint">Giá nguyên liệu ước tính cho 1 người. Ngân sách cả ngày dùng để xếp thực đơn tuần thì đặt trong <a href="#plan" data-act="close-sheet">Kế hoạch</a>.</p></section>';
    h += flavorGroup();

    h += '<button type="button" class="more-toggle" data-act="toggle-more" aria-expanded="' + !!H.ui.filterMore + '"><span>Lọc thêm <small>' +
      (plan ? 'độ khó, món chay, dụng cụ' : 'độ khó, nguyên liệu chính, cách ăn, năng lượng, dụng cụ') + '</small></span>' +
      H.icon(H.ui.filterMore ? 'chev-d' : 'chev-r', { size: 18 }) + '</button>';
    if (H.ui.filterMore) {
      h += '<div class="more-body">';
      h += '<section class="fgroup"><h3>Độ khó tối đa</h3><div class="chips">' +
        H.ui.chip('Bất kỳ', !f.maxLevel, 'set-level', { v: 0 }) +
        H.LEVELS.map(function (l) { return H.ui.chip(esc(l.name), f.maxLevel === l.id, 'set-level', { v: l.id }); }).join('') + '</div>' +
        '<p class="hint">' + H.LEVELS.map(function (l) { return '<strong>' + esc(l.name) + ':</strong> ' + esc(l.hint.charAt(0).toLowerCase() + l.hint.slice(1)); }).join('. ') + '.</p></section>';
      if (!plan) {
        h += '<section class="fgroup"><h3>Nguyên liệu chính</h3><div class="chips">' + H.PROTEINS.map(function (pr) {
          return H.ui.chip(pr.emoji + ' ' + esc(pr.name), f.proteins.indexOf(pr.id) >= 0, 'toggle-protein', { v: pr.id });
        }).join('') + '</div><p class="hint">Chọn nhiều loại cùng lúc được. Không chọn gì nghĩa là món nào cũng được.</p></section>';
        h += '<section class="fgroup"><h3>Cách ăn</h3><div class="chips">' +
          H.ui.chip('Tất cả', f.mode === 'all', 'set-mode', { v: 'all' }) +
          H.ui.chip('Nấu tại nhà', f.mode === 'home', 'set-mode', { v: 'home' }, 'chip-green') +
          H.ui.chip('Ăn ngoài', f.mode === 'out', 'set-mode', { v: 'out' }) + '</div></section>';
        h += '<section class="fgroup"><h3>Mức năng lượng</h3><div class="chips">' +
          [['all', 'Tất cả'], ['thap', 'Thấp'], ['tb', 'Trung bình'], ['cao', 'Cao']].map(function (e) {
            return H.ui.chip(e[1], f.energy === e[0], 'set-energy', { v: e[0] });
          }).join('') + '</div><p class="hint">Thấp dưới 300 kcal, trung bình 300 đến 450, cao trên 450 (ước tính cho 1 bữa).</p></section>';
      }
      h += '<section class="fgroup"><h3>Món chay</h3><div class="chips">' +
        H.ui.chip(H.icon('leaf', { size: 16 }) + ' Chỉ món chay', p.veg, 'toggle-veg') + '</div>' +
        '<p class="hint">Món chay ở đây là không thịt, không cá (có thể có trứng hoặc sữa, mình ghi rõ trên từng món).</p></section>';
      h += '<section class="fgroup"><h3>Phòng trọ của tôi có</h3><div class="chips">' + H.TOOLS.map(function (t) {
        return H.ui.chip(t.emoji + ' ' + t.name, p.tools.indexOf(t.id) >= 0, 'toggle-tool', { v: t.id });
      }).join('') + '</div><p class="hint">Món chỉ hiện khi bạn có ít nhất một dụng cụ nó cần.</p></section>';
      h += '</div>';
    }
    return h;
  }

  H.openFilters = function (ctx) {
    filterCtx = ctx || 'home';
    H.ui.filterMore = hasMoreActive();
    H.sheet.open({
      title: 'Bộ lọc',
      left: '<button type="button" class="sheet-link" data-act="filters-reset">Đặt lại</button>',
      right: '<button type="button" class="sheet-link strong" data-act="close-sheet">Áp dụng</button>',
      render: function () {
        var n, label;
        if (filterCtx === 'plan') {
          n = H.DISHES.filter(function (d) { return d.mode === 'home' && H.fitsProfile(d) && H.fitsLimits(d) && !H.isExcluded(d.id); }).length;
          label = 'Còn ' + n + ' món nấu tại nhà để xếp thực đơn';
        } else {
          n = filterCtx === 'explore' ? H.exploreList().length : H.wheelPool(H.ui.meal).length;
          label = 'Xem ' + n + ' món phù hợp';
        }
        return {
          body: filterBody(),
          foot: '<button type="button" class="btn btn-primary btn-block btn-lg" data-act="close-sheet">' + label + '</button>'
        };
      },
      onClose: function () { H.render({ keepScroll: true }); H.sheet.refresh(); }
    });
  };

  H.actions['open-filters'] = function (el) { H.openFilters(el.getAttribute('data-ctx') || (H.route && H.route.name === 'explore' ? 'explore' : 'home')); };
  H.actions['set-stage'] = function (el) { H.state.profile.stage = el.dataset.v; onProfileChange(); };
  H.actions['set-sev'] = function (el) { H.state.profile.severity = el.dataset.v; onProfileChange(); };
  H.actions['set-meal'] = function (el) {
    if (filterCtx === 'explore') H.ui.exploreMeal = el.dataset.v; else H.ui.meal = el.dataset.v;
    H.ui.result = null;
    H.sheet.refresh();
  };
  H.actions['set-mode'] = function (el) { H.state.filters.mode = el.dataset.v; onProfileChange(); };
  H.actions['set-energy'] = function (el) { H.state.filters.energy = el.dataset.v; onProfileChange(); };
  H.actions['set-time'] = function (el) { H.state.filters.maxTime = Number(el.dataset.v) || 0; onProfileChange(); };
  H.actions['set-cost'] = function (el) { H.state.filters.maxCost = Number(el.dataset.v) || 0; onProfileChange(); };
  H.actions['set-level'] = function (el) { H.state.filters.maxLevel = Number(el.dataset.v) || 0; onProfileChange(); };
  H.actions['toggle-protein'] = function (el) {
    var a = H.state.filters.proteins, i = a.indexOf(el.dataset.v);
    if (i >= 0) a.splice(i, 1); else a.push(el.dataset.v);
    onProfileChange();
  };
  H.actions['set-flavor'] = function (el) {
    var k = el.dataset.k, v = Number(el.dataset.v);
    if (el.getAttribute('aria-disabled') === 'true') {
      var pl = H.ui.profileLabel();
      H.toast('Mức “' + H.flavorLabel(k, v).toLowerCase() + '” đang khoá theo hồ sơ (' + pl.text + '). Muốn nới, hãy hỏi bác sĩ rồi đổi hồ sơ.', { icon: 'lock', ms: 4200 });
      return;
    }
    H.setFlavor(k, v);
    onProfileChange();
  };
  H.actions['toggle-more'] = function () { H.ui.filterMore = !H.ui.filterMore; H.sheet.refresh(); };
  H.actions['toggle-quick'] = function () { H.state.filters.maxTime = H.state.filters.maxTime === 15 ? 0 : 15; onProfileChange(); };
  H.actions['toggle-cheap'] = function () { H.state.filters.maxCost = H.state.filters.maxCost === 15000 ? 0 : 15000; onProfileChange(); };
  H.actions['toggle-veg'] = function () { H.state.profile.veg = !H.state.profile.veg; onProfileChange(); };
  H.actions['toggle-tool'] = function (el) {
    var t = H.state.profile.tools, i = t.indexOf(el.dataset.v);
    if (i >= 0) t.splice(i, 1); else t.push(el.dataset.v);
    onProfileChange();
  };
  H.actions['filters-reset'] = function () {
    H.resetFilters();
    H.ui.exploreMeal = 'all';
    H.ui.meal = H.autoMeal();
    onProfileChange();
  };
  // Nút xoá trên các nhãn lọc đang bật (trang chủ, khám phá, kế hoạch, vòng quay của bạn).
  H.actions['clear-filter'] = function (el) {
    H.clearFilter(el.dataset.k);
    H.ui.result = null;
    H.render({ keepScroll: true });
    H.sheet.refresh();
  };

  // ───────────── Vòng quay của bạn ─────────────
  H.openWheelList = function () {
    filterCtx = 'home';
    H.sheet.open({
      title: 'Vòng quay của bạn 🎡',
      render: function () {
        var meal = H.ui.meal, f = H.state.filters, p = H.state.profile;
        var list = H.candidates(meal);
        var active = list.filter(function (d) { return !H.isExcluded(d.id); }).length;
        var body = '<div class="chips scroller" role="group" aria-label="Chọn bữa">' + H.SLOTS.map(function (m) {
          return H.ui.chip(m.emoji + ' ' + m.short, meal === m.id, 'set-meal', { v: m.id });
        }).join('') + '</div>';
        body += '<div class="chips scroller" role="group" aria-label="Bộ lọc nhanh">' +
          H.ui.chip(H.icon('clock', { size: 15 }) + ' Dưới 15 phút', f.maxTime === 15, 'toggle-quick') +
          H.ui.chip(H.icon('coin', { size: 15 }) + ' Dưới 15.000đ', f.maxCost === 15000, 'toggle-cheap') +
          H.ui.chip(H.icon('leaf', { size: 15 }) + ' Chay', p.veg, 'toggle-veg') +
          H.ui.chip('Ăn ngoài', f.mode === 'out', 'set-mode', { v: f.mode === 'out' ? 'home' : 'out' }) +
          H.ui.chip(H.icon('sliders', { size: 15 }) + ' Thêm bộ lọc', false, 'open-filters', { ctx: 'home' }) + '</div>';
        body += H.ui.filterPills();
        if (!list.length) {
          body += H.ui.empty({ title: 'Chưa có món nào', text: 'Thử nới bộ lọc hoặc đổi giai đoạn dạ dày.' });
        } else {
          body += '<ul class="rows">' + list.map(function (d) {
            var off = H.isExcluded(d.id);
            return '<li class="row' + (off ? ' off' : '') + '">' + H.ui.tile(d, 'sm') +
              '<span class="row-main"><strong>' + esc(d.name) + '</strong><small>' + esc(d.kind) + ' · ' + U.vnd(d.cost) + (d.time ? ' · ' + d.time + ' phút' : '') + '</small></span>' +
              '<button type="button" class="btn-icon round" data-act="toggle-excl" data-id="' + d.id + '" aria-label="' + (off ? 'Đưa lại ' : 'Bỏ ') + esc(d.name) + ' ' + (off ? 'vào vòng quay' : 'khỏi vòng quay') + '">' +
              H.icon(off ? 'plus' : 'x', { size: 16 }) + '</button></li>';
          }).join('') + '</ul>';
        }
        return {
          body: body,
          foot: '<button type="button" class="btn btn-primary btn-block btn-lg" data-act="wheel-go"' + (active < 2 ? ' disabled' : '') + '>Quay với ' + active + ' món 🎡</button>'
        };
      },
      onClose: function () { H.render(); }
    });
  };
  H.actions['open-wheel-list'] = function () { H.openWheelList(); };
  H.actions['toggle-excl'] = function (el) { H.toggleExcluded(el.dataset.id); H.sheet.refresh(); };
  H.actions['wheel-go'] = function () {
    H.sheet.close();
    H.render();
    setTimeout(function () { if (H.actions.spin) H.actions.spin(); }, 320);
  };

  // ───────────── Ghim vào lịch ─────────────
  var pin = null;   // { id, date, slot }

  function weekStripFor(slot) {
    var start = H.weekStartOf(0);
    var todayISO = U.iso(new Date());
    return H.weekDays(start).map(function (day) {
      var iso = U.iso(day);
      var id = H.getMeal(iso, slot);
      var d = id ? H.DISH_BY_ID[id] : null;
      var cnt = H.slotsOn().concat(['phu']).filter(function (s, i, a) { return a.indexOf(s) === i && H.getMeal(iso, s); }).length;
      var sel = pin && pin.date === iso;
      return '<button type="button" class="daybtn' + (sel ? ' sel' : '') + (iso === todayISO ? ' today' : '') + '" data-act="pin-day" data-date="' + iso + '" aria-pressed="' + !!sel + '" aria-label="' + U.WD_LONG[day.getDay()] + ' ' + U.fmtDM(day) + (d ? ', đã có ' + esc(d.name) : ', trống') + '">' +
        '<small>' + U.WD_SHORT[day.getDay()] + '</small>' +
        (d ? '<span class="tile s-xs ' + H.ui.kindClass(d.kind) + '" aria-hidden="true"><span class="tile-e">' + d.emoji + '</span></span>' : '<span class="daynum">' + day.getDate() + '</span>') +
        (cnt ? '<i class="cnt">' + cnt + '</i>' : '') + '</button>';
    }).join('');
  }

  H.openPin = function (id, slot, dateISO) {
    var d = H.DISH_BY_ID[id];
    if (!d) return;
    var date = dateISO || U.iso(new Date());
    pin = { id: id, date: date, slot: slot };
    H.pinMeal(id, date, slot);
    H.sheet.open({
      title: 'Đã ghim vào lịch! 📌',
      cls: 'overlay-dialog',
      right: '',
      render: function () {
        var dish = H.DISH_BY_ID[pin.id];
        var where = dish.mode === 'out'
          ? linkOut(H.mapsUrl(dish.mapQuery + ' gần đây'), 'pin', 'Tìm quán gần bạn')
          : linkOut(H.mapsUrl('siêu thị mini gần đây'), 'cart', 'Mua nguyên liệu') + linkOut(H.ytUrl('cách nấu ' + dish.name + ' cho người đau dạ dày'), 'play', 'Xem cách nấu');
        return {
          body: '<p class="pin-name">' + esc(dish.name) + '</p>' +
            '<div class="pin-slots" role="group" aria-label="Chọn bữa">' + H.SLOTS.map(function (s) {
              return H.ui.chip(s.emoji + ' ' + s.short, pin.slot === s.id, 'pin-slot', { v: s.id });
            }).join('') + '</div>' +
            '<h3 class="pin-h">Tuần này</h3><div class="weekstrip">' + weekStripFor(pin.slot) + '</div>' +
            '<p class="hint centered">Chạm vào ngày khác để dời món này sang ngày đó.</p>' +
            '<h3 class="pin-h">' + (dish.mode === 'out' ? 'Ăn ở đâu?' : 'Chuẩn bị') + '</h3><div class="pin-links">' + where + '</div>',
          foot: '<div class="foot-actions"><a class="btn btn-ghost" href="#rank" data-act="close-sheet">Xem lịch sử chốt</a><button type="button" class="btn btn-primary" data-act="close-sheet" data-autofocus>Xong</button></div>'
        };
      },
      onClose: function () { pin = null; H.render(); }
    });
  };

  function movePin(date, slot) {
    if (!pin) return;
    var oldDate = pin.date, oldSlot = pin.slot;
    if (oldDate === date && oldSlot === slot) return;
    if (H.getMeal(oldDate, oldSlot) === pin.id) H.setMeal(oldDate, oldSlot, null);
    pin.date = date; pin.slot = slot;
    H.setMeal(date, slot, pin.id);
    H.sheet.refresh();
  }
  H.actions['pin-day'] = function (el) { if (pin) movePin(el.dataset.date, pin.slot); };
  H.actions['pin-slot'] = function (el) { if (pin) movePin(pin.date, el.dataset.v); };
  H.actions.pin = function (el) {
    var id = el.dataset.id;
    var d = H.DISH_BY_ID[id];
    var slot = el.dataset.slot || (d.meals.indexOf(H.ui.meal) >= 0 ? H.ui.meal : d.meals[0]);
    H.openPin(id, slot);
  };

  // ───────────── Chọn món cho một ô trống ─────────────
  H.openPicker = function (date, slot, replace) {
    var q = '';
    var rec = H.sheet.open({
      title: 'Chọn món cho ' + (H.SLOTS.filter(function (s) { return s.id === slot; })[0].label.toLowerCase()),
      render: function () {
        // Món trong giới hạn của bạn (thời gian, giá, độ khó, mức vị) lên trước; món vượt giới hạn vẫn hiện nhưng có ghi chú.
        var list = H.DISHES.filter(function (d) {
          return d.meals.indexOf(slot) >= 0 && H.fitsProfile(d) && !H.isExcluded(d.id) && U.searchMatch(d.searchRaw, d.searchText, q);
        }).map(function (d, i) { return { d: d, i: i, flag: H.limitReason(d) }; })
          .sort(function (a, b) { return (a.flag ? 1 : 0) - (b.flag ? 1 : 0) || a.i - b.i; })
          .map(function (x) { return x.d; });
        var body = '<div class="search"><span class="search-ic">' + H.icon('search', { size: 18 }) + '</span>' +
          '<input id="picker-q" type="search" placeholder="Tìm món…" autocomplete="off" value="' + esc(q) + '" data-input="picker-q" aria-label="Tìm món"></div>';
        body += list.length ? '<ul class="rows">' + list.map(function (d) {
          return '<li><button type="button" class="row pick" data-act="pick-dish" data-id="' + d.id + '">' + H.ui.tile(d, 'sm') +
            '<span class="row-main"><strong>' + esc(d.name) + '</strong><small>' + esc(d.kind) + ' · ' + U.vnd(d.cost) + (d.time ? ' · ' + d.time + ' phút' : '') + '</small>' +
            (H.limitReason(d) ? '<span class="missing">' + esc(H.limitReason(d)) + '</span>' : '') + '</span>' +
            H.ui.careBadge(d.care) + '</button></li>';
        }).join('') + '</ul>' : H.ui.empty({ title: 'Không có món phù hợp', text: 'Thử từ khoá khác hoặc đổi hồ sơ dạ dày.' });
        return { body: body };
      }
    });
    rec.pickCtx = { date: date, slot: slot };
    rec.setQuery = function (v) {
      q = v;
      var body = U.$('.sheet-body', rec.el);
      var input = U.$('#picker-q', rec.el);
      var pos = input ? input.selectionStart : 0;
      rec.refresh();
      var again = U.$('#picker-q', rec.el);
      if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (e) { /* bỏ qua */ } }
      void body;
    };
  };
  H.inputs['picker-q'] = function (el) { var t = H.sheet.top(); if (t && t.setQuery) t.setQuery(el.value); };
  H.actions['pick-dish'] = function (el) {
    var t = H.sheet.top();
    if (!t || !t.pickCtx) return;
    H.pinMeal(el.dataset.id, t.pickCtx.date, t.pickCtx.slot);
    H.sheet.close(t);
    H.toast('Đã thêm vào kế hoạch', { icon: 'check' });
    H.render();
  };
  H.actions['open-picker'] = function (el) { H.openPicker(el.dataset.date, el.dataset.slot); };

  // ───────────── Cài đặt ─────────────
  H.openSettings = function () {
    H.sheet.open({
      title: 'Cài đặt',
      render: function () {
        var t = H.state.theme;
        var pl = H.ui.profileLabel();
        return {
          body:
            '<section class="fgroup"><h3>Hồ sơ dạ dày</h3>' +
            '<button type="button" class="opt" data-act="settings-profile"><span class="opt-emoji">' + pl.stage.emoji + '</span><span class="opt-text"><strong>' + esc(pl.text) + '</strong><small>Chạm để đổi giai đoạn, mức độ và dụng cụ</small></span><span class="opt-check">' + H.icon('chev-r', { size: 18 }) + '</span></button></section>' +
            '<section class="fgroup"><h3>Nhắc giờ ăn</h3>' +
            '<a class="opt" href="#plan-remind" data-act="close-sheet"><span class="opt-emoji" aria-hidden="true">⏰</span><span class="opt-text"><strong>' + (H.state.remind.on ? 'Đang bật' : 'Đang tắt') + '</strong><small>Đổi giờ ăn, loại nhắc, thông báo và xuất lịch</small></span><span class="opt-check">' + H.icon('chev-r', { size: 18 }) + '</span></a></section>' +
            '<section class="fgroup"><h3>Giao diện</h3><div class="chips">' +
            H.ui.chip(H.icon('sparkle', { size: 16 }) + ' Theo thiết bị', t === 'auto', 'set-theme', { v: 'auto' }) +
            H.ui.chip(H.icon('sun', { size: 16 }) + ' Sáng', t === 'light', 'set-theme', { v: 'light' }) +
            H.ui.chip(H.icon('moon', { size: 16 }) + ' Tối', t === 'dark', 'set-theme', { v: 'dark' }) + '</div></section>' +
            '<section class="fgroup"><h3>Màu giao diện</h3><div class="swatches" role="radiogroup" aria-label="Màu giao diện">' + H.PALETTES.map(function (pl2) {
              var on = pl2.id === H.state.palette;
              return '<button type="button" class="swatch" role="radio" aria-checked="' + on + '" data-act="set-palette" data-v="' + pl2.id + '">' +
                '<span class="swatch-dot" style="--sw-a:' + pl2.p + ';--sw-b:' + pl2.accent + '" aria-hidden="true"></span>' +
                '<span class="swatch-name">' + esc(pl2.name) + '</span>' +
                (on ? '<span class="swatch-tick" aria-hidden="true">' + H.icon('check', { size: 14, stroke: 3 }) + '</span>' : '') + '</button>';
            }).join('') + '</div></section>' +
            '<section class="fgroup"><h3>Dữ liệu</h3><p class="hint">Kế hoạch, tủ lạnh, bài viết và bảng xếp hạng của bạn chỉ lưu trên thiết bị này (trong trình duyệt), chưa đồng bộ lên máy chủ.</p>' +
            '<button type="button" class="btn btn-ghost btn-danger-ghost" data-act="reset-all">' + H.icon('trash', { size: 16 }) + ' Xoá toàn bộ dữ liệu trên máy này</button></section>' +
            '<section class="fgroup"><h3>Về trang này</h3><p class="hint">“Hôm nay ăn gì?” gợi ý món cho sinh viên bị đau dạ dày hoặc viêm loét dạ dày đang tự nấu ăn ở nhà trọ. Nội dung chỉ để tham khảo và chưa thay thế lời khuyên của bác sĩ. Giá món là ước tính.</p><a class="btn btn-soft btn-sm" href="#about" data-act="close-sheet">Đọc ý tưởng dự án</a></section>'
        };
      },
      onClose: function () { H.render(); }
    });
  };
  H.actions['open-settings'] = function () { H.openSettings(); };
  H.actions['settings-profile'] = function () { H.sheet.close(); setTimeout(function () { H.openFilters('home'); }, 230); };
  H.actions['set-theme'] = function (el) { H.state.theme = el.dataset.v; H.applyTheme(); H.save(); H.sheet.refresh(); };
  H.actions['set-palette'] = function (el) {
    if (!H.PALETTES.some(function (p) { return p.id === el.dataset.v; })) return;
    H.state.palette = el.dataset.v;
    H.applyTheme();
    H.save();
    H.sheet.refresh();
  };
  H.actions['reset-all'] = function () {
    H.confirm({
      title: 'Xoá toàn bộ dữ liệu?',
      text: 'Kế hoạch tuần, tủ lạnh, bài viết, bảng xếp hạng và cài đặt sẽ về mặc định. Việc này không hoàn tác được.',
      ok: 'Xoá hết', danger: true,
      onOk: function () {
        H.sheet.closeAll();
        H.resetAll();
        H.applyTheme();
        H.toast('Đã xoá dữ liệu trên máy này');
        if (location.hash && location.hash !== '#home') location.hash = '#home';
        else H.render();
        setTimeout(H.openWelcome, 450);
      }
    });
  };

  // ───────────── Chào mừng ─────────────
  // Chỉ hỏi ba điều: dạ dày đang thế nào, mỗi bữa muốn chi tối đa bao nhiêu và có bao nhiêu thời gian nấu.
  // Dụng cụ nấu để mặc định (nồi cơm điện, bếp, chảo) và đổi sau trong Bộ lọc.
  var WELCOME_COST = [0, 10000, 15000, 20000, 30000];
  var WELCOME_TIME = [0, 15, 30, 45];
  H.openWelcome = function () {
    filterCtx = 'home';
    H.sheet.open({
      title: 'Chào bạn!',
      cls: 'overlay-welcome',
      dismissible: false,
      right: '<button type="button" class="sheet-link" data-act="welcome-skip">Bỏ qua</button>',
      render: function () {
        var p = H.state.profile, f = H.state.filters, rm = H.state.remind;
        return {
          body:
            '<div class="welcome-hero">' + H.mascot({ size: 84 }) +
            '<p>Mình là <strong>Bé Cháo</strong>. Trả lời nhanh ba câu để mình chọn món vừa sức nhé.</p></div>' +
            '<section class="fgroup"><h3>1. Dạ dày bạn đang thế nào?</h3>' + optCards(H.STAGES.map(function (s) { return { id: s.id, name: s.name, emoji: s.emoji, desc: s.desc }; }), p.stage, 'set-stage') + acuteNote(p) +
            '<p class="label w-lab">Mức độ</p><div class="chips cols-3 w-sev">' + H.SEVERITIES.map(function (s) {
              return H.ui.chip(esc(s.name) + '<small>' + esc(s.desc) + '</small>', p.severity === s.id, 'set-sev', { v: s.id }, 'chip-2l');
            }).join('') + '</div></section>' +
            '<section class="fgroup"><h3>2. Mỗi bữa bạn muốn chi tối đa</h3><div class="chips">' + WELCOME_COST.map(function (n) {
              return H.ui.chip(esc(H.costLabel(n)), f.maxCost === n, 'set-cost', { v: n });
            }).join('') + '</div></section>' +
            '<section class="fgroup"><h3>3. Thời gian nấu tối đa</h3><div class="chips">' + WELCOME_TIME.map(function (n) {
              return H.ui.chip(esc(H.timeLabel(n)), f.maxTime === n, 'set-time', { v: n });
            }).join('') + '</div></section>' +
            '<section class="fgroup"><div class="rm-row"><div><strong>Nhắc tôi ăn đúng giờ</strong><small>Người đau dạ dày nên ăn đều đặn. Mình nhắc đi chợ, nấu và ăn.</small></div>' +
            '<button type="button" class="switch" role="switch" aria-checked="' + !!rm.on + '" data-act="welcome-remind" aria-label="Nhắc tôi ăn đúng giờ"><i></i></button></div></section>' +
            '<p class="hint">Mình tạm coi bạn có nồi cơm điện, bếp và chảo. Muốn đổi dụng cụ hay lọc kỹ hơn, vào <strong>Bộ lọc</strong> sau.</p>' +
            '<p class="hint"><strong>Lưu ý:</strong> đây là gợi ý tham khảo, không thay thế bác sĩ. Nếu nôn ra máu, đi ngoài phân đen hoặc đau dữ dội, hãy đi khám ngay.</p>',
          foot: '<button type="button" class="btn btn-primary btn-block btn-lg" data-act="welcome-done" data-autofocus>Bắt đầu chọn món</button>'
        };
      }
    });
  };
  H.actions['welcome-remind'] = function () { H.state.remind.on = !H.state.remind.on; H.save(); H.sheet.refresh(); };
  H.actions['welcome-done'] = function () { H.state.onboarded = true; H.save(); H.sheet.closeAll(); H.ui.result = null; H.render(); };
  H.actions['welcome-skip'] = H.actions['welcome-done'];
})(window.HNAG = window.HNAG || {});
