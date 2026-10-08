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
    }).sort(function (a, b) {
      var fa = H.fitsProfile(a) ? 0 : 1, fb = H.fitsProfile(b) ? 0 : 1;
      return (fa - fb) || (a.care - b.care) || a.name.localeCompare(b.name, 'vi');
    });
  };

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

  function dishCard(d) {
    var fav = H.state.favs.indexOf(d.id) >= 0;
    var reason = H.notFitReason(d);
    return '<li class="dcard' + (reason ? ' dim' : '') + '">' +
      '<a class="dcard-link" href="#dish-' + d.id + '" aria-label="' + esc(d.name) + '"></a>' +
      H.ui.tile(d, 'lg') +
      '<div class="dcard-body"><span class="dcard-kind">' + esc(d.kind) + (d.veg ? ' · chay' : '') + (d.base === 'com' ? ' · kèm cơm' : '') + '</span>' +
      '<strong class="dcard-name">' + esc(d.name) + '</strong>' +
      '<span class="dcard-meta">' + (d.mode === 'out' ? '~' : '') + U.vnd(d.cost) + (d.time ? ' · ' + d.time + ' phút' : ' · ăn ngoài') + ' · ' + d.kcal + ' kcal</span>' +
      (reason ? '<span class="dcard-warn">' + H.icon('info', { size: 13 }) + esc(reason) + '</span>' : H.ui.careBadge(d.care)) + '</div>' +
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
      var f = H.state.filters, p = H.state.profile;
      var active = (f.mode !== 'all' ? 1 : 0) + (f.energy !== 'all' ? 1 : 0) + (f.quick ? 1 : 0) + (f.cheap ? 1 : 0) + (p.veg ? 1 : 0);
      var pl = H.ui.profileLabel();
      return '<div class="explore">' +
        H.ui.pageHead('KHÁM PHÁ', 'Món lành cho dạ dày', 'Chọn theo bữa, theo ngân sách hoặc theo nguyên liệu bạn có. Mỗi món đều ghi rõ vì sao hợp và cách làm.') +
        '<div class="toolbar"><div class="search"><span class="search-ic">' + H.icon('search', { size: 18 }) + '</span>' +
        '<input id="explore-q" type="search" placeholder="Tìm món hoặc nguyên liệu" autocomplete="off" value="' + esc(H.ui.exploreQ) + '" data-input="explore-q" aria-label="Tìm món"></div>' +
        '<button type="button" class="btn btn-soft btn-filter" data-act="open-filters" data-ctx="explore" aria-label="Bộ lọc' + (active ? ', đang bật ' + active : '') + '">' + H.icon('sliders', { size: 18 }) + '<span class="btn-t">Bộ lọc</span>' + (active ? '<i class="count">' + active + '</i>' : '') + '</button></div>' +
        '<div class="chips scroller" role="group" aria-label="Lọc theo bữa">' +
        [{ id: 'all', short: 'Tất cả bữa', emoji: '' }].concat(H.SLOTS).map(function (m) {
          return H.ui.chip((m.emoji ? m.emoji + ' ' : '') + m.short, H.ui.exploreMeal === m.id, 'explore-meal', { v: m.id });
        }).join('') +
        H.ui.chip(H.icon('heart', { size: 15 }) + ' Yêu thích', H.ui.exploreFav, 'explore-fav') + '</div>' +
        '<div class="explore-meta"><p><strong id="explore-count">' + H.exploreList().length + ' món</strong> hợp với <button type="button" class="link-btn" data-act="open-filters" data-ctx="home">' + esc(pl.text) + '</button></p>' +
        '<button type="button" class="link-btn" data-act="explore-all" aria-pressed="' + H.ui.exploreAll + '">' + (H.ui.exploreAll ? 'Chỉ hiện món hợp với tôi' : 'Hiện cả món chưa hợp') + '</button></div>' +
        '<div id="explore-results">' + resultsHtml() + '</div>' +
        H.ui.disclaimer() + '</div>';
    }
  };

  H.inputs['explore-q'] = function (el) { H.ui.exploreQ = el.value; renderResults(); };
  H.actions['explore-meal'] = function (el) { H.ui.exploreMeal = el.dataset.v; H.render({ keepScroll: true }); };
  H.actions['explore-fav'] = function () { H.ui.exploreFav = !H.ui.exploreFav; H.render({ keepScroll: true }); };
  H.actions['explore-all'] = function () { H.ui.exploreAll = !H.ui.exploreAll; H.render({ keepScroll: true }); };
  H.actions['explore-reset'] = function () {
    H.ui.exploreQ = ''; H.ui.exploreMeal = 'all'; H.ui.exploreFav = false;
    H.state.filters = { mode: 'home', energy: 'all', quick: false, cheap: false };
    H.state.profile.veg = false;
    H.save();
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

  function ingredientRows(d) {
    var have = {};
    H.state.fridge.forEach(function (id) { have[id] = true; });
    return '<ul class="ings">' + d.ing.map(function (p) {
      var it = H.INGREDIENTS[p[0]];
      var qty = U.fmtQty(p[1], it.unit);
      if (it.staple) {
        return '<li class="ing staple"><span class="ing-e">' + it.emoji + '</span><span class="ing-n">' + esc(it.name) + '<small>có sẵn trong bếp</small></span><span class="ing-q">' + qty + '</span></li>';
      }
      var on = !!have[p[0]];
      return '<li class="ing"><span class="ing-e">' + it.emoji + '</span><span class="ing-n">' + esc(it.name) + '</span><span class="ing-q">' + qty + '</span>' +
        '<button type="button" class="pill-toggle' + (on ? ' on' : '') + '" data-act="toggle-fridge" data-id="' + p[0] + '" aria-pressed="' + on + '" aria-label="Đã có ' + esc(it.name) + ' trong tủ lạnh">' +
        (on ? H.icon('check', { size: 13, stroke: 3 }) + 'Đã có' : 'Chưa có') + '</button></li>';
    }).join('') + '</ul>';
  }

  function missingNote(d) {
    var have = {};
    H.state.fridge.forEach(function (id) { have[id] = true; });
    var miss = d.ing.filter(function (p) { return !H.INGREDIENTS[p[0]].staple && !H.isGarnish(p[0], p[1]) && !have[p[0]]; });
    if (!miss.length) return '<p class="note ok">' + H.icon('check', { size: 16, stroke: 3 }) + 'Bạn có đủ nguyên liệu chính trong tủ lạnh để nấu món này.</p>';
    var cost = miss.reduce(function (s, p) { var it = H.INGREDIENTS[p[0]]; return s + p[1] * it.price; }, 0);
    return '<p class="note">' + H.icon('cart', { size: 16 }) + 'Cần mua thêm ' + miss.length + ' nguyên liệu, khoảng ' + U.vnd(Math.max(500, Math.round(cost / 500) * 500)) + '.</p>';
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
      h += H.ui.dishStats(d);
      h += '<section class="callout"><h2>' + H.icon('shield', { size: 18 }) + 'Vì sao hợp dạ dày</h2><p>' + esc(d.why) + '</p>' + stagePills(d) + '</section>';

      if (d.mode === 'home') {
        h += '<section class="block"><h2>Dụng cụ</h2><div class="chips static">' + (d.tools.indexOf('khong') >= 0 ? '<span class="chip static">Không cần nấu</span>' : d.tools.map(function (t) {
          var tool = H.TOOLS.filter(function (x) { return x.id === t; })[0];
          return '<span class="chip static">' + tool.emoji + ' ' + esc(tool.name) + '</span>';
        }).join('<span class="or">hoặc</span>')) + '</div></section>';
        h += '<section class="block"><div class="block-head"><h2>Nguyên liệu <small>cho 1 người</small></h2></div>' + ingredientRows(d) + missingNote(d) + '</section>';
        h += '<section class="block"><h2>Cách làm</h2><ol class="steps">' + d.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></section>';
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

  H.actions.back = function () { H.back('explore'); };
  H.actions['toggle-fridge'] = function (el) {
    H.toggleFridge(el.dataset.id);
    H.render({ keepScroll: true });
  };
})(window.HNAG = window.HNAG || {});
