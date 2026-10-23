/*
 * Cá nhân: hồ sơ người dùng (tên, nhóm, hồ sơ dạ dày, ngân sách, thời gian nấu), Cộng đồng (đánh giá món của bạn và vài bài mẫu, xem community.js)
 * và cài đặt (nhắc giờ ăn, cỡ chữ, giao diện, màu, dữ liệu). Đây không phải một bước trong luồng chính
 * (Hôm nay -> Món ăn -> Thực đơn): là nơi chỉnh những thứ thuộc về riêng bạn, nên nằm ở mục thứ tư của thanh điều hướng.
 */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;
  var M = H.me = {};

  // ───────────── thanh chuyển Hồ sơ | Cộng đồng ─────────────
  M.switchHtml = function (cur) {
    var n = H.community.count();   // đánh giá của bạn cộng bài mẫu đang hiện
    function item(id, href, icon, label) {
      var on = cur === id;
      return '<a class="seg-i' + (on ? ' on' : '') + '" href="' + href + '"' + (on ? ' aria-current="page"' : '') + '>' + H.icon(icon, { size: 18 }) + '<span>' + label + '</span></a>';
    }
    return '<nav class="modeswitch exsw" aria-label="Hồ sơ hoặc cộng đồng">' +
      item('me', '#me', 'user', 'Hồ sơ') +
      item('community', '#community', 'users', 'Cộng đồng' + (n ? ' · ' + n : '')) + '</nav>';
  };

  function personaOf() { return H.PERSONAS.filter(function (p) { return p.id === H.state.profile.who; })[0] || null; }

  function avatar() {
    var n = H.state.profile.name;
    return '<span class="me-av' + (n ? '' : ' none') + '" aria-hidden="true">' + (n ? esc(Array.from(n)[0].toUpperCase()) : H.icon('user', { size: 30 })) + '</span>';
  }

  // Thẻ hồ sơ: tên, nhóm, tình trạng dạ dày, vài giới hạn cơ bản và ba con số của bạn.
  function profileCard() {
    var p = H.state.profile, f = H.state.filters, pl = H.ui.profileLabel(), who = personaOf(), st = H.historyStats();
    var facts = [f.maxCost ? 'Tối đa ' + U.vnd(f.maxCost) + '/bữa' : 'Không giới hạn giá', f.maxTime ? 'Nấu tối đa ' + f.maxTime + ' phút' : 'Không giới hạn thời gian'];
    if (p.veg) facts.push('Ăn chay');
    return '<section class="mecard" aria-labelledby="me-name-t">' +
      '<div class="me-top">' + avatar() +
      '<div class="me-id"><h2 id="me-name-t">' + (p.name ? esc(p.name) : 'Chưa đặt tên') + '</h2>' +
      '<p>' + (who ? who.emoji + ' ' + esc(who.name) + ' · ' : '') + esc(pl.text) + '</p></div>' +
      '<button type="button" class="btn-icon round" data-act="me-name" aria-label="' + (p.name ? 'Sửa tên' : 'Đặt tên') + '">' + H.icon('edit', { size: 18 }) + '</button></div>' +
      '<ul class="me-facts">' + facts.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<ul class="me-stats">' +
      '<li><b>' + st.spins + '</b> <span>vòng quay</span></li>' +
      '<li><b>' + st.pinned + '</b> <span>lần chốt</span></li>' +
      '<li class="lnk"><a href="#community"><b>' + H.state.reviews.length + '</b> <span>đánh giá</span></a></li></ul></section>';
  }

  // Dòng "Ảnh đã lưu" trong mục Dữ liệu: cho biết số ảnh và cho xoá hết ảnh (giữ lại bình luận).
  function photoRow() {
    var ph = H.photo.stats();
    if (!ph.n) return '';
    return '<p class="hint photo-row">Ảnh đã lưu trong đánh giá: <strong>' + ph.n + '/' + ph.max + ' ảnh</strong> (khoảng ' + ph.kb + ' KB). ' +
      '<button type="button" class="link-btn" data-act="photos-clear">Xoá tất cả ảnh</button></p>';
  }

  // Các nhóm hồ sơ và cài đặt, vẽ thẳng trên trang (trước đây nằm trong hộp Cài đặt).
  M.settingsHtml = function () {
    var t = H.state.theme, pl = H.ui.profileLabel(), who = H.state.profile.who;
    return '<div class="me-grid">' +
      // thẻ 1: hồ sơ của tôi
      '<section class="fgroup" aria-labelledby="me-g1"><h2 id="me-g1">Hồ sơ của tôi</h2>' +
      '<h3>Tôi là</h3><div class="chips" role="radiogroup" aria-label="Nhóm người dùng">' + H.PERSONAS.map(function (ps) {
        return '<button type="button" class="chip" role="radio" aria-checked="' + (who === ps.id) + '" data-act="set-persona" data-v="' + ps.id + '">' + ps.emoji + ' ' + esc(ps.name) + '</button>';
      }).join('') + '</div><p class="hint">Chọn nhóm của bạn, mình đặt sẵn ngân sách, thời gian nấu, giờ ăn và cỡ chữ cho hợp. Bạn vẫn đổi từng mục được.</p>' +
      '<h3>Hồ sơ dạ dày</h3>' +
      '<button type="button" class="opt" data-act="settings-profile"><span class="opt-emoji">' + pl.stage.emoji + '</span><span class="opt-text"><strong>' + esc(pl.text) + '</strong><small>Đổi tình trạng, mức độ, dụng cụ, ngân sách, thời gian nấu</small></span><span class="opt-check">' + H.icon('chev-r', { size: 18 }) + '</span></button></section>' +

      // thẻ 2: cài đặt
      '<section class="fgroup" aria-labelledby="me-g2"><h2 id="me-g2">Cài đặt</h2>' +
      '<h3>Nhắc giờ ăn</h3>' +
      '<button type="button" class="opt" data-act="settings-remind"><span class="opt-emoji" aria-hidden="true">⏰</span><span class="opt-text"><strong>' + (H.state.remind.on ? 'Đang bật' : 'Đang tắt') + '</strong><small>Đổi giờ ăn, loại nhắc, thông báo và xuất lịch</small></span><span class="opt-check">' + H.icon('chev-r', { size: 18 }) + '</span></button>' +
      '<h3>Cỡ chữ</h3><div class="chips" role="radiogroup" aria-label="Cỡ chữ">' +
      '<button type="button" class="chip" role="radio" aria-checked="' + (H.state.textSize !== 'large') + '" data-act="set-text" data-v="normal">Chữ thường</button>' +
      '<button type="button" class="chip chip-big" role="radio" aria-checked="' + (H.state.textSize === 'large') + '" data-act="set-text" data-v="large">Chữ to</button></div>' +
      '<h3>Giao diện</h3><div class="chips">' +
      H.ui.chip(H.icon('sparkle', { size: 16 }) + ' Theo thiết bị', t === 'auto', 'set-theme', { v: 'auto' }) +
      H.ui.chip(H.icon('sun', { size: 16 }) + ' Sáng', t === 'light', 'set-theme', { v: 'light' }) +
      H.ui.chip(H.icon('moon', { size: 16 }) + ' Tối', t === 'dark', 'set-theme', { v: 'dark' }) + '</div>' +
      '<h3>Màu giao diện</h3><div class="swatches" role="radiogroup" aria-label="Màu giao diện">' + H.PALETTES.map(function (pl2) {
        var on = pl2.id === H.state.palette;
        return '<button type="button" class="swatch" role="radio" aria-checked="' + on + '" data-act="set-palette" data-v="' + pl2.id + '">' +
          '<span class="swatch-dot" style="--sw-a:' + pl2.p + ';--sw-b:' + pl2.accent + '" aria-hidden="true"></span>' +
          '<span class="swatch-name">' + esc(pl2.name) + '</span>' +
          (on ? '<span class="swatch-tick" aria-hidden="true">' + H.icon('check', { size: 14, stroke: 3 }) + '</span>' : '') + '</button>';
      }).join('') + '</div></section>' +

      // thẻ 3: dữ liệu và giới thiệu
      '<section class="fgroup" aria-labelledby="me-g3"><h2 id="me-g3">Dữ liệu và giới thiệu</h2>' +
      '<h3>Dữ liệu</h3><p class="hint">Thực đơn, tủ lạnh, nhật ký, đánh giá và những món bạn hay chọn chỉ lưu trên thiết bị này (trong trình duyệt), chưa đồng bộ lên máy chủ.</p>' +
      photoRow() +
      '<button type="button" class="btn btn-ghost btn-danger-ghost" data-act="reset-all">' + H.icon('trash', { size: 16 }) + ' Xoá toàn bộ dữ liệu trên máy này</button>' +
      '<h3>Về trang này</h3><p class="hint">“Hôm nay ăn gì?” gợi ý món lành cho người bị đau dạ dày hoặc viêm loét dạ dày và cho bất kỳ ai muốn ăn nhẹ bụng, ở mọi lứa tuổi. Nội dung chỉ để tham khảo và chưa thay thế lời khuyên của bác sĩ. Giá món là ước tính.</p>' +
      '<div class="chips"><a class="btn btn-soft btn-sm" href="#about">Đọc ý tưởng dự án</a><button type="button" class="btn btn-soft btn-sm" data-act="share-site">' + H.icon('ext', { size: 16 }) + 'Mời bạn bè dùng thử</button></div></section>' +
      '</div>';
  };

  H.views.me = {
    title: 'Cá nhân',
    render: function () {
      return '<div class="me">' +
        H.ui.pageHead('CÁ NHÂN', 'Của tôi', 'Hồ sơ, cộng đồng và cài đặt của bạn.') +
        M.switchHtml('me') + profileCard() + M.settingsHtml() + H.ui.disclaimer() + '</div>';
    }
  };

  // ───────────── đặt tên hiển thị ─────────────
  H.actions['me-name'] = function () {
    H.sheet.open({
      title: 'Tên của bạn', cls: 'overlay-dialog',
      render: function () {
        return {
          body: '<label class="label" for="me-name-in">Tên hiển thị <small>(không bắt buộc, tối đa 24 ký tự)</small></label>' +
            '<input id="me-name-in" class="input" type="text" maxlength="24" autocomplete="nickname" enterkeyhint="done" value="' + esc(H.state.profile.name) + '" data-autofocus>' +
            '<p class="hint">Tên chỉ lưu trên máy bạn. Mình dùng tên ở trang Cá nhân và khi bạn chia sẻ một đánh giá.</p>',
          foot: '<div class="foot-actions"><button type="button" class="btn btn-ghost" data-act="close-sheet">Huỷ</button>' +
            '<button type="button" class="btn btn-primary" data-act="me-name-save">Lưu</button></div>'
        };
      }
    });
  };
  H.actions['me-name-save'] = function () {
    var input = document.getElementById('me-name-in');
    if (!input) return;
    H.state.profile.name = H.cleanName(input.value);
    H.save();
    H.sheet.close();
    H.toast(H.state.profile.name ? 'Đã lưu tên của bạn' : 'Đã bỏ tên', { icon: 'check' });
    H.render({ keepScroll: true });
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.id === 'me-name-in') { e.preventDefault(); H.actions['me-name-save'](); }
  });
})(window.HNAG = window.HNAG || {});
