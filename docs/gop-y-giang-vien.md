# Phân tích góp ý của giảng viên

Nguồn: một đoạn ghi âm dài khoảng 8 phút 37 giây (giảng viên vừa xem bản thử của nhóm vừa nhận xét) và ảnh tóm
tắt "3 màn hình chính cần thiết kế lại".

## Cách đọc ghi âm

Ghi âm có nhiều tạp âm, nhiều người nói xen nhau nên mình chuyển thành chữ bằng mô hình nhận dạng tiếng Việt
(Zipformer của sherpa-onnx), lọc ồn, chạy hai mô hình khác nhau rồi đối chiếu với ảnh tóm tắt. Bản chữ máy còn nhiều
chỗ sai, vì vậy các câu bên dưới là **diễn giải lại ý**, không phải nguyên văn. Mình chỉ dựa vào những ý lặp lại ở
nhiều đoạn và khớp với ảnh tóm tắt.

## Giảng viên nói gì, theo thứ tự trong ghi âm

| Đoạn | Nội dung (diễn giải) |
|---|---|
| 0:00 đến 0:45 | Xem luồng của nhóm: quay, chọn, "chốt", đi mua nguyên liệu, quay về màn hình chính. Hỏi lại: "thực đơn là gì?" (xem lại các món đã ăn trong tuần) rồi "cẩm nang là gì?". |
| 0:45 đến 1:40 | Nhóm giải thích cẩm nang: với tình trạng hiện tại (ví dụ hay ợ chua) thì món nào hợp, vì sao. Giảng viên nhấn mạnh: trước khi ăn, trước khi mua, người dùng cần biết ngay món này có hợp với mình lúc này không. |
| 1:40 đến 2:10 | "Vậy có bị trùng không?" Chọn món ở bên này rồi sang bên kia mới biết món có hợp không: hai chỗ làm gần như cùng một việc. |
| 2:10 đến 2:45 | Mọi thứ nên **đơn giản, logic, từ góc nhìn người dùng**. Nhóm đang làm từ góc nhìn người làm ("mình biết nhiều, muốn đưa hết vào"). Người dùng cần thật, nhưng làm vậy mọi thứ trở nên phức tạp. |
| 2:45 đến 3:05 | Cẩm nang **không phải bỏ đi**, nhưng toàn bộ nội dung của nó nên đưa **vào từng món ăn**, ngay chỗ trước khi người ta đi mua, để người dùng biết sẵn. |
| 3:05 đến 4:00 | Nhóm kể thêm các chức năng khác: hỗ trợ cộng đồng, nhắc giờ (giờ đi chợ, giờ nấu, giờ ăn). |
| 4:00 đến 5:10 | Nhật ký ăn uống (ghi cảm giác sau khi ăn): **gộp vào thực đơn**, chỉ là "một dòng thêm" trong phần thực đơn. Quy trình thật là: chọn món, biết món tốt hay xấu, đi chợ, về nấu và ăn, rồi đánh giá và lưu lại. |
| 5:10 đến 6:30 | Phải nghĩ **theo quy trình, từng bước**. Bước đầu vào trang "Hôm nay": muốn may rủi thì có vòng quay cho vui; không thích thì chuyển sang tự lựa chọn món. Thực đơn cho biết trong tuần có món gì. Rút lại còn **ba chức năng chính**. |
| 6:30 đến 7:30 | Hãy đứng ở vị trí người dùng cuối. Ý tưởng tốt, sâu sắc hơn trước, nhưng đang **đưa quá nhiều thông tin**, người dùng vào không biết bắt đầu từ đâu. Cần **tiết chế**: không phải cái gì đưa lên cũng tốt. Xem các website tương tự để học cách trình bày. |
| 7:30 đến 8:35 | Dưới phần vòng quay ghi **đã quay bao nhiêu vòng, từng chọn những món gì**. Quay xong thì **chốt**, rồi đề xuất **xem hướng dẫn đi mua** (dự kiến mua gì); phần nhắc nhở chỉ là phần phụ. Kết luận: trình bày **rõ hơn, ngắn hơn, đơn giản hơn, hệ thống hơn** là ổn. |

## Ảnh tóm tắt: ba màn hình chính

1. **Hôm nay**: vòng quay may mắn, khu vực chọn món chủ động, thống kê số vòng đã quay và các món đã chọn.
2. **Món ăn (đã tích hợp cẩm nang)**: danh sách và chi tiết món, khối thông tin sức khoẻ và dinh dưỡng (hợp hay không
   với tình trạng ợ chua, dạ dày), nút chốt món và hướng dẫn đi chợ.
3. **Thực đơn và nhật ký**: xem lại các món đã ăn trong tuần, ô nhận xét cảm nhận sau khi ăn, khối nhắc nhở (giờ đi
   chợ, giờ nấu, giờ ăn).

## Những điểm cần cải thiện rút ra

| # | Vấn đề | Cách xử lý trong bản này |
|---|---|---|
| 1 | Thiết kế theo danh sách tính năng, chưa theo quy trình của người dùng | Quy trình một mạch: **Hôm nay** (quay hoặc tự chọn) → **Món ăn** (xem có hợp không, chốt, hướng dẫn đi chợ) → **Thực đơn** (cả tuần, ăn xong ghi cảm nhận) |
| 2 | Quá nhiều chỗ để vào (5 mục chính cộng nhiều trang phụ) | Còn đúng **3 màn hình chính** ở thanh điều hướng |
| 3 | Cẩm nang và Món ăn trùng việc, người dùng phải sang hai nơi | Bỏ tab Cẩm nang. Nội dung đưa vào **trang từng món** (khối "Hợp với bạn không?") và ô tìm món cũng tra được nguyên liệu |
| 4 | Nhật ký ăn uống nằm riêng, ít ai nhớ vào ghi | Nhật ký thành **một dòng cảm nhận ngay dưới từng bữa** trong thực đơn |
| 5 | Nhắc giờ là một trang riêng | Thành **một khối nhắc nhở** trong màn Thực đơn (giờ đi chợ, giờ nấu, giờ ăn) |
| 6 | Chưa cho thấy hành trình của người dùng | Trang chủ có thẻ **thống kê**: đã quay bao nhiêu vòng, đã chốt những món nào |
| 7 | Sau khi chốt món người dùng không biết làm gì tiếp | Chốt xong hiện ngay bước tiếp theo: **xem hướng dẫn đi chợ** cho món đó |
| 8 | Còn chức năng phụ, chưa thật sự cần | Bỏ bảng tin cộng đồng, bảng xếp hạng minh hoạ, vuốt chọn món, video chờ kiểm duyệt, trang "Thêm" |
| 9 | Trình bày dài | Mỗi màn hình chỉ giữ phần chính; phần phụ gập lại hoặc mở trong hộp thoại khi cần |

## Kịch bản demo ngắn (khoảng 2 phút)

1. **Hôm nay**: quay một vòng (đếm vòng tăng lên), hoặc bật "Tự chọn món". Cuộn xuống xem "Hành trình của bạn".
2. Bấm **Chốt món**: hộp "Đã chốt món!" hiện ngay bước tiếp theo "Xem hướng dẫn đi chợ".
3. **Món ăn**: khối "Hợp với bạn không?" (hợp hay chưa, vì sao, dinh dưỡng, cẩm nang của từng nguyên liệu), rồi "Đi chợ cho món này".
4. **Thực đơn**: khối nhắc nhở ở đầu trang; đánh dấu một bữa "đã ăn" rồi chọn cảm giác ngay dưới bữa đó; cuối trang là "Nhìn lại tuần".

## Chỗ nên hỏi lại giảng viên

- **Cộng đồng**: ghi âm chỉ nhắc "hỗ trợ cộng đồng" khi nhóm kể thêm chức năng, và ảnh tóm tắt không có mục này. Mình bỏ khỏi bản này vì bảng tin và bảng xếp hạng chỉ lưu trên máy nên chưa có ý nghĩa thật. Cần xác nhận đây có phải điều giảng viên muốn.
- **Hướng dẫn đi chợ**: mình hiểu là "dự kiến sẽ mua gì cho món vừa chốt" và làm thành khối ngay trên trang món cùng một nút ở thanh dưới. Cần xác nhận có đúng ý, hay giảng viên muốn một màn hình riêng.
- **Khối nhắc nhở** được coi là phần phụ: mình đặt ở đầu màn Thực đơn nhưng đã làm gọn (một dòng "Sắp tới" và ba mốc giờ); có thể gập lại nếu vẫn còn nặng.
- **Độ tin cậy của bản chuyển chữ**: ghi âm nhiều tạp âm nên có đoạn nghe không chắc. Các ý ở trên chỉ giữ lại khi lặp lại ở nhiều đoạn và khớp với ảnh tóm tắt.
