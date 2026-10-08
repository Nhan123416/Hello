/* Trang "Về dự án": vấn đề, nguyên nhân, câu hỏi thiết kế và cách trang này giải quyết. */
(function (H) {
  'use strict';

  var esc = H.util.esc;

  var CONSEQUENCES = [
    'Bệnh dạ dày tái phát hoặc nặng hơn do ăn sai.',
    'Tốn tiền mua nguyên liệu nhưng không dùng đúng cách, lãng phí.',
    'Căng thẳng, lo lắng mỗi bữa ăn vì sợ “lỡ ăn sai”.',
    'Chất lượng sống giảm, ảnh hưởng việc học vì đau bụng thường xuyên.'
  ];

  var ROOT_CAUSES = [
    ['Lối sống sinh viên', 'Ăn uống thất thường, stress học tập, ăn đồ cay hoặc ăn nhanh vì tiện và rẻ.'],
    ['Thiếu nguồn thông tin đáng tin cậy', 'Công thức trên mạng không tính đến yếu tố bệnh lý dạ dày.'],
    ['Không ai “dịch” lời dặn của bác sĩ', 'Câu “hạn chế đồ cay, dầu mỡ” chưa thành thực đơn cụ thể theo nguyên liệu sinh viên có sẵn.']
  ];

  var SOLUTIONS = [
    ['wheel', 'Gợi ý món và thực đơn theo giai đoạn', 'Lọc theo mức nặng nhẹ và giai đoạn cấp hay mãn tính. Quay vòng quay hoặc để mình xếp thực đơn 7 ngày.', '#home'],
    ['search', 'Nguyên liệu nên dùng và nên tránh, kèm vì sao', 'Ví dụ vì sao nên tránh cà chua sống, còn cà chua nấu nhừ thì dùng ít được.', '#guide-tra'],
    ['shuffle', 'Gợi ý nguyên liệu thay thế', 'Công thức gốc có thành phần cần kiêng thì đổi sang gì cho vẫn ngon. Dán công thức để mình soi giúp.', '#guide-thaythe'],
    ['warn', 'Cảnh báo “tưởng lành mà không lành”', 'Đồ lên men, nước có gas, đồ đóng hộp và những thứ nghe có vẻ tốt cho sức khoẻ.', '#guide-tuonglanh'],
    ['play', 'Video từ chuyên gia, bác sĩ dinh dưỡng', 'Để người bệnh yên tâm hơn. Mục này đang chờ danh sách video đã kiểm duyệt.', '#guide-video'],
    ['users', 'Cộng đồng chia sẻ kinh nghiệm', 'Các bạn cùng tình trạng trao đổi món ăn và mẹo nấu. Hiện là bản thử nghiệm.', '#community']
  ];

  H.views.about = {
    title: 'Về dự án',
    render: function () {
      return '<div class="about">' +
        H.ui.pageHead('VỀ DỰ ÁN', 'Vì sao có “Hôm nay ăn gì?”', 'Một công cụ nhỏ cho sinh viên bị đau dạ dày đang tự nấu ăn ở nhà trọ.') +

        '<section class="about-card"><h2>Vấn đề</h2>' +
        '<p>Sinh viên bị đau dạ dày hoặc viêm loét dạ dày thường phải tự nấu ăn ở nhà trọ, vì quán ăn và dịch vụ giao đồ ăn hiện tại hầu như không có lựa chọn cho người cần kiêng cữ (cay, chua, dầu mỡ, cà phê...). Tự mua nguyên liệu và nấu đúng cách thì lại thiếu hướng dẫn cụ thể, đáng tin cậy.</p></section>' +

        '<div class="about-grid">' +
        '<section class="about-card"><h2>Hậu quả</h2><ul class="about-list">' + CONSEQUENCES.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></section>' +
        '<section class="about-card"><h2>Nguyên nhân gốc rễ</h2><ul class="about-list">' + ROOT_CAUSES.map(function (c) { return '<li><strong>' + esc(c[0]) + ':</strong> ' + esc(c[1]) + '</li>'; }).join('') + '</ul></section>' +
        '</div>' +

        '<section class="callout"><h2>' + H.icon('info', { size: 18 }) + 'Tuyên bố vấn đề</h2>' +
        '<p>Sinh viên bị đau dạ dày cần biết chính xác nên mua nguyên liệu gì và nấu như thế nào để không làm bệnh nặng thêm. Các dịch vụ ăn uống hiện tại không phục vụ nhu cầu kiêng cữ này, và họ lại thiếu một nguồn hướng dẫn cụ thể, đáng tin cậy để tự nấu ăn an toàn tại nhà.</p></section>' +
        '<section class="callout tip"><h2>' + H.icon('sparkle', { size: 18 }) + 'Câu hỏi định hướng thiết kế</h2>' +
        '<p>Làm sao để sinh viên bị đau dạ dày có thể tự tin mua đúng nguyên liệu và nấu ăn an toàn cho tình trạng của mình, mà không cần lo sợ ăn sai hay tự mò mẫm?</p></section>' +

        '<section class="block"><h2>Trang này giải quyết như thế nào</h2><ul class="about-solutions">' + SOLUTIONS.map(function (s) {
          return '<li><a class="row" href="' + s[3] + '"><span class="row-ic">' + H.icon(s[0], { size: 20 }) + '</span>' +
            '<span class="row-main"><strong>' + esc(s[1]) + '</strong><small>' + esc(s[2]) + '</small></span>' + H.icon('chev-r', { size: 18 }) + '</a></li>';
        }).join('') + '</ul></section>' +

        '<div class="about-grid">' +
        '<section class="about-card"><h2>Đối tượng hưởng lợi</h2><p>Sinh viên bị đau dạ dày hoặc viêm loét dạ dày, sống một mình hoặc ở trọ, cần tự nấu ăn nhưng thiếu kiến thức y khoa để làm đúng.</p></section>' +
        '<section class="about-card"><h2>Kết quả kỳ vọng</h2><p>Sinh viên tự tin hơn khi tự nấu ăn, giảm nguy cơ tái phát hoặc nặng hơn do ăn sai, và tiết kiệm thời gian tìm hiểu thông tin rời rạc, thiếu tin cậy trên mạng.</p></section>' +
        '</div>' +

        '<p class="note warn">' + H.icon('warn', { size: 16 }) + '<span>Trang này là bản thử nghiệm của một ý tưởng thiết kế, không phải sản phẩm y tế. Nội dung chỉ để tham khảo và cần bác sĩ hoặc chuyên gia dinh dưỡng thẩm định trước khi dùng rộng rãi.</span></p>' +
        '</div>';
    }
  };
})(window.HNAG = window.HNAG || {});
