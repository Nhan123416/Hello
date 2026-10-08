/* Khám phá món + trang chi tiết món. */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;

  // Danh sách món cho màn "Khám phá" (dùng chung với bộ lọc).
  H.exploreList = function () {
    var q = H.ui.exploreQ;
    var meal = H.ui.exploreMeal;
    return H.DISHES.filter(function (d) {
      if (meal !== 'all' && d.meals.indexOf(meal) < 0) return false;
      if (H.ui.exploreFav && H.state.favs.indexOf(d.id) < 0) return false;
      if (q && !U.searchMatch(d.searchRaw, d.searchText, q)) return false;
      if (!H.ui.exploreAll && !(H.fitsProfile(d) && H.matchesFilters(d))) return false;
      return true;
    }).sort(sorter(H.ui.exploreSort));
  };

  // Món hợp hồ sơ luôn đứng trước món chưa hợp; trong mỗi nhóm xếp theo tiêu chí đã chọn, hoà thì theo "hợp nhất".
  function sorter(mode) {
    function byFit(a, b) { return (H.fitsProfile(a) ? 0 : 1) - (H.fitsProfile(b) ? 0 : 1); }
    function byGentle(a, b) { return (a.care - b.care) || a.name.localeCompare(b.name, 'vi'); }
    var key = {
      gia: function (d) { return d.cost; },
      nhanh: function (d) { return d.time == null ? 0 : d.time; },
      kcal: function (d) { return d.kcal; },
      sao: function (d) { return -H.ratingOf(d.id); },
      han: function (d) { return -H.urgencyOf(d).score; }
    }[mode];
    return function (a, b) {
      var f = byFit(a, b);
      if (f) return f;
      if (key) { var k = key(a) - key(b); if (k) return k; }
      return byGentle(a, b);
    };
  }

  // Lý do món chưa hợp với hồ sơ hiện tại (null nếu hợp).
  H.notFitReason = function (d) {
    var p = H.state.profile;
    if (d.care > H.maxCare(p)) {
      return d.care === 3 ? 'Chỉ hợp khi dạ dày đã ổn định' : 'Chỉ hợp khi dạ dày đã đỡ';
    }
    if (!H.canMake(d, p)) return 'Cần dụng cụ bạn chưa chọn';
    if (p.veg && !d.veg) return 'Không phải món chay';
    return null;
  };
  // Món hợp hồ sơ nhưng vượt giới hạn tự đặt (thời gian, giá, độ khó, mức vị): trả về câu ngắn đầu tiên.
  H.limitReason = function (d) { return H.limitFlags(d)[0] || null; };

  function miniStars(id) {
    var r = H.ratingOf(id);
    return r ? ' · <span class="mini-stars" role="img" aria-label="Bạn chấm ' + r + ' sao">' + H.icon('star', { size: 12, fill: true }) + r + '</span>' : '';
  }

  // Lý do nên nấu sớm khi đang sắp xếp theo "dùng đồ sắp hết hạn".
  function useNote(d) {
    if (H.ui.exploreSort !== 'han') return '';
    var u = H.urgencyOf(d);
    return u.score ? '<span class="why-use">Dùng ' + u.why.map(function (w) { return esc(H.pantry.shortName(w.id)) + ' (còn ' + w.days + ' ngày)'; }).join(', ') + '</span>' : '';
  }

  function dishCard(d) {
    var fav = H.state.favs.indexOf(d.id) >= 0;
    var reason = H.notFitReason(d) || H.limitReason(d);
    return '<li class="dcard' + (reason ? ' dim' : '') + '">' +
      '<a class="dcard-link" href="#dish-' + d.id + '" aria-label="' + esc(d.name) + '"></a>' +
      H.ui.tile(d, 'lg') +
      '<div class="dcard-body"><span class="dcard-kind">' + esc(d.kind) + (d.veg ? ' · chay' : '') + (d.base === 'com' ? ' · kèm cơm' : '') + '</span>' +
      '<strong class="dcard-name">' + esc(d.name) + '</strong>' +
      '<span class="dcard-meta">' + (d.mode === 'out' ? '~' : '') + U.vnd(d.cost) + (d.time ? ' · ' + d.time + ' phút' : ' · ăn ngoài') + ' · ' + d.kcal + ' kcal' + miniStars(d.id) + '</span>' +
      (reason ? '<span class="dcard-warn">' + H.icon('info', { size: 13 }) + esc(reason) + '</span>' : H.ui.careBadge(d.care)) + useNote(d) + '</div>' +
      '<button type="button" class="fav' + (fav ? ' on' : '') + '" data-act="fav" data-id="' + d.id + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Bỏ yêu thích ' : 'Yêu thích ') + esc(d.name) + '">' + H.icon('heart', { size: 20, fill: fav }) + '</button></li>';
  }

  function resultsHtml() {
    var list = H.exploreList();
    if (!list.length) {
      return H.ui.empty({
        title: 'Không tìm thấy món',
        text: H.ui.exploreAll ? 'Thử từ khoá khác nhé.' : 'Chưa có món hợp với hồ sơ và bộ lọc hiện tại. Thử hiện cả món chưa hợp hoặc nới bộ lọc.',
        action: '<button type="button" class="btn btn-soft" data-act="explore-reset">Xoá tìm kiếm và bộ lọc</button>'
      });
    }
    return '<ul class="dgrid">' + list.map(dishCard).join('') + '</ul>';
  }

  function renderResults() {
    var box = document.getElementById('explore-results');
    var cnt = document.getElementById('explore-count');
    if (box) box.innerHTML = resultsHtml();
    if (cnt) cnt.textContent = H.exploreList().length + ' món';
  }

  H.views.explore = {
    title: 'Khám phá món lành',
    render: function () {
      var active = H.activeFilters().length;
      var pl = H.ui.profileLabel();
      return '<div class="explore">' +
        H.ui.pageHead('KHÁM PHÁ', 'Món lành cho dạ dày', 'Chọn theo bữa, theo ngân sách hoặc theo nguyên liệu bạn có. Mỗi món đều ghi rõ vì sao hợp và cách làm.') +
        '<div class="toolbar"><div class="search"><span class="search-ic">' + H.icon('search', { size: 18 }) + '</span>' +
        '<input id="explore-q" type="search" placeholder="Tìm món hoặc nguyên liệu" autocomplete="off" value="' + esc(H.ui.exploreQ) + '" data-input="explore-q" aria-label="Tìm món"></div>' +
        '<button type="button" class="btn btn-soft btn-filter" data-act="open-filters" data-ctx="explore" aria-label="Bộ lọc' + (active ? ', đang bật ' + active : '') + '">' + H.icon('sliders', { size: 18 }) + '<span class="btn-t">Bộ lọc</span>' + (active ? '<i class="count">' + active + '</i>' : '') + '</button></div>' +
        '<button type="button" class="deck-cta" data-act="open-deck">' + H.icon('shuffle', { size: 20 }) + '<span><strong>Vuốt chọn món</strong><small>Vuốt phải để thích, vuốt trái để bỏ. Mình ghi nhớ gu của bạn.</small></span>' + H.icon('chev-r', { size: 18 }) + '</button>' +
        '<div class="chips scroller" role="group" aria-label="Lọc theo bữa">' +
        [{ id: 'all', short: 'Tất cả bữa', emoji: '' }].concat(H.SLOTS).map(function (m) {
          return H.ui.chip((m.emoji ? m.emoji + ' ' : '') + m.short, H.ui.exploreMeal === m.id, 'explore-meal', { v: m.id });
        }).join('') +
        H.ui.chip(H.icon('heart', { size: 15 }) + ' Yêu thích', H.ui.exploreFav, 'explore-fav') + '</div>' +
        H.ui.filterPills('explore') +
        '<div class="sortbar"><span class="sort-l" id="sort-l">Sắp xếp</span><div class="chips scroller" role="group" aria-labelledby="sort-l">' + H.SORTS.map(function (so) {
          return H.ui.chip(esc(so.label), H.ui.exploreSort === so.id, 'explore-sort', { v: so.id });
        }).join('') + '</div></div>' +
        '<div class="explore-meta"><p><strong id="explore-count">' + H.exploreList().length + ' món</strong> hợp với <button type="button" class="link-btn" data-act="open-filters" data-ctx="home">' + esc(pl.text) + '</button></p>' +
        '<button type="button" class="link-btn" data-act="explore-all" aria-pressed="' + H.ui.exploreAll + '">' + (H.ui.exploreAll ? 'Chỉ hiện món hợp với tôi' : 'Hiện cả món chưa hợp') + '</button></div>' +
        '<div id="explore-results">' + resultsHtml() + '</div>' +
        H.ui.disclaimer() + '</div>';
    }
  };

  H.inputs['explore-q'] = function (el) { H.ui.exploreQ = el.value; renderResults(); };
  H.actions['explore-meal'] = function (el) { H.ui.exploreMeal = el.dataset.v; H.render({ keepScroll: true }); };
  H.actions['explore-sort'] = function (el) { H.ui.exploreSort = el.dataset.v; H.render({ keepScroll: true }); };
  H.actions['explore-fav'] = function () { H.ui.exploreFav = !H.ui.exploreFav; H.render({ keepScroll: true }); };
  H.actions['explore-all'] = function () { H.ui.exploreAll = !H.ui.exploreAll; H.render({ keepScroll: true }); };
  H.actions['explore-reset'] = function () {
    H.ui.exploreQ = ''; H.ui.exploreMeal = 'all'; H.ui.exploreFav = false; H.ui.exploreSort = 'hop';
    H.resetFilters();
    H.render({ keepScroll: true });
  };
  H.actions.fav = function (el) {
    var on = H.toggleFav(el.dataset.id);
    H.toast(on ? 'Đã thêm vào yêu thích' : 'Đã bỏ khỏi yêu thích', { icon: 'heart' });
    if (H.ui.exploreFav && !on) H.render({ keepScroll: true });
    else {
      U.$$('[data-act="fav"][data-id="' + el.dataset.id + '"]').forEach(function (b) {
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on);
        b.innerHTML = H.icon('heart', { size: 20, fill: on });
      });
    }
  };

  // ───────────── chi tiết món ─────────────
  function stagePills(d) {
    var base = { cap: 1, doi: 2, on: 3 };
    return '<div class="stage-pills" aria-label="Hợp với giai đoạn">' + H.STAGES.map(function (s) {
      var ok = base[s.id] >= d.care;
      return '<span class="spill ' + (ok ? 'yes' : 'no') + '">' + (ok ? '✓' : '✕') + ' ' + esc(s.short) + '</span>';
    }).join('') + '</div>';
  }

  // Thang mức vị của món so với mức bạn đặt. Cột nào vượt mức thì tô cảnh báo.
  function flavorMeter(d) {
    return '<section class="flmeter" aria-label="Mức vị của món"><h2 class="flmeter-h">Mức vị của món' + (d.mode === 'out' ? ' <small>khi gọi đúng như hướng dẫn</small>' : '') + '</h2><ul>' +
      H.FLAVORS.map(function (f) {
        var lv = d.fl[f.id], lim = H.flavorLimit(f.id), over = lv > lim;
        var bars = '';
        for (var i = 1; i <= 3; i++) bars += '<i class="' + (i <= lv ? 'on' : '') + '"></i>';
        return '<li class="' + (over ? 'over' : '') + '"><span class="flm-n"><span aria-hidden="true">' + f.emoji + '</span> ' + esc(f.name.split(' ')[0]) + '</span>' +
          '<span class="flm-bars" aria-hidden="true">' + bars + '</span>' +
          '<span class="flm-v">' + esc(f.levels[lv]) + (over ? ' · vượt mức bạn đặt' : '') + '</span></li>';
      }).join('') + '</ul></section>';
  }

  // Nguyên liệu nào làm món vượt mức vị bạn đặt thì nhắc cách chỉnh (gừng, cà chua, muối, dầu).
  var FLAVOR_OF = { 'gung': 'cay', 'ca-chua': 'chua', 'dau-an': 'beo', 'muoi': 'man', 'nuoc-mam': 'man', 'nuoc-tuong': 'man' };
  function flavorAdvice(d, id) {
    var k = FLAVOR_OF[id];
    if (!k || d.fl[k] <= H.flavorLimit(k)) return '';
    var lim = H.flavorLimit(k);
    if (k === 'cay') return 'Bạn đặt mức “' + H.flavorLabel(k, lim).toLowerCase() + '”: bỏ nguyên liệu này';
    if (k === 'chua') return 'Bạn đặt mức “' + H.flavorLabel(k, lim).toLowerCase() + '”: thay bằng cà rốt và bí đỏ nấu nhừ';
    if (k === 'man') return 'Nêm nhạt hơn công thức: dùng khoảng một nửa';
    return 'Giảm dầu: chỉ cần một lớp mỏng';
  }

  function ingredientRows(d) {
    return '<ul class="ings">' + d.ing.map(function (p) {
      var id = p[0], it = H.INGREDIENTS[id];
      var qty = U.fmtQty(p[1], it.unit);
      var advice = flavorAdvice(d, id);
      if (it.staple) {
        return '<li class="ing staple"><span class="ing-e">' + it.emoji + '</span><span class="ing-n">' + esc(it.name) + '<small>' + (advice ? esc(advice) : 'có sẵn trong bếp') + '</small></span><span class="ing-q">' + qty + '</span></li>';
      }
      var have = H.usableStock(id), enough = have + 1e-9 >= p[1], part = have > 0 && !enough;
      var label = enough ? 'Đủ' : (part ? 'Thiếu ' + U.fmtQty(p[1] - have, it.unit) : 'Chưa có');
      var swap = !enough && H.SUBS[id] ? '<button type="button" class="sub-link" data-act="subs-open" data-id="' + id + '">Thay thế</button>' : '';
      return '<li class="ing"><span class="ing-e">' + it.emoji + '</span><span class="ing-n">' + esc(it.name) + (advice ? '<small class="adv">' + esc(advice) + '</small>' : '') + swap + '</span><span class="ing-q">' + qty + '</span>' +
        '<button type="button" class="pill-toggle' + (enough ? ' on' : (part ? ' part' : '')) + '" data-act="toggle-fridge" data-id="' + id + '" data-need="' + p[1] + '" aria-pressed="' + enough + '" aria-label="' + esc(it.name) + ': ' + label + (enough ? '. Chạm để sửa số lượng trong tủ lạnh' : '. Chạm để thêm vào tủ lạnh') + '">' +
        (enough ? H.icon('check', { size: 13, stroke: 3 }) : '') + label + '</button></li>';
    }).join('') + '</ul>';
  }

  function missingNote(d) {
    var miss = d.ing.filter(function (p) { return !H.INGREDIENTS[p[0]].staple && !H.isGarnish(p[0], p[1]) && !H.hasIngredient(p[0], p[1]); });
    if (!miss.length) return '<p class="note ok">' + H.icon('check', { size: 16, stroke: 3 }) + '<span>Bạn có đủ nguyên liệu chính trong tủ lạnh để nấu món này.</span></p>';
    var cost = miss.reduce(function (s, p) { return s + (p[1] - H.usableStock(p[0])) * H.INGREDIENTS[p[0]].price; }, 0);
    var items = miss.map(function (p) { return p[0] + ':' + Math.round((p[1] - H.usableStock(p[0])) * 100) / 100; }).join(',');
    return '<p class="note">' + H.icon('cart', { size: 16 }) + '<span>Cần mua thêm ' + miss.length + ' nguyên liệu, khoảng ' + U.vnd(Math.max(500, Math.round(cost / 500) * 500)) + '. ' +
      '<button type="button" class="link-btn" data-act="buy-ids" data-items="' + esc(items) + '">Mua online</button></span></p>';
  }

  H.views.dish = {
    title: function (r) { var d = H.DISH_BY_ID[r.id]; return d ? d.name : 'Món ăn'; },
    render: function (r) {
      var d = H.DISH_BY_ID[r.id];
      if (!d) {
        return '<div class="dish">' + H.ui.empty({ title: 'Không tìm thấy món này', text: 'Có thể đường dẫn đã cũ.', action: '<a class="btn btn-primary" href="#explore">Về danh sách món</a>' }) + '</div>';
      }
      var fav = H.state.favs.indexOf(d.id) >= 0;
      var reason = H.notFitReason(d);
      var h = '<article class="dish">' +
        '<button type="button" class="back" data-act="back">' + H.icon('chev-l', { size: 18 }) + 'Quay lại</button>' +
        '<header class="dish-hero ' + H.ui.kindClass(d.kind) + '">' + H.ui.tile(d, 'xxl') +
        '<div class="dish-title"><div class="tags">' + H.ui.kindTag(d) + H.ui.careBadge(d.care, true) + H.ui.extraTags(d) + '</div>' +
        '<h1>' + esc(d.name) + '</h1></div></header>';
      if (reason) h += '<p class="note warn">' + H.icon('info', { size: 16 }) + '<span><strong>Chưa hợp với hồ sơ hiện tại của bạn:</strong> ' + esc(reason) + '. Bạn vẫn xem được công thức để tham khảo.</span></p>';
      else {
        var flags = H.limitFlags(d);
        if (flags.length) h += '<p class="note warn">' + H.icon('info', { size: 16 }) + '<span><strong>Vượt giới hạn bạn đã đặt:</strong> ' + flags.map(esc).join('; ') + '. Bạn vẫn có thể nấu, hoặc chỉnh lại bộ lọc.</span></p>';
      }
      h += H.ui.dishStats(d);
      h += flavorMeter(d);
      h += '<section class="callout"><h2>' + H.icon('shield', { size: 18 }) + 'Vì sao hợp dạ dày</h2><p>' + esc(d.why) + '</p>' + stagePills(d) + '</section>';

      if (d.mode === 'home') {
        h += '<section class="block"><h2>Dụng cụ</h2><div class="chips static">' + (d.tools.indexOf('khong') >= 0 ? '<span class="chip static">Không cần nấu</span>' : d.tools.map(function (t) {
          var tool = H.TOOLS.filter(function (x) { return x.id === t; })[0];
          return '<span class="chip static">' + tool.emoji + ' ' + esc(tool.name) + '</span>';
        }).join('<span class="or">hoặc</span>')) + '</div></section>';
        h += '<section class="block"><div class="block-head"><h2>Nguyên liệu <small>cho 1 người</small></h2></div>' + ingredientRows(d) + missingNote(d) + '</section>';
        h += '<section class="block"><h2>Cách làm</h2>' +
          '<a class="btn btn-primary btn-lg btn-block cook-cta" href="#cook-' + d.id + '">' + H.icon('play', { size: 20 }) + 'Nấu từng bước <small>đọc to, hẹn giờ</small></a><ol class="steps">' + d.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></section>';
      } else {
        h += '<section class="block"><h2>Cách gọi món an toàn</h2><ol class="steps">' + d.order.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></section>';
        h += '<section class="block"><h2>Nên tránh khi gọi</h2><ul class="avoid-list">' + d.avoid.map(function (s) { return '<li>' + H.icon('x', { size: 14, stroke: 3 }) + esc(s) + '</li>'; }).join('') + '</ul></section>';
      }
      h += '<section class="callout tip"><h2>' + H.icon('info', { size: 18 }) + 'Lưu ý</h2><p>' + esc(d.tip) + '</p></section>';
      if (d.swaps && d.swaps.length) {
        h += '<section class="block"><h2>Nguyên liệu đổi được</h2><ul class="swaps">' + d.swaps.map(function (s) {
          return '<li><span class="sw-from">' + esc(s[0]) + '</span>' + H.icon('chev-r', { size: 16 }) + '<span class="sw-to"><strong>' + esc(s[1]) + '</strong><small>' + esc(s[2]) + '</small></span></li>';
        }).join('') + '</ul></section>';
      }
      h += rateBlock(d) + diaryNote(d) + talkBlock(d);
      h += '<div class="dish-actions">' +
        '<button type="button" class="btn btn-primary btn-lg grow" data-act="pin" data-id="' + d.id + '">' + H.icon('pin', { size: 18 }) + 'Chốt món này</button>' +
        '<button type="button" class="btn btn-soft btn-lg btn-sq fav' + (fav ? ' on' : '') + '" data-act="fav" data-id="' + d.id + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Bỏ yêu thích' : 'Yêu thích') + '">' + H.icon('heart', { size: 20, fill: fav }) + '</button>' +
        (d.mode === 'out'
          ? '<a class="btn btn-soft btn-lg btn-sq" href="' + H.mapsUrl(d.mapQuery + ' gần đây') + '" target="_blank" rel="noopener noreferrer" aria-label="Tìm quán gần bạn (mở tab mới)">' + H.icon('pin', { size: 20 }) + '</a>'
          : '<a class="btn btn-soft btn-lg btn-sq" href="' + H.ytUrl('cách nấu ' + d.name + ' cho người đau dạ dày') + '" target="_blank" rel="noopener noreferrer" aria-label="Xem video hướng dẫn trên YouTube (mở tab mới)">' + H.icon('play', { size: 20 }) + '</a>') +
        '</div>';
      h += H.ui.disclaimer() + '</article>';
      return h;
    }
  };

  // Nhật ký của bạn nói gì về món này.
  function diaryNote(d) {
    var E = H.state.diary.filter(function (x) { return x.dishes.indexOf(d.id) >= 0; });
    if (!E.length) return '';
    var bad = E.filter(function (x) { return x.feel >= 3; }).length;
    return '<p class="note ' + (bad ? 'warn' : 'ok') + '">' + H.icon(bad ? 'info' : 'check', { size: 16, stroke: bad ? 2 : 3 }) +
      '<span>Nhật ký của bạn: đã ăn món này ' + E.length + ' lần, ' + (bad ? 'khó chịu ' + bad + ' lần. <a href="#community-diary">Xem nhật ký</a>' : 'chưa lần nào khó chịu.') + '</span></p>';
  }

  // Bài của mọi người (và của bạn) nhắc đến món này, như một góc hỏi đáp về công thức.
  function talkBlock(d) {
    var posts = H.allPosts().filter(function (p) { return p.dish === d.id; }).slice(0, 3);
    return '<section class="block talk"><div class="block-head"><h2>Mọi người nói gì về món này</h2></div>' +
      (posts.length ? '<ul class="posts">' + posts.map(H.postCard).join('') + '</ul>' : '<p class="hint">Chưa có ai chia sẻ về món này. Bạn nấu thử rồi kể mọi người nghe nhé?</p>') +
      '<button type="button" class="btn btn-soft btn-sm" data-act="post-about" data-id="' + d.id + '">' + H.icon('plus', { size: 16 }) + 'Viết bài về món này</button></section>';
  }

  function rateBlock(d) {
    var r = H.ratingOf(d.id), off = H.isExcluded(d.id);
    var stars = '';
    for (var i = 1; i <= 5; i++) {
      stars += '<button type="button" class="star' + (i <= r ? ' on' : '') + '" role="radio" aria-checked="' + (i === r) + '" data-act="rate" data-id="' + d.id + '" data-v="' + i + '" aria-label="' + i + ' sao' + (i === r ? ', bấm lại để bỏ chấm' : '') + '">' + H.icon('star', { size: 28, fill: i <= r }) + '</button>';
    }
    return '<section class="rate"><h2>Bạn thấy món này thế nào?</h2><div class="stars" role="radiogroup" aria-label="Chấm sao cho ' + esc(d.name) + '">' + stars + '</div>' +
      '<p class="hint">' + (r ? 'Bạn chấm ' + r + ' sao. ' : '') + 'Món 4 đến 5 sao được ưu tiên khi tự xếp thực đơn, món 1 đến 2 sao ít được chọn hơn.</p>' +
      '<button type="button" class="link-btn excl-btn" data-act="toggle-excl-dish" data-id="' + d.id + '" aria-pressed="' + off + '">' + (off ? 'Đã bỏ khỏi vòng quay và kế hoạch. Đưa lại' : 'Không muốn ăn món này? Bỏ khỏi vòng quay và kế hoạch') + '</button></section>';
  }
  H.actions.rate = function (el) {
    var id = el.dataset.id, n = H.rate(id, Number(el.dataset.v));
    H.toast(n ? 'Đã chấm ' + n + ' sao' : 'Đã bỏ chấm sao', { icon: 'star' });
    H.render({ keepScroll: true });
  };
  H.actions['toggle-excl-dish'] = function (el) {
    H.toggleExcluded(el.dataset.id);
    H.ui.result = null;
    H.toast(H.isExcluded(el.dataset.id) ? 'Đã bỏ món này khỏi vòng quay và kế hoạch' : 'Đã đưa món lại vòng quay', { icon: 'check' });
    H.render({ keepScroll: true });
  };

  H.actions.back = function () { H.back('explore'); };
  // Chạm vào nhãn "Chưa có / Thiếu": thêm một gói vào tủ lạnh. Đã đủ thì mở hộp sửa số lượng.
  H.actions['toggle-fridge'] = function (el) {
    var id = el.dataset.id, need = Number(el.dataset.need) || 0;
    if (H.hasIngredient(id, need)) { H.openStockEdit(id); return; }
    var gap = Math.max(H.packOf(id).qty, need - H.usableStock(id));
    H.addStock(id, gap);
    H.toast('Đã thêm ' + H.pantry.shortName(id).toLowerCase() + ' vào tủ lạnh', { icon: 'check' });
    H.render({ keepScroll: true });
  };
})(window.HNAG = window.HNAG || {});
