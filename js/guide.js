/*
 * Cẩm nang, đưa vào màn "Món ăn" thay vì làm một mục riêng.
 *  - Trên trang từng món: mỗi nguyên liệu được gắn với mục cẩm nang tương ứng (nên dùng, dùng ít, nên tránh, vì sao).
 *  - Ô tìm món cũng tra được nguyên liệu.
 *  - Hộp "Cẩm nang" (mở khi cần): tra nguyên liệu, kiểm tra công thức bất kỳ, gợi ý thay thế, lưu ý chung và dấu hiệu cần đi khám.
 */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;
  var G = H.guide = {};

  var FOOD_BY_ID = {};
  H.FOODS.forEach(function (f) { FOOD_BY_ID[f.id] = f; });

  // Nguyên liệu trong công thức -> mục cẩm nang. Đặt tay cho chắc, khỏi nhận nhầm theo tên ("phi lê" không phải quả lê).
  var FOOD_OF = {
    'gao': 'com-chao', 'nui': 'bun-pho', 'yen-mach': 'yen-mach', 'banh-mi-sw': 'banh-mi-mem', 'banh-quy-lat': 'banh-quy-lat',
    'khoai-tay': 'khoai', 'khoai-lang': 'khoai', 'khoai-mon': 'khoai',
    'mien-dong': 'bun-pho', 'banh-pho': 'bun-pho', 'bun': 'bun-pho', 'banh-canh': 'bun-pho', 'dau-xanh': 'gao-lut', 'bap-ngo': 'gao-lut',
    'uc-ga': 'uc-ga', 'thit-nac': 'thit-nac', 'thit-bo-nac': 'thit-nac', 'ca-phi-le': 'ca-trang', 'tom': 'hai-san', 'trung-ga': 'trung', 'dau-hu': 'dau-hu',
    'bi-do': 'rau-cu-mem', 'bi-xanh': 'rau-cu-mem', 'su-su': 'rau-cu-mem', 'muop': 'rau-cu-mem', 'bau': 'rau-cu-mem', 'ca-rot': 'ca-rot',
    'mong-toi': 'rau-la', 'rau-ngot': 'rau-la', 'cai-ngot': 'rau-la', 'bap-cai': 'bap-cai', 'bong-cai': 'bap-cai',
    'nam': 'nam', 'ca-chua': 'ca-chua', 'dua-leo': 'dua-leo', 'hanh-la': 'hanh-la', 'rau-thom': 'hanh-la', 'gung': 'gung',
    'chuoi': 'chuoi', 'du-du': 'du-du', 'tao': 'tao-le', 'sua-dau-nanh': 'sua-dau-nanh', 'sua-chua': 'sua-chua',
    'muoi': 'nuoc-mam-muoi', 'nuoc-mam': 'nuoc-mam-muoi', 'nuoc-tuong': 'nuoc-mam-muoi', 'duong': 'duong', 'dau-an': 'dau-an'
  };
  G.foodFor = function (ingredientId) { return FOOD_BY_ID[FOOD_OF[ingredientId]] || null; };

  function verdictPill(v) {
    var m = H.VERDICTS[v];
    return '<span class="vpill v-' + v + '"><b aria-hidden="true">' + m.icon + '</b>' + m.label + '</span>';
  }
  G.verdictPill = verdictPill;

  // Nguyên liệu chính của món (bỏ gia vị có sẵn trong bếp) gom theo mục cẩm nang, rồi chia theo mức.
  G.dishFoods = function (d) {
    var byFood = {}, order = [];
    (d.ing || []).forEach(function (p) {
      var it = H.INGREDIENTS[p[0]], f = it && !it.staple ? G.foodFor(p[0]) : null;
      if (!f) return;
      if (!byFood[f.id]) { byFood[f.id] = { food: f, names: [] }; order.push(f.id); }
      byFood[f.id].names.push(it.name.split(' (')[0]);
    });
    var out = { avoid: [], limit: [], good: [] };
    order.forEach(function (id) { out[byFood[id].food.v].push(byFood[id]); });
    return out;
  };

  // ───────────── dinh dưỡng đơn giản: món có đủ tinh bột, đạm, rau không ─────────────
  var GROUPS = [
    { id: 'tinhbot', name: 'Tinh bột', emoji: '🍚', add: 'ăn kèm cơm mềm hoặc cháo' },
    { id: 'dam', name: 'Đạm', emoji: '🍗', add: 'thêm trứng, đậu hũ hoặc thịt nạc' },
    { id: 'rau', name: 'Rau củ', emoji: '🥬', add: 'ăn kèm rau củ nấu chín' }
  ];
  G.nutrition = function (d) {
    if (d.mode !== 'home') return { kcal: d.kcal, groups: [], note: 'Món ăn ngoài: nhóm chất thay đổi theo từng quán, hãy gọi đúng như hướng dẫn.' };
    var has = {};
    (d.ing || []).forEach(function (p) {
      var it = H.INGREDIENTS[p[0]];
      if (!it || it.staple) return;
      if (it.cat === 'khac') has.dam = true;   // sữa chua, sữa đậu nành
      else has[it.cat] = true;
    });
    var groups = GROUPS.map(function (g) { return { id: g.id, name: g.name, emoji: g.emoji, add: g.add, has: !!has[g.id] }; });
    var snack = (d.meals.length === 1 && d.meals[0] === 'phu') || d.kind === 'Ăn vặt' || d.kind === 'Tráng miệng';
    var light = d.kind === 'Điểm tâm';   // bữa sáng nhẹ: không đòi rau, bữa chính trong ngày sẽ bù
    var shown = light ? groups.filter(function (g) { return g.id !== 'rau'; }) : groups;
    var miss = shown.filter(function (g) { return !g.has; });
    var note = snack ? 'Món ăn nhẹ cho bữa phụ, không cần đủ nhóm chất.'
      : !miss.length ? (light ? 'Đủ tinh bột và đạm cho một bữa sáng nhẹ. Bữa chính trong ngày nhớ có rau củ.' : 'Đủ ba nhóm chất cho một bữa chính.')
      : 'Chưa có ' + miss.map(function (g) { return g.name.toLowerCase(); }).join(', ') + ': ' + miss.map(function (g) { return g.add; }).join('; ') + '.';
    return { kcal: d.kcal, groups: snack ? [] : shown, note: note };
  };

  // ───────────── tra nguyên liệu ─────────────
  function raw(f) {
    if (!f._raw) { f._raw = [f.name].concat(f.alias).join(' ').toLowerCase(); f._norm = U.norm(f._raw); }
    return f;
  }
  function searchFoods(q, v, g) {
    return H.FOODS.filter(function (f) {
      if (v && v !== 'all' && f.v !== v) return false;
      if (g && g !== 'all' && f.group !== g) return false;
      raw(f);
      return !q || U.searchMatch(f._raw, f._norm, q);
    });
  }
  // Gợi ý nhanh khi gõ vào ô tìm món: tối đa vài mục cẩm nang khớp với từ khoá.
  G.search = function (q, limit) {
    q = String(q || '').trim();
    if (U.norm(q).length < 2) return [];
    return searchFoods(q).slice(0, limit || 2);
  };

  function foodCard(f) {
    return '<li class="food v-' + f.v + '"><div class="food-top"><span class="food-e" aria-hidden="true">' + f.emoji + '</span>' +
      '<h3>' + esc(f.name) + '</h3>' + verdictPill(f.v) + '</div>' +
      '<p class="food-why"><strong>Vì sao: </strong>' + esc(f.why) + '</p>' +
      '<p class="food-tip"><strong>' + (f.v === 'good' ? 'Lưu ý' : 'Nên làm') + ': </strong>' + esc(f.tip) + '</p></li>';
  }

  // Thẻ gọn dưới ô tìm món. Nếu còn nhiều mục khớp hơn số đang hiện thì có nút xem thêm trong hộp Cẩm nang.
  G.lookupHtml = function (q) {
    var all = searchFoods(String(q || '').trim()), list = U.norm(q).length < 2 ? [] : all.slice(0, 2);
    if (!list.length) return '';
    return '<section class="lookup" aria-label="Cẩm nang cho từ khoá “' + esc(q) + '”"><p class="lookup-h">' + H.icon('book', { size: 16 }) + 'Cẩm nang cho “' + esc(q.trim()) + '”</p>' +
      '<ul class="foods compact">' + list.map(foodCard).join('') + '</ul>' +
      (all.length > list.length ? '<button type="button" class="link-btn" data-act="open-guide" data-tab="tra" data-q="' + esc(q.trim()) + '">Xem thêm ' + (all.length - list.length) + ' mục trong cẩm nang</button>' : '') +
      '</section>';
  };

  // ───────────── khối "cẩm nang" trên trang từng món ─────────────
  function noteRow(x) {
    var f = x.food;
    return '<li class="gnote v-' + f.v + '"><span class="gn-e" aria-hidden="true">' + f.emoji + '</span><div class="gn-b">' +
      '<strong>' + esc(x.names.join(', ')) + '</strong>' + verdictPill(f.v) +
      '<p>' + esc(f.tip) + '</p></div></li>';
  }
  function goodRow(x) {
    var f = x.food;
    return '<li class="gnote v-good"><span class="gn-e" aria-hidden="true">' + f.emoji + '</span><div class="gn-b"><strong>' + esc(x.names.join(', ')) + '</strong>' +
      '<p>' + esc(f.why) + '</p></div></li>';
  }
  // Từng nguyên liệu của món theo cẩm nang: nguyên liệu cần chú ý hiện ngay, nguyên liệu ổn gập lại.
  G.dishHtml = function (d) {
    var g = G.dishFoods(d), warn = g.avoid.concat(g.limit);
    if (!warn.length && !g.good.length) return '';
    var h = '<div class="gdish"><h3 class="gdish-h">' + H.icon('book', { size: 16 }) + 'Cẩm nang nói gì về nguyên liệu của món</h3>';
    if (warn.length) h += '<ul class="gnotes">' + warn.map(noteRow).join('') + '</ul>';
    else h += '<p class="note ok">' + H.icon('check', { size: 16, stroke: 3 }) + '<span>Các nguyên liệu chính đều thuộc nhóm nên dùng.</span></p>';
    if (g.good.length) {
      h += '<details class="fold"' + H.ui.foldAttr('gd-good', false) + '><summary>' + g.good.length + ' nguyên liệu ổn cho dạ dày</summary><ul class="gnotes">' + g.good.map(goodRow).join('') + '</ul></details>';
    }
    return h + '</div>';
  };

  // ───────────── kiểm tra công thức ─────────────
  var reCache = {};
  function wordRe(alias) {
    if (!reCache[alias]) {
      var esc2 = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      reCache[alias] = new RegExp('(^|[^\\p{L}\\p{N}])' + esc2 + '($|[^\\p{L}\\p{N}])', 'u');
    }
    return reCache[alias];
  }

  var index = null;
  function buildIndex() {
    index = [];
    H.FOODS.forEach(function (f) {
      f.alias.concat([f.name]).forEach(function (a) {
        var low = a.toLowerCase();
        index.push({ food: f, alias: low, n: U.norm(low) });
      });
    });
  }

  // Tìm các nguyên liệu trong một dòng; ưu tiên cụm dài nhất (VD "trà hoa cúc" thắng "trà").
  function matchToken(tok) {
    if (!index) buildIndex();
    var low = tok.toLowerCase();
    var accented = /[^\u0000-\u007f]/.test(low);
    var padded = ' ' + U.norm(tok) + ' ';
    var hits = [];
    index.forEach(function (e) {
      var ok = accented ? wordRe(e.alias).test(low) : padded.indexOf(' ' + e.n + ' ') >= 0;
      if (ok) hits.push(e);
    });
    // bỏ các cụm nằm trọn trong một cụm dài hơn
    hits = hits.filter(function (a) {
      return !hits.some(function (b) { return b !== a && b.n.length > a.n.length && (' ' + b.n + ' ').indexOf(' ' + a.n + ' ') >= 0; });
    });
    var seen = {}, out = [];
    hits.forEach(function (e) { if (!seen[e.food.id]) { seen[e.food.id] = 1; out.push(e.food); } });
    return out;
  }

  H.checkRecipe = function (text) {
    var tokens = String(text || '').replace(/\s+và\s+/gi, ',').split(/[\n,;•·]+/)
      .map(function (t) { return t.replace(/^[\s\-*+]+/, '').trim(); })
      .filter(function (t) { return t.length > 1; });
    var byFood = {}, order = [], unknown = [];
    tokens.forEach(function (t) {
      var foods = matchToken(t);
      if (!foods.length) { unknown.push(t); return; }
      foods.forEach(function (f) {
        if (!byFood[f.id]) { byFood[f.id] = { food: f, from: [] }; order.push(f.id); }
        byFood[f.id].from.push(t);
      });
    });
    var res = { avoid: [], limit: [], good: [], unknown: unknown, tokens: tokens.length };
    order.forEach(function (id) { res[byFood[id].food.v].push(byFood[id]); });
    return res;
  };

  function checkResultHtml(res) {
    if (!res.tokens) {
      return '<p class="hint">Dán danh sách nguyên liệu (cách nhau bằng dấu phẩy hoặc xuống dòng) rồi nhấn “Kiểm tra”.</p>';
    }
    var h = '<div class="check-sum">' +
      '<span class="vpill v-avoid"><b>✕</b>' + res.avoid.length + ' nên tránh</span>' +
      '<span class="vpill v-limit"><b>!</b>' + res.limit.length + ' dùng ít</span>' +
      '<span class="vpill v-good"><b>✓</b>' + res.good.length + ' ổn</span></div>';
    function group(title, list, cls) {
      if (!list.length) return '';
      return '<section class="chk ' + cls + '"><h3>' + title + '</h3><ul>' + list.map(function (x) {
        var f = x.food;
        return '<li><div class="chk-top"><span aria-hidden="true">' + f.emoji + '</span><strong>' + esc(f.name) + '</strong>' +
          '<small>trong: ' + esc(x.from.join('; ')) + '</small></div>' +
          '<p>' + esc(f.why) + '</p><p class="swap">' + H.icon('shuffle', { size: 14 }) + '<span><strong>Gợi ý: </strong>' + esc(f.tip) + '</span></p></li>';
      }).join('') + '</ul></section>';
    }
    h += group('Nên tránh hoặc đổi', res.avoid, 'avoid');
    h += group('Dùng ít, nấu kỹ', res.limit, 'limit');
    h += group('Ổn cho dạ dày', res.good, 'good');
    if (res.unknown.length) {
      h += '<section class="chk unknown"><h3>Chưa có trong cẩm nang</h3><p>' + res.unknown.map(esc).join(' · ') + '</p>' +
        '<p class="hint">Mình chưa nhận ra các mục này. Hãy tra riêng ở mục “Tra nguyên liệu” hoặc hỏi bác sĩ, dược sĩ.</p></section>';
    }
    if (!res.avoid.length && !res.limit.length && res.good.length) {
      h += '<p class="note ok">' + H.icon('check', { size: 16, stroke: 3 }) + '<span>Không thấy nguyên liệu nào cần tránh trong danh sách này. Vẫn nên nêm nhạt và nấu mềm.</span></p>';
    }
    return h;
  }

  var SAMPLE = '500g thịt ba chỉ, 2 quả ớt, 3 tép tỏi, 1 quả cà chua, hành phi, nước mắm, chanh, rau muống, cà phê sữa';
  var lastCheck = '';

  // ───────────── các mục của hộp Cẩm nang ─────────────
  var TABS = [
    { id: 'tra', label: 'Tra nguyên liệu', icon: 'search' },
    { id: 'congthuc', label: 'Kiểm tra công thức', icon: 'list' },
    { id: 'thaythe', label: 'Thay thế', icon: 'shuffle' },
    { id: 'luuy', label: 'Lưu ý chung', icon: 'shield' }
  ];
  var gs = { tab: 'tra', q: '', v: 'all', g: 'all' };

  function traTab() {
    var cnt = { good: 0, limit: 0, avoid: 0 };
    H.FOODS.forEach(function (f) { cnt[f.v]++; });
    return '<div class="search big"><span class="search-ic">' + H.icon('search', { size: 20 }) + '</span>' +
      '<input id="guide-q" type="search" placeholder="Gõ tên nguyên liệu (VD: cà chua, sữa, ớt)" autocomplete="off" value="' + esc(gs.q) + '" data-input="guide-q" aria-label="Tra nguyên liệu"></div>' +
      '<div class="chips scroller" role="group" aria-label="Lọc theo mức">' +
      H.ui.chip('Tất cả (' + H.FOODS.length + ')', gs.v === 'all', 'guide-v', { v: 'all' }) +
      H.ui.chip('<b class="vdot good"></b>Nên dùng (' + cnt.good + ')', gs.v === 'good', 'guide-v', { v: 'good' }) +
      H.ui.chip('<b class="vdot limit"></b>Dùng ít (' + cnt.limit + ')', gs.v === 'limit', 'guide-v', { v: 'limit' }) +
      H.ui.chip('<b class="vdot avoid"></b>Nên tránh (' + cnt.avoid + ')', gs.v === 'avoid', 'guide-v', { v: 'avoid' }) + '</div>' +
      '<div class="chips scroller sub" role="group" aria-label="Lọc theo nhóm">' +
      H.ui.chip('Mọi nhóm', gs.g === 'all', 'guide-g', { v: 'all' }) +
      H.FOOD_GROUPS.map(function (g) { return H.ui.chip(esc(g.name), gs.g === g.id, 'guide-g', { v: g.id }); }).join('') + '</div>' +
      '<p class="hint" id="food-count">' + searchFoods(gs.q, gs.v, gs.g).length + ' kết quả</p>' +
      '<div id="food-results">' + foodResults() + '</div>';
  }
  function foodResults() {
    var list = searchFoods(gs.q, gs.v, gs.g);
    if (!list.length) {
      return H.ui.empty({ title: 'Chưa có trong cẩm nang', text: 'Mình chưa có nguyên liệu này. Hãy hỏi bác sĩ hoặc dược sĩ nếu bạn không chắc, và thử nhập tên gần giống.' });
    }
    return '<ul class="foods">' + list.map(foodCard).join('') + '</ul>';
  }

  function congthucTab() {
    return '<section class="callout"><h2>' + H.icon('list', { size: 18 }) + 'Dán công thức, mình soi giúp</h2>' +
      '<p>Dán danh sách nguyên liệu của một công thức bất kỳ. Mình đánh dấu thành phần nên tránh hoặc dùng ít, kèm gợi ý thay thế.</p></section>' +
      '<label class="label" for="recipe-text">Nguyên liệu của công thức</label>' +
      '<textarea id="recipe-text" class="textarea" rows="5" placeholder="VD: 500g thịt ba chỉ, 2 quả ớt, 3 tép tỏi, 1 quả cà chua…" data-input="recipe-text">' + esc(lastCheck) + '</textarea>' +
      '<div class="row-actions"><button type="button" class="btn btn-primary" data-act="recipe-check">' + H.icon('search', { size: 18 }) + 'Kiểm tra</button>' +
      '<button type="button" class="btn btn-soft" data-act="recipe-sample">Dùng ví dụ</button>' +
      '<button type="button" class="btn btn-ghost" data-act="recipe-clear">Xoá</button></div>' +
      '<div id="recipe-result" aria-live="polite">' + checkResultHtml(H.checkRecipe(lastCheck)) + '</div>';
  }

  function thaythe() {
    return '<section class="callout"><h2>' + H.icon('shuffle', { size: 18 }) + 'Đổi gì cho khỏi “lỡ ăn sai”?</h2><p>Khi công thức gốc có thành phần cần kiêng, thử các cách đổi dưới đây. Món vẫn ngon mà dạ dày dễ chịu hơn.</p></section>' +
      '<ul class="swapcards">' + H.SWAPS.map(function (s) {
        return '<li class="swapcard"><div class="sc-from"><span aria-hidden="true">' + s.emoji + '</span><div><small>Thay vì</small><strong>' + esc(s.from) + '</strong></div></div>' +
          '<div class="sc-arrow" aria-hidden="true">' + H.icon('chev-d', { size: 18 }) + '</div>' +
          '<ul class="sc-to">' + s.to.map(function (t) { return '<li>' + H.icon('check', { size: 14, stroke: 3 }) + esc(t) + '</li>'; }).join('') + '</ul>' +
          '<p class="sc-why">' + esc(s.why) + '</p></li>';
      }).join('') + '</ul>';
  }

  function luuy() {
    return '<section class="redflags" aria-labelledby="rf-t"><h2 id="rf-t">' + H.icon('warn', { size: 20 }) + 'Khi nào cần đi khám ngay</h2>' +
      '<ul>' + H.REDFLAGS.map(function (r) { return '<li>' + H.icon('warn', { size: 16 }) + '<span>' + esc(r) + '</span></li>'; }).join('') + '</ul>' +
      '<p class="rf-note">' + esc(H.REDFLAG_NOTE) + '</p></section>' +
      '<section class="block"><h2>Tưởng lành mà không lành</h2><ul class="warncards">' + H.WARNINGS.map(function (w) {
        return '<li class="warncard"><div class="wc-top"><span class="wc-e" aria-hidden="true">' + w.emoji + '</span><h3>' + esc(w.title) + '</h3></div>' +
          '<p class="wc-myth"><strong>Nhiều người nghĩ: </strong>' + esc(w.myth) + '</p>' +
          '<p class="wc-truth"><strong>Thực tế: </strong>' + esc(w.truth) + '</p>' +
          '<p class="wc-todo"><strong>Nên làm: </strong>' + esc(w.todo) + '</p></li>';
      }).join('') + '</ul></section>' +
      '<section class="block"><h2>Thói quen giúp dạ dày dễ chịu</h2><ul class="habits">' + H.HABITS.map(function (x) {
        return '<li class="habit"><span class="habit-e" aria-hidden="true">' + x.emoji + '</span><div><h3>' + esc(x.title) + '</h3><p>' + esc(x.text) + '</p></div></li>';
      }).join('') + '</ul></section>' +
      '<section class="callout"><h2>' + H.icon('info', { size: 18 }) + 'Về nguồn thông tin</h2><p>Nội dung được tổng hợp từ các hướng dẫn dinh dưỡng phổ biến cho viêm và loét dạ dày. Các nguồn y khoa nhấn mạnh nguyên nhân chính thường là vi khuẩn H. pylori hoặc thuốc giảm đau nhóm NSAID, còn chế độ ăn chỉ hỗ trợ giảm triệu chứng và mỗi người có “tác nhân” riêng. Hãy hỏi bác sĩ về điều trị.</p></section>';
  }

  function sheetBody() {
    var body = { tra: traTab, congthuc: congthucTab, thaythe: thaythe, luuy: luuy }[gs.tab]();
    return '<nav class="chips scroller guide-tabs" role="group" aria-label="Mục cẩm nang">' + TABS.map(function (t) {
      return H.ui.chip(H.icon(t.icon, { size: 15 }) + esc(t.label), gs.tab === t.id, 'guide-tab', { v: t.id });
    }).join('') + '</nav>' + body;
  }

  // Mở hộp Cẩm nang. tab: tra | congthuc | thaythe | luuy. q: từ khoá có sẵn khi mở ở mục tra nguyên liệu.
  G.open = function (tab, q) {
    gs.tab = TABS.some(function (t) { return t.id === tab; }) ? tab : 'tra';
    if (q != null) { gs.q = String(q); gs.v = 'all'; gs.g = 'all'; }
    H.sheet.open({
      title: 'Cẩm nang dạ dày',
      cls: 'overlay-guide',
      render: function () { return { body: sheetBody() }; },
      onOpen: function (rec) { rec.isGuide = true; }
    });
  };

  // ───────────── hành động ─────────────
  H.actions['open-guide'] = function (el) { G.open(el.getAttribute('data-tab') || 'tra', el.getAttribute('data-q')); };
  H.actions['open-redflags'] = function () { G.open('luuy'); };
  H.actions['guide-tab'] = function (el) { gs.tab = el.dataset.v; H.sheet.refresh(); var b = document.querySelector('.overlay-guide .sheet-body'); if (b) b.scrollTop = 0; };
  H.actions['guide-v'] = function (el) { gs.v = el.dataset.v; H.sheet.refresh(); };
  H.actions['guide-g'] = function (el) { gs.g = el.dataset.v; H.sheet.refresh(); };
  H.inputs['guide-q'] = function (el) {
    gs.q = el.value;
    var box = document.getElementById('food-results');
    var cnt = document.getElementById('food-count');
    if (box) box.innerHTML = foodResults();
    if (cnt) cnt.textContent = searchFoods(gs.q, gs.v, gs.g).length + ' kết quả';
  };

  H.inputs['recipe-text'] = function (el) { lastCheck = el.value; };
  function runCheck() {
    var t = document.getElementById('recipe-text');
    if (t) lastCheck = t.value;
    var box = document.getElementById('recipe-result');
    if (box) box.innerHTML = checkResultHtml(H.checkRecipe(lastCheck));
  }
  H.actions['recipe-check'] = function () { runCheck(); var b = document.getElementById('recipe-result'); if (b) b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
  H.actions['recipe-sample'] = function () {
    lastCheck = SAMPLE;
    var t = document.getElementById('recipe-text');
    if (t) t.value = SAMPLE;
    runCheck();
  };
  H.actions['recipe-clear'] = function () {
    lastCheck = '';
    var t = document.getElementById('recipe-text');
    if (t) { t.value = ''; t.focus(); }
    runCheck();
  };
})(window.HNAG = window.HNAG || {});
