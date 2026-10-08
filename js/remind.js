/*
 * Lời nhắc ăn đúng giờ.
 *
 * Lịch nhắc không được lưu mà luôn tính lại từ thực đơn và giờ ăn của bạn (H.remind.events). Chỉ có nhật ký
 * "đã hiện / đã hẹn lại / đã xong" (state.remindLog) và các lần bấm "Đã ăn" (state.ate) được lưu.
 *
 * Giới hạn cần nói thật: trang web chỉ tự nhắc được khi tab đang mở (hoặc đang chạy nền). Khi đóng hẳn trình duyệt
 * cần có máy chủ đẩy thông báo thì mới nhắc được, nên mình có thêm nút xuất file lịch .ics: điện thoại sẽ tự nhắc
 * kể cả khi không mở trang.
 */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;
  var R = H.remind = {};

  var WINDOW = 30 * 60000;       // quá 30 phút kể từ giờ nhắc mà chưa hiện thì coi như lỡ, không bật hộp nhắc nữa
  var FIRST_WINDOW = 10 * 60000; // lần kiểm tra đầu tiên khi vừa mở trang: chỉ nhắc nếu mới trễ tối đa 10 phút (trễ hơn thì để thẻ ở trang chủ hỏi)
  var firstDone = false;
  var SNOOZE = 10 * 60000;       // "nhắc lại sau" 10 phút
  var OVERDUE = 3 * 3600000;     // thẻ trang chủ còn hỏi "bạn ăn chưa" trong 3 giờ sau giờ ăn
  var ON_TIME = 30;              // lệch không quá 30 phút so với giờ ăn thì tính là đúng giờ

  var TYPES = {
    shop: { emoji: '🛒', name: 'Đi chợ' },
    prep: { emoji: '🥕', name: 'Chuẩn bị nguyên liệu' },
    cook: { emoji: '🍳', name: 'Bắt đầu nấu' },
    eat: { emoji: '🍽️', name: 'Giờ ăn' },
    feel: { emoji: '📝', name: 'Ghi nhật ký' }
  };
  var FEEL_DELAY = 45 * 60000;   // hỏi "bụng bạn thấy sao" sau khi bấm "Đã ăn" khoảng 45 phút
  R.TYPES = TYPES;

  function slotInfo(id) { return H.SLOTS.filter(function (s) { return s.id === id; })[0]; }
  function toMin(hhmm) { var m = /^(\d{2}):(\d{2})$/.exec(hhmm || ''); return m ? +m[1] * 60 + +m[2] : null; }
  function fmtMin(min) { min = ((Math.round(min) % 1440) + 1440) % 1440; return U.pad2(Math.floor(min / 60)) + ':' + U.pad2(min % 60); }
  function atOf(dateISO, min) { var d = U.parse(dateISO); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, Math.round(min), 0, 0); }
  function weekKeyOf(dateISO) { return U.iso(U.weekStart(U.parse(dateISO))); }
  R.toMin = toMin; R.fmtMin = fmtMin;
  R.timeOf = function (slot) { return H.state.remind.times[slot]; };

  // "25 phút", "1 giờ 5 phút"
  R.fmtSpan = function (ms) {
    var m = Math.max(0, Math.round(ms / 60000));
    if (m < 1) return 'dưới 1 phút';
    if (m < 60) return m + ' phút';
    var h = Math.floor(m / 60), r = m % 60;
    return h + ' giờ' + (r ? ' ' + r + ' phút' : '');
  };

  // ───────────── tính lịch nhắc ─────────────
  // Nguyên liệu (không tính đồ có sẵn trong bếp) còn thiếu cho các bữa nấu tại nhà chưa nấu của một ngày,
  // sau khi trừ lượng đang có trong tủ lạnh.
  R.needsFor = function (dateISO) {
    var need = {}, meals = 0, wk = weekKeyOf(dateISO);
    H.slotsOn().forEach(function (slot) {
      var id = H.getMeal(dateISO, slot), d = id && H.DISH_BY_ID[id];
      if (!d || d.mode !== 'home' || H.state.cooked[dateISO + ':' + slot]) return;
      meals++;
      d.ing.forEach(function (p) {
        if (H.INGREDIENTS[p[0]].staple) return;
        need[p[0]] = (need[p[0]] || 0) + p[1];
      });
    });
    var miss = {}, cost = 0;
    Object.keys(need).forEach(function (id) {
      if (H.state.bought[wk + ':' + id] === true) return;        // bản cũ chỉ tick "đã mua", không có số lượng
      var gap = need[id] - H.usableStock(id);
      if (gap > 1e-9) { miss[id] = gap; cost += gap * H.INGREDIENTS[id].price; }
    });
    return { ids: Object.keys(miss), qty: miss, cost: Math.max(0, Math.round(cost / 500) * 500), meals: meals };
  };

  // Các lời nhắc của một ngày. all = true bỏ qua việc bật tắt từng loại (dùng cho thẻ thông tin ở trang chủ).
  R.events = function (dateISO, all) {
    var rm = H.state.remind, out = [];
    function push(slot, type, min, d) {
      out.push({ key: dateISO + ':' + slot + ':' + type, date: dateISO, slot: slot, type: type, min: min, at: atOf(dateISO, min), dish: d || null });
    }
    H.slotsOn().forEach(function (slot) {
      var eatMin = toMin(rm.times[slot]);
      if (eatMin == null) return;
      var id = H.getMeal(dateISO, slot), d = id ? H.DISH_BY_ID[id] : null;
      if (d && d.mode === 'home') {
        var noCook = d.tools.indexOf('khong') >= 0;
        var cookT = noCook ? 0 : Math.max(5, d.time || 10);
        if (cookT > 0 && (all || rm.kinds.cook)) push(slot, 'cook', eatMin - cookT, d);
        if (all || rm.kinds.prep) push(slot, 'prep', eatMin - cookT - (noCook ? 5 : rm.prepLead), d);
      }
      if (all || rm.kinds.eat) push(slot, 'eat', eatMin, d);
    });
    // Sau khi ăn khoảng 45 phút: hỏi cảm giác để ghi nhật ký (chỉ khi đã bấm "Đã ăn" và chưa có mục nhật ký của bữa đó).
    H.slotsOn().forEach(function (slot) {
      var a = H.state.ate[dateISO + ':' + slot];
      if (!a || !(all || rm.kinds.feel) || H.diaryFor(dateISO, slot)) return;
      var at = new Date(a.t + FEEL_DELAY), id = H.getMeal(dateISO, slot);
      out.push({ key: dateISO + ':' + slot + ':feel', date: dateISO, slot: slot, type: 'feel', min: Math.round((+at - +atOf(dateISO, 0)) / 60000), at: at, dish: id ? H.DISH_BY_ID[id] : null });
    });
    if (all || rm.kinds.shop) {
      var tomorrow = U.iso(U.addDays(U.parse(dateISO), 1));
      var need = R.needsFor(tomorrow), shopMin = toMin(rm.shopAt);
      if (need.ids.length && shopMin != null) {
        out.push({ key: dateISO + ':all:shop', date: dateISO, slot: 'all', type: 'shop', min: shopMin, at: atOf(dateISO, shopMin), dish: null, need: need, forDate: tomorrow });
      }
    }
    return out.sort(function (a, b) { return a.at - b.at || a.min - b.min; });
  };

  // Lời nhắc dạng chữ.
  R.describe = function (e) {
    var s = e.slot !== 'all' ? slotInfo(e.slot) : null, d = e.dish;
    if (e.type === 'shop') {
      var names = e.need.ids.slice(0, 4).map(function (id) { return H.INGREDIENTS[id].name.split(' (')[0]; });
      return { emoji: '🛒', title: 'Mai cần đi chợ',
        body: 'Còn thiếu ' + e.need.ids.length + ' nguyên liệu cho ' + e.need.meals + ' bữa ngày mai: ' + names.join(', ') + (e.need.ids.length > 4 ? '…' : '') + ' (khoảng ' + U.vnd(e.need.cost) + ').' };
    }
    var at = fmtMin(toMin(H.state.remind.times[e.slot]));
    if (e.type === 'feel') {
      return { emoji: '📝', title: 'Bụng bạn thấy sao?', body: 'Sau ' + s.label.toLowerCase() + (d ? ' (' + d.name + ')' : '') + ' khoảng 45 phút. Ghi lại để mình biết món nào hợp với bạn.' };
    }
    if (e.type === 'prep') {
      return { emoji: '🥕', title: 'Chuẩn bị nguyên liệu', body: d.name + ' cho ' + s.label.toLowerCase() + ' lúc ' + at + '. Lấy nguyên liệu ra, rửa và sơ chế trước khi nấu.' };
    }
    if (e.type === 'cook') {
      return { emoji: '🍳', title: 'Đến giờ nấu', body: d.name + ' cần khoảng ' + (d.time || 10) + ' phút để kịp ' + s.label.toLowerCase() + ' lúc ' + at + '.' };
    }
    return { emoji: s.emoji, title: 'Đến giờ ăn ' + s.label.toLowerCase(),
      body: d ? 'Hôm nay: ' + d.name + '.' : 'Hôm nay chưa chọn món cho ' + s.label.toLowerCase() + '. Quay vòng quay để chọn nhanh nhé.' };
  };

  // ───────────── nhật ký nhắc & "đã ăn" ─────────────
  function setLog(key, patch) {
    var L = H.state.remindLog;
    L[key] = Object.assign(L[key] || {}, patch);
    H.save();
  }
  R.logOf = function (key) { return H.state.remindLog[key] || null; };

  R.ateOf = function (date, slot) { return H.state.ate[date + ':' + slot] || null; };

  R.markAte = function (date, slot) {
    var S = H.state, k = date + ':' + slot, now = H.now();
    var late = Math.round((+now - +atOf(date, toMin(S.remind.times[slot]))) / 60000);
    S.ate[k] = { t: +now, late: date === U.iso(now) && Math.abs(late) <= 360 ? late : null };
    var id = H.getMeal(date, slot), d = id && H.DISH_BY_ID[id];
    if (d && d.mode === 'home') H.setCooked(date, slot, true);   // ăn rồi nghĩa là đã nấu: trừ nguyên liệu khỏi tủ lạnh
    ['prep', 'cook', 'eat'].forEach(function (t) {
      var key = date + ':' + slot + ':' + t;
      S.remindLog[key] = Object.assign(S.remindLog[key] || {}, { d: 1 });
    });
    H.save();
    if (H.afterAte) H.afterAte(date, slot);
    return S.ate[k];
  };
  R.unmarkAte = function (date, slot) {
    var S = H.state;
    delete S.ate[date + ':' + slot];
    var key = date + ':' + slot + ':eat';
    if (S.remindLog[key]) { delete S.remindLog[key].d; delete S.remindLog[key].skip; }
    H.save();
  };
  R.isOnTime = function (a) { return !!a && a.late != null && Math.abs(a.late) <= ON_TIME; };

  // Tóm tắt một ngày: số bữa đã đến giờ, số bữa đã ăn, số bữa đúng giờ.
  R.daySummary = function (dateISO) {
    var now = H.now(), nowMs = +now, today = U.iso(now);
    var due = 0, ate = 0, onTime = 0, total = 0;
    H.slotsOn().forEach(function (slot) {
      total++;
      var passed = dateISO < today || (dateISO === today && nowMs >= +atOf(dateISO, toMin(H.state.remind.times[slot])));
      var a = R.ateOf(dateISO, slot);
      if (passed) due++;
      if (a) { ate++; if (R.isOnTime(a)) onTime++; }
    });
    return { due: due, ate: ate, onTime: onTime, total: total };
  };

  // ───────────── bộ hẹn giờ ─────────────
  var alarm = null;          // hộp nhắc đang mở: { e, rec, preview }
  var pending = [];          // hộp nhắc đang chờ đến lượt
  var waiting = [];          // lời nhắc đến lúc tab đang ẩn, hiện khi quay lại
  var baseTitle = '';

  // Các lời nhắc đang đến hạn (chưa hiện, hoặc đã hẹn lại và hết giờ hẹn).
  R.due = function () {
    var rm = H.state.remind;
    if (!rm.on || !H.state.onboarded) return [];
    var now = H.now(), nowMs = +now, S = H.state, out = [];
    var win = firstDone ? WINDOW : FIRST_WINDOW, first = !firstDone;
    firstDone = true;
    [-1, 0, 1].forEach(function (off) {
      var date = U.iso(U.addDays(now, off));
      R.events(date).forEach(function (e) {
        var log = S.remindLog[e.key], t = +e.at;
        if (log && log.d) return;
        if (e.slot !== 'all' && e.type !== 'feel') {
          if (S.ate[e.date + ':' + e.slot]) return;                         // bữa này ăn rồi
          if (e.type !== 'eat' && S.cooked[e.date + ':' + e.slot]) return; // nấu rồi thì khỏi nhắc nấu
        }
        if (log && log.z) { if (nowMs >= log.z) out.push(e); return; }
        if (log && log.s) return;                                          // đã hiện, người dùng không hẹn lại
        if (nowMs >= t && nowMs - t <= win) out.push(e);
        // Vừa mở trang mà lời nhắc đã trễ hơn 10 phút: coi như lỡ hẳn để lần kiểm tra sau không bật lên muộn màng.
        else if (first && nowMs >= t && nowMs - t <= WINDOW) setLog(e.key, { d: 1, miss: 1, z: 0 });
      });
    });
    return out.sort(function (a, b) { return a.at - b.at; });
  };

  R.tick = function () {
    R.refreshCard();
    var due = R.due();
    // Cùng một bữa mà nhiều bước cùng đến hạn (mở trang muộn): chỉ nhắc bước muộn nhất, các bước trước coi như đã qua.
    var rank = { shop: 0, prep: 1, cook: 2, eat: 3, feel: 4 }, best = {};
    due.forEach(function (e) {
      var g = e.date + ':' + e.slot;
      if (!best[g] || rank[e.type] > rank[best[g].type]) best[g] = e;
    });
    due = due.filter(function (e) {
      if (best[e.date + ':' + e.slot] === e) return true;
      setLog(e.key, { d: 1, auto: 1, z: 0 });
      return false;
    });
    due.forEach(function (e) {
      if (pending.some(function (p) { return p.key === e.key; }) || waiting.some(function (p) { return p.key === e.key; })) return;
      if (alarm && alarm.e.key === e.key) return;
      pending.push(e);
    });
    R.pump();
  };

  R.pump = function () {
    if (alarm || !pending.length) return;
    var e = pending.shift();
    setLog(e.key, { s: +H.now(), z: 0 });
    if (document.hidden) {
      R.systemNotify(e);
      waiting.push(e);
      R.pump();
      return;
    }
    R.openAlarm(e);
  };

  R.wake = function () {
    if (document.hidden) return;
    waiting.splice(0).forEach(function (e) { pending.push(e); });
    R.tick();
  };

  // Thông báo của trình duyệt (cần người dùng cho phép). Chỉ gửi khi tab đang ẩn, để khỏi nhắc hai lần.
  R.notifyState = function () {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;   // default | granted | denied
  };
  R.systemNotify = function (e) {
    var rm = H.state.remind;
    if (!rm.notify || R.notifyState() !== 'granted') return false;
    var info = R.describe(e);
    try {
      var n = new Notification(info.title, { body: info.body, tag: e.key, icon: 'assets/favicon.svg' });
      n.onclick = function () { try { window.focus(); } catch (x) { /* bỏ qua */ } n.close(); };
      return true;
    } catch (x) { return false; }
  };

  // Âm báo và rung chỉ chạy khi người dùng đã từng chạm vào trang (trình duyệt chặn nếu chưa).
  function activated() { return !!(navigator.userActivation && navigator.userActivation.hasBeenActive); }
  R.beep = function () {
    if (!activated()) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx = R.audio || (R.audio = new AC());
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      [0, 0.2, 0.4].forEach(function (dt, i) {
        var o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime + dt;
        o.type = 'sine'; o.frequency.value = i === 2 ? 988 : 784;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.17);
        o.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0 + 0.19);
      });
    } catch (x) { /* bỏ qua */ }
  };
  R.buzz = function () {
    if (!activated()) return;
    try { if (navigator.vibrate) navigator.vibrate([220, 100, 220]); } catch (x) { /* bỏ qua */ }
  };

  // ───────────── hộp nhắc ─────────────
  function tipFor(e) {
    var t = H.HABITS[U.hash(e.key) % H.HABITS.length];
    return t.emoji + ' ' + t.title + ': ' + t.text;
  }

  function alarmBody(e) {
    var info = R.describe(e), d = e.dish, s = e.slot !== 'all' ? slotInfo(e.slot) : null;
    var h = '<div class="alarm"><div class="alarm-e" aria-hidden="true">' + info.emoji + '</div>';
    if (s) h += '<p class="alarm-sub">' + esc(s.label) + ' · ' + fmtMin(toMin(H.state.remind.times[e.slot])) + '</p>';
    if (d) h += '<div class="alarm-dish">' + H.ui.tile(d, 'md') + '<strong>' + esc(d.name) + '</strong></div>';
    h += '<p class="alarm-text">' + esc(info.body) + '</p>';
    if (e.type === 'prep' && d) {
      h += '<ul class="alarm-ings">' + d.ing.filter(function (p) { return !H.INGREDIENTS[p[0]].staple; }).map(function (p) {
        var it = H.INGREDIENTS[p[0]];
        return '<li><span aria-hidden="true">' + it.emoji + '</span><span>' + esc(it.name) + '</span><b>' + U.fmtQty(p[1], it.unit) + '</b></li>';
      }).join('') + '</ul>';
    }
    if (e.type === 'shop') {
      h += '<ul class="alarm-ings">' + e.need.ids.slice(0, 8).map(function (id) {
        var it = H.INGREDIENTS[id];
        return '<li><span aria-hidden="true">' + it.emoji + '</span><span>' + esc(it.name) + '</span><b>' + U.fmtQty(e.need.qty[id], it.unit) + '</b></li>';
      }).join('') + '</ul>';
    }
    if (e.type === 'eat') h += '<p class="alarm-tip">' + esc(tipFor(e)) + '</p>';
    if (e.type === 'feel' && alarm && alarm.e.key === e.key && alarm.feelState) {
      h += '<p class="alarm-q">Bạn thấy triệu chứng nào không?</p><div class="chips alarm-sym" role="group" aria-label="Triệu chứng">' + H.SYMPTOMS.map(function (name) {
        return H.ui.chip(esc(name), alarm.feelState.symptoms.indexOf(name) >= 0, 'alarm-sym', { v: name });
      }).join('') + '</div>';
    }
    return h + '</div>';
  }

  function alarmFoot(e, preview) {
    var d = e.dish, k = ' data-key="' + esc(e.key) + '"' + (preview ? ' data-preview="1"' : '');
    var snooze = '<button type="button" class="btn btn-ghost" data-act="alarm-snooze"' + k + '>' + H.icon('clock', { size: 16 }) + 'Nhắc lại sau 10 phút</button>';
    if (e.type === 'eat') {
      return '<div class="alarm-foot">' +
        (d ? '' : '<a class="btn btn-soft" href="#home" data-act="alarm-go"' + k + '>' + H.icon('wheel', { size: 18 }) + 'Quay chọn món</a>') +
        '<button type="button" class="btn btn-primary btn-lg" data-act="alarm-eat" data-autofocus' + k + '>' + H.icon('check', { size: 18, stroke: 3 }) + 'Đã ăn xong</button>' +
        snooze + '<button type="button" class="btn btn-ghost" data-act="alarm-skip"' + k + '>Bỏ qua bữa này</button></div>';
    }
    if (e.type === 'feel') {
      if (alarm && alarm.e.key === e.key && alarm.feelState) {
        return '<div class="alarm-foot"><button type="button" class="btn btn-primary btn-lg" data-act="alarm-feel-save" data-autofocus' + k + '>' + H.icon('check', { size: 18, stroke: 3 }) + 'Lưu nhật ký</button></div>';
      }
      return '<div class="alarm-foot"><div class="feelbar" role="group" aria-label="Bụng bạn thấy sao">' + H.FEELS.map(function (f) {
        return '<button type="button" class="feel-btn" data-act="alarm-feel" data-v="' + f.id + '"' + k + '><span aria-hidden="true">' + f.emoji + '</span><small>' + esc(f.label) + '</small></button>';
      }).join('') + '</div>' + snooze + '<a class="link center" href="#community-diary" data-act="alarm-go"' + k + '>Mở nhật ký để ghi chi tiết</a></div>';
    }
    if (e.type === 'shop') {
      return '<div class="alarm-foot"><a class="btn btn-primary btn-lg" href="#plan-shop" data-act="alarm-go" data-autofocus' + k + '>' + H.icon('cart', { size: 18 }) + 'Xem danh sách đi chợ</a>' +
        snooze + '<button type="button" class="btn btn-ghost" data-act="alarm-done"' + k + '>Đã mua rồi</button></div>';
    }
    var go = H.views.cook ? '#cook-' + d.id : '#dish-' + d.id;
    return '<div class="alarm-foot"><a class="btn btn-primary btn-lg" href="' + go + '" data-act="alarm-go" data-autofocus' + k + '>' +
      H.icon(e.type === 'cook' ? 'flame' : 'book', { size: 18 }) + (e.type === 'cook' ? 'Bắt đầu nấu' : 'Xem công thức') + '</a>' +
      snooze + '<button type="button" class="btn btn-ghost" data-act="alarm-done"' + k + '>' + (e.type === 'prep' ? 'Đã chuẩn bị xong' : 'Đang nấu rồi') + '</button></div>';
  }

  R.openAlarm = function (e, preview) {
    var info = R.describe(e), rm = H.state.remind;
    baseTitle = document.title.replace(/^⏰ .*? · /, '');
    var rec = H.sheet.open({
      title: info.title,
      cls: 'overlay-dialog overlay-alarm',
      render: function () { return { body: alarmBody(e), foot: alarmFoot(e, preview) }; },
      onClose: function () {
        alarm = null;
        document.title = baseTitle;
        setTimeout(R.pump, 250);
      }
    });
    alarm = { e: e, rec: rec, preview: !!preview };
    document.title = '⏰ ' + info.title + ' · ' + baseTitle;
    if (rm.sound) R.beep();
    if (rm.vibrate) R.buzz();
    var live = document.getElementById('sr-live');
    if (live) live.textContent = info.title + '. ' + info.body;
  };

  function closeAlarm() { if (alarm) H.sheet.close(alarm.rec); }
  function keyOf(el) { return el.getAttribute('data-key'); }
  function isPreview(el) { return el.getAttribute('data-preview') === '1'; }
  function eventOf(key) {
    var p = key.split(':');
    var date = p[0], slot = p[1], type = p[2];
    return R.events(date, true).filter(function (e) { return e.slot === slot && e.type === type; })[0] || null;
  }

  H.actions['alarm-eat'] = function (el) {
    var key = keyOf(el), p = key.split(':');
    if (!isPreview(el)) {
      var a = R.markAte(p[0], p[1]);
      var s = slotInfo(p[1]);
      H.toast(R.isOnTime(a) ? 'Đúng giờ rồi, giỏi quá! Ăn chậm, nhai kỹ nhé.' : 'Đã ghi nhận ' + s.label.toLowerCase() + '. Ăn chậm, nhai kỹ nhé.', { icon: 'check' });
    }
    closeAlarm();
    H.render({ keepScroll: true });
  };
  H.actions['alarm-snooze'] = function (el) {
    if (!isPreview(el)) setLog(keyOf(el), { z: +H.now() + SNOOZE, d: 0 });
    H.toast('Mình nhắc lại sau 10 phút', { icon: 'clock' });
    closeAlarm();
  };
  H.actions['alarm-skip'] = function (el) {
    if (!isPreview(el)) setLog(keyOf(el), { d: 1, skip: 1, z: 0 });
    closeAlarm();
    H.render({ keepScroll: true });
  };
  H.actions['alarm-done'] = function (el) {
    if (!isPreview(el)) setLog(keyOf(el), { d: 1, z: 0 });
    closeAlarm();
  };
  H.actions['alarm-go'] = function (el) {
    if (!isPreview(el)) {
      var key = keyOf(el), p = key.split(':');
      // mở công thức / danh sách đi chợ coi như đã làm theo lời nhắc (riêng giờ ăn thì chưa tính là đã ăn)
      if (p[2] !== 'eat') setLog(key, { d: 1, z: 0 });
    }
    closeAlarm();   // đường dẫn của thẻ <a> vẫn được trình duyệt xử lý sau đó
  };

  function saveFeel(e, feel, syms) {
    H.addDiary({ date: e.date, slot: e.slot, feel: feel, symptoms: syms, dishes: e.dish ? [e.dish.id] : [], note: '' });
    setLog(e.key, { d: 1, z: 0 });
    H.toast('Đã ghi vào nhật ký', { icon: 'check' });
    closeAlarm();
    H.render({ keepScroll: true });
  }
  H.actions['alarm-feel'] = function (el) {
    if (!alarm || isPreview(el)) { closeAlarm(); return; }
    var v = Number(el.dataset.v);
    if (v >= 3) { alarm.feelState = { feel: v, symptoms: [] }; alarm.rec.refresh(); return; }
    saveFeel(alarm.e, v, []);
  };
  H.actions['alarm-sym'] = function (el) {
    if (!alarm || !alarm.feelState) return;
    var a = alarm.feelState.symptoms, i = a.indexOf(el.dataset.v);
    if (i >= 0) a.splice(i, 1); else a.push(el.dataset.v);
    alarm.rec.refresh();
  };
  H.actions['alarm-feel-save'] = function () {
    if (!alarm || !alarm.feelState) return;
    saveFeel(alarm.e, alarm.feelState.feel, alarm.feelState.symptoms);
  };

  // ───────────── thẻ "Giờ ăn kế tiếp" ở trang chủ ─────────────
  // Trả về { kind: 'off' | 'overdue' | 'next' | 'done' | 'empty', ... }
  R.nextUp = function () {
    var S = H.state, rm = S.remind, now = H.now(), nowMs = +now, today = U.iso(now);
    if (!rm.on) return { kind: 'off' };
    var todayEvents = R.events(today, true);
    // 1. quá giờ ăn mà chưa ăn (trong 3 giờ qua)
    var over = todayEvents.filter(function (e) {
      var log = S.remindLog[e.key];
      return e.type === 'eat' && +e.at <= nowMs && nowMs - +e.at <= OVERDUE && !S.ate[e.date + ':' + e.slot] && !(log && log.skip);
    });
    if (over.length) {
      var e = over[over.length - 1];
      return { kind: 'overdue', e: e, late: nowMs - +e.at };
    }
    // 2. lời nhắc sắp tới (hôm nay, rồi đến ngày mai)
    var tomorrow = U.iso(U.addDays(now, 1));
    var all = todayEvents.concat(R.events(tomorrow, true));
    var next = all.filter(function (e) {
      if (+e.at < nowMs) return false;
      if (e.slot !== 'all' && S.ate[e.date + ':' + e.slot]) return false;
      return true;
    })[0];
    if (next) return { kind: 'next', e: next, in: +next.at - nowMs, sameDay: next.date === today };
    return { kind: 'empty' };
  };

  R.cardHtml = function () {
    var u = R.nextUp(), S = H.state, now = H.now();
    var sum = R.daySummary(U.iso(now));
    var progress = '<span class="nu-prog">Hôm nay đã ăn <strong>' + sum.ate + '/' + sum.total + '</strong> bữa' + (sum.onTime ? ' · ' + sum.onTime + ' đúng giờ' : '') + '</span>';
    var link = '<a class="link" href="#plan-remind">Lịch nhắc ' + H.icon('chev-r', { size: 14 }) + '</a>';
    if (u.kind === 'off') {
      return '<div class="nextup off"><span class="nu-e" aria-hidden="true">⏰</span><div class="nu-main"><strong>Nhắc giờ ăn đang tắt</strong>' +
        '<p>Ăn đúng giờ rất quan trọng với dạ dày. Bật lên để mình nhắc đi chợ, chuẩn bị, nấu và ăn.</p></div>' +
        '<div class="nu-acts"><button type="button" class="btn btn-primary btn-sm" data-act="nextup-on">Bật nhắc giờ</button></div></div>';
    }
    if (u.kind === 'overdue') {
      var e = u.e, s = slotInfo(e.slot), d = e.dish;
      return '<div class="nextup overdue" role="status"><span class="nu-e" aria-hidden="true">' + s.emoji + '</span><div class="nu-main">' +
        '<strong>Đã quá giờ ' + esc(s.label.toLowerCase()) + ' ' + R.fmtSpan(u.late) + ' (' + fmtMin(e.min) + ')</strong>' +
        '<p>' + (d ? 'Hôm nay: ' + esc(d.name) + '. ' : 'Chưa chọn món. ') + 'Bạn ăn chưa? Đừng để bụng đói quá lâu.</p></div>' +
        '<div class="nu-acts"><button type="button" class="btn btn-primary btn-sm" data-act="nextup-ate" data-date="' + e.date + '" data-slot="' + e.slot + '">' + H.icon('check', { size: 15, stroke: 3 }) + 'Đã ăn</button>' +
        (d ? '' : '<button type="button" class="btn btn-soft btn-sm" data-act="spin">Quay chọn món</button>') +
        '<button type="button" class="btn btn-ghost btn-sm" data-act="nextup-skip" data-date="' + e.date + '" data-slot="' + e.slot + '">Bỏ qua</button></div>' +
        '<div class="nu-foot">' + progress + link + '</div></div>';
    }
    if (u.kind === 'next') {
      var n = u.e, ty = TYPES[n.type], when = fmtMin(n.min), ds = n.dish, sl = n.slot !== 'all' ? slotInfo(n.slot) : null;
      var what = n.type === 'eat' ? 'Đến giờ ăn ' + sl.label.toLowerCase()
        : n.type === 'shop' ? 'Đi chợ cho ngày mai'
        : n.type === 'feel' ? 'Ghi cảm giác sau ' + sl.label.toLowerCase()
        : ty.name + ' ' + ds.name;
      var sub = n.type === 'eat' ? (ds ? 'Món: ' + ds.name : 'Chưa chọn món cho bữa này')
        : n.type === 'shop' ? 'Còn thiếu ' + n.need.ids.length + ' nguyên liệu'
        : n.type === 'feel' ? (ds ? 'Sau món ' + ds.name : 'Bụng bạn thấy sao?')
        : sl.label + ' lúc ' + fmtMin(toMin(S.remind.times[n.slot])) + ' · ' + ds.name;
      return '<div class="nextup" role="status"><span class="nu-e" aria-hidden="true">' + ty.emoji + '</span><div class="nu-main">' +
        '<strong>' + (u.sameDay ? 'Còn ' + R.fmtSpan(u.in) : 'Ngày mai') + ': ' + esc(what) + ' <span class="nu-time">' + when + '</span></strong><p>' + esc(sub) + '</p></div>' +
        '<div class="nu-foot">' + progress + link + '</div></div>';
    }
    return '<div class="nextup"><span class="nu-e" aria-hidden="true">🌙</span><div class="nu-main"><strong>Hôm nay hết bữa rồi</strong>' +
      '<p>Chưa có lời nhắc nào sắp tới. Chọn món cho ngày mai để mình nhắc giờ nhé.</p></div><div class="nu-foot">' + progress + link + '</div></div>';
  };

  var lastCard = '';
  // Khung thẻ cho trang chủ (id="nextup" để bộ hẹn giờ cập nhật đếm ngược mà không vẽ lại cả trang).
  R.cardBox = function () {
    lastCard = R.cardHtml();
    return '<div id="nextup" class="nextup-box" aria-live="off">' + lastCard + '</div>';
  };
  R.refreshCard = function () {
    var box = document.getElementById('nextup');
    if (!box) { lastCard = ''; return; }
    var html = R.cardHtml();
    if (html === lastCard) return;
    lastCard = html;
    box.innerHTML = html;
  };

  H.actions['nextup-on'] = function () { H.state.remind.on = true; H.save(); H.toast('Đã bật nhắc giờ ăn', { icon: 'bell' }); H.render({ keepScroll: true }); R.tick(); };
  H.actions['nextup-ate'] = function (el) {
    var a = R.markAte(el.dataset.date, el.dataset.slot);
    H.toast(R.isOnTime(a) ? 'Đúng giờ rồi, giỏi quá!' : 'Đã ghi nhận bữa ăn. Ăn chậm, nhai kỹ nhé.', { icon: 'check' });
    H.render({ keepScroll: true });
  };
  H.actions['nextup-skip'] = function (el) {
    setLog(el.dataset.date + ':' + el.dataset.slot + ':eat', { d: 1, skip: 1, z: 0 });
    H.render({ keepScroll: true });
  };

  // ───────────── file lịch .ics ─────────────
  function icsText(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function localStamp(d) { return d.getFullYear() + U.pad2(d.getMonth() + 1) + U.pad2(d.getDate()) + 'T' + U.pad2(d.getHours()) + U.pad2(d.getMinutes()) + '00'; }
  function utcStamp(d) { return d.getUTCFullYear() + U.pad2(d.getUTCMonth() + 1) + U.pad2(d.getUTCDate()) + 'T' + U.pad2(d.getUTCHours()) + U.pad2(d.getUTCMinutes()) + U.pad2(d.getUTCSeconds()) + 'Z'; }
  // Một dòng iCalendar không quá 75 byte: dòng dài phải gập lại bằng CRLF + dấu cách.
  function fold(line) {
    var out = '', bytes = 0, enc = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
    Array.from(line).forEach(function (ch) {
      var n = enc ? enc.encode(ch).length : 1;
      if (bytes + n > 74) { out += '\r\n '; bytes = 1; }
      out += ch; bytes += n;
    });
    return out;
  }

  R.ics = function (days) {
    var now = H.now(), stamp = utcStamp(now);
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hom nay an gi//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'X-WR-CALNAME:' + icsText('Hôm nay ăn gì? Nhắc giờ ăn')];
    var n = 0;
    for (var i = 0; i < (days || 7); i++) {
      R.events(U.iso(U.addDays(now, i))).forEach(function (e) {
        if (+e.at < +now - 60000) return;   // lời nhắc đã qua thì bỏ
        var info = R.describe(e), dur = e.type === 'eat' ? 30 : 15;
        L.push('BEGIN:VEVENT',
          'UID:' + e.key.replace(/[^a-z0-9:-]/gi, '') + '@hom-nay-an-gi',
          'DTSTAMP:' + stamp,
          'DTSTART:' + localStamp(e.at),
          'DTEND:' + localStamp(new Date(+e.at + dur * 60000)),
          'SUMMARY:' + icsText(info.emoji + ' ' + info.title + (e.dish ? ': ' + e.dish.name : '')),
          'DESCRIPTION:' + icsText(info.body),
          'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsText(info.title), 'TRIGGER:PT0M', 'END:VALARM',
          'END:VEVENT');
        n++;
      });
    }
    L.push('END:VCALENDAR');
    return { text: L.map(fold).join('\r\n') + '\r\n', count: n };
  };

  // Trong khung xem artifact, trang không được tự tải file về (nút sẽ không làm gì), nên ẩn nút tải và chỉ dùng sao chép + Google Calendar.
  R.inViewer = function () { return !!(window.claude && typeof window.claude.use === 'function'); };

  // Liên kết tạo sự kiện lặp mỗi ngày đúng giờ ăn trên Google Calendar (mở tab mới, không cần tải file).
  R.gcalUrl = function (slot) {
    var s = slotInfo(slot), min = toMin(H.state.remind.times[slot]), now = H.now(), date = U.iso(now);
    if (+atOf(date, min) < +now) date = U.iso(U.addDays(now, 1));
    var start = atOf(date, min), end = new Date(+start + 30 * 60000);
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(s.emoji + ' Giờ ăn ' + s.label.toLowerCase()) +
      '&details=' + encodeURIComponent('Ăn đúng giờ, ăn chậm và nhai kỹ. Mở “Hôm nay ăn gì?” để xem món hôm nay.') +
      '&dates=' + localStamp(start) + '/' + localStamp(end) +
      '&recur=' + encodeURIComponent('RRULE:FREQ=DAILY');
  };

  R.download = function (name, text, mime) {
    try {
      var blob = new Blob([text], { type: mime });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name; a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      return true;
    } catch (x) { return false; }
  };

  // ───────────── tab "Nhắc giờ" trong Kế hoạch ─────────────
  function sw(on, act, extra, label) {
    return '<button type="button" class="switch" role="switch" aria-checked="' + !!on + '" data-act="' + act + '"' + (extra || '') + ' aria-label="' + esc(label) + '"><i></i></button>';
  }

  // Khoảng cách giữa các bữa: báo nếu quá xa hoặc quá gần nhau.
  function gapHtml() {
    var rm = H.state.remind;
    var list = H.slotsOn().map(function (s) { return { s: s, m: toMin(rm.times[s]) }; }).filter(function (x) { return x.m != null; })
      .sort(function (a, b) { return a.m - b.m; });
    if (list.length < 2) return '';
    var notes = [], tooFar = null, tooNear = null;
    for (var i = 0; i < list.length - 1; i++) {
      var gap = list[i + 1].m - list[i].m;
      if (gap > 300 && (!tooFar || gap > tooFar.gap)) tooFar = { a: list[i], b: list[i + 1], gap: gap };
      if (gap < 120 && (!tooNear || gap < tooNear.gap)) tooNear = { a: list[i], b: list[i + 1], gap: gap };
    }
    function name(x) { return slotInfo(x.s).label.toLowerCase(); }
    function span(min) { return R.fmtSpan(min * 60000); }
    if (tooFar) notes.push('Từ ' + name(tooFar.a) + ' đến ' + name(tooFar.b) + ' cách nhau ' + span(tooFar.gap) + ', hơi lâu và dễ đói cồn cào. Thường nên cách khoảng 3 đến 5 giờ' + (H.state.snack ? '.' : ': bật bữa phụ ở giữa cho đỡ đói.'));
    if (tooNear) notes.push(name(tooNear.a).charAt(0).toUpperCase() + name(tooNear.a).slice(1) + ' và ' + name(tooNear.b) + ' chỉ cách ' + span(tooNear.gap) + '. Nên để dạ dày nghỉ ít nhất 2 đến 3 giờ giữa hai bữa chính.');
    var last = list[list.length - 1];
    if (last.m > 21 * 60) notes.push('Bữa cuối lúc ' + fmtMin(last.m) + ' hơi muộn: nên ăn xong ít nhất 2 đến 3 giờ trước khi ngủ.');
    if (!notes.length) return '<p class="note ok" id="rm-gap">' + H.icon('check', { size: 16, stroke: 3 }) + '<span>Các bữa cách nhau khoảng 3 đến 5 giờ: hợp lý cho dạ dày.</span></p>';
    return '<p class="note warn" id="rm-gap">' + H.icon('info', { size: 16 }) + '<span>' + notes.map(esc).join(' ') + '</span></p>';
  }

  function timelineHtml() {
    var S = H.state, now = H.now(), nowMs = +now, today = U.iso(now);
    var evs = R.events(today), firstNext = null;
    evs.forEach(function (e) { if (!firstNext && +e.at >= nowMs) firstNext = e.key; });
    if (!evs.length) return '<p class="hint" id="rm-timeline">Hôm nay chưa có lời nhắc nào. Bật các loại nhắc ở trên hoặc chọn món trong kế hoạch.</p>';
    return '<ol class="rm-line" id="rm-timeline">' + evs.map(function (e) {
      var info = R.describe(e), log = S.remindLog[e.key], past = +e.at < nowMs;
      var ate = e.slot !== 'all' && S.ate[e.date + ':' + e.slot];
      var done = (log && log.d && !log.skip) || (ate && e.type === 'eat');
      var state = done ? '<span class="rm-st ok">' + H.icon('check', { size: 12, stroke: 3 }) + 'Xong</span>'
        : (log && log.skip) ? '<span class="rm-st">Đã bỏ qua</span>'
        : past ? '<span class="rm-st past">Đã qua</span>'
        : e.key === firstNext ? '<span class="rm-st next">Sắp tới</span>' : '';
      var main = e.type === 'eat' ? info.title : info.title + (e.dish ? ': ' + e.dish.name : '');
      var ateBtn = e.type === 'eat'
        ? '<button type="button" class="btn-icon round' + (ate ? ' on' : '') + '" data-act="remind-ate" data-date="' + e.date + '" data-slot="' + e.slot + '" aria-pressed="' + !!ate + '" aria-label="' + (ate ? 'Bỏ đánh dấu đã ăn ' : 'Đánh dấu đã ăn ') + esc(slotInfo(e.slot).label.toLowerCase()) + '">' + H.icon('check', { size: 15, stroke: 3 }) + '</button>' : '';
      return '<li class="rm-ev' + (done ? ' done' : '') + (e.key === firstNext ? ' next' : '') + (e.type === 'eat' ? ' eat' : '') + '"><time>' + fmtMin(e.min) + '</time>' +
        '<span class="rm-ev-e" aria-hidden="true">' + info.emoji + '</span><span class="rm-ev-t"><strong>' + esc(main) + '</strong>' + state + '</span>' + ateBtn + '</li>';
    }).join('') + '</ol>';
  }

  function weekHtml() {
    var start = U.weekStart(H.now()), today = U.iso(H.now());
    var tot = { ate: 0, onTime: 0 };
    var days = H.weekDays(start).map(function (day) {
      var iso = U.iso(day), sm = R.daySummary(iso);
      tot.ate += sm.ate; tot.onTime += sm.onTime;
      var planned = H.slotsOn().some(function (sl) { return H.getMeal(iso, sl); });
      var cls = iso > today ? 'future' : (sm.due && sm.ate >= sm.due ? 'full' : (sm.ate ? 'part' : (sm.due && planned ? 'none' : 'nodata')));
      var label = cls === 'future' || cls === 'nodata' ? '' : sm.ate + '/' + sm.total;
      return '<li class="' + cls + (iso === today ? ' today' : '') + '"><small>' + U.WD_SHORT[day.getDay()] + '</small><span class="rm-dot" aria-hidden="true">' +
        (cls === 'full' ? H.icon('check', { size: 14, stroke: 3 }) : '') + '</span><b>' + label + '</b></li>';
    }).join('');
    return '<ul class="rm-week" aria-label="Số bữa đã ăn mỗi ngày trong tuần">' + days + '</ul>' +
      '<p class="hint">Tuần này bạn đã ghi nhận <strong>' + tot.ate + '</strong> bữa ăn' + (tot.onTime ? ', trong đó <strong>' + tot.onTime + '</strong> bữa đúng giờ (lệch không quá 30 phút).' : '.') +
      ' Bấm “Đã ăn” khi nhắc hiện ra để ghi lại.</p>';
  }

  function notifyBlock() {
    var rm = H.state.remind, st = R.notifyState();
    if (st === 'unsupported') return '<p class="hint">Trình duyệt hoặc khung xem này không hỗ trợ thông báo hệ thống. Lời nhắc vẫn hiện ngay trên trang khi bạn đang mở.</p>';
    if (st === 'denied') return '<p class="hint">Thông báo đang bị chặn. Bật lại trong phần cài đặt trang web của trình duyệt rồi quay lại đây nhé.</p>';
    if (st === 'granted') return '<div class="rm-row"><div><strong>Thông báo của trình duyệt</strong><small>Hiện khi bạn chuyển sang tab khác (trang vẫn phải đang mở)</small></div>' + sw(rm.notify, 'remind-notify', '', 'Thông báo của trình duyệt') + '</div>';
    return '<div class="rm-row"><div><strong>Thông báo của trình duyệt</strong><small>Nhận nhắc khi bạn đang ở tab khác. Trình duyệt sẽ hỏi xin phép.</small></div><button type="button" class="btn btn-soft btn-sm" data-act="remind-notify">Cho phép</button></div>';
  }

  R.tabHtml = function () {
    var rm = H.state.remind, S = H.state;
    var h = '<section class="rm-hero"><span class="rm-hero-e" aria-hidden="true">⏰</span><div><h2>Ăn đúng giờ cũng là điều trị</h2>' +
      '<p>Người đau dạ dày thường được dặn ăn đều đặn, chia nhỏ bữa và đừng để bụng đói quá lâu. Mình nhắc bạn đi chợ, chuẩn bị nguyên liệu, nấu và ăn đúng giờ theo thực đơn.</p></div></section>';
    h += '<div class="rm-row master"><div><strong>Nhắc tôi ăn đúng giờ</strong><small>' + (rm.on ? 'Đang bật' : 'Đang tắt') + '</small></div>' + sw(rm.on, 'remind-toggle', '', 'Bật tắt nhắc giờ ăn') + '</div>';

    h += '<section class="fgroup"><h3>Giờ ăn của bạn</h3><ul class="rm-times">' + H.slotsOn().map(function (slot) {
      var s = slotInfo(slot);
      return '<li><label for="rt-' + slot + '"><span aria-hidden="true">' + s.emoji + '</span> ' + esc(s.label) + '</label>' +
        '<input id="rt-' + slot + '" type="time" class="input rm-time" value="' + esc(rm.times[slot]) + '" data-input="remind-time" data-slot="' + slot + '" required></li>';
    }).join('') + '</ul>' + gapHtml() +
      '<div class="chips"><button type="button" class="btn btn-ghost btn-sm" data-act="remind-defaults">Dùng giờ gợi ý</button>' +
      H.ui.chip(S.snack ? 'Có bữa phụ' : 'Thêm bữa phụ', S.snack, 'remind-snack') + '</div></section>';

    h += '<section class="fgroup"><h3>Nhắc những gì</h3><ul class="rm-kinds">' +
      [['shop', '🛒', 'Đi chợ', 'Tối hôm trước, nhắc những nguyên liệu còn thiếu cho ngày mai'],
       ['prep', '🥕', 'Chuẩn bị nguyên liệu', 'Trước giờ nấu ' + rm.prepLead + ' phút: lấy ra, rửa, sơ chế'],
       ['cook', '🍳', 'Bắt đầu nấu', 'Đúng lúc để kịp giờ ăn, tính theo thời gian nấu của từng món'],
       ['eat', '🍽️', 'Đến giờ ăn', 'Đúng giờ ăn đã đặt, kể cả khi chưa chọn món'],
       ['feel', '📝', 'Hỏi cảm giác sau ăn', 'Khoảng 45 phút sau khi bạn bấm “Đã ăn”, hỏi bụng thấy sao để ghi nhật ký']].map(function (k) {
        return '<li class="rm-row"><span class="rm-k-e" aria-hidden="true">' + k[1] + '</span><div><strong>' + k[2] + '</strong><small>' + k[3] + '</small></div>' +
          sw(rm.kinds[k[0]], 'remind-kind', ' data-k="' + k[0] + '"', 'Nhắc ' + k[2].toLowerCase()) + '</li>';
      }).join('') + '</ul>' +
      '<p class="label">Chuẩn bị nguyên liệu trước giờ nấu</p><div class="chips" role="group" aria-label="Số phút chuẩn bị trước">' + [5, 10, 15, 20, 30].map(function (n) {
        return H.ui.chip(n + ' phút', rm.prepLead === n, 'remind-lead', { v: n });
      }).join('') + '</div>' +
      '<label class="label" for="rt-shop">Giờ nhắc đi chợ <small>(tối hôm trước)</small></label><input id="rt-shop" type="time" class="input rm-time" value="' + esc(rm.shopAt) + '" data-input="remind-shop-time" required></section>';

    h += '<section class="fgroup"><h3>Cách nhận lời nhắc</h3><div class="rm-rows">' +
      '<div class="rm-row"><div><strong>Hộp nhắc trên màn hình</strong><small>Luôn có khi trang đang mở, kể cả khi bạn ở tab khác rồi quay lại</small></div><span class="rm-fixed">' + H.icon('check', { size: 16, stroke: 3 }) + '</span></div>' +
      notifyBlock() +
      '<div class="rm-row"><div><strong>Âm báo</strong><small>Ba tiếng bíp nhẹ khi hộp nhắc hiện ra</small></div>' + sw(rm.sound, 'remind-sound', '', 'Âm báo') + '</div>' +
      '<div class="rm-row"><div><strong>Rung (điện thoại)</strong><small>Nếu thiết bị hỗ trợ</small></div>' + sw(rm.vibrate, 'remind-vibrate', '', 'Rung') + '</div></div>' +
      '<div class="chips"><button type="button" class="btn btn-soft btn-sm" data-act="remind-test">' + H.icon('bell', { size: 16 }) + 'Thử một lời nhắc</button></div></section>';

    h += '<section class="fgroup"><h3>Lịch nhắc hôm nay</h3>' + timelineHtml() + '</section>';
    h += '<section class="fgroup"><h3>Tuần này bạn ăn đúng giờ chưa?</h3>' + weekHtml() + '</section>';

    var viewer = R.inViewer();
    h += '<section class="fgroup"><h3>Nhắc kể cả khi đóng trang</h3>' +
      '<p class="note">' + H.icon('info', { size: 16 }) + '<span><strong>Nói thật:</strong> trang web chỉ tự nhắc được khi tab này còn mở. Muốn điện thoại nhắc dù bạn không mở trang, hãy đưa giờ ăn vào ứng dụng Lịch của máy: Google Calendar (nút bên dưới) hoặc file .ics cho Lịch của iPhone và các app khác.</span></p>' +
      '<p class="label">Google Calendar <small>(lặp mỗi ngày đúng giờ ăn)</small></p><div class="chips" id="rm-gcal">' + H.slotsOn().map(function (slot) {
        var sl = slotInfo(slot);
        return '<a class="btn btn-soft btn-sm" href="' + esc(R.gcalUrl(slot)) + '" target="_blank" rel="noopener noreferrer">' + sl.emoji + ' ' + esc(sl.short) + ' ' + esc(rm.times[slot]) + H.icon('ext', { size: 14 }) + '<span class="sr-only"> (mở tab mới)</span></a>';
      }).join('') + '</div>' +
      '<p class="hint">Mỗi nút mở Google Calendar với một sự kiện lặp hằng ngày. Bạn bấm Lưu và chỉnh thời gian báo trước trong Google Calendar.</p>' +
      '<p class="label">File lịch 7 ngày <small>(.ics, gồm cả nhắc nấu và chuẩn bị)</small></p>' +
      '<div class="stack">' + (viewer ? '' : '<button type="button" class="btn btn-primary" data-act="remind-ics">' + H.icon('calendar', { size: 18 }) + 'Tải file lịch 7 ngày (.ics)</button>') +
      '<button type="button" class="btn ' + (viewer ? 'btn-primary' : 'btn-ghost') + '" data-act="remind-ics-copy">' + H.icon('copy', { size: 18 }) + 'Sao chép nội dung file</button></div>' +
      '<p class="hint">' + (viewer ? 'Khung xem này không cho tải file về. ' : 'Nếu trình duyệt chặn việc tải file, ') + 'hãy bấm “Sao chép nội dung file”, dán vào ứng dụng Ghi chú rồi lưu với tên <strong>nhac-gio-an.ics</strong> để mở bằng ứng dụng Lịch. Khi thực đơn đổi, xuất lại nhé.</p></section>';
    return h;
  };

  function rerenderTab() { H.render({ keepScroll: true }); }

  function refreshFragments() {
    var tl = document.getElementById('rm-timeline');
    if (tl) tl.outerHTML = timelineHtml();
    var gap = document.getElementById('rm-gap');
    var g = gapHtml();
    if (gap) { if (g) gap.outerHTML = g; else gap.remove(); }
    else if (g) { var list = document.querySelector('.rm-times'); if (list) list.insertAdjacentHTML('afterend', g); }
  }

  H.actions['remind-toggle'] = function () {
    var rm = H.state.remind;
    rm.on = !rm.on;
    H.save();
    H.toast(rm.on ? 'Đã bật nhắc giờ ăn' : 'Đã tắt nhắc giờ ăn', { icon: 'bell' });
    rerenderTab();
    if (rm.on) R.tick();
  };
  H.actions['remind-kind'] = function (el) {
    var k = el.dataset.k, rm = H.state.remind;
    rm.kinds[k] = !rm.kinds[k];
    H.save();
    rerenderTab();
  };
  H.actions['remind-lead'] = function (el) { H.state.remind.prepLead = Number(el.dataset.v); H.save(); rerenderTab(); };
  H.actions['remind-sound'] = function () { var rm = H.state.remind; rm.sound = !rm.sound; H.save(); if (rm.sound) { R.beep(); } rerenderTab(); };
  H.actions['remind-vibrate'] = function () { var rm = H.state.remind; rm.vibrate = !rm.vibrate; H.save(); if (rm.vibrate) R.buzz(); rerenderTab(); };
  H.actions['remind-snack'] = function () { H.state.snack = !H.state.snack; H.save(); rerenderTab(); };
  H.actions['remind-defaults'] = function () {
    var d = H.defaultRemind();
    H.state.remind.times = d.times; H.state.remind.shopAt = d.shopAt; H.state.remind.prepLead = d.prepLead;
    H.save();
    H.toast('Đã đặt lại giờ ăn gợi ý', { icon: 'refresh' });
    rerenderTab();
  };
  H.actions['remind-notify'] = function () {
    var rm = H.state.remind, st = R.notifyState();
    if (st === 'granted') { rm.notify = !rm.notify; H.save(); rerenderTab(); return; }
    if (st !== 'default') { rerenderTab(); return; }
    function done(p) {
      rm.notify = p === 'granted';
      H.save();
      H.toast(rm.notify ? 'Đã bật thông báo của trình duyệt' : 'Trình duyệt chưa cho phép thông báo', { icon: 'bell' });
      rerenderTab();
    }
    try {
      var r = Notification.requestPermission(done);
      if (r && typeof r.then === 'function') r.then(done, function () { done('denied'); });
    } catch (x) { done('denied'); }
  };
  H.actions['remind-test'] = function () {
    var now = H.now(), slot = H.autoMeal(now);
    var rmTimes = H.state.remind.times;
    var date = U.iso(now);
    var e = { key: date + ':' + slot + ':eat', date: date, slot: slot, type: 'eat', min: toMin(rmTimes[slot]), at: now, dish: H.getMeal(date, slot) ? H.DISH_BY_ID[H.getMeal(date, slot)] : null };
    R.openAlarm(e, true);
  };
  H.actions['remind-ate'] = function (el) {
    var date = el.dataset.date, slot = el.dataset.slot;
    if (R.ateOf(date, slot)) R.unmarkAte(date, slot);
    else R.markAte(date, slot);
    rerenderTab();
  };
  H.actions['remind-ics'] = function () {
    if (R.inViewer()) { H.actions['remind-ics-copy'](); return; }
    var r = R.ics(7);
    if (!r.count) { H.toast('Chưa có lời nhắc nào trong 7 ngày tới', { icon: 'info' }); return; }
    var ok = R.download('nhac-gio-an.ics', r.text, 'text/calendar;charset=utf-8');
    H.toast(ok ? 'Đã tạo file lịch ' + r.count + ' lời nhắc. Nếu máy không tải về, hãy dùng nút Sao chép.' : 'Không tải được file. Hãy dùng nút Sao chép nội dung.', { icon: 'calendar', ms: 4600 });
  };
  H.actions['remind-ics-copy'] = function () {
    var r = R.ics(7);
    U.copy(r.text).then(function (ok) {
      if (ok) H.toast('Đã sao chép nội dung file lịch. Dán vào Ghi chú rồi lưu thành nhac-gio-an.ics.', { icon: 'copy', ms: 4600 });
      else if (H.showTextSheet) H.showTextSheet('Nội dung file lịch (.ics)', r.text);
    });
  };

  H.inputs['remind-time'] = function (el) {
    var v = el.value, slot = el.dataset.slot;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) return;
    H.state.remind.times[slot] = v;
    H.save();
    refreshFragments();
  };
  H.inputs['remind-shop-time'] = function (el) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(el.value)) return;
    H.state.remind.shopAt = el.value;
    H.save();
    refreshFragments();
  };

  // ───────────── khởi động ─────────────
  R.init = function () {
    if (R.timer) return;
    R.timer = setInterval(R.tick, 15000);
    document.addEventListener('visibilitychange', R.wake);
    window.addEventListener('focus', R.wake);
    setTimeout(R.tick, 1500);
  };
})(window.HNAG = window.HNAG || {});
