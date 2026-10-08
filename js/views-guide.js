/* Cẩm nang: tra nguyên liệu, kiểm tra công thức, thay thế, "tưởng lành", video, thói quen và dấu hiệu cần đi khám. */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;

  var TABS = [
    { id: 'tra', label: 'Tra nguyên liệu', icon: 'search' },
    { id: 'congthuc', label: 'Kiểm tra công thức', icon: 'list' },
    { id: 'thaythe', label: 'Thay thế', icon: 'shuffle' },
    { id: 'tuonglanh', label: 'Tưởng lành', icon: 'warn' },
    { id: 'video', label: 'Video chuyên gia', icon: 'play' },
    { id: 'luuy', label: 'Thói quen & đi khám', icon: 'shield' }
  ];

  var SAMPLE = '500g thịt ba chỉ, 2 quả ớt, 3 tép tỏi, 1 quả cà chua, hành phi, nước mắm, chanh, rau muống, cà phê sữa';

  function verdictPill(v) {
    var m = H.VERDICTS[v];
    return '<span class="vpill v-' + v + '"><b aria-hidden="true">' + m.icon + '</b>' + m.label + '</span>';
  }

  // ───────────── Tab: tra nguyên liệu ─────────────
  function foodList() {
    var q = H.ui.guideQ;
    return H.FOODS.filter(function (f) {
      if (H.ui.guideV !== 'all' && f.v !== H.ui.guideV) return false;
      if (H.ui.guideG !== 'all' && f.group !== H.ui.guideG) return false;
      if (q) {
        if (!f._raw) { f._raw = [f.name].concat(f.alias).join(' ').toLowerCase(); f._norm = U.norm(f._raw); }
        if (!U.searchMatch(f._raw, f._norm, q)) return false;
      }
      return true;
    });
  }

  function foodCard(f) {
    return '<li class="food v-' + f.v + '"><div class="food-top"><span class="food-e" aria-hidden="true">' + f.emoji + '</span>' +
      '<h3>' + esc(f.name) + '</h3>' + verdictPill(f.v) + '</div>' +
      '<p class="food-why"><strong>Vì sao: </strong>' + esc(f.why) + '</p>' +
      '<p class="food-tip"><strong>' + (f.v === 'good' ? 'Lưu ý' : 'Nên làm') + ': </strong>' + esc(f.tip) + '</p></li>';
  }

  function foodResults() {
    var list = foodList();
    if (!list.length) {
      return H.ui.empty({ title: 'Chưa có trong cẩm nang', text: 'Mình chưa có nguyên liệu này. Hãy hỏi bác sĩ hoặc dược sĩ nếu bạn không chắc, và thử nhập tên gần giống.' });
    }
    return '<ul class="foods">' + list.map(foodCard).join('') + '</ul>';
  }

  function traTab() {
    var cnt = { good: 0, limit: 0, avoid: 0 };
    H.FOODS.forEach(function (f) { cnt[f.v]++; });
    return '<div class="search big"><span class="search-ic">' + H.icon('search', { size: 20 }) + '</span>' +
      '<input id="guide-q" type="search" placeholder="Gõ tên nguyên liệu (VD: cà chua, sữa, ớt)" autocomplete="off" value="' + esc(H.ui.guideQ) + '" data-input="guide-q" aria-label="Tra nguyên liệu"></div>' +
      '<div class="chips scroller" role="group" aria-label="Lọc theo mức">' +
      H.ui.chip('Tất cả (' + H.FOODS.length + ')', H.ui.guideV === 'all', 'guide-v', { v: 'all' }) +
      H.ui.chip('<b class="vdot good"></b>Nên dùng (' + cnt.good + ')', H.ui.guideV === 'good', 'guide-v', { v: 'good' }) +
      H.ui.chip('<b class="vdot limit"></b>Dùng ít (' + cnt.limit + ')', H.ui.guideV === 'limit', 'guide-v', { v: 'limit' }) +
      H.ui.chip('<b class="vdot avoid"></b>Nên tránh (' + cnt.avoid + ')', H.ui.guideV === 'avoid', 'guide-v', { v: 'avoid' }) + '</div>' +
      '<div class="chips scroller sub" role="group" aria-label="Lọc theo nhóm">' +
      H.ui.chip('Mọi nhóm', H.ui.guideG === 'all', 'guide-g', { v: 'all' }) +
      H.FOOD_GROUPS.map(function (g) { return H.ui.chip(esc(g.name), H.ui.guideG === g.id, 'guide-g', { v: g.id }); }).join('') + '</div>' +
      '<p class="hint" id="food-count">' + foodList().length + ' kết quả</p>' +
      '<div id="food-results">' + foodResults() + '</div>';
  }

  // ───────────── Tab: kiểm tra công thức ─────────────
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
        '<p class="hint">Mình chưa nhận ra các mục này. Hãy tra riêng ở tab “Tra nguyên liệu” hoặc hỏi bác sĩ, dược sĩ.</p></section>';
    }
    if (!res.avoid.length && !res.limit.length && res.good.length) {
      h += '<p class="note ok">' + H.icon('check', { size: 16, stroke: 3 }) + 'Không thấy nguyên liệu nào cần tránh trong danh sách này. Vẫn nên nêm nhạt và nấu mềm.</p>';
    }
    return h;
  }

  var lastCheck = '';
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

  // ───────────── Tab: thay thế ─────────────
  function thaythe() {
    return '<section class="callout"><h2>' + H.icon('shuffle', { size: 18 }) + 'Đổi gì cho khỏi “lỡ ăn sai”?</h2><p>Khi công thức gốc có thành phần cần kiêng, thử các cách đổi dưới đây. Món vẫn ngon mà dạ dày dễ chịu hơn.</p></section>' +
      '<ul class="swapcards">' + H.SWAPS.map(function (s) {
        return '<li class="swapcard"><div class="sc-from"><span aria-hidden="true">' + s.emoji + '</span><div><small>Thay vì</small><strong>' + esc(s.from) + '</strong></div></div>' +
          '<div class="sc-arrow" aria-hidden="true">' + H.icon('chev-d', { size: 18 }) + '</div>' +
          '<ul class="sc-to">' + s.to.map(function (t) { return '<li>' + H.icon('check', { size: 14, stroke: 3 }) + esc(t) + '</li>'; }).join('') + '</ul>' +
          '<p class="sc-why">' + esc(s.why) + '</p></li>';
      }).join('') + '</ul>';
  }

  // ───────────── Tab: tưởng lành ─────────────
  function tuonglanh() {
    return '<section class="callout warn"><h2>' + H.icon('warn', { size: 18 }) + 'Tưởng lành mà không lành</h2><p>Những thứ nghe có vẻ tốt cho sức khoẻ nhưng có thể làm dạ dày khó chịu hơn.</p></section>' +
      '<ul class="warncards">' + H.WARNINGS.map(function (w) {
        return '<li class="warncard"><div class="wc-top"><span class="wc-e" aria-hidden="true">' + w.emoji + '</span><h3>' + esc(w.title) + '</h3></div>' +
          '<p class="wc-myth"><strong>Nhiều người nghĩ: </strong>' + esc(w.myth) + '</p>' +
          '<p class="wc-truth"><strong>Thực tế: </strong>' + esc(w.truth) + '</p>' +
          '<p class="wc-todo"><strong>Nên làm: </strong>' + esc(w.todo) + '</p></li>';
      }).join('') + '</ul>';
  }

  // ───────────── Tab: video ─────────────
  function videoTab() {
    var h = '<section class="callout"><h2>' + H.icon('play', { size: 18 }) + 'Video từ bác sĩ, chuyên gia dinh dưỡng</h2>' +
      '<p>Nghe chính chuyên gia nói giúp bạn yên tâm hơn. Mình chỉ đưa vào các video đã được kiểm duyệt nội dung.</p></section>';
    if (H.VIDEOS.length) {
      h += '<ul class="videos">' + H.VIDEOS.map(function (v) {
        return '<li class="video"><a href="https://www.youtube.com/watch?v=' + encodeURIComponent(v.id) + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="video-play">' + H.icon('play', { size: 22, fill: true }) + '</span><span class="video-t"><strong>' + esc(v.title) + '</strong>' +
          '<small>' + esc(v.who) + ' · ' + esc(v.role) + '</small><em>' + esc(v.topic) + '</em></span>' + H.icon('ext', { size: 16 }) + '<span class="sr-only">(mở tab mới)</span></a></li>';
      }).join('') + '</ul>';
    } else {
      h += H.ui.empty({
        title: 'Sắp có video chuyên gia',
        text: 'Mục này đang chờ danh sách video đã kiểm duyệt. Trong lúc đó, bạn có thể tìm hiểu thêm bằng các chủ đề dưới đây (mở YouTube, nội dung do người đăng chịu trách nhiệm).'
      });
    }
    h += '<section class="block"><h2>Tìm hiểu thêm trên YouTube</h2><ul class="rows">' + H.VIDEO_TOPICS.map(function (t) {
      return '<li><a class="row" href="' + H.ytUrl(t.q) + '" target="_blank" rel="noopener noreferrer"><span class="row-ic">' + H.icon('search', { size: 18 }) + '</span>' +
        '<span class="row-main"><strong>' + esc(t.title) + '</strong><small>Mở kết quả tìm kiếm</small></span>' + H.icon('ext', { size: 16 }) + '<span class="sr-only">(mở tab mới)</span></a></li>';
    }).join('') + '</ul></section>';
    return h;
  }

  // ───────────── Tab: thói quen & đi khám ─────────────
  function luuy() {
    return '<section class="redflags" aria-labelledby="rf-t"><h2 id="rf-t">' + H.icon('warn', { size: 20 }) + 'Khi nào cần đi khám ngay</h2>' +
      '<ul>' + H.REDFLAGS.map(function (r) { return '<li>' + H.icon('warn', { size: 16 }) + '<span>' + esc(r) + '</span></li>'; }).join('') + '</ul>' +
      '<p class="rf-note">' + esc(H.REDFLAG_NOTE) + '</p></section>' +
      '<section class="block"><h2>Thói quen giúp dạ dày dễ chịu</h2><ul class="habits">' + H.HABITS.map(function (x) {
        return '<li class="habit"><span class="habit-e" aria-hidden="true">' + x.emoji + '</span><div><h3>' + esc(x.title) + '</h3><p>' + esc(x.text) + '</p></div></li>';
      }).join('') + '</ul></section>' +
      '<section class="callout"><h2>' + H.icon('info', { size: 18 }) + 'Về nguồn thông tin</h2><p>Nội dung được tổng hợp từ các hướng dẫn dinh dưỡng phổ biến cho viêm và loét dạ dày. Các nguồn y khoa nhấn mạnh nguyên nhân chính thường là vi khuẩn H. pylori hoặc thuốc giảm đau nhóm NSAID, còn chế độ ăn chỉ hỗ trợ giảm triệu chứng và mỗi người có “tác nhân” riêng. Hãy hỏi bác sĩ về điều trị.</p></section>';
  }

  H.views.guide = {
    title: 'Cẩm nang dạ dày',
    mount: function () { H.centerActive('.tabs', '.tab.on'); },
    render: function (r) {
      var tab = TABS.filter(function (t) { return t.id === r.tab; })[0] ? r.tab : 'tra';
      var body = { tra: traTab, congthuc: congthucTab, thaythe: thaythe, tuonglanh: tuonglanh, video: videoTab, luuy: luuy }[tab]();
      return '<div class="guide">' +
        H.ui.pageHead('CẨM NANG', 'Ăn gì, tránh gì, vì sao?', 'Tra từng nguyên liệu, soi công thức có sẵn và xem cách thay thế để tự nấu an toàn.') +
        '<nav class="tabs scroller" aria-label="Mục cẩm nang">' + TABS.map(function (t) {
          return '<a class="tab' + (t.id === tab ? ' on' : '') + '" href="#guide-' + t.id + '"' + (t.id === tab ? ' aria-current="page"' : '') + '>' + H.icon(t.icon, { size: 16 }) + '<span>' + t.label + '</span></a>';
        }).join('') + '</nav>' +
        '<div class="guide-body">' + body + '</div>' + H.ui.disclaimer() + '</div>';
    }
  };

  // ───────────── hành động ─────────────
  H.inputs['guide-q'] = function (el) {
    H.ui.guideQ = el.value;
    var box = document.getElementById('food-results');
    var cnt = document.getElementById('food-count');
    if (box) box.innerHTML = foodResults();
    if (cnt) cnt.textContent = foodList().length + ' kết quả';
  };
  H.actions['guide-v'] = function (el) { H.ui.guideV = el.dataset.v; H.render({ keepScroll: true }); };
  H.actions['guide-g'] = function (el) { H.ui.guideG = el.dataset.v; H.render({ keepScroll: true }); };

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
