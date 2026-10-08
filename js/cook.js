/*
 * Chế độ nấu từng bước (#cook-<mã món>): chữ to, đọc to bằng giọng nói, hẹn giờ theo từng bước,
 * điều khiển bằng giọng nói (thử nghiệm) và giữ màn hình sáng.
 *
 * Giọng đọc dùng speechSynthesis của trình duyệt nên chất lượng phụ thuộc thiết bị (có máy chưa cài giọng tiếng Việt).
 * Điều khiển bằng giọng nói dùng SpeechRecognition, chỉ có trên một số trình duyệt (Chrome, Edge) và cần cho phép micro.
 */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;
  var C = H.cook = {};
  var wake = null;          // wake lock đang giữ
  var rec = null;           // bộ nhận dạng giọng nói
  var micOn = false;
  var checked = {};         // ô nguyên liệu đã tick ở bước chuẩn bị (chỉ trong phiên)
  var timerClock = null;
  var fired = [];           // hẹn giờ đã reo, chờ người dùng bấm xác nhận
  var alarmRec = null;

  function dishOf(r) { return H.DISH_BY_ID[r.id]; }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  // ───────────── đọc to ─────────────
  C.speechText = function (s) {
    return String(s == null ? '' : s)
      .replace(/(\d+)\s*½/g, '$1 rưỡi')
      .replace(/¼/g, ' một phần tư ').replace(/½/g, ' một nửa ').replace(/¾/g, ' ba phần tư ')
      .replace(/(\d+(?:[.,]\d+)?)\s*kg\b/gi, '$1 ki lô gam')
      .replace(/(\d+(?:[.,]\d+)?)\s*ml\b/gi, '$1 mi li lít')
      .replace(/(\d+(?:[.,]\d+)?)\s*g\b/g, '$1 gam')
      .replace(/(\d+)\s*[–-]\s*(\d+)/g, '$1 đến $2')
      .replace(/(\d+)\s*%/g, '$1 phần trăm')
      .replace(/°\s*C/g, ' độ C')
      .replace(/[()]/g, ', ')
      .replace(/\s+/g, ' ').trim();
  };

  C.supported = function () { return 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function'; };

  function pickVoice() {
    try {
      var vs = window.speechSynthesis.getVoices() || [];
      return vs.filter(function (v) { return /^vi/i.test(v.lang); })[0] || null;
    } catch (e) { return null; }
  }

  C.speak = function (text) {
    if (!C.supported()) return false;
    try {
      window.speechSynthesis.cancel();
      var u = new window.SpeechSynthesisUtterance(C.speechText(text));
      u.lang = 'vi-VN';
      u.rate = H.state.cookPrefs.rate;
      var v = pickVoice();
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  };
  C.stopSpeaking = function () { try { if (C.supported()) window.speechSynthesis.cancel(); } catch (e) { /* bỏ qua */ } };

  // Nội dung đọc cho từng bước: 0 = nguyên liệu, 1..n = các bước, n+1 = hoàn thành.
  C.stepSpeech = function (d, step) {
    var n = d.steps.length;
    if (step === 0) {
      return 'Chuẩn bị cho ' + d.name + ', khẩu phần một người. ' + d.ing.map(function (p) {
        var it = H.INGREDIENTS[p[0]];
        return it.name.split(' (')[0] + ' ' + U.fmtQty(p[1], it.unit);
      }).join(', ') + '.';
    }
    if (step > n) return 'Xong rồi. Chúc bạn ngon miệng, nhớ ăn chậm và nhai kỹ.';
    return 'Bước ' + step + ' trên ' + n + '. ' + d.steps[step - 1];
  };

  // ───────────── tìm thời gian trong câu ("12–15 phút", "5 phút", "1 giờ") ─────────────
  var DUR_RE = /(\d+(?:[.,]\d+)?)\s*(?:[–-]\s*(\d+(?:[.,]\d+)?))?\s*(phút|giây|giờ)/gi;
  C.durations = function (text) {
    var out = [], seen = {}, m;
    DUR_RE.lastIndex = 0;
    while ((m = DUR_RE.exec(String(text)))) {
      var lo = parseFloat(m[1].replace(',', '.')), hi = m[2] ? parseFloat(m[2].replace(',', '.')) : lo;
      var unit = m[3].toLowerCase();
      var secs = Math.round(Math.max(lo, hi) * (unit === 'giờ' ? 3600 : unit === 'phút' ? 60 : 1));   // lấy cận trên cho chắc chín
      if (secs < 20 || secs > 4 * 3600 || seen[secs]) continue;
      seen[secs] = 1;
      out.push({ secs: secs, label: (m[2] ? lo + '–' + hi : String(lo)).replace('.', ',') + ' ' + unit });
    }
    return out;
  };

  C.clock = function (ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return (h ? h + ':' + U.pad2(m) : m) + ':' + U.pad2(r);
  };

  // ───────────── hẹn giờ ─────────────
  function saveTimers() { H.save(); }
  C.addTimer = function (dishId, step, secs, label) {
    var k = dishId + ':' + step + ':' + secs;
    var T = H.state.timers;
    if (T.some(function (t) { return t.k === k; })) return false;
    if (T.length >= 8) { H.toast('Đã có nhiều hẹn giờ đang chạy, hãy tắt bớt', { icon: 'info' }); return false; }
    T.push({ k: k, dish: dishId, step: step, label: label, end: Date.now() + secs * 1000, secs: secs });
    saveTimers();
    C.startClock();
    return true;
  };
  C.cancelTimer = function (k) {
    H.state.timers = H.state.timers.filter(function (t) { return t.k !== k; });
    saveTimers();
    C.paint();
  };
  C.extendTimer = function (k, secs) {
    var t = H.state.timers.filter(function (x) { return x.k === k; })[0];
    if (t) { t.end += secs * 1000; t.secs += secs; saveTimers(); }
  };

  C.startClock = function () {
    if (timerClock) return;
    timerClock = setInterval(C.tick, 500);
  };

  C.tick = function () {
    var now = Date.now(), T = H.state.timers, done = [];
    T.forEach(function (t) { if (t.end <= now) done.push(t); });
    if (done.length) {
      H.state.timers = T.filter(function (t) { return t.end > now; });
      saveTimers();
      done.forEach(function (t) { fired.push(t); });
      C.ring();
      if (H.route && H.route.name === 'cook') H.render({ keepScroll: true });   // nút "Đang hẹn" trở lại thành "Hẹn giờ"
    }
    if (!H.state.timers.length && !fired.length && timerClock) { clearInterval(timerClock); timerClock = null; }
    C.paint();
  };

  // Hẹn giờ reo: âm báo, rung, đọc to (nếu bật) và hộp xác nhận to dễ bấm khi tay đang ướt.
  C.ring = function () {
    if (alarmRec || !fired.length) return;
    var t = fired[0], d = H.DISH_BY_ID[t.dish];
    var text = 'Hết giờ' + (d ? ' cho ' + d.name : '') + (t.step ? ', bước ' + t.step : '') + '.';
    if (H.remind) { if (H.state.remind.sound) H.remind.beep(); if (H.state.remind.vibrate) H.remind.buzz(); }
    if (H.state.cookPrefs.read) C.speak(text + ' ' + (t.label ? 'Hẹn giờ ' + t.label + ' đã xong.' : ''));
    alarmRec = H.sheet.open({
      title: 'Hết giờ!',
      cls: 'overlay-dialog overlay-alarm',
      render: function () {
        var cur = fired[0];
        if (!cur) return { body: '' };
        var dd = H.DISH_BY_ID[cur.dish], more = fired.length > 1 ? '<p class="hint">Còn ' + (fired.length - 1) + ' hẹn giờ khác cũng đã xong.</p>' : '';
        return {
          body: '<div class="alarm"><div class="alarm-e" aria-hidden="true">⏲️</div>' +
            (dd ? '<div class="alarm-dish">' + H.ui.tile(dd, 'md') + '<strong>' + esc(dd.name) + '</strong></div>' : '') +
            '<p class="alarm-text">' + (cur.step ? 'Bước ' + cur.step + ': ' : '') + 'hẹn giờ ' + esc(cur.label || '') + ' đã xong. Kiểm tra món ăn đã chín kỹ chưa nhé.</p>' + more + '</div>',
          foot: '<div class="alarm-foot"><button type="button" class="btn btn-primary btn-lg" data-act="cook-fired-ok" data-autofocus>' + H.icon('check', { size: 18, stroke: 3 }) + 'Đã kiểm tra</button>' +
            '<button type="button" class="btn btn-ghost" data-act="cook-fired-more">' + H.icon('clock', { size: 16 }) + 'Thêm 2 phút</button>' +
            (dd ? '<a class="btn btn-soft" href="#cook-' + dd.id + '" data-act="cook-fired-ok">Về chế độ nấu</a>' : '') + '</div>'
        };
      },
      onClose: function () {
        alarmRec = null;
        fired.shift();
        C.stopSpeaking();
        if (fired.length) setTimeout(C.ring, 250);
        C.paint();
      }
    });
  };
  H.actions['cook-fired-ok'] = function () { if (alarmRec) H.sheet.close(alarmRec); };
  H.actions['cook-fired-more'] = function () {
    var t = fired[0];
    if (t) { H.state.timers.push({ k: t.k + ':+', dish: t.dish, step: t.step, label: '2 phút thêm', end: Date.now() + 120000, secs: 120 }); saveTimers(); C.startClock(); }
    if (alarmRec) H.sheet.close(alarmRec);
  };

  // Cập nhật bảng hẹn giờ trong màn nấu và nhãn nổi ở các màn khác mà không vẽ lại cả trang.
  C.paint = function () {
    var now = Date.now(), T = H.state.timers;
    var tray = document.getElementById('cook-timers');
    if (tray) {
      var html = trayHtml();
      if (tray.getAttribute('data-h') !== html) { tray.innerHTML = html; tray.setAttribute('data-h', html); }
    }
    var chip = document.getElementById('timer-chip');
    if (chip) {
      var onCook = H.route && H.route.name === 'cook';
      if (!T.length || onCook) { chip.hidden = true; }
      else {
        var first = T.slice().sort(function (a, b) { return a.end - b.end; })[0];
        var d = H.DISH_BY_ID[first.dish];
        chip.hidden = false;
        chip.setAttribute('href', '#cook-' + first.dish);
        chip.innerHTML = H.icon('clock', { size: 16 }) + '<strong>' + C.clock(first.end - now) + '</strong><span>' + esc(d ? d.name : 'Hẹn giờ') + (T.length > 1 ? ' +' + (T.length - 1) : '') + '</span>';
      }
    }
  };

  function trayHtml() {
    var now = Date.now(), cur = H.route && H.route.id;
    var T = H.state.timers.filter(function (t) { return !cur || t.dish === cur; }).sort(function (a, b) { return a.end - b.end; });
    if (!T.length) return '';
    return '<h3 class="ck-h">Đang hẹn giờ</h3><ul class="ck-timers">' + T.map(function (t) {
      return '<li><span class="ck-clock" aria-hidden="true">' + H.icon('clock', { size: 18 }) + '</span><span class="ck-t"><strong>' + C.clock(t.end - now) + '</strong><small>' + (t.step ? 'Bước ' + t.step + ' · ' : '') + esc(t.label || '') + '</small></span>' +
        '<button type="button" class="btn-icon round" data-act="cook-timer-cancel" data-k="' + esc(t.k) + '" aria-label="Tắt hẹn giờ ' + esc(t.label || '') + '">' + H.icon('x', { size: 16, stroke: 3 }) + '</button></li>';
    }).join('') + '</ul>';
  }

  // ───────────── màn hình nấu ─────────────
  function progress(d) {
    return (H.state.cookAt.id === d.id ? H.state.cookAt.step : 0);
  }

  function ingredientStep(d) {
    var tools = d.tools.indexOf('khong') >= 0 ? '' : '<div class="chips static ck-tools">' + d.tools.map(function (t) {
      var tool = H.TOOLS.filter(function (x) { return x.id === t; })[0];
      return '<span class="chip static">' + tool.emoji + ' ' + esc(tool.name) + '</span>';
    }).join('<span class="or">hoặc</span>') + '</div>';
    return '<h2 class="ck-h2">Chuẩn bị nguyên liệu</h2><p class="ck-sub">Cho 1 người. Chạm để đánh dấu thứ đã lấy ra.</p>' + tools +
      '<ul class="ck-ings">' + d.ing.map(function (p, i) {
        var it = H.INGREDIENTS[p[0]], on = !!checked[d.id + ':' + i];
        var st = it.staple ? 'có sẵn trong bếp' : (H.hasIngredient(p[0], p[1]) ? 'bạn có đủ' : (H.usableStock(p[0]) > 0 ? 'trong tủ còn thiếu' : 'chưa có trong tủ'));
        return '<li><button type="button" class="checkrow' + (on ? ' on' : '') + '" role="checkbox" aria-checked="' + on + '" data-act="cook-check" data-i="' + i + '">' +
          '<span class="box">' + (on ? H.icon('check', { size: 14, stroke: 3.2 }) : '') + '</span><span class="ing-e">' + it.emoji + '</span>' +
          '<span class="ing-n">' + esc(it.name) + '<small>' + st + '</small></span><span class="ing-q">' + U.fmtQty(p[1], it.unit) + '</span></button></li>';
      }).join('') + '</ul>';
  }

  function recipeStep(d, step) {
    var text = d.steps[step - 1];
    var durs = C.durations(text);
    var chips = durs.map(function (x) {
      var k = d.id + ':' + step + ':' + x.secs, running = H.state.timers.some(function (t) { return t.k === k; });
      return '<button type="button" class="btn ' + (running ? 'btn-soft' : 'btn-primary') + ' ck-timer-btn" data-act="cook-timer" data-secs="' + x.secs + '" data-label="' + esc(x.label) + '"' + (running ? ' disabled' : '') + '>' +
        H.icon('clock', { size: 18 }) + (running ? 'Đang hẹn ' : 'Hẹn giờ ') + esc(x.label) + '</button>';
    }).join('');
    return '<p class="ck-step-text">' + esc(text) + '</p>' + (chips ? '<div class="ck-timer-row">' + chips + '</div>' : '');
  }

  function doneStep(d) {
    return '<div class="ck-done">' + H.mascot({ size: 96, mood: 'wow' }) + '<h2 class="ck-h2">Xong rồi, ngon miệng nhé!</h2>' +
      '<p class="ck-sub">Để món nguội bớt cho ấm vừa miệng. Ăn chậm, nhai kỹ khoảng 20 phút.</p>' +
      '<button type="button" class="btn btn-primary btn-lg btn-block" data-act="cook-finish">' + H.icon('check', { size: 18, stroke: 3 }) + 'Đánh dấu đã nấu</button>' +
      '<p class="hint">Mình sẽ trừ nguyên liệu đã dùng khỏi tủ lạnh.</p></div>';
  }

  function viewBody(d, step) {
    var n = d.steps.length;
    return step === 0 ? ingredientStep(d) : (step > n ? doneStep(d) : recipeStep(d, step));
  }

  H.views.cook = {
    title: function (r) { var d = H.DISH_BY_ID[r.id]; return d ? 'Nấu ' + d.name : 'Nấu từng bước'; },
    render: function (r) {
      var d = dishOf(r);
      if (!d || d.mode !== 'home') {
        return '<div class="cook">' + H.ui.empty({ title: d ? 'Món này không cần nấu' : 'Không tìm thấy món', text: d ? 'Đây là món ăn ngoài, xem cách gọi món an toàn ở trang món.' : 'Có thể đường dẫn đã cũ.',
          action: '<a class="btn btn-primary" href="#' + (d ? 'dish-' + d.id : 'explore') + '">' + (d ? 'Xem cách gọi món' : 'Về danh sách món') + '</a>' }) + '</div>';
      }
      var n = d.steps.length, step = Math.min(progress(d), n + 1);
      if (H.state.cookAt.id !== d.id) { H.state.cookAt = { id: d.id, step: 0 }; step = 0; }
      var label = step === 0 ? 'Chuẩn bị' : (step > n ? 'Hoàn thành' : 'Bước ' + step + ' / ' + n);
      var pct = Math.round(step / (n + 1) * 100);
      var read = H.state.cookPrefs.read, SR = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      return '<div class="cook" data-dish="' + d.id + '">' +
        '<header class="cook-top"><button type="button" class="btn-icon round" data-act="cook-exit" aria-label="Thoát chế độ nấu">' + H.icon('x', { size: 18, stroke: 2.6 }) + '</button>' +
        '<div class="cook-title"><small>Nấu từng bước</small><strong>' + esc(d.name) + '</strong></div>' +
        '<a class="btn-icon round" href="#dish-' + d.id + '" aria-label="Xem trang món">' + H.icon('book', { size: 18 }) + '</a></header>' +
        '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + (n + 1) + '" aria-valuenow="' + step + '" aria-label="Tiến độ nấu"><i style="width:' + pct + '%"></i></div>' +
        '<p class="ck-label" aria-live="polite">' + label + '</p>' +
        '<section class="cook-card" role="region" aria-label="Nội dung bước nấu" id="cook-card">' + viewBody(d, step) + '</section>' +
        '<div id="cook-timers" class="cook-timers">' + trayHtml() + '</div>' +
        '<div class="cook-voice" role="group" aria-label="Giọng nói">' +
        (C.supported() ? '<button type="button" class="btn btn-soft" data-act="cook-speak">' + H.icon('volume', { size: 18 }) + 'Đọc to</button>' +
          H.ui.chip('Tự đọc khi sang bước', read, 'cook-auto') : '<p class="hint">Trình duyệt này chưa hỗ trợ đọc to.</p>') +
        (SR ? H.ui.chip(H.icon('mic', { size: 16 }) + (micOn ? ' Đang nghe…' : ' Ra lệnh bằng giọng nói'), micOn, 'cook-mic') : '') + '</div>' +
        (C.supported() ? '<div class="chips ck-rate" role="group" aria-label="Tốc độ đọc"><span class="sort-l">Tốc độ đọc</span>' +
          [[0.85, 'Chậm'], [1, 'Vừa'], [1.15, 'Nhanh']].map(function (r2) { return H.ui.chip(r2[1], H.state.cookPrefs.rate === r2[0], 'cook-rate', { v: r2[0] }); }).join('') + '</div>' : '') +
        '<nav class="cook-nav" aria-label="Chuyển bước"><button type="button" class="btn btn-ghost btn-lg" data-act="cook-prev"' + (step === 0 ? ' disabled' : '') + '>' + H.icon('chev-l', { size: 20 }) + 'Trước</button>' +
        (step > n ? '<a class="btn btn-primary btn-lg" href="#dish-' + d.id + '">Về trang món</a>'
          : '<button type="button" class="btn btn-primary btn-lg" data-act="cook-next">' + (step === 0 ? 'Bắt đầu nấu' : (step === n ? 'Hoàn thành' : 'Tiếp theo')) + H.icon('chev-r', { size: 20 }) + '</button>') + '</nav>' +
        '<p class="ck-keys hint">Phím tắt: ← → chuyển bước, Dấu cách để nghe lại.</p></div>';
    },
    mount: function (r) {
      var d = dishOf(r);
      document.documentElement.classList.add('cooking');
      C.keepAwake();
      C.startClock();
      C.paint();
      // Chỉ đọc khi vừa mở màn nấu (không đọc lại mỗi lần vẽ lại màn hình)
      if (d && C.entered !== d.id) {
        C.entered = d.id;
        if (H.state.cookPrefs.read && C.supported()) C.speak(C.stepSpeech(d, progress(d)));
      }
    }
  };

  C.leave = function () {
    document.documentElement.classList.remove('cooking');
    C.releaseAwake();
    C.stopSpeaking();
    C.stopMic();
    C.entered = '';
    C.paint();
  };

  function go(step, speakIt) {
    var d = H.DISH_BY_ID[H.route.id];
    if (!d) return;
    var n = d.steps.length;
    step = U.clamp(step, 0, n + 1);
    H.state.cookAt = { id: d.id, step: step };
    H.save();
    H.render({ keepScroll: true });
    var card = document.getElementById('cook-card');
    if (card && !reduced()) { card.classList.remove('flip'); void card.offsetWidth; card.classList.add('flip'); }
    if (H.state.cookPrefs.read && speakIt !== false) C.speak(C.stepSpeech(d, step));
    else C.stopSpeaking();
    var live = document.getElementById('sr-live');
    if (live) live.textContent = step === 0 ? 'Chuẩn bị nguyên liệu' : (step > n ? 'Hoàn thành' : 'Bước ' + step + ' trên ' + n);
    window.scrollTo(0, 0);
  }

  function cur() { return H.state.cookAt.step; }

  H.actions['cook-next'] = function () { go(cur() + 1); };
  H.actions['cook-prev'] = function () { go(cur() - 1); };
  H.actions['cook-exit'] = function () {
    var d = H.DISH_BY_ID[H.route.id];
    H.go(d ? 'dish-' + d.id : 'explore');
  };
  H.actions['cook-check'] = function (el) {
    var k = H.route.id + ':' + el.dataset.i;
    checked[k] = !checked[k];
    H.render({ keepScroll: true });
  };
  H.actions['cook-speak'] = function () {
    var d = H.DISH_BY_ID[H.route.id];
    if (!d) return;
    if (!C.speak(C.stepSpeech(d, cur()))) H.toast('Trình duyệt chưa cho đọc to', { icon: 'info' });
  };
  H.actions['cook-auto'] = function () {
    var p = H.state.cookPrefs;
    p.read = !p.read;
    H.save();
    H.render({ keepScroll: true });
    if (p.read) H.actions['cook-speak']();
    else C.stopSpeaking();
  };
  H.actions['cook-rate'] = function (el) { H.state.cookPrefs.rate = Number(el.dataset.v); H.save(); H.render({ keepScroll: true }); H.actions['cook-speak'](); };
  H.actions['cook-timer'] = function (el) {
    var d = H.DISH_BY_ID[H.route.id];
    if (!d) return;
    if (C.addTimer(d.id, cur(), Number(el.dataset.secs), el.dataset.label)) {
      H.toast('Đã hẹn giờ ' + el.dataset.label, { icon: 'clock' });
      H.render({ keepScroll: true });
    }
  };
  H.actions['cook-timer-cancel'] = function (el) { C.cancelTimer(el.dataset.k); H.render({ keepScroll: true }); };

  // Nấu xong: tìm bữa hôm nay đang xếp món này (hoặc một bữa trống phù hợp) rồi đánh dấu đã nấu, trừ nguyên liệu khỏi tủ lạnh.
  H.actions['cook-finish'] = function () {
    var d = H.DISH_BY_ID[H.route.id];
    if (!d) return;
    var today = U.iso(H.now()), slots = ['sang', 'trua', 'toi', 'phu'];
    var slot = slots.filter(function (s) { return H.getMeal(today, s) === d.id && !H.state.cooked[today + ':' + s]; })[0];
    var msg;
    if (!slot) {
      var already = slots.filter(function (s) { return H.getMeal(today, s) === d.id; })[0];
      if (already) { msg = 'Món này đã được đánh dấu đã nấu hôm nay'; }
      else {
        var free = d.meals.filter(function (s) { return !H.getMeal(today, s); });
        var pick = free.indexOf(H.autoMeal(H.now())) >= 0 ? H.autoMeal(H.now()) : free[0];
        if (pick) { H.pinMeal(d.id, today, pick); H.setCooked(today, pick, true); msg = 'Đã ghim vào ' + H.SLOTS.filter(function (s) { return s.id === pick; })[0].label.toLowerCase() + ' và đánh dấu đã nấu'; }
        else msg = 'Chúc bạn ngon miệng! Các bữa hôm nay đã có món khác nên mình chưa ghim.';
      }
    } else { H.setCooked(today, slot, true); msg = 'Đã đánh dấu đã nấu và trừ nguyên liệu khỏi tủ lạnh'; }
    H.state.timers = H.state.timers.filter(function (t) { return t.dish !== d.id; });
    H.state.cookAt = { id: '', step: 0 };
    H.save();
    H.toast(msg, { icon: 'check', ms: 3600 });
    H.go('home');
  };

  // ───────────── giữ màn hình sáng ─────────────
  C.keepAwake = function () {
    try {
      if (!navigator.wakeLock || wake) return;
      navigator.wakeLock.request('screen').then(function (l) {
        wake = l;
        l.addEventListener('release', function () { if (wake === l) wake = null; });
      }, function () { /* không được phép: bỏ qua */ });
    } catch (e) { /* bỏ qua */ }
  };
  C.releaseAwake = function () { try { if (wake) { wake.release(); wake = null; } } catch (e) { wake = null; } };
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && document.documentElement.classList.contains('cooking')) C.keepAwake();
  });

  // ───────────── điều khiển bằng giọng nói ─────────────
  C.command = function (text) {
    var t = ' ' + U.norm(text) + ' ';
    if (/ (tiep|tiep theo|sang buoc|qua buoc|next) /.test(t)) return 'next';
    if (/ (truoc|buoc truoc|quay lai|lui|back) /.test(t)) return 'prev';
    if (/ (doc lai|nhac lai|nghe lai|lap lai|lai|repeat) /.test(t)) return 'repeat';
    if (/ (hen gio|bam gio|timer) /.test(t)) return 'timer';
    if (/ (dung|im|thoi|stop) /.test(t)) return 'stop';
    return null;
  };

  C.run = function (cmd) {
    var d = H.route && H.route.name === 'cook' ? H.DISH_BY_ID[H.route.id] : null;
    if (!d) return false;
    if (cmd === 'next') go(cur() + 1);
    else if (cmd === 'prev') go(cur() - 1);
    else if (cmd === 'repeat') C.speak(C.stepSpeech(d, cur()));
    else if (cmd === 'stop') C.stopSpeaking();
    else if (cmd === 'timer') { var b = document.querySelector('.ck-timer-btn:not([disabled])'); if (b) b.click(); else C.speak('Bước này không có thời gian để hẹn.'); }
    else return false;
    return true;
  };

  C.stopMic = function () {
    micOn = false;
    if (rec) { try { rec.onend = null; rec.stop(); } catch (e) { /* bỏ qua */ } rec = null; }
  };
  C.startMic = function () {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    try {
      rec = new SR();
      rec.lang = 'vi-VN';
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = function (e) {
        for (var i = e.resultIndex; i < e.results.length; i++) {
          if (!e.results[i].isFinal) continue;
          var cmd = C.command(e.results[i][0].transcript);
          if (cmd) C.run(cmd);
        }
      };
      rec.onerror = function (e) {
        if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')) {
          H.toast('Trình duyệt chưa cho dùng micro nên chưa nghe lệnh được', { icon: 'info', ms: 4200 });
          micOn = false; rec = null; H.render({ keepScroll: true });
        }
      };
      rec.onend = function () { if (micOn && rec) { try { rec.start(); } catch (e) { /* bỏ qua */ } } };
      micOn = true;
      rec.start();
      return true;
    } catch (e) { micOn = false; rec = null; return false; }
  };
  H.actions['cook-mic'] = function () {
    if (micOn) { C.stopMic(); H.render({ keepScroll: true }); return; }
    if (!C.startMic()) { H.toast('Thiết bị này chưa hỗ trợ ra lệnh bằng giọng nói', { icon: 'info' }); return; }
    H.toast('Hãy nói: “tiếp”, “trước”, “đọc lại” hoặc “hẹn giờ”', { icon: 'mic', ms: 4200 });
    H.render({ keepScroll: true });
  };

  // ───────────── bàn phím ─────────────
  document.addEventListener('keydown', function (e) {
    if (!H.route || H.route.name !== 'cook' || H.sheet.count() || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); H.actions['cook-next'](); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); H.actions['cook-prev'](); }
    else if (e.key === ' ' && !(t && (t.tagName === 'BUTTON' || t.tagName === 'A'))) { e.preventDefault(); H.actions['cook-speak'](); }
  });

  // ───────────── khởi động ─────────────
  C.init = function () {
    if (!document.getElementById('timer-chip')) {
      var a = document.createElement('a');
      a.id = 'timer-chip'; a.className = 'timer-fab'; a.hidden = true; a.setAttribute('role', 'status');
      a.setAttribute('aria-label', 'Hẹn giờ đang chạy');
      document.body.appendChild(a);
    }
    // hẹn giờ còn lại sau khi tải lại trang: hết giờ trong lúc vắng thì báo ngay
    if (H.state.timers.length) { C.startClock(); C.tick(); }
  };
})(window.HNAG = window.HNAG || {});
