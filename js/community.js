/*
 * Cộng đồng: đánh giá món bằng sao, bình luận và ảnh món. Nằm trong mục "Cá nhân" (cạnh hồ sơ) và ở cuối trang từng món. Đánh giá chỉ lưu trên máy bạn; nút Chia sẻ gửi một đánh giá (kèm ảnh nếu máy hỗ trợ)
 * cho bạn bè qua hộp chia sẻ của điện thoại. Cộng đồng chung cho mọi người cùng xem cần máy chủ nên chưa có.
 */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;
  var C = H.community = {};
  var filter = 'all';      // all | photo
  var draft = null;        // { dish, fixed, stars, text, photo (data URL), q, busy }

  // ───────────── thành phần nhỏ ─────────────
  function starsHtml(n) {
    var s = '';
    for (var i = 1; i <= 5; i++) s += H.icon('star', { size: 14, fill: i <= n });
    return '<span class="rv-stars" role="img" aria-label="' + n + ' trên 5 sao">' + s + '</span>';
  }

  function timeLabel(ts) {
    var diff = Date.now() - ts;
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' phút trước';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' giờ trước';
    return U.fmtDMY(new Date(ts));
  }

  // Nút chọn ảnh: nhãn bọc ô file ẩn (vẫn dùng được bằng bàn phím). capture = mở thẳng camera trên điện thoại.
  function fileBtn(label, cls, handler, id, capture, icon) {
    return '<label class="' + cls + ' filebtn"><input type="file" accept="image/*"' + (capture ? ' capture="environment"' : '') + ' class="sr-only" data-input="' + handler + '"' + (id ? ' data-id="' + esc(id) + '"' : '') + '>' +
      H.icon(icon || 'camera', { size: 18 }) + '<span>' + label + '</span></label>';
  }
  C.fileBtn = fileBtn;

  function card(r, withDish) {
    var d = H.DISH_BY_ID[r.dish], src = r.photo ? H.photo.get(r.photo) : '';
    var h = '<li class="rvcard' + (src ? ' has-photo' : '') + '" id="rv-' + esc(r.id) + '">';
    if (src) {
      h += '<button type="button" class="rv-photo" data-act="rv-zoom" data-id="' + esc(r.id) + '" aria-label="Xem ảnh lớn món ' + esc(d.name) + '"><img src="' + src + '" alt="Ảnh món ' + esc(d.name) + ' do bạn đăng" loading="lazy"></button>';
    }
    h += '<div class="rv-body"><div class="rv-head">' +
      (withDish ? '<a class="rv-dish" href="#dish-' + d.id + '">' + H.ui.tile(d, 'xs') + '<strong>' + esc(d.name) + '</strong></a>' : '') +
      (r.stars ? starsHtml(r.stars) : '') + '</div>' +
      (r.text ? '<p class="rv-text">' + esc(r.text) + '</p>' : '') +
      '<div class="rv-foot"><small>' + timeLabel(r.ts) + '</small>' +
      '<button type="button" class="link-btn" data-act="rv-share" data-id="' + esc(r.id) + '">' + H.icon('ext', { size: 14 }) + 'Chia sẻ</button>' +
      '<button type="button" class="link-btn danger" data-act="rv-del" data-id="' + esc(r.id) + '">' + H.icon('trash', { size: 14 }) + 'Xoá</button></div></div></li>';
    return h;
  }

  // ───────────── trang một món: nút viết bình luận, gửi ảnh và các đánh giá của món ─────────────
  C.dishPart = function (d) {
    var list = H.reviewsOf(d.id);
    var h = '<div class="rv-actions">' +
      '<button type="button" class="btn btn-soft btn-sm" data-act="rv-open" data-id="' + d.id + '">' + H.icon('edit', { size: 16 }) + 'Viết bình luận</button>' +
      fileBtn('Gửi ảnh món', 'btn btn-soft btn-sm', 'rv-quick', d.id, false) + '</div>';
    if (list.length) {
      h += '<ul class="rv-list" aria-label="Đánh giá món ' + esc(d.name) + '">' + list.slice(0, 3).map(function (r) { return card(r, false); }).join('') + '</ul>' +
        '<a class="link rv-more" href="#community">' + (list.length > 3 ? 'Xem cả ' + list.length + ' đánh giá' : 'Mở Cộng đồng') + ' ' + H.icon('chev-r', { size: 14 }) + '</a>';
    }
    return h;
  };

  // ───────────── màn Cộng đồng ─────────────
  H.views.community = {
    title: 'Cộng đồng',
    render: function () {
      var all = H.allReviews(), withPhoto = all.filter(function (r) { return r.photo; });
      var list = filter === 'photo' ? withPhoto : all;
      var h = '<div class="explore community">' +
        H.ui.pageHead('CÁ NHÂN', 'Cộng đồng', 'Đánh giá, bình luận và ảnh những món bạn đã nấu.') +
        H.me.switchHtml('community') +
        '<p class="note">' + H.icon('info', { size: 16 }) + '<span><strong>Đánh giá lưu trên máy bạn.</strong> Bấm Chia sẻ để gửi một đánh giá cho bạn bè. Cộng đồng chung cho mọi người cùng xem: <strong>sắp có</strong> (cần máy chủ).</span></p>' +
        '<div class="cm-bar"><button type="button" class="btn btn-primary" data-act="rv-new">' + H.icon('edit', { size: 18 }) + 'Viết đánh giá</button>' +
        fileBtn('Gửi ảnh món', 'btn btn-soft', 'rv-quick', '', false) + '</div>';
      if (!all.length) {
        return h + H.ui.empty({
          title: 'Chưa có đánh giá nào',
          text: 'Nấu một món rồi viết vài dòng cảm nhận, hoặc gửi ảnh món của bạn nhé. Đánh giá bằng sao cũng giúp mình gợi ý đúng gu bạn hơn.',
          action: '<button type="button" class="btn btn-primary" data-act="rv-new">Viết đánh giá đầu tiên</button>'
        }) + H.ui.disclaimer() + '</div>';
      }
      h += '<div class="chips cm-filter" role="group" aria-label="Lọc đánh giá">' +
        H.ui.chip('Tất cả (' + all.length + ')', filter === 'all', 'rv-filter', { v: 'all' }) +
        H.ui.chip(H.icon('camera', { size: 15 }) + ' Có ảnh (' + withPhoto.length + ')', filter === 'photo', 'rv-filter', { v: 'photo' }) + '</div>';
      h += list.length ? '<ul class="rv-grid">' + list.map(function (r) { return card(r, true); }).join('') + '</ul>'
        : '<p class="hint">Chưa có đánh giá nào kèm ảnh.</p>';
      return h + H.ui.disclaimer() + '</div>';
    }
  };

  H.actions['rv-filter'] = function (el) { filter = el.dataset.v === 'photo' ? 'photo' : 'all'; H.render({ keepScroll: true }); };

  // ───────────── hộp viết đánh giá ─────────────
  function blank(dish, photo) {
    return { dish: dish || '', fixed: !!dish, stars: dish ? H.ratingOf(dish) : 0, text: '', photo: photo || '', q: '', busy: false };
  }
  function canPost() { return !!draft && !!draft.dish && !draft.busy && !!(draft.text.trim() || draft.photo); }

  function pickList() {
    var q = draft.q;
    var list = H.DISHES.filter(function (d) { return U.searchMatch(d.searchRaw, d.searchText, q); });
    // món bạn hay chọn, hay nấu lên đầu
    list.sort(function (a, b) { return H.habitCount(b.id) - H.habitCount(a.id) || a.name.localeCompare(b.name, 'vi'); });
    list = list.slice(0, 40);
    return list.length ? '<ul class="rows">' + list.map(function (d) {
      return '<li><button type="button" class="row pick" data-act="rv-pick" data-id="' + d.id + '">' + H.ui.tile(d, 'sm') +
        '<span class="row-main"><strong>' + esc(d.name) + '</strong><small>' + esc(d.kind) + (H.habitCount(d.id) ? ' · bạn hay chọn' : '') + '</small></span></button></li>';
    }).join('') + '</ul>' : H.ui.empty({ title: 'Không có món phù hợp', text: 'Thử từ khoá khác nhé.' });
  }

  function composeRender() {
    if (!draft.dish) {
      return {
        title: 'Chọn món để đánh giá',
        body: '<div class="search"><span class="search-ic">' + H.icon('search', { size: 18 }) + '</span><input id="rv-q" type="search" placeholder="Tìm món…" autocomplete="off" value="' + esc(draft.q) + '" data-input="rv-q" data-autofocus aria-label="Tìm món"></div>' +
          (draft.photo ? '<p class="hint">Ảnh của bạn đã sẵn sàng, chọn món để gắn ảnh.</p>' : '') +
          '<div id="rv-pick-list">' + pickList() + '</div>'
      };
    }
    var d = H.DISH_BY_ID[draft.dish], i, stars = '';
    for (i = 1; i <= 5; i++) {
      stars += '<button type="button" class="star' + (i <= draft.stars ? ' on' : '') + '" role="radio" aria-checked="' + (i === draft.stars) + '" data-act="rv-star" data-v="' + i + '" aria-label="' + i + ' sao' + (i === draft.stars ? ', bấm lại để bỏ chấm' : '') + '">' + H.icon('star', { size: 28, fill: i <= draft.stars }) + '</button>';
    }
    var photo;
    if (draft.busy) photo = '<p class="hint" role="status">Đang xử lý ảnh…</p>';
    else if (draft.photo) {
      photo = '<figure class="rv-preview"><img src="' + draft.photo + '" alt="Ảnh món bạn sắp đăng"></figure><div class="rv-photo-acts">' +
        fileBtn('Đổi ảnh', 'btn btn-ghost btn-sm', 'rv-file', '', false) +
        '<button type="button" class="btn btn-ghost btn-sm" data-act="rv-photo-rm">' + H.icon('trash', { size: 16 }) + 'Bỏ ảnh</button></div>';
    } else photo = '<div class="rv-photo-empty">' + fileBtn('Chụp hoặc chọn ảnh món', 'btn btn-soft', 'rv-file', '', false) + '</div>';
    return {
      title: 'Đánh giá món',
      body: '<div class="rvf-dish">' + H.ui.tile(d, 'sm') + '<div class="rvf-name"><strong>' + esc(d.name) + '</strong><small>' + esc(d.kind) + '</small></div>' +
        (draft.fixed ? '' : '<button type="button" class="link-btn" data-act="rv-change-dish">Đổi món</button>') + '</div>' +
        '<div class="label" id="rvf-sl">Bạn chấm mấy sao?</div><div class="stars rvf-stars" role="radiogroup" aria-labelledby="rvf-sl">' + stars + '</div>' +
        '<label class="label" for="rv-text">Bình luận <small>(có thể bỏ trống nếu đã thêm ảnh)</small></label>' +
        '<textarea id="rv-text" class="textarea" rows="4" maxlength="500" placeholder="Món này ăn thấy sao? Có mẹo nấu hay lưu ý nào không?" data-input="rv-text" data-autofocus>' + esc(draft.text) + '</textarea>' +
        '<p class="hint rvf-count" id="rv-count">' + draft.text.length + '/500</p>' +
        '<div class="label">Ảnh món <small>(không bắt buộc)</small></div>' + photo +
        '<p class="hint rvf-priv">' + H.icon('lock', { size: 14 }) + ' Đánh giá và ảnh chỉ lưu trên máy bạn, chỉ gửi đi khi bạn bấm Chia sẻ. Đừng đăng thông tin cá nhân.</p>',
      foot: '<button type="button" class="btn btn-primary btn-lg btn-block" id="rv-submit" data-act="rv-submit"' + (canPost() ? '' : ' disabled') + '>' + H.icon('check', { size: 18, stroke: 3 }) + 'Đăng đánh giá</button>'
    };
  }

  // dish rỗng: mở bước chọn món trước. photo: ảnh đã chọn sẵn (data URL).
  C.open = function (dish, photo) {
    if (dish && !H.DISH_BY_ID[dish]) return;
    draft = blank(dish, photo);
    H.sheet.open({ title: 'Đánh giá món', cls: 'overlay-review', render: composeRender, onClose: function () { draft = null; } });
  };
  H.actions['rv-open'] = function (el) { C.open(el.dataset.id); };
  H.actions['rv-new'] = function () { C.open(''); };

  H.actions['rv-pick'] = function (el) {
    if (!draft || !H.DISH_BY_ID[el.dataset.id]) return;
    draft.dish = el.dataset.id; draft.stars = H.ratingOf(draft.dish);
    H.sheet.refresh();
  };
  H.actions['rv-change-dish'] = function () { if (draft) { draft.dish = ''; draft.q = ''; H.sheet.refresh(); } };
  H.inputs['rv-q'] = function (el) {
    if (!draft) return;
    draft.q = el.value;
    var box = document.getElementById('rv-pick-list');
    if (box) box.innerHTML = pickList();
  };

  H.actions['rv-star'] = function (el) {
    if (!draft) return;
    var n = Number(el.dataset.v);
    draft.stars = draft.stars === n ? 0 : n;
    H.sheet.refresh();
    var b = document.querySelector('.overlay.in [data-act="rv-star"][data-v="' + n + '"]');
    if (b) b.focus();
  };
  H.inputs['rv-text'] = function (el) {
    if (!draft) return;
    draft.text = el.value;
    var c = document.getElementById('rv-count'); if (c) c.textContent = el.value.length + '/500';
    var b = document.getElementById('rv-submit'); if (b) b.disabled = !canPost();
  };

  // Đọc ảnh vừa chọn. Báo lỗi bằng thông báo nhỏ, không làm hỏng bản nháp.
  function readPhoto(file) {
    return H.photo.fromFile(file, { max: 800, q: 0.72 }).catch(function (e) {
      H.toast(e && e.message === 'not-image' ? 'Hãy chọn một file ảnh (JPG hoặc PNG)' : 'Không đọc được ảnh này, thử ảnh khác nhé', { icon: 'info', ms: 3400 });
      return '';
    });
  }
  // Chọn ảnh trong hộp viết đánh giá.
  H.inputs['rv-file'] = function (el, e) {
    if (e && e.type === 'input') return;
    var f = el.files && el.files[0];
    el.value = '';
    if (!f || !draft) return;
    draft.busy = true; H.sheet.refresh();
    readPhoto(f).then(function (url) {
      if (!draft) return;
      draft.busy = false;
      if (url) draft.photo = url;
      H.sheet.refresh();
    });
  };
  // Chọn ảnh ngay từ trang món hoặc màn Cộng đồng: có ảnh rồi mới mở hộp viết đánh giá.
  H.inputs['rv-quick'] = function (el, e) {
    if (e && e.type === 'input') return;
    var f = el.files && el.files[0], id = el.dataset.id || '';
    el.value = '';
    if (!f) return;
    readPhoto(f).then(function (url) { if (url) C.open(id, url); });
  };
  H.actions['rv-photo-rm'] = function () { if (draft) { draft.photo = ''; H.sheet.refresh(); } };

  H.actions['rv-submit'] = function () {
    if (!canPost()) { H.toast('Hãy viết vài chữ hoặc thêm một ảnh', { icon: 'info' }); return; }
    var pid = '';
    if (draft.photo) {
      var put = H.photo.put(draft.photo);
      if (!put.ok) {
        draft.photo = '';
        H.toast(put.why === 'full' ? 'Đã đủ ' + H.photo.stats().max + ' ảnh lưu trên máy. Xoá bớt ảnh cũ rồi thử lại nhé.' : 'Bộ nhớ trình duyệt đã đầy nên chưa lưu được ảnh. Bạn vẫn đăng được phần bình luận.', { icon: 'info', ms: 4200 });
        H.sheet.refresh();
        return;
      }
      pid = put.id;
    }
    var r = H.addReview({ dish: draft.dish, stars: draft.stars, text: draft.text, photo: pid });
    if (!r) { if (pid) H.photo.del(pid); H.toast('Chưa lưu được đánh giá, thử lại nhé', { icon: 'info' }); return; }
    H.sheet.close();
    H.toast('Đã đăng đánh giá của bạn', { icon: 'check' });
    H.render({ keepScroll: true });
  };

  // ───────────── xem ảnh lớn, chia sẻ, xoá ─────────────
  H.actions['rv-zoom'] = function (el) {
    var r = H.reviewById(el.dataset.id), src = r && H.photo.get(r.photo);
    if (!src) return;
    var d = H.DISH_BY_ID[r.dish];
    H.sheet.open({
      title: d.name, cls: 'overlay-dialog overlay-photo',
      render: function () { return { body: '<img class="rv-zoom" src="' + src + '" alt="Ảnh món ' + esc(d.name) + ' do bạn đăng">' }; }
    });
  };

  H.actions['rv-share'] = function (el) {
    var r = H.reviewById(el.dataset.id);
    if (!r) return;
    var d = H.DISH_BY_ID[r.dish], url = location.href.split('#')[0];
    var text = d.emoji + ' ' + d.name + (r.stars ? ' · ' + r.stars + '/5 sao' : '') + (r.text ? '\n' + r.text : '') + '\n— ' + (H.state.profile.name ? H.state.profile.name + ', ' : '') + 'từ “Hôm nay ăn gì?”' + (/^https?:/.test(url) ? ' ' + url : '');
    function copyIt() {
      U.copy(text).then(function (ok) {
        if (ok) H.toast('Đã sao chép đánh giá, dán vào Zalo hay Messenger nhé', { icon: 'copy', ms: 3600 });
        else if (H.showTextSheet) H.showTextSheet('Đánh giá để chia sẻ', text);
      });
    }
    // Chia sẻ kèm ảnh nếu máy hỗ trợ; khung nhúng chặn chia sẻ hệ thống thì chuyển sang sao chép (bấm huỷ thì thôi).
    var file = r.photo ? H.photo.toFile(r.photo, 'mon-an.jpg') : null;
    try {
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: d.name, text: text }).catch(function (e) { if (!e || e.name !== 'AbortError') copyIt(); });
        return;
      }
      if (navigator.share) {
        navigator.share({ title: d.name, text: text }).catch(function (e) { if (!e || e.name !== 'AbortError') copyIt(); });
        return;
      }
    } catch (e) { /* chuyển sang sao chép */ }
    copyIt();
  };

  H.actions['rv-del'] = function (el) {
    var id = el.dataset.id;
    H.confirm({
      title: 'Xoá đánh giá này?', text: 'Đánh giá và ảnh kèm theo sẽ bị xoá khỏi máy này.', ok: 'Xoá', danger: true,
      onOk: function () { H.deleteReview(id); H.toast('Đã xoá đánh giá', { icon: 'trash' }); H.render({ keepScroll: true }); }
    });
  };
})(window.HNAG = window.HNAG || {});
