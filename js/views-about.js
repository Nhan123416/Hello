/* Trang "Về dự án": vấn đề, nguyên nhân, câu hỏi thiết kế, quy trình ba màn hình và những gì đã gộp lại hoặc bỏ đi theo góp ý. */
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

  // Quy trình của người dùng, từng bước, và nơi làm từng việc. Đúng ba màn hình ở thanh điều hướng.
  var FLOW = [
    ['wheel', 'Hôm nay', 'Quay may mắn cho vui, hoặc tự chọn món. Phía dưới ghi lại bạn đã quay bao nhiêu vòng và đã chốt những món nào.', '#home'],
    ['book', 'Món ăn', 'Mỗi món cho biết ngay có hợp với bạn không và vì sao (cẩm nang nằm trong từng món), rồi chốt món và xem hướng dẫn đi chợ. Cạnh danh sách món có Cộng đồng: đánh giá bằng sao, bình luận và ảnh món.', '#explore'],
    ['calendar', 'Thực đơn', 'Thực đơn cả tuần, danh sách đi chợ, khối nhắc nhở (giờ đi chợ, giờ nấu, giờ ăn) và ô ghi cảm nhận sau mỗi bữa.', '#plan']
  ];

  // Những gì đã gộp vào ba màn hình trên theo góp ý, và những gì đã bỏ.
  var MERGED = [
    ['Cẩm nang', 'vào từng món ở màn Món ăn (khối “Hợp với bạn không?”). Phần tra nguyên liệu, kiểm tra công thức và lưu ý chung mở bằng nút “Cẩm nang”.'],
    ['Nhật ký ăn uống', 'thành một dòng cảm nhận ngay dưới từng bữa ở màn Thực đơn, kèm phần “Nhìn lại tuần”.'],
    ['Nhắc giờ ăn', 'thành khối “Nhắc nhở” ở màn Thực đơn.'],
    ['Tủ lạnh', 'vào tab Đi chợ của màn Thực đơn, để danh sách đi chợ tự trừ đồ đang có. Trong hộp Tủ lạnh có “Quét nguyên liệu bằng camera”.'],
    ['Cộng đồng', 'thành phần đánh giá món (sao, bình luận, ảnh) ngay trong màn Món ăn: cạnh danh sách món và ở cuối từng món.']
  ];
  var DROPPED = [
    'Bảng tin viết tự do và bảng xếp hạng số liệu mẫu: thay bằng đánh giá món có bình luận và ảnh.',
    'Vuốt chọn món: trùng việc với “Tự chọn món” ở trang Hôm nay.',
    'Mục video chuyên gia: đang chờ danh sách video đã kiểm duyệt.',
    'Trang “Thêm” và các nút phụ: không còn cần khi mọi thứ đã nằm trong ba màn hình.'
  ];

  // Việc nào làm thật được ngay trên trang này, việc nào cần máy chủ hoặc AI.
  var REAL = [
    'Lọc món theo tình trạng dạ dày, mức độ, thời gian nấu, ngân sách, độ khó và mức vị (cay, mặn, chua, béo) bị khoá theo hồ sơ.',
    'Xếp thực đơn tuần, lặp lại thực đơn tuần trước, danh sách đi chợ trừ đồ trong tủ lạnh, tự trừ nguyên liệu khi đánh dấu “đã nấu”.',
    'Cẩm nang gắn vào từng nguyên liệu của món; tra nguyên liệu, kiểm tra công thức bất kỳ và gợi ý thay thế.',
    'Nhớ món bạn hay chọn và hay nấu, số vòng đã quay, món đã chốt; nhớ số tiền chi thật khi đi chợ để gợi ý ngân sách sát thực tế.',
    'Đánh giá món bằng sao, bình luận và ảnh (ảnh được thu nhỏ và chỉ lưu trên máy bạn); chia sẻ một đánh giá cho bạn bè qua hộp chia sẻ của điện thoại.',
    'Chụp hoặc chọn ảnh tủ lạnh rồi chạm vào những thứ thấy trong ảnh để thêm vào tủ lạnh (ảnh không được lưu lại).',
    'Ghi cảm nhận sau từng bữa và nhìn lại tuần; mình chỉ ra món hay làm bạn khó chịu và món hợp với bạn.',
    'Nhắc giờ khi tab còn mở, thông báo của trình duyệt (nếu bạn cho phép), file lịch .ics cho điện thoại.'
  ];
  var LATER = [
    'Cộng đồng chung để mọi người cùng xem đánh giá và ảnh của nhau, kết bạn, bảng xếp hạng thật: cần tài khoản, máy chủ và kiểm duyệt nội dung.',
    'Tự nhận ra nguyên liệu trong ảnh chụp tủ lạnh (quét bằng AI): cần dịch vụ nhận diện hình ảnh. Hiện bạn chụp ảnh rồi tự chạm chọn.',
    'Nhắc đẩy khi đã đóng hẳn trình duyệt: cần máy chủ gửi thông báo (hiện dùng file lịch .ics thay thế).',
    'Đặt hàng tự động trên Shopee, Tiki, Bách hoá Xanh: hiện chỉ mở trang tìm kiếm của cửa hàng.',
    'Video của bác sĩ, chuyên gia dinh dưỡng: cần danh sách video đã kiểm duyệt.'
  ];

  H.views.about = {
    title: 'Về dự án',
    render: function () {
      return '<div class="about">' +
        '<a class="back" href="#home">' + H.icon('chev-l', { size: 18 }) + 'Hôm nay</a>' +
        H.ui.pageHead('VỀ DỰ ÁN', 'Vì sao có “Hôm nay ăn gì?”', 'Một công cụ nhỏ giúp người đau dạ dày tự nấu ăn đúng cách, và giúp bất kỳ ai muốn ăn nhẹ bụng, ở mọi lứa tuổi.') +

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

        '<section class="block"><h2>Quy trình: ba màn hình</h2><ol class="flow">' + FLOW.map(function (f, i) {
          return '<li><a class="row" href="' + f[3] + '"><span class="row-ic">' + H.icon(f[0], { size: 20 }) + '</span>' +
            '<span class="row-main"><strong>' + (i + 1) + '. ' + esc(f[1]) + '</strong><small>' + esc(f[2]) + '</small></span>' + H.icon('chev-r', { size: 18 }) + '</a></li>';
        }).join('') + '</ol>' +
        '<p class="hint">Người dùng đi một mạch: chọn món, biết món có hợp không rồi chốt, đi chợ, nấu và ăn, ghi lại cảm nhận. Mỗi màn hình chỉ giữ phần chính của bước đó; phần phụ gập lại hoặc mở trong hộp thoại khi cần.</p></section>' +

        '<div class="about-grid">' +
        '<section class="about-card"><h2>Đã gộp lại theo góp ý</h2><ul class="about-list">' + MERGED.map(function (m) { return '<li><strong>' + esc(m[0]) + '</strong> ' + esc(m[1]) + '</li>'; }).join('') + '</ul></section>' +
        '<section class="about-card"><h2>Đã bỏ</h2><ul class="about-list">' + DROPPED.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></section>' +
        '</div>' +

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
})(window.HNAG = window.HNAG || {});
