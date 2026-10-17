/* Trang "Về dự án": vấn đề, nguyên nhân, câu hỏi thiết kế, cách trang này giải quyết và những gì đã đổi theo góp ý. */
(function (H) {
  'use strict';

  var esc = H.util.esc;

  var CONSEQUENCES = [
    'Bệnh dạ dày tái phát hoặc nặng hơn do ăn sai.',
    'Tốn tiền mua nguyên liệu nhưng không dùng đúng cách, lãng phí.',
    'Căng thẳng, lo lắng mỗi bữa ăn vì sợ “lỡ ăn sai”.',
    'Chất lượng sống giảm, ảnh hưởng việc học và việc làm vì đau bụng thường xuyên.'
  ];

  var ROOT_CAUSES = [
    ['Nhịp sống bận rộn', 'Ăn uống thất thường, áp lực học tập và công việc, ăn đồ cay hoặc ăn nhanh vì tiện và rẻ.'],
    ['Thiếu nguồn thông tin đáng tin cậy', 'Công thức trên mạng không tính đến yếu tố bệnh lý dạ dày.'],
    ['Không ai “dịch” lời dặn của bác sĩ', 'Câu “hạn chế đồ cay, dầu mỡ” chưa thành thực đơn cụ thể theo nguyên liệu và dụng cụ mà mỗi người đang có.']
  ];

  // Luồng chính: ba việc ai cũng làm. Mọi thứ khác nằm trong mục "Thêm".
  var MAIN_FLOW = [
    ['wheel', 'Quay hoặc chọn một món', 'Vòng quay chỉ gồm những món hợp với tình trạng dạ dày, ngân sách và thời gian nấu của bạn.', '#home'],
    ['calendar', 'Xếp thực đơn cả tuần', 'Tự lập 21 bữa không lặp món, tính sẵn chi phí và thời gian nấu từng ngày.', '#plan'],
    ['cart', 'Đi chợ theo danh sách', 'Gộp nguyên liệu của cả tuần, trừ đồ đã có trong tủ lạnh.', '#plan-shop']
  ];

  var SOLUTIONS = [
    ['search', 'Nguyên liệu nên dùng và nên tránh, kèm vì sao', 'Ví dụ vì sao nên tránh cà chua sống, còn cà chua nấu nhừ thì dùng ít được.', '#guide-tra'],
    ['shuffle', 'Gợi ý nguyên liệu thay thế', 'Công thức gốc có thành phần cần kiêng thì đổi sang gì cho vẫn ngon. Dán công thức để mình soi giúp.', '#guide-thaythe'],
    ['warn', 'Cảnh báo “tưởng lành mà không lành”', 'Đồ lên men, nước có gas, đồ đóng hộp và những thứ nghe có vẻ tốt cho sức khoẻ.', '#guide-tuonglanh'],
    ['play', 'Video từ chuyên gia, bác sĩ dinh dưỡng', 'Để người bệnh yên tâm hơn. Mục này đang chờ danh sách video đã kiểm duyệt.', '#guide-video'],
    ['bell', 'Nhắc ăn đúng giờ', 'Nhắc đi chợ, chuẩn bị nguyên liệu, nấu và ăn theo giờ bạn đặt. Xuất lịch .ics để điện thoại nhắc kể cả khi đóng trang.', '#remind'],
    ['fridge', 'Tủ lạnh có số lượng và hạn dùng', 'Báo đồ sắp hỏng, sắp hết, gợi ý món nên nấu trước và nguyên liệu thay thế khi thiếu.', '#fridge'],
    ['book2', 'Nhật ký ăn uống', 'Ghi cảm giác sau mỗi bữa để tìm ra món hợp và món hay làm bạn khó chịu.', '#diary'],
    ['users', 'Cộng đồng chia sẻ kinh nghiệm', 'Trao đổi món ăn và mẹo nấu. Hiện là bản thử nghiệm.', '#community']
  ];

  // Việc nào làm thật được ngay trên trang này, việc nào cần máy chủ hoặc AI.
  var REAL = [
    'Lọc món theo tình trạng dạ dày, mức độ, thời gian nấu, ngân sách, độ khó và mức vị (cay, mặn, chua, béo) bị khoá theo hồ sơ.',
    'Xếp thực đơn tuần, lặp lại thực đơn tuần trước, danh sách đi chợ trừ đồ trong tủ lạnh, tự trừ nguyên liệu khi đánh dấu “đã nấu”.',
    'Nhớ món bạn hay chọn và hay nấu để gợi ý nhanh hơn; nhớ số tiền bạn chi thật khi đi chợ để gợi ý ngân sách sát thực tế.',
    'Nhắc giờ khi tab còn mở, thông báo của trình duyệt (nếu bạn cho phép), file lịch .ics cho điện thoại.',
    'Chấm sao, vuốt chọn món, nhật ký ăn uống: lưu trên thiết bị của bạn.'
  ];
  var LATER = [
    'Kết bạn, bảng xếp hạng và bài viết cho mọi người cùng thấy: cần tài khoản và máy chủ.',
    'Chụp ảnh tủ lạnh hoặc quét mã để nhập nguyên liệu: cần dịch vụ nhận diện hình ảnh (AI).',
    'Nhắc đẩy khi đã đóng hẳn trình duyệt: cần máy chủ gửi thông báo (hiện dùng file lịch .ics thay thế).',
    'Đặt hàng tự động trên Shopee, Tiki, Bách hoá Xanh: hiện chỉ mở trang tìm kiếm của cửa hàng.'
  ];

  H.views.about = {
    title: 'Về dự án',
    render: function () {
      return '<div class="about">' +
        H.ui.subHead('VỀ DỰ ÁN', 'Vì sao có “Hôm nay ăn gì?”', 'Một công cụ nhỏ giúp người đau dạ dày tự nấu ăn đúng cách, và giúp bất kỳ ai muốn ăn nhẹ bụng, ở mọi lứa tuổi.') +

        '<section class="about-card"><h2>Vấn đề</h2>' +
        '<p>Người bị đau dạ dày hoặc viêm loét dạ dày thường phải tự nấu ăn, vì quán ăn và dịch vụ giao đồ ăn hiện tại hầu như không có lựa chọn cho người cần kiêng cữ (cay, chua, dầu mỡ, cà phê...). Điều này rõ nhất với sinh viên ở nhà trọ, nhưng người đi làm bận rộn và người lớn tuổi cũng gặp đúng khó khăn đó. Tự mua nguyên liệu và nấu đúng cách thì lại thiếu hướng dẫn cụ thể, đáng tin cậy.</p></section>' +

        '<div class="about-grid">' +
        '<section class="about-card"><h2>Hậu quả</h2><ul class="about-list">' + CONSEQUENCES.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></section>' +
        '<section class="about-card"><h2>Nguyên nhân gốc rễ</h2><ul class="about-list">' + ROOT_CAUSES.map(function (c) { return '<li><strong>' + esc(c[0]) + ':</strong> ' + esc(c[1]) + '</li>'; }).join('') + '</ul></section>' +
        '</div>' +

        '<section class="callout"><h2>' + H.icon('info', { size: 18 }) + 'Tuyên bố vấn đề</h2>' +
        '<p>Người bị đau dạ dày cần biết chính xác nên mua nguyên liệu gì và nấu như thế nào để không làm bệnh nặng thêm. Các dịch vụ ăn uống hiện tại không phục vụ nhu cầu kiêng cữ này, và họ lại thiếu một nguồn hướng dẫn cụ thể, đáng tin cậy để tự nấu ăn an toàn tại nhà.</p></section>' +
        '<section class="callout tip"><h2>' + H.icon('sparkle', { size: 18 }) + 'Câu hỏi định hướng thiết kế</h2>' +
        '<p>Làm sao để người bị đau dạ dày có thể tự tin mua đúng nguyên liệu và nấu ăn an toàn cho tình trạng của mình, mà không cần lo sợ ăn sai hay tự mò mẫm?</p></section>' +

        '<section class="block"><h2>Luồng chính: ba việc</h2><ul class="about-solutions">' + MAIN_FLOW.map(row).join('') + '</ul>' +
        '<p class="hint">Trang chủ chỉ giữ ba việc này. Tủ lạnh, nhắc giờ, nhật ký, cộng đồng và các cài đặt nằm trong mục “Thêm” để lúc đầu bạn không bị rối.</p></section>' +

        '<section class="block"><h2>Những thứ hỗ trợ thêm</h2><ul class="about-solutions">' + SOLUTIONS.map(row).join('') + '</ul></section>' +

        '<section class="block"><h2>Ai dùng được?</h2><ul class="about-solutions">' + H.PERSONAS.map(function (p) {
          return '<li class="row who-row"><span class="row-ic" aria-hidden="true">' + p.emoji + '</span><span class="row-main"><strong>' + esc(p.name) + '</strong><small>' + esc(p.desc) + '</small></span></li>';
        }).join('') + '</ul>' +
        '<p class="hint">Chọn nhóm của bạn lúc bắt đầu (hoặc trong Cài đặt), mình đặt sẵn ngân sách, thời gian nấu, giờ ăn và cỡ chữ cho hợp. Ai không đau dạ dày cũng dùng được: chọn “Ăn lành mạnh” để có thực đơn nhẹ bụng, ít dầu mỡ.</p></section>' +

        '<div class="about-grid">' +
        '<section class="about-card"><h2>Đối tượng hưởng lợi</h2><p>Người bị đau dạ dày hoặc viêm loét dạ dày đang tự nấu ăn (sinh viên, người đi làm, người lớn tuổi), cùng những ai muốn ăn lành mạnh, nhưng thiếu kiến thức y khoa để làm đúng.</p></section>' +
        '<section class="about-card"><h2>Kết quả kỳ vọng</h2><p>Người dùng tự tin hơn khi tự nấu ăn, giảm nguy cơ tái phát hoặc nặng hơn do ăn sai, và tiết kiệm thời gian tìm hiểu thông tin rời rạc, thiếu tin cậy trên mạng.</p></section>' +
        '</div>' +

        '<div class="about-grid">' +
        '<section class="about-card"><h2>Đang làm được thật</h2><ul class="about-list">' + REAL.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></section>' +
        '<section class="about-card"><h2>Cần máy chủ hoặc AI nên chưa có</h2><ul class="about-list">' + LATER.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></section>' +
        '</div>' +

        '<p class="note warn">' + H.icon('warn', { size: 16 }) + '<span>Trang này là bản thử nghiệm của một ý tưởng thiết kế, không phải sản phẩm y tế. Nội dung chỉ để tham khảo và cần bác sĩ hoặc chuyên gia dinh dưỡng thẩm định trước khi dùng rộng rãi.</span></p>' +
        '</div>';
    }
  };

  function row(s) {
    return '<li><a class="row" href="' + s[3] + '"><span class="row-ic">' + H.icon(s[0], { size: 20 }) + '</span>' +
      '<span class="row-main"><strong>' + esc(s[1]) + '</strong><small>' + esc(s[2]) + '</small></span>' + H.icon('chev-r', { size: 18 }) + '</a></li>';
  }
})(window.HNAG = window.HNAG || {});
