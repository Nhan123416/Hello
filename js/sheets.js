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
  var filterCtx = 'home';

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

  function filterBody() {
    var S = H.state, p = S.profile, f = S.filters;
    var mealList = [{ id: 'all', short: 'Tất cả', emoji: '' }].concat(H.SLOTS);
    var curMeal = filterCtx === 'explore' ? H.ui.exploreMeal : H.ui.meal;
    if (filterCtx !== 'explore') mealList = H.SLOTS;
    var h = '';
    h += '<section class="fgroup"><h3>Giai đoạn dạ dày</h3>' + optCards(H.STAGES.map(function (s) { return { id: s.id, name: s.name, emoji: s.emoji, desc: s.desc }; }), p.stage, 'set-stage') + acuteNote(p) + '</section>';
    h += '<section class="fgroup"><h3>Mức độ</h3><div class="chips cols-3">' + H.SEVERITIES.map(function (s) {
      return H.ui.chip(esc(s.name) + '<small>' + esc(s.desc) + '</small>', p.severity === s.id, 'set-sev', { v: s.id }, 'chip-2l');
    }).join('') + '</div><p class="hint">Mức càng nặng, mình càng ưu tiên món mềm, ít kích thích.</p></section>';
    h += '<section class="fgroup"><h3>Loại bữa</h3><div class="chips">' + mealList.map(function (m) {
      return H.ui.chip((m.emoji ? m.emoji + ' ' : '') + m.short, curMeal === m.id, 'set-meal', { v: m.id });
    }).join('') + '</div></section>';
    h += '<section class="fgroup"><h3>Cách ăn</h3><div class="chips">' +
      H.ui.chip('Tất cả', f.mode === 'all', 'set-mode', { v: 'all' }) +
      H.ui.chip('Nấu tại nhà', f.mode === 'home', 'set-mode', { v: 'home' }, 'chip-green') +
      H.ui.chip('Ăn ngoài', f.mode === 'out', 'set-mode', { v: 'out' }) + '</div></section>';
    h += '<section class="fgroup"><h3>Mức năng lượng</h3><div class="chips">' +
      [['all', 'Tất cả'], ['thap', 'Thấp'], ['tb', 'Trung bình'], ['cao', 'Cao']].map(function (e) {
        return H.ui.chip(e[1], f.energy === e[0], 'set-energy', { v: e[0] });
      }).join('') + '</div><p class="hint">Thấp dưới 300 kcal, trung bình 300 đến 450, cao trên 450 (ước tính cho 1 bữa).</p></section>';
    h += '<section class="fgroup"><h3>Tuỳ chọn nhanh</h3><div class="chips">' +
      H.ui.chip(H.icon('clock', { size: 16 }) + ' Nấu dưới 15 phút', f.quick, 'toggle-quick') +
      H.ui.chip(H.icon('coin', { size: 16 }) + ' Dưới 15.000đ', f.cheap, 'toggle-cheap') +
      H.ui.chip(H.icon('leaf', { size: 16 }) + ' Chỉ món chay', p.veg, 'toggle-veg') + '</div>' +
      '<p class="hint">Món chay ở đây là không thịt, không cá (có thể có trứng hoặc sữa, mình ghi rõ trên từng món).</p></section>';
    h += '<section class="fgroup"><h3>Phòng trọ của tôi có</h3><div class="chips">' + H.TOOLS.map(function (t) {
      return H.ui.chip(t.emoji + ' ' + t.name, p.tools.indexOf(t.id) >= 0, 'toggle-tool', { v: t.id });
    }).join('') + '</div><p class="hint">Món chỉ hiện khi bạn có ít nhất một dụng cụ nó cần.</p></section>';
    return h;
  }

  H.openFilters = function (ctx) {
    filterCtx = ctx || 'home';
    H.sheet.open({
      title: 'Bộ lọc',
      left: '<button type="button" class="sheet-link" data-act="filters-reset">Đặt lại</button>',
      right: '<button type="button" class="sheet-link strong" data-act="close-sheet">Áp dụng</button>',
      render: function () {
        var n = filterCtx === 'explore' ? H.exploreList().length : H.wheelPool(H.ui.meal).length;
        return {
          body: filterBody(),
          foot: '<button type="button" class="btn btn-primary btn-block btn-lg" data-act="close-sheet">Xem ' + n + ' món phù hợp</button>'
        };
      },
      onClose: function () { H.render(); }
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
  H.actions['toggle-quick'] = function () { H.state.filters.quick = !H.state.filters.quick; onProfileChange(); };
  H.actions['toggle-cheap'] = function () { H.state.filters.cheap = !H.state.filters.cheap; onProfileChange(); };
  H.actions['toggle-veg'] = function () { H.state.profile.veg = !H.state.profile.veg; onProfileChange(); };
  H.actions['toggle-tool'] = function (el) {
    var t = H.state.profile.tools, i = t.indexOf(el.dataset.v);
    if (i >= 0) t.splice(i, 1); else t.push(el.dataset.v);
    onProfileChange();
  };
  H.actions['filters-reset'] = function () {
    H.state.filters = { mode: 'home', energy: 'all', quick: false, cheap: false };
    H.state.profile.veg = false;
    H.ui.exploreMeal = 'all';
    H.ui.meal = H.autoMeal();
    onProfileChange();
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
          H.ui.chip(H.icon('clock', { size: 15 }) + ' Nhanh', f.quick, 'toggle-quick') +
          H.ui.chip(H.icon('coin', { size: 15 }) + ' Rẻ', f.cheap, 'toggle-cheap') +
          H.ui.chip(H.icon('leaf', { size: 15 }) + ' Chay', p.veg, 'toggle-veg') +
          H.ui.chip('Ăn ngoài', f.mode === 'out', 'set-mode', { v: f.mode === 'out' ? 'home' : 'out' }) + '</div>';
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
        var list = H.DISHES.filter(function (d) {
          return d.meals.indexOf(slot) >= 0 && H.fitsProfile(d) && !H.isExcluded(d.id) && U.searchMatch(d.searchRaw, d.searchText, q);
        });
        var body = '<div class="search"><span class="search-ic">' + H.icon('search', { size: 18 }) + '</span>' +
          '<input id="picker-q" type="search" placeholder="Tìm món…" autocomplete="off" value="' + esc(q) + '" data-input="picker-q" aria-label="Tìm món"></div>';
        body += list.length ? '<ul class="rows">' + list.map(function (d) {
          return '<li><button type="button" class="row pick" data-act="pick-dish" data-id="' + d.id + '">' + H.ui.tile(d, 'sm') +
            '<span class="row-main"><strong>' + esc(d.name) + '</strong><small>' + esc(d.kind) + ' · ' + U.vnd(d.cost) + (d.time ? ' · ' + d.time + ' phút' : '') + '</small></span>' +
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
            '<section class="fgroup"><h3>Giao diện</h3><div class="chips">' +
            H.ui.chip(H.icon('sparkle', { size: 16 }) + ' Theo thiết bị', t === 'auto', 'set-theme', { v: 'auto' }) +
            H.ui.chip(H.icon('sun', { size: 16 }) + ' Sáng', t === 'light', 'set-theme', { v: 'light' }) +
            H.ui.chip(H.icon('moon', { size: 16 }) + ' Tối', t === 'dark', 'set-theme', { v: 'dark' }) + '</div></section>' +
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
  H.openWelcome = function () {
    filterCtx = 'home';
    H.sheet.open({
      title: 'Chào bạn!',
      cls: 'overlay-welcome',
      dismissible: false,
      right: '<button type="button" class="sheet-link" data-act="welcome-skip">Bỏ qua</button>',
      render: function () {
        var p = H.state.profile;
        return {
          body:
            '<div class="welcome-hero">' + H.mascot({ size: 84 }) +
            '<p>Mình là <strong>Bé Cháo</strong>. Cho mình biết dạ dày bạn đang thế nào để mình chọn món vừa sức nhé.</p></div>' +
            '<section class="fgroup"><h3>Hiện giờ bạn thấy sao?</h3>' + optCards(H.STAGES.map(function (s) { return { id: s.id, name: s.name, emoji: s.emoji, desc: s.desc }; }), p.stage, 'set-stage') + acuteNote(p) + '</section>' +
            '<section class="fgroup"><h3>Mức độ</h3><div class="chips cols-3">' + H.SEVERITIES.map(function (s) {
              return H.ui.chip(esc(s.name) + '<small>' + esc(s.desc) + '</small>', p.severity === s.id, 'set-sev', { v: s.id }, 'chip-2l');
            }).join('') + '</div></section>' +
            '<section class="fgroup"><h3>Phòng trọ của bạn có</h3><div class="chips">' + H.TOOLS.map(function (t) {
              return H.ui.chip(t.emoji + ' ' + t.name, p.tools.indexOf(t.id) >= 0, 'toggle-tool', { v: t.id });
            }).join('') + '</div></section>' +
            '<p class="hint"><strong>Lưu ý:</strong> đây là gợi ý tham khảo, không thay thế bác sĩ. Nếu nôn ra máu, đi ngoài phân đen hoặc đau dữ dội, hãy đi khám ngay.</p>',
          foot: '<button type="button" class="btn btn-primary btn-block btn-lg" data-act="welcome-done" data-autofocus>Bắt đầu chọn món</button>'
        };
      }
    });
  };
  H.actions['welcome-done'] = function () { H.state.onboarded = true; H.save(); H.sheet.closeAll(); H.ui.result = null; H.render(); };
  H.actions['welcome-skip'] = H.actions['welcome-done'];
})(window.HNAG = window.HNAG || {});
