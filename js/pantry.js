/*
 * Tủ lạnh: số lượng và hạn dùng, cảnh báo sắp hết / sắp hỏng, nhập nhanh bằng chữ, nguyên liệu thay thế
 * và liên kết mở trang tìm kiếm của các cửa hàng.
 *
 * Dữ liệu và phép tính nằm ở store.js (H.state.pantry, H.addStock, H.lowStock...). File này lo giao diện.
 * Nhập bằng ảnh / quét mã chưa làm được vì cần dịch vụ nhận diện hình ảnh và máy chủ, nên chỉ có màn giải thích.
 */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;
  var P = H.pantry = {};
  var NEAR = 2;   // còn từ 2 ngày trở xuống thì báo "sắp hết hạn"

  function nameOf(id) { return H.INGREDIENTS[id].name; }
  function shortName(id) { return H.INGREDIENTS[id].name.split(' (')[0]; }
  function qtyText(id, q) { return U.fmtQty(q, H.INGREDIENTS[id].unit); }
  P.shortName = shortName;

  // ───────────── nhập nhanh bằng chữ ─────────────
  var aliasCache = null;
  function aliasList() {
    if (aliasCache) return aliasCache;
    var list = [];
    Object.keys(H.ING_ALIASES).forEach(function (id) {
      H.ING_ALIASES[id].forEach(function (a) { list.push({ id: id, raw: a.toLowerCase(), norm: U.norm(a) }); });
    });
    list.sort(function (a, b) { return b.raw.length - a.raw.length; });   // cụm dài khớp trước ("thịt bò" trước "thịt")
    aliasCache = list;
    return list;
  }

  // Gõ có dấu thì khớp đúng dấu, gõ không dấu thì khớp mọi dấu. Chỉ khớp nguyên từ ("ga" không khớp "gao").
  function findIngredient(text) {
    var raw = ' ' + text.toLowerCase().replace(/\s+/g, ' ').trim() + ' ';
    var norm = ' ' + U.norm(text) + ' ';
    var accent = /[^\u0000-\u007f]/.test(text);
    var list = aliasList();
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (accent ? raw.indexOf(' ' + a.raw + ' ') >= 0 : norm.indexOf(' ' + a.norm + ' ') >= 0) return a.id;
    }
    return null;
  }

  var QTY_RE = /(\d+(?:[.,]\d+)?)\s*(kg|ký|kí|ky|ki|lạng|lang|gram|gam|gr|g|quả|qua|trái|trai|củ|cu|hộp|hop|lát|lat|miếng|mieng|chục|chuc|lon|gói|goi|bó|túi|tui)?(?=\s|$|[^a-zà-ỹ])/i;

  function qtyFrom(id, m) {
    var it = H.INGREDIENTS[id], pk = H.packOf(id);
    if (!m) return pk.qty;
    var n = parseFloat(m[1].replace(',', '.')), u = (m[2] || '').toLowerCase();
    if (!isFinite(n) || n <= 0) return pk.qty;
    if (it.unit === 'g') {
      if (u === 'kg' || u === 'ký' || u === 'kí' || u === 'ky' || u === 'ki') return n * 1000;
      if (u === 'lạng' || u === 'lang') return n * 100;
      if (u === 'g' || u === 'gr' || u === 'gram' || u === 'gam') return n;
      if (u === 'củ' || u === 'cu') return n * 100;
      if (u) return n * pk.qty;                 // gói, bó, túi, hộp, quả...: tính theo số gói thường mua
      return n >= 20 ? n : n * pk.qty;          // "thịt 500" là 500g, "gạo 2" là 2 gói
    }
    return u === 'chục' || u === 'chuc' ? n * 10 : n;   // đếm theo đơn vị của nguyên liệu (quả, hộp, lát, miếng)
  }

  // "trứng 6, gạo 1kg, 2 củ cà rốt" -> { items: [{ id, qty }], unknown: ['...'] }
  P.parse = function (text) {
    var items = [], unknown = [];
    String(text || '').split(/[,;\n]+|\s+và\s+|\s+\+\s+/i).forEach(function (tok) {
      tok = tok.trim();
      if (!tok) return;
      var m = QTY_RE.exec(tok);
      var label = m ? tok.replace(QTY_RE, ' ') : tok;
      var id = findIngredient(label);
      if (!id) { unknown.push(tok); return; }
      var same = items.filter(function (x) { return x.id === id; })[0];
      var q = qtyFrom(id, m);
      if (same) same.qty += q; else items.push({ id: id, qty: q });
    });
    return { items: items, unknown: unknown };
  };

  // ───────────── giao diện tab "Tủ lạnh" ─────────────
  function expBadge(x) {
    if (x.days == null) return '<span class="exp none">Không theo dõi hạn</span>';
    if (x.days < 0) return '<span class="exp bad">Hết hạn ' + (-x.days) + ' ngày trước</span>';
    if (x.days === 0) return '<span class="exp warn">Hết hạn hôm nay</span>';
    if (x.days <= NEAR) return '<span class="exp warn">Còn ' + x.days + ' ngày</span>';
    return '<span class="exp">Hạn ' + U.fmtDM(U.parse(x.exp)) + '</span>';
  }

  function stockRow(x) {
    var it = x.it;
    return '<li class="st-row' + (x.days != null && x.days < 0 ? ' expired' : '') + '">' +
      '<button type="button" class="st-main" data-act="stock-edit" data-id="' + x.id + '" aria-label="Sửa ' + esc(shortName(x.id)) + ': ' + qtyText(x.id, x.qty) + '">' +
      '<span class="ing-e" aria-hidden="true">' + it.emoji + '</span><span class="st-t"><strong>' + esc(it.name) + '</strong>' + expBadge(x) + '</span></button>' +
      '<div class="stepper" role="group" aria-label="Số lượng ' + esc(shortName(x.id)) + '">' +
      '<button type="button" class="btn-icon round" data-act="stock-dec" data-id="' + x.id + '" aria-label="Giảm ' + esc(shortName(x.id)) + '">' + H.icon('minus', { size: 16, stroke: 2.6 }) + '</button>' +
      '<output>' + qtyText(x.id, x.qty) + '</output>' +
      '<button type="button" class="btn-icon round" data-act="stock-inc" data-id="' + x.id + '" aria-label="Tăng ' + esc(shortName(x.id)) + '">' + H.icon('plus', { size: 16, stroke: 2.6 }) + '</button></div></li>';
  }

  function dishRow(m, reason) {
    var d = m.dish, lim = H.limitReason(d);
    return '<li><a class="row" href="#dish-' + d.id + '">' + H.ui.tile(d, 'sm') +
      '<span class="row-main"><strong>' + esc(d.name) + '</strong><small>' + esc(d.kind) + ' · ' + U.vnd(d.cost) + (d.time ? ' · ' + d.time + ' phút' : '') + '</small>' +
      (reason ? '<span class="why-use">' + reason + '</span>' : '') +
      (m.short.length ? '<span class="missing">Thiếu: ' + m.short.map(function (s) {
        return esc(shortName(s.id)) + (s.have > 0 ? ' (cần thêm ' + qtyText(s.id, s.need - s.have) + ')' : '');
      }).join(', ') + '</span>' : '') +
      (lim ? '<span class="missing">' + esc(lim) + '</span>' : '') + '</span>' +
      H.ui.careBadge(d.care) + '</a></li>';
  }

  function useReason(m) {
    return m.urgency.why.map(function (w) {
      return esc(shortName(w.id)) + ' (' + (w.days === 0 ? 'hết hạn hôm nay' : 'còn ' + w.days + ' ngày') + ')';
    }).join(', ');
  }

  // Khối "Cần chú ý": đồ hết hạn, sắp hết hạn, sắp hết.
  function alertsHtml(matches) {
    var rows = '';
    H.expiredItems().forEach(function (x) {
      rows += '<li class="alert bad"><span class="al-ic">' + H.icon('warn', { size: 18 }) + '</span><div class="al-t"><strong>' + esc(shortName(x.id)) + '</strong> đã hết hạn ' + (-x.days) + ' ngày trước. Nên bỏ đi, không dùng nữa.</div>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-act="stock-discard" data-id="' + x.id + '">Bỏ đi</button></li>';
    });
    H.expiringItems(NEAR).forEach(function (x) {
      var use = matches.filter(function (m) { return m.missing.length <= 1 && m.urgency.why.some(function (w) { return w.id === x.id; }); })
        .sort(function (a, b) { return a.missing.length - b.missing.length || b.urgency.score - a.urgency.score; })[0];
      rows += '<li class="alert warn"><span class="al-ic">' + H.icon('clock', { size: 18 }) + '</span><div class="al-t"><strong>' + esc(shortName(x.id)) + '</strong> ' +
        (x.days === 0 ? 'hết hạn hôm nay' : 'còn ' + x.days + ' ngày') + '. ' +
        (use ? 'Nấu sớm: <a href="#dish-' + use.dish.id + '">' + esc(use.dish.name) + '</a>.' : 'Dùng sớm kẻo bỏ phí.') + '</div></li>';
    });
    H.lowStock().forEach(function (x) {
      var subs = H.subsFor(x.id), sub = subs.filter(function (s) { return s.have; })[0] || subs[0];
      rows += '<li class="alert low"><span class="al-ic">' + H.icon('flame', { size: 18 }) + '</span><div class="al-t"><strong>' + esc(shortName(x.id)) + '</strong> còn ' + qtyText(x.id, x.qty) +
        (x.need > x.qty ? ', các bữa trong 3 ngày tới cần ' + qtyText(x.id, x.need) : ' (sắp hết)') + '. ' +
        (sub ? 'Có thể thay bằng ' + esc(sub.name.split(' (')[0].toLowerCase()) + (sub.have ? ' (bạn đang có)' : '') + '.' : '') + '</div>' +
        '<button type="button" class="btn btn-soft btn-sm" data-act="buy-one" data-id="' + x.id + '">Mua thêm</button></li>';
    });
    if (!rows) return '';
    return '<section class="fgroup"><h3>Cần chú ý</h3><ul class="alerts">' + rows + '</ul></section>';
  }

  P.tabHtml = function () {
    var items = H.pantryItems(), inStock = {};
    items.forEach(function (x) { inStock[x.id] = true; });
    var matches = H.fridgeMatches();
    var h = '<section class="weekcard fridge-head"><h2>Tủ lạnh của tôi</h2>' +
      '<p>Ghi số lượng và hạn dùng. Mình báo đồ sắp hỏng, đồ sắp hết, gợi ý món nên nấu trước và tự trừ nguyên liệu khi bạn đánh dấu “đã nấu”.</p>' +
      '<label class="label" for="quick-q">Nhập nhanh bằng chữ <small>(gõ nhiều món, cách nhau bằng dấu phẩy)</small></label>' +
      '<div class="quickadd"><input id="quick-q" class="input" type="text" placeholder="VD: trứng 6, gạo 1kg" autocomplete="off" enterkeyhint="done">' +
      '<button type="button" class="btn btn-primary" data-act="quick-add">Thêm</button></div>' +
      '<p class="hint quick-msg" id="quick-msg" role="status" aria-live="polite"></p>' +
      '<div class="chips"><button type="button" class="btn btn-ghost btn-sm" data-act="scan-info">' + H.icon('camera', { size: 16 }) + 'Chụp ảnh tủ lạnh / quét mã <span class="soon">Sắp có</span></button></div></section>';

    h += alertsHtml(matches);

    h += '<section class="fgroup"><h3>Đang có trong tủ <small class="h3-s">' + items.length + ' loại</small></h3>';
    if (!items.length) {
      h += '<p class="hint">Tủ đang trống. Gõ vào ô nhập nhanh ở trên hoặc chạm vào nguyên liệu trong danh mục bên dưới.</p>';
    } else {
      H.CATEGORIES.forEach(function (c) {
        var its = items.filter(function (x) { return x.it.cat === c.id; });
        if (!its.length) return;
        h += '<h4 class="st-cat">' + c.emoji + ' ' + esc(c.name) + '</h4><ul class="stock">' + its.map(stockRow).join('') + '</ul>';
      });
    }
    h += '</section>';

    // gợi ý món
    if (items.length) {
      var first = matches.filter(function (m) { return m.urgency.score > 0 && m.missing.length <= 1; })
        .sort(function (a, b) { return b.urgency.score - a.urgency.score || a.missing.length - b.missing.length; }).slice(0, 4);
      if (first.length) {
        h += '<section class="block"><h2>Nên nấu trước <small>dùng đồ sắp hết hạn</small></h2><ul class="rows">' +
          first.map(function (m) { return dishRow(m, 'Dùng ' + useReason(m)); }).join('') + '</ul></section>';
      }
      var ready = matches.filter(function (m) { return m.missing.length === 0; })
        .map(function (m, i) { return { m: m, i: i, over: !H.fitsLimits(m.dish) }; })
        .sort(function (a, b) { return (a.over ? 1 : 0) - (b.over ? 1 : 0) || b.m.urgency.score - a.m.urgency.score || a.i - b.i; })
        .map(function (o) { return o.m; });
      var near = matches.filter(function (m) { return m.missing.length > 0 && m.missing.length <= 2 && m.have > 0; })
        .sort(function (a, b) { return a.missing.length - b.missing.length || a.dish.care - b.dish.care; }).slice(0, 12);
      h += '<section class="block"><h2>Nấu được ngay <small>' + ready.length + ' món</small></h2>' +
        (ready.length ? '<ul class="rows">' + ready.map(function (m) { return dishRow(m); }).join('') + '</ul>' :
          '<p class="hint">Chưa có món nào đủ nguyên liệu. Xem các món thiếu ít bên dưới.</p>') + '</section>';
      if (near.length) {
        h += '<section class="block"><h2>Chỉ thiếu 1 đến 2 nguyên liệu</h2><ul class="rows">' + near.map(function (m) { return dishRow(m); }).join('') + '</ul></section>';
      }
    }

    // danh mục để thêm
    var cat = '';
    H.CATEGORIES.forEach(function (c) {
      if (c.id === 'giavi') return;
      var ids = Object.keys(H.INGREDIENTS).filter(function (id) { return H.INGREDIENTS[id].cat === c.id && !inStock[id]; });
      if (!ids.length) return;
      cat += '<h4 class="st-cat">' + c.emoji + ' ' + esc(c.name) + '</h4><div class="chips wrap">' + ids.map(function (id) {
        var it = H.INGREDIENTS[id];
        return H.ui.chip(it.emoji + ' ' + esc(it.name), false, 'toggle-fridge-tab', { id: id });
      }).join('') + '</div>';
    });
    h += '<section class="fgroup cat-add"><h3>Thêm từ danh mục</h3><p class="hint">Chạm để thêm một gói thường mua (sửa số lượng và hạn dùng sau).</p>' + (cat || '<p class="hint">Bạn đã có đủ mọi nguyên liệu trong danh mục.</p>') + '</section>';
    return h;
  };

  // Thẻ nhỏ ở trang chủ khi có đồ hết hạn / sắp hết hạn / sắp hết.
  P.alertCard = function () {
    var exp = H.expiredItems(), near = H.expiringItems(NEAR), low = H.lowStock();
    if (!exp.length && !near.length && !low.length) return '';
    var cls, text;
    if (exp.length) {
      cls = 'bad';
      text = shortName(exp[0].id) + ' đã hết hạn' + (exp.length > 1 ? ' (cùng ' + (exp.length - 1) + ' món khác)' : '') + '. Kiểm tra tủ lạnh nhé.';
    } else if (near.length) {
      cls = 'warn';
      var x = near[0];
      var m = H.fridgeMatches().filter(function (z) { return z.missing.length <= 1 && z.urgency.why.some(function (w) { return w.id === x.id; }); })
        .sort(function (a, b) { return a.missing.length - b.missing.length || b.urgency.score - a.urgency.score; })[0];
      text = shortName(x.id) + (x.days === 0 ? ' hết hạn hôm nay' : ' còn ' + x.days + ' ngày hạn') + (near.length > 1 ? ' (cùng ' + (near.length - 1) + ' món khác)' : '') + (m ? '. Nấu sớm: ' + m.dish.name : '');
    } else {
      cls = 'low';
      text = shortName(low[0].id) + ' sắp hết' + (low.length > 1 ? ' (cùng ' + (low.length - 1) + ' món khác)' : '') + '. Xem tủ lạnh và danh sách thay thế.';
    }
    return '<a class="alertcard ' + cls + '" href="#plan-fridge"><span class="ac-e" aria-hidden="true">🧊</span><span class="ac-t">' + esc(text) + '</span>' + H.icon('chev-r', { size: 16 }) + '</a>';
  };

  // ───────────── hành động ─────────────
  function rerender() { H.render({ keepScroll: true }); }

  H.actions['toggle-fridge-tab'] = function (el) {
    var id = el.dataset.id;
    if (H.stockOf(id) > 0) { H.openStockEdit(id); return; }
    H.addStock(id, H.packOf(id).qty);
    H.toast('Đã thêm ' + shortName(id).toLowerCase() + ' (' + qtyText(id, H.packOf(id).qty) + ')', { icon: 'check' });
    rerender();
  };
  H.actions['stock-inc'] = function (el) { H.addStock(el.dataset.id, H.packOf(el.dataset.id).step); rerender(); };
  H.actions['stock-dec'] = function (el) {
    var id = el.dataset.id, left = H.stockOf(id) - H.packOf(id).step;
    if (left <= 1e-9) { H.addStock(id, -H.stockOf(id)); H.toast('Đã hết ' + shortName(id).toLowerCase() + ', bỏ khỏi tủ lạnh', { icon: 'trash' }); }
    else H.addStock(id, -H.packOf(id).step);
    rerender();
  };
  H.actions['stock-discard'] = function (el) {
    H.setStock(el.dataset.id, 0);
    H.toast('Đã bỏ ' + shortName(el.dataset.id).toLowerCase() + ' hết hạn', { icon: 'trash' });
    rerender();
  };
  H.actions['stock-edit'] = function (el) { H.openStockEdit(el.dataset.id); };

  H.actions['quick-add'] = function () {
    var input = document.getElementById('quick-q'), msg = document.getElementById('quick-msg');
    if (!input) return;
    var r = P.parse(input.value);
    if (!r.items.length && !r.unknown.length) { if (msg) msg.textContent = 'Hãy gõ tên nguyên liệu, ví dụ: trứng 6, gạo 1kg.'; return; }
    r.items.forEach(function (x) { H.addStock(x.id, x.qty); });
    var added = r.items.map(function (x) { return shortName(x.id).toLowerCase() + ' ' + qtyText(x.id, x.qty); });
    var text = (added.length ? 'Đã thêm: ' + added.join(', ') + '.' : '') + (r.unknown.length ? ' Chưa nhận ra: ' + r.unknown.join(', ') + '. Thử gõ tên khác hoặc chọn trong danh mục.' : '');
    if (added.length) {
      H.toast('Đã thêm ' + added.length + ' nguyên liệu vào tủ lạnh', { icon: 'check' });
      rerender();
      var m2 = document.getElementById('quick-msg');
      if (m2) m2.textContent = text;
      var again = document.getElementById('quick-q');
      if (again && r.unknown.length) again.value = r.unknown.join(', ');
    } else if (msg) msg.textContent = text;
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.id === 'quick-q') { e.preventDefault(); H.actions['quick-add'](); }
  });

  // ───────────── sửa số lượng và hạn dùng ─────────────
  H.openStockEdit = function (id) {
    var it = H.INGREDIENTS[id];
    if (!it || it.staple) return;
    H.sheet.open({
      title: 'Trong tủ lạnh',
      cls: 'overlay-dialog',
      render: function () {
        var q = H.stockOf(id), exp = H.expOf(id), pk = H.packOf(id), days = H.daysLeft(id);
        var subs = H.subsFor(id);
        var note = days == null ? '' : (days < 0 ? '<p class="note warn">' + H.icon('warn', { size: 16 }) + '<span>Đã hết hạn ' + (-days) + ' ngày trước. Nên bỏ đi.</span></p>'
          : days <= NEAR ? '<p class="note warn">' + H.icon('clock', { size: 16 }) + '<span>' + (days === 0 ? 'Hết hạn hôm nay' : 'Còn ' + days + ' ngày') + ', dùng sớm nhé.</span></p>' : '');
        return {
          body: '<div class="se-head"><span class="se-e" aria-hidden="true">' + it.emoji + '</span><div><strong>' + esc(it.name) + '</strong><small>Gói thường mua: ' + qtyText(id, pk.qty) + ' · giá ước tính ' + (it.unit === 'g' ? U.vnd(it.price * 1000) + '/kg' : U.vnd(it.price) + '/' + esc(it.unit)) + '</small></div></div>' + note +
            '<label class="label" for="se-qty">Số lượng <small>(' + (it.unit === 'g' ? 'gam' : esc(it.unit)) + ')</small></label>' +
            '<div class="stepper big"><button type="button" class="btn-icon round" data-act="se-dec" aria-label="Giảm">' + H.icon('minus', { size: 18, stroke: 2.6 }) + '</button>' +
            '<input id="se-qty" class="input" type="number" inputmode="decimal" min="0" step="any" value="' + (q || '') + '" placeholder="0" data-input="se-qty">' +
            '<button type="button" class="btn-icon round" data-act="se-inc" aria-label="Tăng">' + H.icon('plus', { size: 18, stroke: 2.6 }) + '</button></div>' +
            '<label class="label" for="se-exp">Hạn dùng <small>(không bắt buộc)</small></label>' +
            '<input id="se-exp" class="input" type="date" value="' + esc(exp) + '" data-input="se-exp">' +
            '<div class="chips se-chips"><button type="button" class="btn btn-ghost btn-sm" data-act="se-exp-default">' + (H.SHELF_DAYS[id] > 0 ? 'Theo mặc định (' + H.SHELF_DAYS[id] + ' ngày)' : 'Đồ để lâu, không cần hạn') + '</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-act="se-exp-clear">Bỏ hạn</button></div>' +
            (subs.length ? '<h3 class="se-h">Khi hết, có thể thay bằng</h3><ul class="rows">' + subs.map(subRow).join('') + '</ul>' : ''),
          foot: '<div class="foot-actions"><button type="button" class="btn btn-ghost btn-danger-ghost" data-act="se-remove">' + H.icon('trash', { size: 16 }) + 'Bỏ khỏi tủ</button>' +
            '<button type="button" class="btn btn-primary" data-act="close-sheet" data-autofocus>Xong</button></div>'
        };
      },
      onClose: function () { rerender(); }
    }).stockId = id;
  };

  function subRow(s) {
    return '<li class="row"><span class="ing-e" aria-hidden="true">' + s.emoji + '</span><span class="row-main"><strong>' + esc(s.name) + '</strong><small>' + esc(s.note) + '</small></span>' +
      (s.have ? '<span class="badge care-1">Bạn đang có</span>' : '') + '</li>';
  }

  function editing() { var t = H.sheet.top(); return t && t.stockId ? t.stockId : null; }
  H.actions['se-inc'] = function () { var id = editing(); if (!id) return; H.addStock(id, H.packOf(id).step); H.sheet.refresh(); };
  H.actions['se-dec'] = function () {
    var id = editing(); if (!id) return;
    var left = H.stockOf(id) - H.packOf(id).step;
    if (left <= 1e-9) H.setStock(id, 0); else H.addStock(id, -H.packOf(id).step);
    H.sheet.refresh();
  };
  H.actions['se-exp-default'] = function () {
    var id = editing(); if (!id) return;
    if (H.stockOf(id) > 0) H.state.pantry[id].exp = H.defaultExp(id);
    H.save(); H.sheet.refresh();
  };
  H.actions['se-exp-clear'] = function () {
    var id = editing(); if (!id) return;
    if (H.stockOf(id) > 0) H.state.pantry[id].exp = '';
    H.save(); H.sheet.refresh();
  };
  H.actions['se-remove'] = function () {
    var id = editing(); if (!id) return;
    H.setStock(id, 0);
    H.toast('Đã bỏ ' + shortName(id).toLowerCase() + ' khỏi tủ lạnh', { icon: 'trash' });
    H.sheet.close();
  };
  // Gõ số lượng / chọn ngày: lưu ngay nhưng không vẽ lại hộp (để khỏi mất con trỏ).
  H.inputs['se-qty'] = function (el) {
    var id = editing(); if (!id) return;
    var v = parseFloat(String(el.value).replace(',', '.'));
    if (!isFinite(v) || v < 0) return;
    if (v === 0) H.setStock(id, 0);
    else H.setStock(id, v, H.expOf(id) || (H.stockOf(id) ? '' : H.defaultExp(id)));
  };
  H.inputs['se-exp'] = function (el) {
    var id = editing(); if (!id) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(el.value)) return;
    if (H.stockOf(id) > 0) { H.state.pantry[id].exp = el.value; H.save(); }
  };

  // ───────────── thay thế nguyên liệu ─────────────
  H.openSubs = function (id) {
    H.sheet.open({
      title: 'Thiếu ' + shortName(id).toLowerCase() + '?',
      cls: 'overlay-dialog',
      render: function () {
        var subs = H.subsFor(id), it = H.INGREDIENTS[id];
        return {
          body: '<p class="dialog-text">Có thể thay <strong>' + esc(it.name) + '</strong> bằng một trong các nguyên liệu sau. Mình xếp thứ bạn đang có trong tủ lạnh lên đầu.</p>' +
            (subs.length ? '<ul class="rows">' + subs.map(subRow).join('') + '</ul>'
              : '<p class="hint">Chưa có gợi ý thay thế cho nguyên liệu này. Nếu chỉ là rau thơm hay hành lá nhỏ thì bỏ đi cũng được.</p>') +
            '<p class="hint">Món thay thế có thể đổi vị và độ mềm một chút. Xem thêm <a href="#guide-thaythe" data-act="close-sheet">bảng thay thế trong Cẩm nang</a>.</p>',
          foot: '<button type="button" class="btn btn-primary btn-block" data-act="close-sheet" data-autofocus>Đã hiểu</button>'
        };
      }
    });
  };
  H.actions['subs-open'] = function (el) { H.openSubs(el.dataset.id); };

  // ───────────── mua online (chỉ mở trang tìm kiếm của cửa hàng) ─────────────
  // items: [{ id, qty }]
  H.openBuy = function (items, title) {
    var st = { store: 'bhx', items: items };
    var rec = H.sheet.open({
      title: title || 'Mua nguyên liệu',
      render: function () {
        var store = H.STORES.filter(function (s) { return s.id === st.store; })[0];
        var body = '<div class="chips scroller" role="group" aria-label="Chọn cửa hàng">' + H.STORES.map(function (s) {
          return H.ui.chip(esc(s.id === 'maps' ? 'Cửa hàng gần bạn' : s.name), s.id === st.store, 'buy-store', { v: s.id });
        }).join('') + '</div><ul class="rows buy-rows">' + st.items.map(function (x) {
          var it = H.INGREDIENTS[x.id];
          return '<li><a class="row" href="' + esc(store.url(shortName(x.id))) + '" target="_blank" rel="noopener noreferrer"><span class="ing-e" aria-hidden="true">' + it.emoji + '</span>' +
            '<span class="row-main"><strong>' + esc(shortName(x.id)) + '</strong><small>Cần mua khoảng ' + qtyText(x.id, x.qty) + '</small></span>' +
            '<span class="buy-go">Tìm ' + H.icon('ext', { size: 14 }) + '<span class="sr-only"> (mở tab mới)</span></span></a></li>';
        }).join('') + '</ul>' +
          '<p class="hint">Mình chưa kết nối đặt hàng tự động. Mỗi dòng chỉ mở trang tìm kiếm của cửa hàng bạn chọn, giá thực tế có thể khác giá ước tính trong ứng dụng.</p>';
        return {
          body: body,
          foot: '<button type="button" class="btn btn-soft btn-block" data-act="buy-copy">' + H.icon('copy', { size: 16 }) + 'Sao chép danh sách để dán vào app đi chợ</button>'
        };
      }
    });
    rec.buy = st;
    return rec;
  };
  H.actions['buy-store'] = function (el) { var t = H.sheet.top(); if (t && t.buy) { t.buy.store = el.dataset.v; t.refresh(); } };
  H.actions['buy-copy'] = function () {
    var t = H.sheet.top(); if (!t || !t.buy) return;
    var text = ['Cần mua:'].concat(t.buy.items.map(function (x) { return '- ' + shortName(x.id) + ': ' + qtyText(x.id, x.qty); })).join('\n');
    U.copy(text).then(function (ok) {
      if (ok) H.toast('Đã sao chép danh sách', { icon: 'copy' });
      else if (H.showTextSheet) H.showTextSheet('Danh sách cần mua', text);
    });
  };
  // Mua thêm một nguyên liệu (lượng thiếu = cần trong 3 ngày tới trừ lượng đang có, tối thiểu một gói).
  H.actions['buy-one'] = function (el) {
    var id = el.dataset.id, need = H.needNext(3)[id] || 0, gap = Math.max(need - H.usableStock(id), H.packOf(id).qty);
    H.openBuy([{ id: id, qty: gap }], 'Mua ' + shortName(id).toLowerCase());
  };
  H.actions['buy-ids'] = function (el) {
    var items = String(el.dataset.items || '').split(',').filter(Boolean).map(function (pair) {
      var p = pair.split(':');
      return H.INGREDIENTS[p[0]] ? { id: p[0], qty: Number(p[1]) || H.packOf(p[0]).qty } : null;
    }).filter(Boolean);
    if (items.length) H.openBuy(items, 'Mua nguyên liệu còn thiếu');
  };

  // ───────────── nhập bằng ảnh: chưa làm được ─────────────
  H.actions['scan-info'] = function () {
    H.sheet.open({
      title: 'Nhập bằng ảnh (sắp có)',
      cls: 'overlay-dialog',
      render: function () {
        return {
          body: '<div class="scan-box"><span class="scan-e" aria-hidden="true">📷</span>' +
            '<p>Ý tưởng: chụp ảnh tủ lạnh hoặc quét mã vạch, mình tự nhận ra nguyên liệu và hạn dùng để bạn khỏi gõ tay.</p></div>' +
            '<p class="note warn">' + H.icon('info', { size: 16 }) + '<span><strong>Chưa làm được trong bản này.</strong> Nhận diện ảnh cần một dịch vụ AI và máy chủ để xử lý, còn trang này chạy hoàn toàn trên máy bạn. Mình không giả vờ nhận ra đồ ăn bằng cách đoán bừa.</span></p>' +
            '<p class="hint">Trong lúc chờ, cách nhanh nhất là gõ vào ô <strong>Nhập nhanh</strong> (ví dụ: <em>trứng 6, gạo 1kg, bí đỏ 300g</em>) hoặc chạm vào nguyên liệu trong danh mục.</p>',
          foot: '<button type="button" class="btn btn-primary btn-block" data-act="close-sheet" data-autofocus>Đã hiểu</button>'
        };
      }
    });
  };
})(window.HNAG = window.HNAG || {});
