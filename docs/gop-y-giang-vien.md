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

- **Cộng đồng**: ghi âm chỉ nhắc "hỗ trợ cộng đồng" khi nhóm kể thêm chức năng, và ảnh tóm tắt không có mục này. Bản vòng 4 bỏ hẳn; sau góp ý của nhóm (phần dưới) cộng đồng quay lại **dưới dạng đánh giá món** (từ vòng 6 nằm trong mục Cá nhân), không còn là bảng tin riêng. Nên hỏi giảng viên xem cách đặt này có ổn không.
- **Hướng dẫn đi chợ**: mình hiểu là "dự kiến sẽ mua gì cho món vừa chốt" và làm thành khối ngay trên trang món cùng một nút ở thanh dưới. Cần xác nhận có đúng ý, hay giảng viên muốn một màn hình riêng.
- **Khối nhắc nhở** được coi là phần phụ: mình đặt ở đầu màn Thực đơn nhưng đã làm gọn (một dòng "Sắp tới" và ba mốc giờ); có thể gập lại nếu vẫn còn nặng.
- **Độ tin cậy của bản chuyển chữ**: ghi âm nhiều tạp âm nên có đoạn nghe không chắc. Các ý ở trên chỉ giữ lại khi lặp lại ở nhiều đoạn và khớp với ảnh tóm tắt.

## Góp ý thêm từ tin nhắn nhóm (vòng 5)

Sau khi gọn lại còn ba màn hình, một bạn trong nhóm nhắn lại (ảnh chụp đoạn chat). Ý chính, diễn giải:

- "Mình tính gọn hết luôn rồi phải không? Bỏ cả cái quét nguyên liệu (trong tủ lạnh)... Gọn app rồi nhưng hình như mất mấy tính năng mới luôn. **Mình nên giữ lại 1 đến 2 tính năng.**"
- Hỏi lại là tính năng nào thì trả lời: **quét nguyên liệu bằng camera (sắp có)** và **cộng đồng**.
- Về cộng đồng: đó là phần đánh giá; **thay vì chỉ chấm sao thì thêm bình luận và gửi ảnh món** được như trước.

| Góp ý | Cách xử lý trong bản này |
|---|---|
| Giữ lại 1 đến 2 tính năng | Chỉ đưa lại đúng hai tính năng này. Không đưa lại bảng xếp hạng, vuốt chọn món, video; thanh điều hướng vẫn chỉ có **3 mục** theo góp ý của giảng viên |
| Quét nguyên liệu bằng camera (sắp có), trong tủ lạnh | Nút **"Quét nguyên liệu bằng camera"** trong hộp Tủ lạnh (và nút "Quét" ở thẻ Tủ lạnh của tab Đi chợ): chụp hoặc chọn ảnh rồi chạm vào những thứ thấy trong ảnh để thêm vào tủ. **Tự nhận diện bằng AI ghi rõ là "sắp có"** vì trang không có dịch vụ nhận diện hình ảnh; ảnh quét không được lưu lại |
| Cộng đồng là đánh giá: thêm bình luận và gửi ảnh món | **Đánh giá món** gồm sao, bình luận và ảnh. Ở vòng 5 nằm trong màn Món ăn (thanh chuyển "Danh sách món \| Cộng đồng") và ở cuối từng món; từ vòng 6 chuyển sang mục Cá nhân (xem phần dưới). Ảnh được thu nhỏ rồi lưu trên máy; nút Chia sẻ gửi đánh giá (kèm ảnh nếu máy hỗ trợ) cho bạn bè |

Điều **chưa** làm thật được và được ghi rõ trên giao diện: cộng đồng chung để mọi người cùng xem đánh giá của nhau (cần máy chủ, tài khoản và kiểm duyệt ảnh) và tự nhận ra nguyên liệu trong ảnh (cần AI nhận diện hình ảnh). Ở vòng 5 mình chưa thêm bài mẫu nào để cộng đồng trông đông hơn; vòng 7 nhóm đề nghị có vài bài đăng sẵn, xem phần cuối (làm có nhãn rõ ràng).

Kịch bản demo thêm: mở một món, bấm "Viết bình luận" hoặc "Gửi ảnh món", chọn ảnh, chấm sao rồi đăng; sang **Món ăn › Cộng đồng** xem lại và bấm Chia sẻ. Trong **Thực đơn › Đi chợ › Tủ lạnh**, bấm "Quét nguyên liệu bằng camera", chọn ảnh rồi chạm vài nguyên liệu và thêm vào tủ.

## Góp ý thêm từ tin nhắn nhóm (vòng 6)

Một bạn trong nhóm nhắn tiếp (ảnh chụp đoạn chat). Ý chính, diễn giải:

- **Cộng đồng nên vào một mục "Cá nhân"**, và trong mục Cá nhân thêm **hồ sơ người dùng** với những thứ cơ bản thôi, như trước đây đã làm.
- **Sửa màu prototype về màu lá trà**: màu hiện tại đang lạc quẻ so với poster. Chờ bạn làm poster chỉnh xong rồi sửa lại cho khớp.

| Góp ý | Cách xử lý trong bản này |
|---|---|
| Mục "Cá nhân" chứa Cộng đồng | Thêm mục thứ tư **Cá nhân** (`#me`) ở thanh điều hướng. Cộng đồng chuyển từ màn Món ăn sang đây (thanh chuyển "Hồ sơ \| Cộng đồng"); màn Món ăn gọn lại như cũ |
| Hồ sơ người dùng cơ bản | Thẻ hồ sơ: ảnh đại diện, **tên hiển thị** (không bắt buộc), nhóm, tình trạng dạ dày, giới hạn ngân sách và thời gian nấu, ba con số (vòng quay, lần chốt, đánh giá). Phía dưới là Tôi là, Hồ sơ dạ dày và các cài đặt trước đây nằm trong hộp Cài đặt (nay bỏ nút bánh răng và hộp đó, mỗi thứ chỉ còn một chỗ) |
| Màu lá trà | **Lá trà `#4F7942` + vàng bơ `#F2C94C`** là màu mặc định; vòng quay đổi sang sắc "vườn trà", nút bánh răng của thực đơn dùng màu nhấn thay cho màu chàm, favicon và màu thanh trình duyệt đổi theo. Người dùng cũ chưa từng tự chọn màu tự chuyển sang bộ này; ngọc lam và hai bộ khác vẫn chọn được trong Cá nhân |

Hai điều cần xác nhận:

- **Mã màu lá trà**: mình chưa thấy poster nên chọn một xanh lá hơi vàng, đủ đậm để chữ trắng trên nút vẫn rõ (tương phản đã kiểm tra ở cả bốn bộ màu, sáng và tối). Khi poster chốt, chỉ cần đổi hai dòng `--p-base` và `--accent-base` ở đầu `css/tokens.css` (README có liệt kê thêm vài chỗ nhỏ cần khớp).
- **Bốn mục thay vì ba**: giảng viên muốn rút lại ba chức năng chính. Mình coi Cá nhân là mục hồ sơ chứ không phải một bước của luồng (chọn món → chốt → đi chợ → ghi cảm nhận), nhưng cần hỏi lại giảng viên. Nếu muốn đúng ba mục ở thanh dưới, có thể chuyển Cá nhân thành biểu tượng ở góc trên bên phải, giữ nguyên nội dung.

## Góp ý thêm từ tin nhắn nhóm (vòng 7)

Một bạn trong nhóm xem bản vòng 6 rồi nhắn (ảnh chụp đoạn chat). Ý chính, diễn giải:

- Nhìn chung **thấy ổn hết**.
- Nhưng nếu **bổ sung chỗ Cộng đồng có một vài bài đã đăng sẵn (giống bản đầu)** thì **hay hơn**: kiểu **có ảnh chụp và đánh giá từ trước**.

| Góp ý | Cách xử lý trong bản này |
|---|---|
| Cộng đồng có vài bài đã đăng sẵn, giống bản đầu | Màn Cộng đồng và cuối từng món có **6 bài mẫu** (chấm sao + bình luận, 5 bài kèm tranh), xếp sau đánh giá của bạn. Mỗi bài viết theo góc nhìn một nhóm người dùng (sinh viên, người đi làm, người lớn tuổi, ăn lành mạnh): cách nấu, cảm nhận sau bữa ăn, cả những bài chỉ 3 đến 4 sao cho tự nhiên. Bản đầu cũng có "mẹo mẫu" gắn nhãn như vậy |
| Có ảnh chụp | Trong dự án chưa có ảnh món nào do nhóm tự chụp, và ảnh lấy trên mạng thì chưa rõ bản quyền, nên mỗi bài kèm **tranh minh hoạ vẽ bằng mã (SVG)**: ghi "Tranh minh hoạ" ngay trên ảnh và khi xem lớn. Có ảnh chụp thật thì bỏ vào `assets/community/` và ghi đường dẫn vào trường `img` của bài (xem README), nhãn tự đổi thành "Ảnh của nhóm" |

**Cách giữ trung thực** (khác với "đánh giá giả"): mỗi thẻ có nhãn **"Bài mẫu"**, viền nét đứt và có dòng giải thích "không phải lời kể hay ảnh chụp của người dùng thật"; gọi theo nhóm người dùng chứ **không đặt tên, ngày giờ hay số lượt thích giả**; bài mẫu **không lưu vào máy, không tính vào sao hay gợi ý món, không có Chia sẻ hay Xoá**, và người dùng **ẩn được bằng một nút** (nhớ lựa chọn). Phần "Cộng đồng chung cho mọi người cùng xem" vẫn ghi là sắp có vì cần máy chủ; khi có thì xoá bài mẫu và dùng bài thật.

Hai điều cần xác nhận:

- **Ảnh**: nếu nhóm có ảnh món tự chụp (đã nấu và chụp, đồng ý cho dùng) thì gửi để thay các tranh minh hoạ. Ảnh lấy từ trang khác chỉ nên dùng khi bản quyền rõ ràng.
- **Khi demo**: nói rõ với người xem đây là bài mẫu để minh hoạ giao diện, vì web chưa có cộng đồng thật. Nếu giảng viên thấy bài mẫu gây hiểu nhầm, tắt bằng nút "Ẩn bài mẫu" hoặc để mảng `H.COMMUNITY_SEED` rỗng.
