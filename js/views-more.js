/* Trang "Thêm": nơi gom các tính năng phụ (tủ lạnh, nhắc giờ, nhật ký, cộng đồng...) để màn hình chính gọn hơn.
 * Luồng chính của ứng dụng vẫn là: quay món -> xếp thực đơn tuần -> đi chợ. */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;

  // Đầu trang cho các trang con của "Thêm": có nút quay về.
  H.ui.subHead = function (kicker, title, lead) {
    return '<a class="back" href="#more">' + H.icon('chev-l', { size: 18 }) + 'Thêm</a>' + H.ui.pageHead(kicker, title, lead);
  };

  function status(text, cls) {
    return text ? '<span class="more-st' + (cls ? ' ' + cls : '') + '">' + esc(text) + '</span>' : '';
  }

  // o: { icon, title, desc, href | act (+ data), st: html trạng thái ngắn }
  function item(o) {
    var inner = '<span class="row-ic">' + H.icon(o.icon, { size: 20 }) + '</span>' +
      '<span class="row-main"><strong>' + esc(o.title) + (o.st || '') + '</strong><small>' + esc(o.desc) + '</small></span>' +
      H.icon('chev-r', { size: 18 });
    if (o.href) return '<li><a class="row more-row" href="' + o.href + '">' + inner + '</a></li>';
    return '<li><button type="button" class="row more-row" data-act="' + o.act + '">' + inner + '</button></li>';
  }

  function fridgeStatus() {
    var n = H.pantryItems().length;
    var warn = H.expiredItems().length + H.expiringItems(2).length;
    if (!n) return status('Chưa có gì');
    return status(warn ? warn + ' món cần chú ý' : n + ' loại', warn ? 'warn' : '');
  }

  function remindStatus() {
    return H.state.remind.on ? status('Đang bật', 'ok') : status('Đang tắt');
  }

  H.views.more = {
    title: 'Thêm',
    render: function () {
      var pl = H.ui.profileLabel();
      var who = H.PERSONAS.filter(function (p) { return p.id === H.state.profile.who; })[0];
      var diaryN = H.state.diary.length;
      return '<div class="more">' +
        H.ui.pageHead('TIỆN ÍCH', 'Thêm', 'Quay món, xếp thực đơn và đi chợ là việc chính. Những mục dưới đây dùng khi bạn cần.') +

        '<section class="more-group"><h2>Hỗ trợ ăn uống</h2><ul class="more-list">' +
        item({ icon: 'fridge', title: 'Tủ lạnh của tôi', desc: 'Ghi đồ đang có, báo đồ sắp hỏng, gợi ý món nấu từ đồ có sẵn', href: '#fridge', st: fridgeStatus() }) +
        item({ icon: 'bell', title: 'Nhắc giờ ăn', desc: 'Nhắc đi chợ, chuẩn bị, nấu và ăn đúng giờ', href: '#remind', st: remindStatus() }) +
        item({ icon: 'book2', title: 'Nhật ký ăn uống', desc: 'Ghi cảm giác sau bữa ăn để tìm món hợp với bạn', href: '#diary', st: status(diaryN ? diaryN + ' lần ghi' : 'Chưa ghi') }) +
        item({ icon: 'shuffle', title: 'Vuốt chọn món', desc: 'Vuốt phải để thích, vuốt trái để bỏ. Mình nhớ gu của bạn', act: 'open-deck' }) +
        '</ul></section>' +

        '<section class="more-group"><h2>Cộng đồng</h2><ul class="more-list">' +
        item({ icon: 'users', title: 'Bảng tin', desc: 'Chia sẻ mẹo nấu và hỏi đáp (bản thử nghiệm, chỉ lưu trên máy)', href: '#community' }) +
        item({ icon: 'trophy', title: 'Bảng xếp hạng món', desc: 'Món bạn chốt nhiều nhất và bảng minh hoạ', href: '#rank' }) +
        item({ icon: 'ext', title: 'Mời bạn bè dùng thử', desc: 'Gửi lời mời qua Zalo, Messenger...', act: 'share-site' }) +
        '</ul></section>' +

        '<section class="more-group"><h2>Của tôi</h2><ul class="more-list">' +
        item({ icon: 'user', title: 'Hồ sơ và cài đặt', desc: (who ? who.name + ' · ' : '') + pl.text + ' · chữ, màu, dữ liệu', act: 'open-settings' }) +
        item({ icon: 'info', title: 'Về dự án', desc: 'Vì sao có trang này và những gì đang làm được', href: '#about' }) +
        '</ul></section>' +
        H.ui.disclaimer() + '</div>';
    }
  };

  // ───────────── trang con: tủ lạnh, nhắc giờ ─────────────
  H.views.fridge = {
    title: 'Tủ lạnh của tôi',
    render: function () {
      return '<div class="plan subpage">' +
        H.ui.subHead('TỦ LẠNH', 'Tủ lạnh của tôi', 'Ghi số lượng và hạn dùng. Mình báo đồ sắp hỏng, gợi ý món nên nấu trước và tự trừ nguyên liệu khi bạn đánh dấu “đã nấu”.') +
        '<div class="plan-body">' + H.pantry.tabHtml() + '</div>' + H.ui.disclaimer() + '</div>';
    }
  };

  H.views.remind = {
    title: 'Nhắc giờ ăn',
    render: function () {
      return '<div class="plan subpage">' +
        H.ui.subHead('NHẮC GIỜ', 'Ăn đúng giờ cũng là điều trị', 'Người đau dạ dày nên ăn đều đặn, chia nhỏ bữa và đừng để bụng đói quá lâu. Mình nhắc bạn đi chợ, chuẩn bị, nấu và ăn đúng giờ.') +
        '<div class="plan-body">' + H.remind.tabHtml() + '</div>' + H.ui.disclaimer() + '</div>';
    }
  };
})(window.HNAG = window.HNAG || {});
