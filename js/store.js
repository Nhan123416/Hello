/* Trạng thái ứng dụng, lưu localStorage, bộ chọn món và thuật toán xếp thực đơn. */
(function (H) {
  'use strict';

  var U = H.util;
  var KEY = 'hnag.v1';

  function defaults() {
    return {
      v: 1,
      onboarded: false,
      theme: 'auto',                       // auto | light | dark
      profile: { stage: 'doi', severity: 'vua', veg: false, tools: ['noi-com', 'bep', 'chao'] },
      filters: { mode: 'home', energy: 'all', quick: false, cheap: false },
      excluded: [],                        // món bị bỏ khỏi vòng quay và kế hoạch
      favs: [],
      plan: {},                            // { 'YYYY-MM-DD': { sang, trua, toi, phu } }
      cooked: {},                          // { 'YYYY-MM-DD:slot': true }
      snack: false,                        // thêm bữa phụ vào kế hoạch tuần
      planSeeded: false,                   // đã tự xếp sẵn thực đơn lần đầu
      budget: 0,                           // ngân sách mỗi ngày (0 = không giới hạn)
      picks: {},                           // { dishId: số lần chốt }
      log: [],                             // [{ t, date, slot, id }]
      fridge: [],                          // mã nguyên liệu đang có
      bought: {},                          // { 'tuần:nguyên liệu': true }
      posts: [],                           // bài viết của người dùng (chỉ lưu trên máy)
      liked: {}
    };
  }

  function load() {
    var s = defaults();
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var o = JSON.parse(raw);
        Object.keys(s).forEach(function (k) {
          if (o[k] === undefined || o[k] === null) return;
          if (k === 'profile' || k === 'filters') s[k] = Object.assign(s[k], o[k]);
          else s[k] = o[k];
        });
      }
    } catch (e) { /* dữ liệu hỏng hoặc bị chặn: dùng mặc định */ }
    // làm sạch kiểu dữ liệu
    ['excluded', 'favs', 'log', 'fridge', 'posts'].forEach(function (k) { if (!Array.isArray(s[k])) s[k] = []; });
    ['plan', 'cooked', 'picks', 'bought', 'liked'].forEach(function (k) { if (!s[k] || typeof s[k] !== 'object') s[k] = {}; });
    if (!Array.isArray(s.profile.tools)) s.profile.tools = ['noi-com', 'bep', 'chao'];
    if (['cap', 'doi', 'on'].indexOf(s.profile.stage) < 0) s.profile.stage = 'doi';
    if (['nhe', 'vua', 'nang'].indexOf(s.profile.severity) < 0) s.profile.severity = 'vua';
    if (['all', 'home', 'out'].indexOf(s.filters.mode) < 0) s.filters.mode = 'home';
    if (['all', 'thap', 'tb', 'cao'].indexOf(s.filters.energy) < 0) s.filters.energy = 'all';
    if (['auto', 'light', 'dark'].indexOf(s.theme) < 0) s.theme = 'auto';
    s.budget = Math.max(0, Number(s.budget) || 0);
    return s;
  }

  H.state = load();

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
    exploreQ: '', exploreMeal: 'all', exploreAll: false, exploreFav: false,
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

  // Hợp với hồ sơ dạ dày + dụng cụ + chay (chưa tính bộ lọc nhanh).
  H.fitsProfile = function (d, p) {
    p = p || H.state.profile;
    if (d.care > H.maxCare(p)) return false;
    if (!H.canMake(d, p)) return false;
    if (p.veg && !d.veg) return false;
    return true;
  };

  H.matchesFilters = function (d, f) {
    f = f || H.state.filters;
    if (f.mode !== 'all' && d.mode !== f.mode) return false;
    if (f.energy !== 'all' && d.energy !== f.energy) return false;
    if (f.quick && d.time != null && d.time > 15) return false;
    if (f.cheap && d.cost > 15000) return false;
    return true;
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
    return H.DISHES.filter(function (d) { return H.fitsProfile(d) && !H.isExcluded(d.id); }).length;
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

  // ───────────── kế hoạch ─────────────
  H.slotsOn = function () { return H.state.snack ? ['sang', 'trua', 'toi', 'phu'] : ['sang', 'trua', 'toi']; };
  H.getMeal = function (dateISO, slot) {
    var day = H.state.plan[dateISO];
    return day && day[slot] && H.DISH_BY_ID[day[slot]] ? day[slot] : null;
  };
  H.setMeal = function (dateISO, slot, id) {
    var day = H.state.plan[dateISO] || (H.state.plan[dateISO] = {});
    if (id) day[slot] = id; else delete day[slot];
    if (!Object.keys(day).length) delete H.state.plan[dateISO];
    delete H.state.cooked[dateISO + ':' + slot];
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
  H.toggleCooked = function (dateISO, slot) {
    var k = dateISO + ':' + slot;
    if (H.state.cooked[k]) delete H.state.cooked[k]; else H.state.cooked[k] = true;
    H.save();
    return !!H.state.cooked[k];
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
      days.forEach(function (d) {
        delete S.plan[d];
        ['sang', 'trua', 'toi', 'phu'].forEach(function (s) { delete S.cooked[d + ':' + s]; });
      });
    }

    var used = {};
    days.forEach(function (d) {
      slots.forEach(function (s) {
        var id = H.getMeal(d, s);
        if (id) used[id] = (used[id] || 0) + 1;
      });
    });

    var pools = {};
    slots.forEach(function (s) {
      pools[s] = H.DISHES.filter(function (d) {
        return d.mode === 'home' && d.meals.indexOf(s) >= 0 && H.fitsProfile(d) && !H.isExcluded(d.id);
      });
    });

    var res = { filled: 0, repeats: 0, missing: [] };
    days.forEach(function (date, di) {
      var dayCost = 0;
      slots.forEach(function (s) {
        var id = H.getMeal(date, s);
        if (id) dayCost += H.DISH_BY_ID[id].cost;
      });
      slots.forEach(function (s) {
        if (H.getMeal(date, s)) return;
        var pool = pools[s];
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
          if (S.budget && dayCost + d.cost > S.budget) score -= 1 + (dayCost + d.cost - S.budget) / 6000;   // vượt càng nhiều càng bị trừ điểm
          if (score > bestScore) { bestScore = score; best = d; }
        });
        if (best) {
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
    if (!pool.length) return null;
    var fresh = pool.filter(function (d) { return !inWeek[d.id]; });
    var pick = U.pick(fresh.length ? fresh : pool);
    H.setMeal(dateISO, slot, pick.id);
    return pick;
  };

  // ───────────── danh sách đi chợ ─────────────
  H.shopping = function (start) {
    var totals = {};
    var meals = 0;
    H.weekDays(start).forEach(function (day) {
      var iso = U.iso(day);
      H.slotsOn().forEach(function (slot) {
        var id = H.getMeal(iso, slot);
        if (!id) return;
        var d = H.DISH_BY_ID[id];
        if (d.mode !== 'home') return;
        meals++;
        d.ing.forEach(function (p) {
          var it = H.INGREDIENTS[p[0]];
          if (it.staple) return;
          totals[p[0]] = (totals[p[0]] || 0) + p[1];
        });
      });
    });
    var wk = U.iso(start);
    var have = {};
    H.state.fridge.forEach(function (id) { have[id] = true; });
    var catOrder = {};
    H.CATEGORIES.forEach(function (c, i) { catOrder[c.id] = i; });
    var items = Object.keys(totals).map(function (id) {
      var it = H.INGREDIENTS[id];
      var cost = Math.max(500, Math.round(totals[id] * it.price / 500) * 500);
      return { id: id, it: it, qty: totals[id], cost: cost, inFridge: !!have[id], bought: !!H.state.bought[wk + ':' + id] };
    }).sort(function (a, b) {
      return (catOrder[a.it.cat] - catOrder[b.it.cat]) || a.it.name.localeCompare(b.it.name, 'vi');
    });
    var total = items.reduce(function (s, x) { return s + (x.inFridge ? 0 : x.cost); }, 0);
    return { items: items, total: total, meals: meals, week: wk };
  };
  H.toggleBought = function (week, id) {
    var k = week + ':' + id;
    if (H.state.bought[k]) delete H.state.bought[k]; else H.state.bought[k] = true;
    H.save();
  };

  // ───────────── tủ lạnh ─────────────
  H.toggleFridge = function (id) {
    var i = H.state.fridge.indexOf(id);
    if (i >= 0) H.state.fridge.splice(i, 1); else H.state.fridge.push(id);
    H.save();
  };
  // Phần rắc thêm rất ít (hành lá, rau thơm...) không bắt buộc phải có trong tủ lạnh.
  H.isGarnish = function (id, qty) {
    var it = H.INGREDIENTS[id];
    return !!it && it.unit === 'g' && qty <= 5;
  };
  H.fridgeMatches = function () {
    var have = {};
    H.state.fridge.forEach(function (id) { have[id] = true; });
    var out = [];
    H.DISHES.forEach(function (d) {
      if (d.mode !== 'home' || !H.fitsProfile(d) || H.isExcluded(d.id)) return;
      var need = d.ing.filter(function (p) { return !H.INGREDIENTS[p[0]].staple && !H.isGarnish(p[0], p[1]); })
        .map(function (p) { return p[0]; });
      var missing = need.filter(function (id) { return !have[id]; });
      out.push({ dish: d, missing: missing, have: need.length - missing.length, total: need.length });
    });
    return out;
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
      name: p.name, tag: p.tag, stage: p.stage, text: p.text, ts: Date.now(), likes: 0 };
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
