/*
 * Vuốt chọn món: một bộ bài các món hợp với bạn.
 * Vuốt phải (hoặc ♥) = thích, thêm vào yêu thích. Vuốt trái (hoặc ✕) = không muốn ăn, bỏ khỏi vòng quay và kế hoạch.
 * "Để sau" đưa món xuống cuối bộ bài. Có hoàn tác, và dùng được bằng bàn phím (← → ↓ và Z).
 */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;
  var D = H.deck = {};
  var st = null;   // { list, i, history, liked, dropped, busy }

  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  // Các món chưa được quyết định (chưa yêu thích, chưa bị bỏ), hợp hồ sơ và bộ lọc hiện tại. Xáo ngẫu nhiên.
  D.build = function () {
    return U.shuffle(H.DISHES.filter(function (d) {
      return H.fitsProfile(d) && H.matchesFilters(d) && H.state.favs.indexOf(d.id) < 0 && !H.isExcluded(d.id);
    })).map(function (d) { return d.id; });
  };

  function cardHtml(d, cls, pos, total) {
    return '<article class="deck-card ' + cls + '"' + (cls === 'top' ? ' tabindex="0" role="group" aria-roledescription="thẻ món" aria-label="Món ' + pos + ' trên ' + total + ': ' + esc(d.name) + '. Dùng phím mũi tên trái để bỏ, phải để thích."' : ' aria-hidden="true"') + ' data-id="' + d.id + '">' +
      '<span class="stamp like" aria-hidden="true">Thích</span><span class="stamp nope" aria-hidden="true">Bỏ</span>' +
      H.ui.tile(d, 'xl') +
      '<h3>' + esc(d.name) + '</h3>' +
      '<div class="tags">' + H.ui.kindTag(d) + H.ui.careBadge(d.care) + H.ui.extraTags(d) + '</div>' +
      H.ui.dishStats(d) +
      '<p class="deck-why">' + esc(d.why) + '</p>' +
      (cls === 'top' ? '<a class="link deck-more" href="#dish-' + d.id + '" data-act="close-sheet">' + (d.mode === 'out' ? 'Cách gọi món' : 'Xem công thức') + H.icon('chev-r', { size: 14 }) + '</a>' : '') +
      '</article>';
  }

  function bodyHtml() {
    var total = st.list.length;
    if (!total) {
      return H.ui.empty({
        title: 'Không còn món để vuốt',
        text: 'Mọi món hợp với bạn đều đã được thích hoặc bỏ. Thử nới bộ lọc, hoặc đưa lại món đã bỏ ở trang món.',
        action: '<button type="button" class="btn btn-soft" data-act="open-filters" data-ctx="explore">Mở bộ lọc</button>'
      });
    }
    if (st.i >= total) {
      return '<div class="deck-done">' + H.mascot({ size: 96, mood: 'wow' }) + '<h3>Xong rồi!</h3>' +
        '<p>Bạn đã thích <strong>' + st.liked + '</strong> món và bỏ <strong>' + st.dropped + '</strong> món. Mình sẽ ưu tiên món bạn thích khi tự xếp thực đơn và không đưa món đã bỏ lên vòng quay.</p>' +
        '<div class="deck-done-acts"><button type="button" class="btn btn-primary" data-act="deck-favs">' + H.icon('heart', { size: 18 }) + 'Xem món yêu thích</button></div></div>';
    }
    var d = H.DISH_BY_ID[st.list[st.i]], nx = st.list[st.i + 1] ? H.DISH_BY_ID[st.list[st.i + 1]] : null;
    return '<div class="deck"><p class="deck-count" aria-hidden="true">' + (st.i + 1) + ' / ' + total + '</p>' +
      '<div class="deck-stage">' + (nx ? cardHtml(nx, 'next', st.i + 2, total) : '') + cardHtml(d, 'top', st.i + 1, total) + '</div>' +
      '<div class="deck-actions">' +
      '<button type="button" class="deck-btn nope" data-act="deck-nope" aria-label="Bỏ món này khỏi vòng quay và kế hoạch">' + H.icon('x', { size: 26, stroke: 3 }) + '</button>' +
      '<button type="button" class="deck-btn skip" data-act="deck-skip" aria-label="Để sau">' + H.icon('refresh', { size: 22 }) + '</button>' +
      '<button type="button" class="deck-btn like" data-act="deck-like" aria-label="Thích món này">' + H.icon('heart', { size: 26, fill: true }) + '</button></div>' +
      '<p class="hint deck-hint">Vuốt phải để thích, vuốt trái để bỏ. Bàn phím: ← bỏ, → thích, ↓ để sau, Z hoàn tác.</p></div>';
  }

  D.open = function () {
    st = { list: D.build(), i: 0, history: [], liked: 0, dropped: 0, busy: false };
    var rec = H.sheet.open({
      title: 'Vuốt chọn món',
      cls: 'overlay-deck',
      render: function () {
        return {
          body: bodyHtml(),
          foot: st.history.length ? '<button type="button" class="btn btn-ghost btn-block" data-act="deck-undo">' + H.icon('refresh', { size: 16 }) + 'Hoàn tác thao tác vừa rồi</button>' : ''
        };
      },
      onClose: function () {
        H.ui.result = null;
        st = null;
        H.render({ keepScroll: true });
      }
    });
    rec.isDeck = true;
    return rec;
  };

  function announce(text) {
    var live = document.getElementById('sr-live');
    if (live) live.textContent = text;
  }

  function topEl() { var s = H.sheet.top(); return s && s.isDeck ? U.$('.deck-card.top', s.el) : null; }

  // kind: 'like' | 'nope' | 'skip'
  D.decide = function (kind, el) {
    if (!st || st.busy || st.i >= st.list.length) return;
    if (kind === 'skip' && st.i + 1 >= st.list.length) { announce('Đây là món cuối cùng, chưa thể để sau'); H.toast('Đây là món cuối cùng nên chưa để sau được', { icon: 'info' }); return; }
    var id = st.list[st.i], d = H.DISH_BY_ID[id];
    var rec = { id: id, kind: kind, wasFav: H.state.favs.indexOf(id) >= 0, wasExcl: H.isExcluded(id) };
    if (kind === 'like') {
      if (!rec.wasFav) H.toggleFav(id);
      st.liked++;
      announce('Đã thích ' + d.name);
    } else if (kind === 'nope') {
      if (!rec.wasExcl) H.toggleExcluded(id);
      st.dropped++;
      announce('Đã bỏ ' + d.name);
    } else {
      st.list.push(id);          // để sau: xuống cuối bộ bài
      announce('Để sau: ' + d.name);
    }
    st.history.push(rec);
    st.i++;
    st.busy = true;
    var card = el || topEl();
    if (card && !reduced()) {
      card.classList.add(kind === 'like' ? 'fly-right' : kind === 'nope' ? 'fly-left' : 'fly-down');
      setTimeout(done, 190);
    } else done();
    function done() { if (st) st.busy = false; if (st && H.sheet.top() && H.sheet.top().isDeck) H.sheet.refresh(); }   // hộp có thể đã đóng trong lúc thẻ bay đi
  };

  D.undo = function () {
    if (!st || st.busy || !st.history.length) return;
    var rec = st.history.pop();
    if (rec.kind === 'like') { if (!rec.wasFav && H.state.favs.indexOf(rec.id) >= 0) H.toggleFav(rec.id); st.liked = Math.max(0, st.liked - 1); }
    else if (rec.kind === 'nope') { if (!rec.wasExcl && H.isExcluded(rec.id)) H.toggleExcluded(rec.id); st.dropped = Math.max(0, st.dropped - 1); }
    else if (st.list[st.list.length - 1] === rec.id) st.list.pop();   // lấy lại bản "để sau" ở cuối
    st.i = Math.max(0, st.i - 1);
    announce('Đã hoàn tác');
    H.sheet.refresh();
  };

  H.actions['open-deck'] = function () { D.open(); };
  H.actions['deck-like'] = function () { D.decide('like'); };
  H.actions['deck-nope'] = function () { D.decide('nope'); };
  H.actions['deck-skip'] = function () { D.decide('skip'); };
  H.actions['deck-undo'] = function () { D.undo(); };
  H.actions['deck-favs'] = function () {
    H.sheet.closeAll();
    H.ui.exploreFav = true; H.ui.exploreMeal = 'all';
    if (location.hash === '#explore') H.render(); else location.hash = '#explore';
  };

  // ── bàn phím ──
  document.addEventListener('keydown', function (e) {
    var s = H.sheet.top();
    if (!s || !s.isDeck || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    var k = e.key;
    if (k === 'ArrowLeft') { e.preventDefault(); D.decide('nope'); }
    else if (k === 'ArrowRight') { e.preventDefault(); D.decide('like'); }
    else if (k === 'ArrowDown') { e.preventDefault(); D.decide('skip'); }
    else if (k === 'z' || k === 'Z') { e.preventDefault(); D.undo(); }
  });

  // ── kéo thả bằng chuột hoặc ngón tay ──
  var drag = null;
  var THRESHOLD = 90;
  document.addEventListener('pointerdown', function (e) {
    if (!st || e.button > 0) return;
    var card = e.target.closest && e.target.closest('.deck-card.top');
    if (!card || e.target.closest('a, button')) return;
    drag = { el: card, x0: e.clientX, y0: e.clientY, dx: 0, id: e.pointerId };
    try { card.setPointerCapture(e.pointerId); } catch (x) { /* bỏ qua */ }
    card.classList.add('dragging');
  });
  document.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x0;
    var dy = (e.clientY - drag.y0) * 0.25;
    drag.el.style.transform = 'translate(' + drag.dx + 'px,' + dy + 'px) rotate(' + (drag.dx / 18) + 'deg)';
    drag.el.style.setProperty('--like', U.clamp(drag.dx / THRESHOLD, 0, 1));
    drag.el.style.setProperty('--nope', U.clamp(-drag.dx / THRESHOLD, 0, 1));
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var dx = drag.dx, el = drag.el;
    drag = null;
    el.classList.remove('dragging');
    if (dx > THRESHOLD) { el.style.transform = ''; D.decide('like', el); }
    else if (dx < -THRESHOLD) { el.style.transform = ''; D.decide('nope', el); }
    else { el.style.transform = ''; el.style.setProperty('--like', 0); el.style.setProperty('--nope', 0); }
  }
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);
})(window.HNAG = window.HNAG || {});
