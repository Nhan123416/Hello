/*
 * Nhật ký ăn uống, gộp vào màn Thực đơn thay vì làm một mục riêng:
 *  - dòng cảm nhận ngay dưới từng bữa đã ăn (bốn nút cảm giác + nhận xét ngắn),
 *  - hộp ghi chi tiết (triệu chứng, món đã ăn) và ghi bữa ngoài thực đơn,
 *  - phần "Nhìn lại tuần": các bữa đã ăn trong tuần, tỷ lệ thấy ổn, món hợp và món nên cẩn thận.
 * Dữ liệu vẫn là H.state.diary (mỗi bữa một mục) nên lời nhắc "bụng bạn thấy sao?" ghi vào cùng chỗ.
 */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;
  var D = H.diary = {};

  function slotInfo(id) { return id === 'khac' ? { id: 'khac', label: 'Lúc khác', short: 'Khác', emoji: '🍽️' } : H.SLOTS.filter(function (s) { return s.id === id; })[0]; }
  function feelInfo(n) { return H.FEELS.filter(function (f) { return f.id === n; })[0]; }
  function dayName(iso) {
    var t = H.today();
    if (iso === t) return 'Hôm nay';
    if (iso === U.iso(U.addDays(U.parse(t), -1))) return 'Hôm qua';
    var d = U.parse(iso);
    return U.WD_LONG[d.getDay()] + ' ' + U.fmtDM(d);
  }
  function refocus(sel) { var el = document.querySelector(sel); if (el) el.focus({ preventScroll: true }); }

  // ───────────── dòng cảm nhận dưới từng bữa ─────────────
  // Chỉ hiện khi bữa đã ăn (đã đánh dấu) hoặc đã có mục nhật ký. Chọn cảm giác xong thì hiện ô nhận xét ngắn.
  D.feelLine = function (date, slot) {
    var e = H.diaryFor(date, slot);
    if (!H.isEaten(date, slot) && !e) return '';
    var d = ' data-date="' + date + '" data-slot="' + slot + '"', qid = 'flq-' + date + '-' + slot;
    var h = '<div class="feelline' + (e ? ' f' + e.feel : '') + '"><div class="fl-row"><span class="fl-q" id="' + qid + '">Bụng bạn thấy sao?</span>' +
      '<div class="fl-btns" role="radiogroup" aria-labelledby="' + qid + '">' + H.FEELS.map(function (f) {
        return '<button type="button" class="fl-b" role="radio" aria-checked="' + !!(e && e.feel === f.id) + '" data-act="meal-feel"' + d + ' data-v="' + f.id + '" aria-label="' + esc(f.label) + '" title="' + esc(f.label) + '">' + f.emoji + '</button>';
      }).join('') + '</div></div>';
    if (e) {
      h += '<div class="fl-more"><input class="input fl-note" type="text" maxlength="200" placeholder="Nhận xét ngắn…" value="' + esc(e.note) + '" data-input="meal-note"' + d + ' aria-label="Nhận xét sau bữa ăn" autocomplete="off">' +
        '<button type="button" class="link-btn" data-act="diary-edit"' + d + '>' + (e.symptoms.length ? esc(e.symptoms.join(', ')) : 'Triệu chứng') + '</button></div>';
    }
    return h + '</div>';
  };

  H.actions['meal-feel'] = function (el) {
    var date = el.dataset.date, slot = el.dataset.slot, feel = Number(el.dataset.v);
    if (!H.setMealFeel(date, slot, feel)) return;
    H.toast('Đã ghi: ' + feelInfo(feel).label.toLowerCase(), { icon: 'check' });
    H.render({ keepScroll: true });
    refocus('[data-act="meal-feel"][data-date="' + date + '"][data-slot="' + slot + '"][data-v="' + feel + '"]');
  };
  H.inputs['meal-note'] = function (el) { H.setMealNote(el.dataset.date, el.dataset.slot, el.value); };
  H.actions['diary-edit'] = function (el) { D.openForm(el.dataset.date, el.dataset.slot, false); };
  H.actions['diary-other'] = function () { D.openForm(H.today(), H.autoMeal(H.now()), true); };

  // ───────────── nhìn lại tuần ─────────────
  function reviewItem(r) {
    var d = H.DISH_BY_ID[r.id], f = r.feel ? feelInfo(r.feel) : null, day = U.parse(r.date);
    return '<li class="rv-item' + (r.feel ? ' f' + r.feel : '') + '"><a href="#dish-' + d.id + '">' + H.ui.tile(d, 'xs') +
      '<span class="rv-t"><strong>' + esc(d.name) + '</strong><small>' + U.WD_SHORT[day.getDay()] + ' · ' + esc(slotInfo(r.slot).short) + '</small></span></a>' +
      '<span class="rv-f" title="' + (f ? esc(f.label) : 'Chưa ghi cảm giác') + '"><span aria-hidden="true">' + (f ? f.emoji : '·') + '</span><span class="sr-only">' + (f ? esc(f.label) : 'chưa ghi cảm giác') + '</span></span></li>';
  }
  function names(list) {
    return list.slice(0, 3).map(function (r) { var d = H.DISH_BY_ID[r.id]; return '<a href="#dish-' + d.id + '">' + esc(d.name) + '</a>'; }).join(', ');
  }

  D.reviewHtml = function (start) {
    var r = H.weekReview(start), st = H.diaryStats(30);
    var h = '<section class="review" aria-labelledby="rv-t"><div class="rv-head"><h2 id="rv-t">' + H.icon('book2', { size: 18 }) + 'Nhìn lại tuần</h2>' +
      '<button type="button" class="link-btn" data-act="diary-other">+ Ghi bữa khác</button></div>';
    if (!r.eaten) {
      h += '<p class="hint">Chưa có bữa nào được đánh dấu đã ăn. Bấm dấu ✓ ở mỗi bữa khi ăn xong, rồi chọn cảm giác ngay bên dưới để mình tìm ra món hợp với bạn.</p>';
    } else {
      h += '<p class="rv-sum">Đã ăn <b>' + r.eaten + '/' + r.planned + '</b> bữa' +
        (r.logged ? ' · <b>' + r.good + '</b> thấy ổn' + (r.bad ? ' · <b>' + r.bad + '</b> khó chịu' : '') : '') +
        (r.eaten > r.logged ? ' · ' + (r.eaten - r.logged) + ' bữa chưa ghi cảm giác' : '') + '</p>' +
        '<ul class="rv-list" aria-label="Các bữa đã ăn trong tuần">' + r.rows.map(reviewItem).join('') + '</ul>';
    }
    if (st.watch.length) h += '<p class="rv-ins warn"><b>Nên cẩn thận:</b> ' + names(st.watch) + '</p>';
    if (st.safe.length) h += '<p class="rv-ins good"><b>Hợp với bạn:</b> ' + names(st.safe) + '</p>';
    if (st.watch.length || st.safe.length) h += '<p class="hint">Thống kê từ nhật ký 30 ngày của bạn, mỗi món cần ăn ít nhất 2 lần. Mỗi người một cơ địa, đây chưa phải kết luận y khoa.</p>';
    return h + '</section>';
  };

  // ───────────── hộp ghi chi tiết ─────────────
  var dd = null;   // bản nháp: { date, slot, feel, symptoms, dishes, note, touched, pickDate, free }

  function prefill() {
    if (dd.touched || dd.slot === 'khac') return;
    var id = H.getMeal(dd.date, dd.slot);
    dd.dishes = id ? [id] : [];
    var old = H.diaryFor(dd.date, dd.slot);
    if (old) { dd.feel = old.feel; dd.symptoms = old.symptoms.slice(); dd.note = old.note; if (old.dishes.length) dd.dishes = old.dishes.slice(); }
  }
  function reset() { dd.touched = false; dd.feel = 0; dd.symptoms = []; dd.note = ''; prefill(); }

  function formBody() {
    var t = H.today(), yest = U.iso(U.addDays(U.parse(t), -1));
    var h = '';
    if (dd.free) {
      h += '<div class="label">Ngày</div><div class="chips" role="group" aria-label="Ngày">' +
        H.ui.chip('Hôm nay', dd.date === t && !dd.pickDate, 'dy-date', { v: t }) +
        H.ui.chip('Hôm qua', dd.date === yest && !dd.pickDate, 'dy-date', { v: yest }) +
        H.ui.chip('Chọn ngày khác', dd.pickDate, 'dy-pick') + '</div>' +
        (dd.pickDate ? '<input id="dy-date" class="input dy-date-in" type="date" max="' + t + '" value="' + esc(dd.date) + '" data-input="dy-date" aria-label="Chọn ngày">' : '') +
        '<div class="label">Bữa</div><div class="chips" role="group" aria-label="Bữa">' + H.SLOTS.concat([slotInfo('khac')]).map(function (s) {
          return H.ui.chip((s.emoji ? s.emoji + ' ' : '') + esc(s.short), dd.slot === s.id, 'dy-slot', { v: s.id });
        }).join('') + '</div>';
    } else {
      h += '<p class="dy-ctx">' + esc(dayName(dd.date)) + ' · ' + esc(slotInfo(dd.slot).label) + '</p>';
    }
    h += '<div class="label">Đã ăn món gì <small>(chạm vào món để bỏ)</small></div><div class="chips dy-dishes">' +
      dd.dishes.map(function (id) {
        var d = H.DISH_BY_ID[id];
        return '<button type="button" class="chip dy-dish" data-act="dy-dish-rm" data-id="' + id + '" aria-label="Bỏ ' + esc(d.name) + '">' + d.emoji + ' ' + esc(d.name) + H.icon('x', { size: 12, stroke: 3 }) + '</button>';
      }).join('') + (dd.dishes.length < 4 ? '<button type="button" class="chip" data-act="dy-dish-add">' + H.icon('plus', { size: 14, stroke: 3 }) + 'Thêm món</button>' : '') + '</div>' +
      '<div class="label" id="dy-feel-l">Bụng bạn thấy sao?</div><div class="feelbar" role="radiogroup" aria-labelledby="dy-feel-l">' + H.FEELS.map(function (f) {
        return '<button type="button" class="feel-btn" role="radio" aria-checked="' + (dd.feel === f.id) + '" data-act="dy-feel" data-v="' + f.id + '"><span aria-hidden="true">' + f.emoji + '</span><small>' + esc(f.label) + '</small></button>';
      }).join('') + '</div>' +
      '<div class="label">Có triệu chứng nào không? <small>(chọn nhiều được)</small></div><div class="chips" role="group" aria-label="Triệu chứng">' + H.SYMPTOMS.map(function (name) {
        return H.ui.chip(esc(name), dd.symptoms.indexOf(name) >= 0, 'dy-sym', { v: name });
      }).join('') + '</div>' +
      '<label class="label" for="dy-note">Nhận xét <small>(không bắt buộc)</small></label>' +
      '<textarea id="dy-note" class="textarea" rows="2" maxlength="200" placeholder="VD: ăn xong 30 phút thì hơi ợ chua" data-input="dy-note">' + esc(dd.note) + '</textarea>';
    return h;
  }
  function formFoot() {
    var old = dd.slot !== 'khac' ? H.diaryFor(dd.date, dd.slot) : null;
    return '<div class="foot-actions">' + (old ? '<button type="button" class="btn btn-ghost btn-danger-ghost" data-act="dy-del" data-id="' + esc(old.id) + '">' + H.icon('trash', { size: 16 }) + 'Xoá</button>' : '') +
      '<button type="button" class="btn btn-primary" data-act="dy-save" data-autofocus>' + H.icon('check', { size: 18, stroke: 3 }) + 'Lưu</button></div>';
  }

  // free = true: ghi một bữa ngoài thực đơn (chọn ngày, bữa, món). Ngược lại là một bữa trong thực đơn.
  D.openForm = function (date, slot, free) {
    dd = { date: date, slot: slot, feel: 0, symptoms: [], dishes: [], note: '', touched: false, pickDate: false, free: !!free };
    prefill();
    var rec = H.sheet.open({
      title: free ? 'Ghi bữa ăn khác' : 'Cảm nhận sau bữa ăn',
      render: function () { return { body: formBody(), foot: formFoot() }; },
      onClose: function () { H.render({ keepScroll: true }); }
    });
    rec.isDiary = true;
  };

  H.actions['dy-date'] = function (el) { dd.date = el.dataset.v; dd.pickDate = false; reset(); H.sheet.refresh(); };
  H.actions['dy-pick'] = function () { dd.pickDate = true; H.sheet.refresh(); };
  H.inputs['dy-date'] = function (el) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(el.value) || el.value > H.today()) return;
    dd.date = el.value; reset();
    H.sheet.refresh();
    var again = document.getElementById('dy-date'); if (again) again.focus();
  };
  H.actions['dy-slot'] = function (el) { dd.slot = el.dataset.v; reset(); H.sheet.refresh(); };
  H.actions['dy-feel'] = function (el) { dd.feel = Number(el.dataset.v); H.sheet.refresh(); };
  H.actions['dy-sym'] = function (el) {
    var i = dd.symptoms.indexOf(el.dataset.v);
    if (i >= 0) dd.symptoms.splice(i, 1); else dd.symptoms.push(el.dataset.v);
    H.sheet.refresh();
  };
  H.inputs['dy-note'] = function (el) { dd.note = el.value; };
  H.actions['dy-dish-rm'] = function (el) { dd.dishes = dd.dishes.filter(function (id) { return id !== el.dataset.id; }); dd.touched = true; H.sheet.refresh(); };
  H.actions['dy-dish-add'] = function () {
    var q = '';
    H.sheet.open({
      title: 'Thêm món đã ăn',
      render: function () {
        var list = H.DISHES.filter(function (d) { return dd.dishes.indexOf(d.id) < 0 && U.searchMatch(d.searchRaw, d.searchText, q); });
        // món trong kế hoạch hôm đó và món hay chốt lên đầu
        var planned = {};
        H.slotsOn().forEach(function (s) { var id = H.getMeal(dd.date, s); if (id) planned[id] = 1; });
        list.sort(function (a, b) { return (planned[b.id] ? 1 : 0) - (planned[a.id] ? 1 : 0) || (H.state.picks[b.id] || 0) - (H.state.picks[a.id] || 0) || a.name.localeCompare(b.name, 'vi'); });
        return {
          body: '<div class="search"><span class="search-ic">' + H.icon('search', { size: 18 }) + '</span><input id="dy-q" type="search" placeholder="Tìm món…" autocomplete="off" value="' + esc(q) + '" data-input="dy-q" aria-label="Tìm món"></div>' +
            (list.length ? '<ul class="rows">' + list.map(function (d) {
              return '<li><button type="button" class="row pick" data-act="dy-dish-pick" data-id="' + d.id + '">' + H.ui.tile(d, 'sm') + '<span class="row-main"><strong>' + esc(d.name) + '</strong><small>' + esc(d.kind) + (planned[d.id] ? ' · đang trong kế hoạch hôm đó' : '') + '</small></span></button></li>';
            }).join('') + '</ul>' : H.ui.empty({ title: 'Không có món phù hợp', text: 'Thử từ khoá khác nhé.' }))
        };
      },
      onOpen: function (rec) { rec.dyQuery = function (v) { q = v; var pos = U.$('#dy-q', rec.el).selectionStart; rec.refresh(); var a = U.$('#dy-q', rec.el); if (a) { a.focus(); try { a.setSelectionRange(pos, pos); } catch (e) { /* bỏ qua */ } } }; },
      onClose: function () { H.sheet.refresh(); }
    });
  };
  H.inputs['dy-q'] = function (el) { var t = H.sheet.top(); if (t && t.dyQuery) t.dyQuery(el.value); };
  H.actions['dy-dish-pick'] = function (el) {
    if (dd.dishes.length < 4 && dd.dishes.indexOf(el.dataset.id) < 0) dd.dishes.push(el.dataset.id);
    dd.touched = true;
    H.sheet.close();
  };
  H.actions['dy-save'] = function () {
    if (!dd.feel) { H.toast('Hãy chọn cảm giác của bạn trước nhé', { icon: 'info' }); return; }
    var e = H.addDiary({ date: dd.date, slot: dd.slot, feel: dd.feel, symptoms: dd.symptoms, dishes: dd.dishes, note: dd.note.trim() });
    if (!e) { H.toast('Chưa lưu được, hãy kiểm tra lại ngày và bữa', { icon: 'info' }); return; }
    H.toast('Đã lưu cảm nhận', { icon: 'check' });
    H.sheet.close();
  };
  H.actions['dy-del'] = function (el) {
    var id = el.dataset.id;
    H.confirm({ title: 'Xoá cảm nhận này?', text: 'Mục này sẽ bị xoá khỏi thiết bị.', ok: 'Xoá', danger: true,
      onOk: function () { H.deleteDiary(id); H.sheet.closeAll(); } });
  };
})(window.HNAG = window.HNAG || {});
