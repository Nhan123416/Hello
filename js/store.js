/* Trạng thái ứng dụng, lưu localStorage, bộ chọn món và thuật toán xếp thực đơn. */
(function (H) {
  'use strict';

  var U = H.util;
  var KEY = 'hnag.v1';

  // Bộ lọc mặc định. maxTime (phút) và maxCost (đồng) bằng 0 nghĩa là không giới hạn; maxLevel 0 = mọi độ khó.
  function defaultFilters() {
    return { mode: 'home', energy: 'all', maxTime: 0, maxCost: 0, maxLevel: 0, proteins: [] };
  }
  H.defaultFilters = defaultFilters;

  function defaults() {
    return {
      v: 1,
      onboarded: false,
      theme: 'auto',                       // auto | light | dark
      palette: 'ngoc-lam',                 // xem H.PALETTES
      profile: { stage: 'doi', severity: 'vua', veg: false, tools: ['noi-com', 'bep', 'chao'], flavor: { cay: null, man: null, chua: null, beo: null } },
      filters: defaultFilters(),
      excluded: [],                        // món bị bỏ khỏi vòng quay và kế hoạch
      favs: [],
      ratings: {},                         // { mã món: 1 đến 5 sao }
      plan: {},                            // { 'YYYY-MM-DD': { sang, trua, toi, phu } }
      cooked: {},                          // { 'YYYY-MM-DD:slot': true }
      snack: false,                        // thêm bữa phụ vào kế hoạch tuần
      planSeeded: false,                   // đã tự xếp sẵn thực đơn lần đầu
      budget: 0,                           // ngân sách mỗi ngày (0 = không giới hạn)
      picks: {},                           // { dishId: số lần chốt }
      log: [],                             // [{ t, date, slot, id }]
      pantry: {},                          // tủ lạnh: { mã nguyên liệu: { qty: số lượng, exp: 'YYYY-MM-DD' hoặc '' } }
      consumed: {},                        // { 'ngày:bữa': { mã: [số lượng đã trừ, hạn] } } để hoàn lại khi bỏ đánh dấu đã nấu
      bought: {},                          // { 'tuần:nguyên liệu': true }
      posts: [],                           // bài viết của người dùng (chỉ lưu trên máy)
      liked: {},
      remind: defaultRemind(),             // lời nhắc ăn đúng giờ (xem js/remind.js)
      remindLog: {},                       // { 'ngày:bữa:loại': { s: lúc hiện, z: hẹn lại lúc, d: 1 đã xử lý } }
      ate: {},                             // { 'ngày:bữa': { t: lúc bấm "Đã ăn", late: số phút lệch so với giờ ăn | null } }
      diary: [],                           // nhật ký ăn uống: [{ id, date, slot, feel 1-4, symptoms, dishes, note, ts }]
      cookPrefs: { read: false, rate: 1 }, // chế độ nấu từng bước: tự đọc to, tốc độ đọc
      cookAt: { id: '', step: 0 },         // món đang nấu dở và bước hiện tại (để quay lại nấu tiếp)
      timers: []                           // hẹn giờ khi nấu: [{ k, dish, step, label, end, secs }]
    };
  }

  // Giờ ăn mặc định và loại lời nhắc. Người dùng chỉnh trong Kế hoạch > Nhắc giờ.
  function defaultRemind() {
    return {
      on: true,
      times: { sang: '07:00', trua: '11:45', toi: '18:30', phu: '15:30' },
      kinds: { shop: true, prep: true, cook: true, eat: true, feel: true },
      prepLead: 15,                        // chuẩn bị nguyên liệu trước giờ bắt đầu nấu bao nhiêu phút
      shopAt: '17:30',                     // giờ nhắc đi chợ cho ngày hôm sau
      notify: false,                       // muốn nhận thông báo của trình duyệt (cần được cho phép)
      sound: true,
      vibrate: true,
      bannerHiddenOn: ''                   // ngày đã ẩn thẻ gợi ý bật nhắc giờ (YYYY-MM-DD)
    };
  }
  H.defaultRemind = defaultRemind;

  function load() {
    var s = defaults();
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var o = JSON.parse(raw);
        Object.keys(s).forEach(function (k) {
          if (o[k] === undefined || o[k] === null) return;
          if (k === 'profile' || k === 'filters' || k === 'remind' || k === 'cookPrefs' || k === 'cookAt') s[k] = Object.assign(s[k], o[k]);
          else s[k] = o[k];
        });
        // bản cũ chỉ ghi "có / không có" trong tủ lạnh: chuyển thành số lượng gói mặc định
        if (Array.isArray(o.fridge) && !o.pantry) {
          s.pantry = {};
          o.fridge.forEach(function (id) {
            var it = H.INGREDIENTS[id];
            if (it && !it.staple) s.pantry[id] = { qty: H.packOf(id).qty, exp: '' };
          });
        }
        // bản cũ chỉ có hai nút "dưới 15 phút" và "dưới 15.000đ": chuyển sang thang mới
        var of = o.filters || {};
        if (of.quick && !(of.maxTime > 0)) s.filters.maxTime = 15;
        if (of.cheap && !(of.maxCost > 0)) s.filters.maxCost = 15000;
      }
    } catch (e) { /* dữ liệu hỏng hoặc bị chặn: dùng mặc định */ }
    // làm sạch kiểu dữ liệu
    ['excluded', 'favs', 'log', 'posts', 'timers', 'diary'].forEach(function (k) { if (!Array.isArray(s[k])) s[k] = []; });
    s.diary = s.diary.map(cleanDiary).filter(Boolean).slice(-400);
    s.posts = s.posts.filter(function (p) { return p && typeof p === 'object' && typeof p.text === 'string'; });
    s.cookPrefs = { read: !!(s.cookPrefs && s.cookPrefs.read), rate: [0.85, 1, 1.15].indexOf(s.cookPrefs && s.cookPrefs.rate) >= 0 ? s.cookPrefs.rate : 1 };
    if (!s.cookAt || typeof s.cookAt.id !== 'string') s.cookAt = { id: '', step: 0 };
    s.cookAt.step = Math.max(0, Math.floor(Number(s.cookAt.step)) || 0);
    var nowMs = Date.now();
    s.timers = s.timers.filter(function (t) {
      return t && typeof t.k === 'string' && typeof t.dish === 'string' && isFinite(t.end) && isFinite(t.secs) && t.secs > 0 && t.end > nowMs - 3600000;
    }).slice(0, 12).map(function (t) { return { k: t.k, dish: t.dish, step: Math.max(0, Math.floor(t.step) || 0), label: String(t.label || '').slice(0, 80), end: Number(t.end), secs: Number(t.secs) }; });
    ['plan', 'cooked', 'picks', 'bought', 'liked', 'remindLog', 'ate', 'pantry', 'consumed', 'ratings'].forEach(function (k) { if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) s[k] = {}; });
    Object.keys(s.ratings).forEach(function (id) {
      var r = s.ratings[id];
      if (!(Number.isInteger(r) && r >= 1 && r <= 5)) delete s.ratings[id];
    });
    Object.keys(s.pantry).forEach(function (id) {
      var v = s.pantry[id], it = H.INGREDIENTS[id], q = v && Number(v.qty);
      if (!it || it.staple || !v || typeof v !== 'object' || !isFinite(q) || q <= 0) { delete s.pantry[id]; return; }
      s.pantry[id] = { qty: Math.round(q * 100) / 100, exp: /^\d{4}-\d{2}-\d{2}$/.test(v.exp) ? v.exp : '' };
    });
    // "đã mua" ngày xưa là true / false; bản mới lưu số lượng đã mua
    Object.keys(s.bought).forEach(function (k) { var b = s.bought[k]; if (b !== true && !(typeof b === 'number' && b > 0)) delete s.bought[k]; });
    sanitizeRemind(s.remind);
    if (!Array.isArray(s.profile.tools)) s.profile.tools = ['noi-com', 'bep', 'chao'];
    if (['cap', 'doi', 'on'].indexOf(s.profile.stage) < 0) s.profile.stage = 'doi';
    if (['nhe', 'vua', 'nang'].indexOf(s.profile.severity) < 0) s.profile.severity = 'vua';
    if (['all', 'home', 'out'].indexOf(s.filters.mode) < 0) s.filters.mode = 'home';
    if (['all', 'thap', 'tb', 'cao'].indexOf(s.filters.energy) < 0) s.filters.energy = 'all';
    delete s.filters.quick; delete s.filters.cheap;
    if (H.TIME_STEPS.indexOf(s.filters.maxTime) < 0) s.filters.maxTime = 0;
    if (H.COST_STEPS.indexOf(s.filters.maxCost) < 0) s.filters.maxCost = 0;
    if ([0, 1, 2, 3].indexOf(s.filters.maxLevel) < 0) s.filters.maxLevel = 0;
    s.filters.proteins = Array.isArray(s.filters.proteins) ? s.filters.proteins.filter(function (id) {
      return H.PROTEINS.some(function (p) { return p.id === id; });
    }) : [];
    var fl = s.profile.flavor && typeof s.profile.flavor === 'object' ? s.profile.flavor : {};
    s.profile.flavor = {};
    H.FLAVORS.forEach(function (f) { s.profile.flavor[f.id] = [0, 1, 2, 3].indexOf(fl[f.id]) >= 0 ? fl[f.id] : null; });
    s.profile.veg = !!s.profile.veg;
    if (['auto', 'light', 'dark'].indexOf(s.theme) < 0) s.theme = 'auto';
    if (!H.PALETTES.some(function (p) { return p.id === s.palette; })) s.palette = H.PALETTES[0].id;
    s.budget = Math.max(0, Number(s.budget) || 0);
    return s;
  }

  // Một mục nhật ký hợp lệ hoặc null. Dùng cả khi đọc dữ liệu đã lưu lẫn khi thêm mới.
  function cleanDiary(e) {
    if (!e || typeof e !== 'object') return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return null;
    if (['sang', 'trua', 'toi', 'phu', 'khac'].indexOf(e.slot) < 0) return null;
    if (!(Number.isInteger(e.feel) && e.feel >= 1 && e.feel <= 4)) return null;
    return {
      id: typeof e.id === 'string' && e.id ? e.id.slice(0, 40) : 'd' + Date.now().toString(36) + U.rand(1000),
      date: e.date, slot: e.slot, feel: e.feel,
      symptoms: (Array.isArray(e.symptoms) ? e.symptoms : []).filter(function (x) { return H.SYMPTOMS.indexOf(x) >= 0; }).filter(function (x, i, a) { return a.indexOf(x) === i; }),
      dishes: (Array.isArray(e.dishes) ? e.dishes : []).filter(function (id) { return H.DISH_BY_ID[id]; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 4),
      note: String(e.note || '').slice(0, 200),
      ts: Number(e.ts) || Date.now()
    };
  }

  // Giờ phải dạng HH:MM hợp lệ, các cờ là boolean, số phút nằm trong khoảng cho phép.
  function sanitizeRemind(r) {
    var def = defaultRemind();
    function okTime(t) { return typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t); }
    r.times = Object.assign({}, def.times, r.times && typeof r.times === 'object' ? r.times : {});
    Object.keys(def.times).forEach(function (k) { if (!okTime(r.times[k])) r.times[k] = def.times[k]; });
    r.kinds = Object.assign({}, def.kinds, r.kinds && typeof r.kinds === 'object' ? r.kinds : {});
    Object.keys(def.kinds).forEach(function (k) { r.kinds[k] = !!r.kinds[k]; });
    if (!okTime(r.shopAt)) r.shopAt = def.shopAt;
    r.prepLead = [0, 5, 10, 15, 20, 30].indexOf(r.prepLead) >= 0 ? r.prepLead : def.prepLead;
    ['on', 'notify', 'sound', 'vibrate'].forEach(function (k) { r[k] = !!r[k]; });
    if (typeof r.bannerHiddenOn !== 'string') r.bannerHiddenOn = '';
  }

  // Cho phép test giả lập giờ: H.nowFn = function () { return new Date(...); }
  H.now = function () { return H.nowFn ? H.nowFn() : new Date(); };

  H.state = load();
  // dọn nhật ký nhắc và lượt "đã ăn" cũ hơn 4 ngày cho khỏi phình (khoá bắt đầu bằng ngày YYYY-MM-DD)
  (function () {
    var cutoff = U.iso(U.addDays(new Date(), -4));
    ['remindLog', 'ate'].forEach(function (k) {
      Object.keys(H.state[k]).forEach(function (key) { if (key.slice(0, 10) < cutoff) delete H.state[k][key]; });
    });
  })();

  var timer = null;
  H.save = function () {
    clearTimeout(timer);
    timer = setTimeout(H.saveNow, 120);
  };
  H.saveNow = function () {
    clearTimeout(timer);
    try { localStorage.setItem(KEY, JSON.stringify(H.state)); } catch (e) { /* bỏ qua */ }
  };
  H.resetAll = function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ }
    H.state = defaults();
    H.ui.meal = H.autoMeal();
  };

  // Trạng thái chỉ sống trong phiên (không lưu)
  H.autoMeal = function (d) {
    var h = (d || new Date()).getHours();
    if (h < 10) return 'sang';
    if (h < 14) return 'trua';
    if (h < 17) return 'phu';
    if (h < 21) return 'toi';
    return 'phu';
  };
  H.ui = {
    meal: H.autoMeal(),
    result: null,            // { id, source: 'spin' | 'daily' }
    spinning: false,
    exploreQ: '', exploreMeal: 'all', exploreAll: false, exploreFav: false, exploreSort: 'hop',
    weekOffset: 0, day: 'all',
    guideQ: '', guideV: 'all', guideG: 'all',
    rankTab: 'demo'
  };

  // ───────────── chọn món theo hồ sơ ─────────────
  H.maxCare = function (p) {
    p = p || H.state.profile;
    var base = { cap: 1, doi: 2, on: 3 }[p.stage] || 2;
    var shift = { nhe: 1, vua: 0, nang: -1 }[p.severity] || 0;
    return U.clamp(base + shift, 1, 3);
  };

  H.canMake = function (d, p) {
    p = p || H.state.profile;
    if (d.mode === 'out' || d.tools.indexOf('khong') >= 0) return true;
    return d.tools.some(function (t) { return p.tools.indexOf(t) >= 0; });
  };

  H.isExcluded = function (id) { return H.state.excluded.indexOf(id) >= 0; };

  // Hợp với hồ sơ dạ dày + dụng cụ + chay (chưa tính các giới hạn tự đặt).
  H.fitsProfile = function (d, p) {
    p = p || H.state.profile;
    if (d.care > H.maxCare(p)) return false;
    if (!H.canMake(d, p)) return false;
    if (p.veg && !d.veg) return false;
    return true;
  };

  // ───────────── mức vị: bị khoá theo hồ sơ dạ dày ─────────────
  // Mức tối đa được phép của một vị (cay, man, chua, beo) với hồ sơ hiện tại.
  H.flavorCap = function (k, p) { return H.FLAVOR_CAPS[H.maxCare(p)][k]; };
  // Mức bạn đặt (không thể vượt mức được phép). Chưa chỉnh thì lấy luôn mức tối đa được phép.
  H.flavorLimit = function (k, p) {
    p = p || H.state.profile;
    var v = p.flavor ? p.flavor[k] : null;
    var cap = H.flavorCap(k, p);
    return v == null ? cap : Math.min(v, cap);
  };
  H.setFlavor = function (k, v) {
    var cap = H.flavorCap(k);
    v = U.clamp(Number(v) || 0, 0, cap);
    H.state.profile.flavor[k] = v >= cap ? null : v;   // đặt bằng mức tối đa thì coi như "theo hồ sơ"
    H.save();
  };
  H.flavorLabel = function (k, level) {
    return H.FLAVORS.filter(function (f) { return f.id === k; })[0].levels[level];
  };

  // Các giới hạn tự đặt mà món này đang vượt (mảng câu ngắn, rỗng nếu món nằm trong giới hạn).
  H.limitFlags = function (d, f) {
    f = f || H.state.filters;
    var out = [];
    if (f.maxTime && d.time != null && d.time > f.maxTime) out.push('Nấu ' + d.time + ' phút, hơn mức ' + f.maxTime + ' phút bạn đặt');
    if (f.maxCost && d.cost > f.maxCost) out.push('Giá ' + U.vnd(d.cost) + ', hơn mức ' + U.vnd(f.maxCost) + ' bạn đặt');
    if (f.maxLevel && d.level > f.maxLevel) out.push('Khó hơn mức "' + H.LEVELS[f.maxLevel - 1].name.toLowerCase() + '" bạn chọn');
    H.FLAVORS.forEach(function (fv) {
      var lim = H.flavorLimit(fv.id);
      if (d.fl[fv.id] > lim) out.push(fv.name.split(' ')[0] + ' hơn mức bạn đặt (' + H.flavorLabel(fv.id, d.fl[fv.id]).toLowerCase() + ')');
    });
    return out;
  };
  H.fitsLimits = function (d, f) { return H.limitFlags(d, f).length === 0; };

  // Bộ lọc để khám phá: cách ăn, năng lượng, nguyên liệu chính (cộng với các giới hạn ở trên).
  H.matchesFilters = function (d, f) {
    f = f || H.state.filters;
    if (f.mode !== 'all' && d.mode !== f.mode) return false;
    if (f.energy !== 'all' && d.energy !== f.energy) return false;
    if (f.proteins.length && !d.proteins.some(function (p) { return f.proteins.indexOf(p) >= 0; })) return false;
    return H.fitsLimits(d, f);
  };

  // Các bộ lọc đang bật (khác mặc định) để hiện thành nhãn có nút xoá. key dùng cho data-act="clear-filter".
  H.activeFilters = function () {
    var S = H.state, f = S.filters, out = [];
    if (f.mode !== 'home') out.push({ key: 'mode', label: f.mode === 'all' ? 'Cả món ăn ngoài' : 'Chỉ ăn ngoài' });
    if (f.energy !== 'all') out.push({ key: 'energy', label: { thap: 'Năng lượng thấp', tb: 'Năng lượng vừa', cao: 'Năng lượng cao' }[f.energy] });
    if (f.maxTime) out.push({ key: 'maxTime', label: H.timeLabel(f.maxTime, true) });
    if (f.maxCost) out.push({ key: 'maxCost', label: H.costLabel(f.maxCost, true) });
    if (f.maxLevel) out.push({ key: 'maxLevel', label: H.LEVELS[f.maxLevel - 1].name });
    if (f.proteins.length) out.push({ key: 'proteins', label: f.proteins.map(function (id) { return H.PROTEINS.filter(function (p) { return p.id === id; })[0].name; }).join(', ') });
    if (S.profile.veg) out.push({ key: 'veg', label: 'Món chay' });
    H.FLAVORS.forEach(function (fv) {
      if (H.flavorLimit(fv.id) < H.flavorCap(fv.id)) out.push({ key: 'flavor-' + fv.id, label: fv.name.split(' ')[0] + ': ' + H.flavorLabel(fv.id, H.flavorLimit(fv.id)).toLowerCase() });
    });
    return out;
  };
  H.clearFilter = function (key) {
    var S = H.state;
    if (key === 'mode') S.filters.mode = 'home';
    else if (key === 'energy') S.filters.energy = 'all';
    else if (key === 'maxTime' || key === 'maxCost' || key === 'maxLevel') S.filters[key] = 0;
    else if (key === 'proteins') S.filters.proteins = [];
    else if (key === 'veg') S.profile.veg = false;
    else if (key.indexOf('flavor-') === 0) S.profile.flavor[key.slice(7)] = null;
    H.save();
  };
  H.resetFilters = function () {
    H.state.filters = defaultFilters();
    H.state.profile.veg = false;
    H.FLAVORS.forEach(function (f) { H.state.profile.flavor[f.id] = null; });
    H.save();
  };

  H.timeLabel = function (n, max) {
    if (!n) return 'Bất kỳ';
    var t = n >= 60 && n % 60 === 0 ? (n / 60) + ' giờ' : n + ' phút';
    return max ? 'Tối đa ' + t : t;
  };
  H.costLabel = function (n, max) {
    if (!n) return 'Bất kỳ';
    return (max ? 'Tối đa ' : '') + U.vnd(n);
  };

  // Các món có thể đưa lên vòng quay (chưa loại món bị bỏ).
  H.candidates = function (meal) {
    return H.DISHES.filter(function (d) {
      return d.meals.indexOf(meal) >= 0 && H.fitsProfile(d) && H.matchesFilters(d);
    });
  };
  H.wheelPool = function (meal) {
    return H.candidates(meal).filter(function (d) { return !H.isExcluded(d.id); });
  };

  // Gợi ý cố định theo ngày để trang chủ luôn có nội dung ngay khi mở.
  H.suggest = function (meal, dateISO) {
    var pool = H.wheelPool(meal);
    if (!pool.length) return null;
    var p = H.state.profile;
    var key = (dateISO || U.iso(new Date())) + meal + p.stage + p.severity;
    return pool[U.hash(key) % pool.length];
  };

  H.countFit = function () {
    return H.DISHES.filter(function (d) { return H.fitsProfile(d) && H.fitsLimits(d) && !H.isExcluded(d.id); }).length;
  };

  // ───────────── yêu thích / loại món ─────────────
  H.toggleFav = function (id) {
    var i = H.state.favs.indexOf(id);
    if (i >= 0) H.state.favs.splice(i, 1); else H.state.favs.push(id);
    H.save();
    return i < 0;
  };
  H.toggleExcluded = function (id) {
    var i = H.state.excluded.indexOf(id);
    if (i >= 0) H.state.excluded.splice(i, 1); else H.state.excluded.push(id);
    H.save();
  };

  // Chấm sao 1 đến 5. Chạm lại đúng số sao đang chấm thì bỏ chấm. Trả về điểm hiện tại (0 = chưa chấm).
  H.ratingOf = function (id) { return H.state.ratings[id] || 0; };
  H.rate = function (id, n) {
    if (!H.DISH_BY_ID[id]) return 0;
    if (!n || H.state.ratings[id] === n) delete H.state.ratings[id]; else H.state.ratings[id] = n;
    H.save();
    return H.ratingOf(id);
  };
  // Điểm "gu của bạn" dùng khi tự xếp thực đơn: sao cao và món yêu thích lên trước, sao thấp xuống sau.
  H.tasteBonus = function (id) {
    var r = H.ratingOf(id), b = r ? (r - 3) * 0.7 : 0;
    if (H.state.favs.indexOf(id) >= 0) b += 0.6;
    return b;
  };

  // ───────────── kế hoạch ─────────────
  H.slotsOn = function () { return H.state.snack ? ['sang', 'trua', 'toi', 'phu'] : ['sang', 'trua', 'toi']; };
  H.getMeal = function (dateISO, slot) {
    var day = H.state.plan[dateISO];
    return day && day[slot] && H.DISH_BY_ID[day[slot]] ? day[slot] : null;
  };
  H.setMeal = function (dateISO, slot, id) {
    H.setCooked(dateISO, slot, false);   // đổi món thì coi như chưa nấu, hoàn lại nguyên liệu đã trừ
    var day = H.state.plan[dateISO] || (H.state.plan[dateISO] = {});
    if (id) day[slot] = id; else delete day[slot];
    if (!Object.keys(day).length) delete H.state.plan[dateISO];
    H.save();
  };
  // Chốt món: ghi vào lịch và tính vào bảng xếp hạng cá nhân.
  H.pinMeal = function (id, dateISO, slot) {
    if (slot === 'phu') H.state.snack = true;   // bữa phụ được ghim thì hiện luôn hàng bữa phụ
    H.setMeal(dateISO, slot, id);
    H.state.picks[id] = (H.state.picks[id] || 0) + 1;
    H.state.log.push({ t: Date.now(), date: dateISO, slot: slot, id: id });
    if (H.state.log.length > 300) H.state.log.splice(0, H.state.log.length - 300);
    H.save();
  };
  // Đánh dấu đã nấu. Khi nấu xong, nguyên liệu của món được trừ khỏi tủ lạnh; bỏ đánh dấu thì cộng lại.
  H.setCooked = function (dateISO, slot, on) {
    var S = H.state, k = dateISO + ':' + slot;
    if (on && !S.cooked[k]) {
      S.cooked[k] = true;
      var id = H.getMeal(dateISO, slot), d = id && H.DISH_BY_ID[id];
      if (d && d.mode === 'home') {
        var used = {};
        d.ing.forEach(function (p) {
          if (H.INGREDIENTS[p[0]].staple) return;
          var take = Math.min(H.usableStock(p[0]), p[1]);
          if (take > 0) { used[p[0]] = [take, H.expOf(p[0])]; H.addStock(p[0], -take); }
        });
        if (Object.keys(used).length) S.consumed[k] = used;
      }
      H.save();
    } else if (!on && S.cooked[k]) {
      delete S.cooked[k];
      var back = S.consumed[k];
      if (back) {
        Object.keys(back).forEach(function (id2) { H.addStock(id2, back[id2][0], H.stockOf(id2) ? {} : { exp: back[id2][1] }); });
        delete S.consumed[k];
      }
      H.save();
    }
    return !!S.cooked[k];
  };
  H.toggleCooked = function (dateISO, slot) {
    return H.setCooked(dateISO, slot, !H.state.cooked[dateISO + ':' + slot]);
  };
  // Xoá cả một ngày khỏi kế hoạch (và hoàn lại nguyên liệu của các bữa đã nấu).
  H.clearDay = function (dateISO) {
    ['sang', 'trua', 'toi', 'phu'].forEach(function (s) { H.setCooked(dateISO, s, false); });
    delete H.state.plan[dateISO];
    H.save();
  };

  H.weekStartOf = function (offset) {
    return U.addDays(U.weekStart(new Date()), (offset || 0) * 7);
  };
  H.weekDays = function (start) {
    var a = [];
    for (var i = 0; i < 7; i++) a.push(U.addDays(start, i));
    return a;
  };

  H.dayStats = function (dateISO) {
    var s = { kcal: 0, cost: 0, time: 0, n: 0 };
    H.slotsOn().forEach(function (slot) {
      var id = H.getMeal(dateISO, slot);
      if (!id) return;
      var d = H.DISH_BY_ID[id];
      s.n++; s.kcal += d.kcal; s.cost += d.cost; s.time += d.time || 0;
    });
    return s;
  };

  H.weekStats = function (start) {
    var st = { total: H.slotsOn().length * 7, planned: 0, cooked: 0, cost: 0, kcal: 0 };
    H.weekDays(start).forEach(function (day) {
      var iso = U.iso(day);
      H.slotsOn().forEach(function (slot) {
        var id = H.getMeal(iso, slot);
        if (!id) return;
        st.planned++;
        st.cost += H.DISH_BY_ID[id].cost;
        st.kcal += H.DISH_BY_ID[id].kcal;
        if (H.state.cooked[iso + ':' + slot]) st.cooked++;
      });
    });
    return st;
  };

  // Xếp thực đơn tuần. mode 'fill' chỉ điền ô trống, 'all' xếp lại cả tuần.
  H.autoPlan = function (start, mode) {
    var S = H.state;
    var slots = H.slotsOn();
    var days = H.weekDays(start).map(U.iso);

    if (mode === 'all') {
      days.forEach(function (d) { H.clearDay(d); });
    }

    var used = {};
    days.forEach(function (d) {
      slots.forEach(function (s) {
        var id = H.getMeal(d, s);
        if (id) used[id] = (used[id] || 0) + 1;
      });
    });

    // Mỗi bữa có hai nhóm món: nằm trong giới hạn bạn đặt (thời gian, giá, độ khó, mức vị) và nhóm dự phòng chỉ cần hợp hồ sơ.
    // Nhóm dự phòng chỉ dùng khi không còn món nào trong giới hạn.
    var pools = {}, loose = {};
    slots.forEach(function (s) {
      var all = H.DISHES.filter(function (d) {
        return d.mode === 'home' && d.meals.indexOf(s) >= 0 && H.fitsProfile(d) && !H.isExcluded(d.id);
      });
      loose[s] = all;
      pools[s] = all.filter(function (d) { return H.fitsLimits(d); });
    });

    var res = { filled: 0, repeats: 0, missing: [], relaxed: 0 };
    days.forEach(function (date, di) {
      var dayCost = 0;
      slots.forEach(function (s) {
        var id = H.getMeal(date, s);
        if (id) dayCost += H.DISH_BY_ID[id].cost;
      });
      slots.forEach(function (s) {
        if (H.getMeal(date, s)) return;
        var pool = pools[s], isLoose = false;
        if (!pool.length) { pool = loose[s]; isLoose = true; }
        if (!pool.length) { if (res.missing.indexOf(s) < 0) res.missing.push(s); return; }
        var kinds = slots.map(function (x) { return H.getMeal(date, x); }).filter(Boolean)
          .map(function (id) { return H.DISH_BY_ID[id].kind; });
        var prev = di > 0 ? H.getMeal(days[di - 1], s) : null;
        var best = null, bestScore = -1e9;
        pool.forEach(function (d) {
          var score = Math.random();
          score -= (used[d.id] || 0) * 10;                 // tránh lặp món trong tuần
          if (kinds.indexOf(d.kind) >= 0) score -= 0.6;   // đa dạng trong ngày
          if (prev === d.id) score -= 2;                  // không trùng bữa cùng giờ hôm qua
          score += Math.min(2, H.urgencyOf(d).score) * 0.4;   // ưu tiên món dùng nguyên liệu sắp hết hạn
          score += H.tasteBonus(d.id);                        // món bạn chấm cao hoặc yêu thích được ưu tiên
          if (S.budget && dayCost + d.cost > S.budget) score -= 1 + (dayCost + d.cost - S.budget) / 6000;   // vượt càng nhiều càng bị trừ điểm
          if (score > bestScore) { bestScore = score; best = d; }
        });
        if (best) {
          if (isLoose) res.relaxed++;
          if (used[best.id]) res.repeats++;
          used[best.id] = (used[best.id] || 0) + 1;
          dayCost += best.cost;
          var day = S.plan[date] || (S.plan[date] = {});
          day[s] = best.id;
          res.filled++;
        }
      });
    });
    H.save();
    return res;
  };

  // Đổi ngẫu nhiên một bữa sang món khác (ưu tiên món chưa có trong tuần).
  H.rerollMeal = function (dateISO, slot, start) {
    var cur = H.getMeal(dateISO, slot);
    var inWeek = {};
    H.weekDays(start).forEach(function (d) {
      H.slotsOn().forEach(function (s) { var id = H.getMeal(U.iso(d), s); if (id) inWeek[id] = true; });
    });
    var pool = H.DISHES.filter(function (d) {
      return d.mode === 'home' && d.meals.indexOf(slot) >= 0 && H.fitsProfile(d) && !H.isExcluded(d.id) && d.id !== cur;
    });
    var inLimits = pool.filter(function (d) { return H.fitsLimits(d); });
    if (inLimits.length) pool = inLimits;
    if (!pool.length) return null;
    var fresh = pool.filter(function (d) { return !inWeek[d.id]; });
    var pick = U.pick(fresh.length ? fresh : pool);
    H.setMeal(dateISO, slot, pick.id);
    return pick;
  };

  // ───────────── tủ lạnh: số lượng và hạn dùng ─────────────
  H.today = function () { return U.iso(H.now()); };
  H.stockOf = function (id) { var p = H.state.pantry[id]; return p ? p.qty : 0; };
  H.expOf = function (id) { var p = H.state.pantry[id]; return p ? p.exp : ''; };
  // Số ngày còn lại tới hạn dùng (âm = đã hết hạn, null = không theo dõi hạn).
  H.daysLeft = function (id) {
    var e = H.expOf(id);
    if (!e) return null;
    return Math.round((+U.parse(e) - +U.parse(H.today())) / 86400000);
  };
  H.isExpired = function (id) { var d = H.daysLeft(id); return d != null && d < 0; };
  // Lượng dùng được (đồ hết hạn không tính).
  H.usableStock = function (id) { return H.isExpired(id) ? 0 : H.stockOf(id); };
  // Có nguyên liệu này (đủ lượng need nếu có truyền vào) và còn hạn.
  H.hasIngredient = function (id, need) {
    var q = H.usableStock(id);
    return need == null ? q > 0 : q + 1e-9 >= need;
  };
  H.defaultExp = function (id) {
    var days = H.SHELF_DAYS[id];
    return days > 0 ? U.iso(U.addDays(H.now(), days)) : '';
  };
  // Cộng (hoặc trừ, nếu qty âm) vào tủ lạnh. Hết thì xoá khỏi tủ. o.exp ghi đè hạn dùng.
  H.addStock = function (id, qty, o) {
    o = o || {};
    var P = H.state.pantry, p = P[id];
    var expired = p && H.isExpired(id);
    var q = (expired && qty > 0 ? 0 : (p ? p.qty : 0)) + qty;   // thêm đồ mới vào chỗ đã hết hạn: bỏ phần cũ
    if (q <= 1e-9) { delete P[id]; H.save(); return; }
    q = Math.round(q * 100) / 100;
    if (!p) P[id] = { qty: q, exp: o.exp != null ? o.exp : H.defaultExp(id) };
    else {
      p.qty = q;
      if (o.exp != null) p.exp = o.exp;
      else if (qty > 0 && (expired || !p.exp)) p.exp = H.defaultExp(id);
    }
    H.save();
  };
  H.setStock = function (id, qty, exp) {
    qty = Number(qty);
    if (!isFinite(qty) || qty <= 0) { delete H.state.pantry[id]; H.save(); return; }
    H.state.pantry[id] = { qty: Math.round(qty * 100) / 100, exp: /^\d{4}-\d{2}-\d{2}$/.test(exp) ? exp : '' };
    H.save();
  };
  H.pantryItems = function () {
    var catOrder = {};
    H.CATEGORIES.forEach(function (c, i) { catOrder[c.id] = i; });
    return Object.keys(H.state.pantry).map(function (id) {
      var p = H.state.pantry[id];
      return { id: id, it: H.INGREDIENTS[id], qty: p.qty, exp: p.exp, days: H.daysLeft(id) };
    }).sort(function (a, b) {
      return (catOrder[a.it.cat] - catOrder[b.it.cat]) || a.it.name.localeCompare(b.it.name, 'vi');
    });
  };
  H.expiringItems = function (maxDays) {
    return H.pantryItems().filter(function (x) { return x.days != null && x.days >= 0 && x.days <= maxDays; })
      .sort(function (a, b) { return a.days - b.days; });
  };
  H.expiredItems = function () { return H.pantryItems().filter(function (x) { return x.days != null && x.days < 0; }); };

  // Nguyên liệu cần cho các bữa nấu tại nhà chưa nấu trong N ngày tới (kể cả hôm nay): { mã: lượng }.
  H.needNext = function (days) {
    var need = {}, start = U.parse(H.today());
    for (var i = 0; i < days; i++) {
      var iso = U.iso(U.addDays(start, i));
      H.slotsOn().forEach(function (slot) {
        var id = H.getMeal(iso, slot), d = id && H.DISH_BY_ID[id];
        if (!d || d.mode !== 'home' || H.state.cooked[iso + ':' + slot]) return;
        d.ing.forEach(function (p) {
          if (H.INGREDIENTS[p[0]].staple) return;
          need[p[0]] = (need[p[0]] || 0) + p[1];
        });
      });
    }
    return need;
  };
  // Đồ còn trong tủ nhưng sắp hết: dưới mức "low" của gói, hoặc không đủ cho các bữa đã xếp trong 3 ngày tới.
  H.lowStock = function () {
    var need = H.needNext(3), out = [];
    Object.keys(H.state.pantry).forEach(function (id) {
      var q = H.usableStock(id);
      if (q <= 0) return;
      var n = need[id] || 0;
      if (q <= H.packOf(id).low || (n > 0 && q < n)) out.push({ id: id, it: H.INGREDIENTS[id], qty: q, need: n });
    });
    return out;
  };
  // Nguyên liệu có thể thay thế, ưu tiên thứ bạn đang có trong tủ.
  H.subsFor = function (id) {
    return (H.SUBS[id] || []).map(function (s) {
      var it = H.INGREDIENTS[s[0]];
      return { id: s[0], name: it.name, emoji: it.emoji, note: s[1], have: H.usableStock(s[0]) > 0 };
    }).sort(function (a, b) { return (b.have ? 1 : 0) - (a.have ? 1 : 0); });
  };
  // Món dùng nhiều đồ sắp hết hạn càng gấp: score cao thì nên nấu trước. why liệt kê nguyên liệu đó.
  H.urgencyOf = function (d) {
    var score = 0, why = [];
    d.ing.forEach(function (p) {
      var left = H.daysLeft(p[0]);
      if (left == null || left < 0 || H.stockOf(p[0]) <= 0 || H.INGREDIENTS[p[0]].staple) return;
      var w = left <= 1 ? 3 : (left <= 2 ? 2 : (left <= 4 ? 1 : (left <= 7 ? 0.5 : 0)));
      if (w) { score += w; why.push({ id: p[0], days: left }); }
    });
    return { score: score, why: why };
  };
  // Phần rắc thêm rất ít (hành lá, rau thơm...) không bắt buộc phải có trong tủ lạnh.
  H.isGarnish = function (id, qty) {
    var it = H.INGREDIENTS[id];
    return !!it && it.unit === 'g' && qty <= 5;
  };
  // Các món nấu được từ đồ trong tủ lạnh: missing = nguyên liệu còn thiếu (thiếu cả khi còn nhưng không đủ lượng).
  H.fridgeMatches = function () {
    var out = [];
    H.DISHES.forEach(function (d) {
      if (d.mode !== 'home' || !H.fitsProfile(d) || H.isExcluded(d.id)) return;
      var need = d.ing.filter(function (p) { return !H.INGREDIENTS[p[0]].staple && !H.isGarnish(p[0], p[1]); });
      var missing = need.filter(function (p) { return !H.hasIngredient(p[0], p[1]); });
      out.push({
        dish: d, missing: missing.map(function (p) { return p[0]; }),
        short: missing.map(function (p) { return { id: p[0], need: p[1], have: H.usableStock(p[0]) }; }),
        have: need.length - missing.length, total: need.length, urgency: H.urgencyOf(d)
      });
    });
    return out;
  };

  // ───────────── danh sách đi chợ ─────────────
  // Cần mua = lượng cần cho các bữa chưa nấu trong tuần trừ đi lượng còn trong tủ lạnh.
  // Bấm "đã mua" thì lượng đó được cộng vào tủ lạnh (bought[tuần:mã] lưu số lượng đã mua).
  H.shopping = function (start) {
    var totals = {};
    var meals = 0;
    H.weekDays(start).forEach(function (day) {
      var iso = U.iso(day);
      H.slotsOn().forEach(function (slot) {
        var id = H.getMeal(iso, slot);
        if (!id) return;
        var d = H.DISH_BY_ID[id];
        if (d.mode !== 'home' || H.state.cooked[iso + ':' + slot]) return;
        meals++;
        d.ing.forEach(function (p) {
          var it = H.INGREDIENTS[p[0]];
          if (it.staple) return;
          totals[p[0]] = (totals[p[0]] || 0) + p[1];
        });
      });
    });
    var wk = U.iso(start);
    var catOrder = {};
    H.CATEGORIES.forEach(function (c, i) { catOrder[c.id] = i; });
    var items = Object.keys(totals).map(function (id) {
      var it = H.INGREDIENTS[id], need = totals[id];
      var b = H.state.bought[wk + ':' + id];
      var boughtQty = typeof b === 'number' ? b : 0;
      var before = Math.max(0, H.usableStock(id) - boughtQty);     // lượng đã có trước khi bấm "đã mua"
      var toBuy = Math.max(0, need - before);
      var covered = toBuy <= 1e-9 && !b;                           // đã đủ trong tủ lạnh
      var qty = covered ? need : (b ? (boughtQty || toBuy) : toBuy);
      var cost = covered ? 0 : Math.max(500, Math.round(qty * it.price / 500) * 500);
      return { id: id, it: it, need: need, have: before, qty: qty, cost: cost, inFridge: covered, bought: !!b, partial: !covered && before > 0 };
    }).sort(function (a, b) {
      return (catOrder[a.it.cat] - catOrder[b.it.cat]) || a.it.name.localeCompare(b.it.name, 'vi');
    });
    var total = items.reduce(function (s, x) { return s + (x.inFridge ? 0 : x.cost); }, 0);
    return { items: items, total: total, meals: meals, week: wk };
  };
  H.toggleBought = function (week, id) {
    var k = week + ':' + id, cur = H.state.bought[k];
    if (cur) {
      if (typeof cur === 'number') H.addStock(id, -cur);
      delete H.state.bought[k];
    } else {
      var row = H.shopping(U.parse(week)).items.filter(function (x) { return x.id === id; })[0];
      var qty = row && !row.inFridge ? row.qty : 0;
      H.state.bought[k] = qty > 0 ? qty : true;
      if (qty > 0) H.addStock(id, qty);
    }
    H.save();
  };

  // ───────────── nhật ký ăn uống ─────────────
  // Mỗi bữa (ngày + bữa) có một mục; bữa "khác" thì ghi nhiều mục được.
  H.addDiary = function (e) {
    var c = cleanDiary(Object.assign({}, e, { id: e.id || '' }));
    if (!c) return null;
    if (c.slot !== 'khac') H.state.diary = H.state.diary.filter(function (x) { return !(x.date === c.date && x.slot === c.slot); });
    H.state.diary.push(c);
    H.state.diary.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.ts - b.ts; });
    H.save();
    return c;
  };
  H.deleteDiary = function (id) { H.state.diary = H.state.diary.filter(function (x) { return x.id !== id; }); H.save(); };
  H.diaryFor = function (date, slot) { return H.state.diary.filter(function (x) { return x.date === date && x.slot === slot; })[0] || null; };

  // Thống kê N ngày gần đây: tỷ lệ ổn, món nên cẩn thận (nhiều lần khó chịu), món hợp, triệu chứng hay gặp, trung bình theo ngày.
  H.diaryStats = function (days) {
    var today = U.parse(H.today()), from = U.iso(U.addDays(today, -(days - 1)));
    var E = H.state.diary.filter(function (x) { return x.date >= from; });
    var good = E.filter(function (x) { return x.feel <= 2; }).length;
    var byDish = {}, sym = {};
    E.forEach(function (x) {
      x.dishes.forEach(function (id) {
        var r = byDish[id] || (byDish[id] = { n: 0, bad: 0 });
        r.n++; if (x.feel >= 3) r.bad++;
      });
      x.symptoms.forEach(function (name) { sym[name] = (sym[name] || 0) + 1; });
    });
    var rows = Object.keys(byDish).map(function (id) { return { id: id, n: byDish[id].n, bad: byDish[id].bad }; });
    var series = [];
    for (var i = 6; i >= 0; i--) {
      var iso = U.iso(U.addDays(today, -i)), day = H.state.diary.filter(function (x) { return x.date === iso; });
      series.push({ date: iso, n: day.length, avg: day.length ? day.reduce(function (s2, x) { return s2 + x.feel; }, 0) / day.length : null });
    }
    return {
      total: E.length, good: good, bad: E.length - good,
      watch: rows.filter(function (r) { return r.n >= 2 && r.bad / r.n >= 0.5; }).sort(function (a, b) { return b.bad - a.bad || b.n - a.n; }),
      safe: rows.filter(function (r) { return r.n >= 2 && r.bad === 0; }).sort(function (a, b) { return b.n - a.n; }),
      symptoms: Object.keys(sym).map(function (k) { return { name: k, n: sym[k] }; }).sort(function (a, b) { return b.n - a.n; }),
      series: series
    };
  };

  // ───────────── bảng xếp hạng & cộng đồng ─────────────
  H.myRank = function () {
    return Object.keys(H.state.picks)
      .filter(function (id) { return H.DISH_BY_ID[id]; })
      .map(function (id) { return [id, H.state.picks[id]]; })
      .sort(function (a, b) { return b[1] - a[1]; });
  };

  H.allPosts = function () {
    var mine = H.state.posts.slice().sort(function (a, b) { return b.ts - a.ts; });
    return mine.concat(H.COMMUNITY_SEED);
  };
  H.addPost = function (p) {
    var post = { id: 'p' + Date.now().toString(36) + U.rand(1000), sample: false, mine: true,
      name: p.name, tag: p.tag, stage: p.stage, text: p.text, dish: H.DISH_BY_ID[p.dish] ? p.dish : '', ts: Date.now(), likes: 0 };
    H.state.posts.push(post);
    H.save();
    return post;
  };
  H.deletePost = function (id) {
    H.state.posts = H.state.posts.filter(function (p) { return p.id !== id; });
    H.save();
  };
  H.toggleLike = function (id) {
    if (H.state.liked[id]) delete H.state.liked[id]; else H.state.liked[id] = true;
    H.save();
  };
})(window.HNAG = window.HNAG || {});
