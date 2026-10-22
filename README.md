# Hôm nay ăn gì? 🥣

Web gợi ý món ăn lành cho **người bị đau dạ dày / viêm loét dạ dày** đang tự nấu ăn, và cho bất kỳ ai muốn ăn nhẹ bụng: sinh viên ở trọ, người đi làm bận rộn, người lớn tuổi.
Giao diện kiểu app "chọn món bằng vòng quay" (mobile-first, bo tròn, sáng/tối) nhưng có bảng màu riêng (lá trà + vàng bơ, khớp với poster của nhóm; đổi được trong Cá nhân), nội dung xoay quanh một câu hỏi: **mua gì và nấu thế nào để không làm dạ dày nặng thêm?**

> ⚠️ Nội dung chỉ mang tính tham khảo, không thay thế chẩn đoán và điều trị của bác sĩ. Hãy để bác sĩ hoặc chuyên gia dinh dưỡng duyệt lại nội dung trước khi công bố rộng rãi.

## Ý tưởng

| | |
|---|---|
| **Vấn đề** | Người đau dạ dày khó tìm quán/dịch vụ phù hợp nên phải tự nấu, nhưng thiếu hướng dẫn cụ thể và đáng tin cậy. Rõ nhất ở sinh viên ở trọ, nhưng người đi làm và người lớn tuổi cũng gặp đúng khó khăn đó. |
| **Đối tượng** | Người bị đau dạ dày / viêm loét dạ dày tự nấu ăn (sinh viên, người đi làm, người lớn tuổi) và người không đau nhưng muốn ăn lành mạnh. |
| **HMW** | Làm sao để họ tự tin mua đúng nguyên liệu và nấu an toàn, không phải lo "lỡ ăn sai"? |

## Ba màn hình chính và mục Cá nhân

Thiết kế lại theo góp ý của giảng viên (phân tích đầy đủ ở [`docs/gop-y-giang-vien.md`](docs/gop-y-giang-vien.md)): *đứng ở vị trí người dùng cuối, đi theo quy trình từng bước, tiết chế thông tin, mỗi thứ chỉ có một chỗ*. Luồng chính chỉ có **3 màn hình**, đúng một mạch **chọn món → biết món có hợp không rồi chốt → đi chợ, nấu, ăn → ghi cảm nhận**. Mục thứ tư, **Cá nhân**, không thuộc luồng chính: là nơi giữ hồ sơ người dùng, Cộng đồng và cài đặt (theo góp ý của nhóm).

| | Mục | Làm gì |
|---|---|---|
| 1 | **Hôm nay** `#home` | Quay may mắn cho vui, hoặc **tự chọn món** từ danh sách món hợp với bạn. Phía dưới là **hành trình của bạn**: đã quay bao nhiêu vòng, đã chốt những món nào. |
| 2 | **Món ăn** `#explore` | Danh sách và chi tiết món. **Cẩm nang nằm ngay trong từng món**: khối "Hợp với bạn không?" (hợp hay không và vì sao), dinh dưỡng, nguyên liệu nên hạn chế. Có nút **Chốt món** và **hướng dẫn đi chợ** cho món đó. Cuối mỗi món có chỗ chấm sao, viết bình luận và gửi ảnh món. |
| 3 | **Thực đơn** `#plan` | Thực đơn cả tuần và danh sách đi chợ; khối **nhắc nhở** (giờ đi chợ, giờ nấu, giờ ăn); **ô cảm nhận ngay dưới từng bữa** và phần "Nhìn lại tuần". |
| 4 | **Cá nhân** `#me` | **Hồ sơ người dùng** cơ bản (tên, nhóm, hồ sơ dạ dày, ngân sách, thời gian nấu), **Cộng đồng** (đánh giá món có sao, bình luận và ảnh, `#community`) và **cài đặt** (nhắc giờ, cỡ chữ, giao diện, màu, dữ liệu). |

Những thứ trước đây là trang riêng đã được **gộp vào ba màn hình trên**:

| Trước | Bây giờ |
|---|---|
| Tab Cẩm nang | Vào từng món (khối "Hợp với bạn không?"); ô tìm món cũng tra được nguyên liệu; nút "Cẩm nang" mở hộp tra nguyên liệu, kiểm tra công thức, thay thế, lưu ý chung |
| Nhật ký ăn uống | Dòng "Bụng bạn thấy sao?" dưới từng bữa trong Thực đơn, kèm "Nhìn lại tuần" |
| Nhắc giờ ăn | Khối "Nhắc nhở" ở đầu màn Thực đơn |
| Tủ lạnh | Thẻ trong tab Đi chợ của màn Thực đơn (danh sách đi chợ tự trừ đồ đang có); trong hộp Tủ lạnh có **Quét nguyên liệu bằng camera** |
| Cộng đồng (bảng tin, xếp hạng) | **Đánh giá món** (sao, bình luận, ảnh) trong mục **Cá nhân**, và ở cuối từng món |
| Trang "Thêm", hộp Cài đặt, nút bánh răng | Mục **Cá nhân**: hồ sơ, Cộng đồng và cài đặt ở một chỗ |

**Đã bỏ** vì chưa làm được thật hoặc trùng việc: bảng tin viết tự do và bảng xếp hạng số liệu mẫu (thay bằng đánh giá món), vuốt chọn món (trùng "Tự chọn món"), mục video chuyên gia (chờ danh sách video đã kiểm duyệt).

## Tính năng

### 1. Hôm nay
- **Hai cách chọn** (công tắc ngay đầu trang): **Quay may mắn** và **Tự chọn món**.
- **Vòng quay "Hôm nay ăn gì?"**: quay ra món hợp với tình trạng dạ dày theo bữa (sáng, trưa, tối, phụ), kèm lý do hợp. Kết quả có "Xem chi tiết", "Quay lại" và **Chốt món**. Có danh sách "Vòng quay của bạn" (bỏ bớt món).
- **Tự chọn món**: danh sách món hợp với hồ sơ cho bữa bạn chọn, món bạn hay chọn và hay nấu xếp lên trước (gắn nhãn "Hay chọn"); bấm **Chọn** để chốt luôn.
- **Hành trình của bạn**: số vòng đã quay, số lần chốt món, số món khác nhau, món chốt nhiều nhất và hàng "Chốt gần đây" (bấm vào để xem món).
- **Chốt xong biết làm gì tiếp**: hộp "Đã chốt món!" cho đổi bữa/ngày và hiện ngay bước tiếp theo: **xem hướng dẫn đi chợ** (món ăn ngoài thì "tìm quán gần bạn").
- Trang chủ chỉ có **một thẻ ngữ cảnh** mỗi lúc (hướng dẫn 3 bước cho người mới → nhắc giờ ăn đã trễ hoặc sắp tới → đồ trong tủ lạnh cần chú ý → gợi ý bật nhắc giờ → mẹo trong ngày).

### 2. Món ăn
- **60 món** (53 nấu tại nhà + 7 gọi món an toàn ở quán), nhiều món thuần Việt: cháo đậu xanh, cháo tôm bí đỏ, canh bầu, canh mồng tơi mướp, canh rau ngót, canh khoai môn, canh bắp cải cuộn thịt, súp gà ngô, bí xanh nhồi thịt hấp, cá kho nhạt, gà kho gừng nhạt, tôm hấp gừng, bún gà, bánh canh cá, nước gạo rang, bánh cuốn và hủ tiếu ở quán... Món có đậu hạt, ngô, tôm, rau lá chỉ hiện khi dạ dày đã ổn định.
- **Tìm kiếm** có dấu hoặc không dấu, **sắp xếp** (hợp nhất, rẻ nhất, nhanh nhất, ít kcal, chấm sao, dùng đồ sắp hết hạn). Gõ tên nguyên liệu (ví dụ "cà chua") thì ngay trên danh sách hiện **cẩm nang của nguyên liệu đó** (nên dùng, dùng ít hay nên tránh, vì sao).
- **Bộ lọc nhiều thang đo**: tình trạng dạ dày, loại bữa, *thời gian nấu* (5 phút đến 1 giờ) và *ngân sách một bữa* (6.000đ đến 50.000đ) là hai mục riêng; thêm độ khó, nguyên liệu chính, cách ăn, năng lượng, món chay, dụng cụ trong "Lọc thêm".
- **Mức vị tối đa (cay, mặn, chua, béo)**: bốn thang 0 đến 3, **tự khoá theo hồ sơ dạ dày** (đang đau cấp thì cay và chua khoá ở mức 0). Bạn chỉ hạ thấp thêm được, không nâng vượt mức an toàn. Nhóm "không đau dạ dày" không bị khoá.
- **Trang một món**, theo đúng thứ tự người dùng cần:
  1. **Hợp với bạn không?**: kết luận rõ ("Hợp với bạn lúc này" / "Hợp với dạ dày, nhưng vượt giới hạn bạn đặt" / "Chưa hợp với bạn lúc này") kèm lý do, giai đoạn nào ăn được, mức vị so với mức bạn đặt, nhóm dinh dưỡng (tinh bột, đạm, rau) và kcal, **cẩm nang nói gì về từng nguyên liệu của món**, nhật ký của bạn về món này và lưu ý khi nấu.
  2. **Đi chợ cho món này**: nguyên liệu và số lượng cho một người, còn thiếu gì và khoảng bao nhiêu tiền, mẹo chọn mua, đồ thay thế khi thiếu.
  3. **Cách làm** và nút **Nấu từng bước** (đọc to, hẹn giờ), video hướng dẫn tìm trên YouTube.
  4. Thanh nút cố định: **Chốt món này**, **Hướng dẫn đi chợ**, **Yêu thích**. **Chấm sao** 1 đến 5: món 4 đến 5 sao và món yêu thích được ưu tiên khi tự xếp thực đơn.
- **Chấm sao, bình luận và gửi ảnh món** ngay cuối trang mỗi món; các đánh giá của bạn gom ở **Cá nhân › Cộng đồng**.
- **Hộp Cẩm nang** (nút "Cẩm nang" ở đầu danh sách): tra 69 nguyên liệu (nên dùng / dùng ít / nên tránh, kèm lý do), **kiểm tra công thức bất kỳ** (dán danh sách nguyên liệu, mình đánh dấu phần nên tránh và gợi ý thay), bảng thay thế, "Tưởng lành mà không lành", thói quen ăn uống, dấu hiệu cần đi khám ngay.

### 3. Thực đơn
- **Thực đơn tuần**: tự xếp 21 bữa không lặp món theo hồ sơ, ngân sách và các giới hạn bạn đặt; ưu tiên món dùng đồ sắp hết hạn, món bạn chấm cao và món hay chọn. Mặc định chỉ xếp món nấu tại nhà; chọn **Cách ăn: Tất cả** (nhóm *Người đi làm* đã chọn sẵn) thì tuần có cả bữa ăn ngoài. Có nút **lặp lại thực đơn tuần trước**.
- **Nhắc nhở** (đầu màn hình): bật/tắt, dòng "Sắp tới: ...", ba mốc **đi chợ**, **nấu** (tính theo thời gian nấu để kịp giờ ăn) và **ăn**. "Chỉnh giờ và cách nhắc" mở hộp đặt giờ ăn, bữa phụ, loại lời nhắc. Có "nhắc lại sau 10 phút", thông báo của trình duyệt (khi bạn cho phép) và **file lịch .ics 7 ngày** để điện thoại tự nhắc kể cả khi không mở trang.
- **Cảm nhận sau bữa ăn**: đánh dấu "đã nấu / đã ăn" thì dưới bữa đó hiện dòng **"Bụng bạn thấy sao?"** (4 mức, một chạm) và ô nhận xét ngắn; bấm dòng "Triệu chứng" để chọn triệu chứng (ợ chua, đầy bụng, buồn nôn...) và ghi thêm món đã ăn. Khoảng 45 phút sau khi bấm "Đã ăn", lời nhắc hỏi bụng bạn thấy sao.
- **Nhìn lại tuần**: đã ăn bao nhiêu bữa, bao nhiêu bữa thấy ổn hay khó chịu, các bữa theo từng ô; từ nhật ký 30 ngày chỉ ra **món nên cẩn thận** và **món hợp với bạn** (mỗi món cần ít nhất 2 lần ghi). Nút "+ Ghi bữa khác" cho bữa không có trong thực đơn.
- **Đi chợ** (tab thứ hai): danh sách = cần cho các bữa chưa nấu − đồ đang có; bấm "đã mua" thì cộng vào tủ lạnh; **Mua online** (Bách hoá Xanh, Shopee, Tiki, Lazada, Google Maps). Thẻ **Tủ lạnh** mở hộp nhập nhanh bằng chữ ("trứng 6, gạo 1kg"), số lượng, hạn dùng, báo đồ sắp hỏng, gợi ý món nên nấu trước và nguyên liệu thay thế; đánh dấu "đã nấu" thì nguyên liệu tự trừ. Trong hộp có **Quét nguyên liệu bằng camera** (thử nghiệm): bấm "Chụp ảnh" (mở camera sau trên điện thoại) hoặc chọn ảnh có sẵn, rồi chạm vào những thứ thấy trong ảnh để thêm vào tủ. **Tự nhận ra nguyên liệu bằng AI là "sắp có"** (cần dịch vụ nhận diện hình ảnh); ảnh quét chỉ nằm trong bộ nhớ lúc hộp mở và không được lưu lại.
- **Ngân sách thực tế**: nhập số tiền đã chi thật (có thể gõ "180k"), mình gợi ý **"Đặt ngân sách X đ/ngày?"** từ dữ liệu của chính bạn.

### 4. Cá nhân
- **Hồ sơ người dùng cơ bản** (`#me`): thẻ đầu trang có ảnh đại diện (chữ cái đầu của tên), **tên hiển thị** (không bắt buộc, tối đa 24 ký tự, chỉ lưu trên máy), nhóm người dùng, tình trạng dạ dày, giới hạn ngân sách và thời gian nấu, ăn chay, cùng ba con số của bạn: số vòng đã quay, số lần chốt món, số đánh giá. Bên dưới là **Tôi là** (4 nhóm, đổi có hộp xác nhận) và **Hồ sơ dạ dày** (mở bộ lọc để đổi tình trạng, mức độ, dụng cụ, ngân sách, thời gian).
- **Cộng đồng = đánh giá món** (thanh chuyển "Hồ sơ | Cộng đồng", `#community`): thay vì chỉ chấm sao, bạn có thể **viết bình luận** và **gửi ảnh món**. Mỗi món có nút "Viết bình luận" và "Gửi ảnh món" ngay dưới phần chấm sao; màn Cộng đồng gom mọi đánh giá của bạn (lọc "Có ảnh", xem ảnh lớn, **Chia sẻ**, xoá). Chấm sao trong đánh giá cũng là điểm của món khi tự xếp thực đơn. **Đánh giá và ảnh chỉ lưu trên máy bạn** (ảnh được thu nhỏ còn tối đa 800px, tối đa 24 ảnh, lưu riêng khỏi dữ liệu chính); nút Chia sẻ gửi một đánh giá (kèm ảnh nếu máy hỗ trợ) cho bạn bè qua hộp chia sẻ của điện thoại, hoặc sao chép nội dung. Cộng đồng chung cho mọi người cùng xem là "sắp có" vì cần máy chủ.
- **Cài đặt**: nhắc giờ ăn (mở hộp chỉnh giờ), cỡ chữ, giao diện sáng / tối / theo thiết bị, **màu giao diện**, dữ liệu (xoá toàn bộ, xoá ảnh đã lưu) và liên kết tới trang "Về dự án", mời bạn bè dùng thử.

### Dùng chung
- **Hồ sơ dạ dày**: tình trạng (đợt cấp / đang đỡ / ổn định / **không đau dạ dày, ăn lành mạnh**) × mức độ (nhẹ / vừa / nặng). Mỗi món có mức "dịu" 1 đến 3 và chỉ hiện khi đủ dịu với hồ sơ.
- **Nhiều đối tượng**: chọn nhóm lúc bắt đầu hoặc trong Cá nhân > **Tôi là**: *Sinh viên* (≤ 20.000đ, ≤ 30 phút), *Người đi làm* (≤ 50.000đ, ≤ 30 phút, thực đơn có cả bữa ăn ngoài), *Người lớn tuổi* (≤ 45 phút, nêm nhạt, **chữ to**, giờ ăn sớm hơn), *Ăn lành mạnh*. Mỗi nhóm chỉ là **cài đặt sẵn**, vẫn đổi được từng mục.
- **Người mới**: chào mừng đúng 2 bước (bạn thuộc nhóm nào → dạ dày đang thế nào); trang chủ có thẻ "Làm quen trong 3 bước" (quay hoặc tự chọn → xem món có hợp không rồi chốt → xem thực đơn và đi chợ) tự tích khi bạn làm xong.
- **Chữ to** (Cá nhân > Cỡ chữ): mọi cỡ chữ tính theo rem nên tăng đồng loạt, đã kiểm tra không tràn ngang ở 360px.
- Giao diện sáng / tối, **4 bộ màu** (**Lá trà** là mặc định, Ngọc lam, Biển sâu, Mận chín), lưu dữ liệu trong trình duyệt (`localStorage`: dữ liệu chính ở khoá `hnag.v1`, ảnh đánh giá ở khoá riêng `hnag.photos.v1`; Cá nhân cho xem số ảnh đã lưu và xoá hết ảnh).
- **Về dự án** (`#about`, mở từ Cá nhân): vấn đề, nguyên nhân gốc rễ, câu hỏi thiết kế, quy trình ba màn hình, những gì đã gộp hoặc bỏ, việc làm được thật / chưa làm được.

## Chạy thử

Không cần cài đặt hay build. Chọn một trong các cách:

```bash
# cách 1: mở trực tiếp
xdg-open index.html            # hoặc nhấp đúp vào index.html

# cách 2: chạy server tĩnh (nên dùng khi phát triển)
python3 -m http.server 8000    # rồi mở http://localhost:8000
npx serve .
```

Đưa lên GitHub Pages: bật Pages cho nhánh chứa các file này (thư mục gốc), không cần cấu hình thêm.

## Cấu trúc

```
index.html            khung trang
css/                  tokens (màu, chữ, chế độ tối, bộ màu) · base (kèm chữ to, thanh 3 tab) · components · views
docs/
  gop-y-giang-vien.md phân tích ghi âm góp ý của giảng viên và cách xử lý từng điểm
js/
  util.js             tiện ích (bỏ dấu, ngày tháng, sao chép...)
  icons.js            icon SVG + mascot "Bé Cháo"
  photos.js           kho ảnh nhỏ trên máy: thu nhỏ ảnh bằng canvas, lưu riêng (hnag.photos.v1), giới hạn số ảnh và dung lượng
  data/
    ingredients.js    nguyên liệu, giá ước tính, dụng cụ, mẹo chọn mua theo nhóm
    dishes.js         các món (công thức, mức dịu, độ khó, nguyên liệu chính, mức vị tính sẵn)
    guide.js          cẩm nang: nên/tránh, thay thế, cảnh báo, thói quen, tình trạng dạ dày
    extras.js         bộ màu, thang lọc, mức vị và ngưỡng khoá, nhóm người dùng, nguyên liệu thay thế, hạn dùng, gói thường mua, cửa hàng
  store.js            trạng thái, localStorage, lọc món, xếp thực đơn, thói quen, thống kê hành trình, cảm nhận từng bữa, tủ lạnh, đi chợ
  ui.js               ô minh hoạ, sheet / hộp thoại, toast, hộp gập nhớ trạng thái
  wheel.js            vòng quay (SVG)
  sheets.js           bộ lọc, chốt món, chọn món, chào mừng 2 bước; các thao tác cài đặt (đổi nhóm, chữ, giao diện, màu, xoá dữ liệu)
  remind.js           lời nhắc ăn đúng giờ, khối nhắc nhở, hộp chỉnh giờ, file .ics
  pantry.js           tủ lạnh: nhập nhanh, thay thế, mua online (mở thành hộp từ tab Đi chợ)
  guide.js            cẩm nang gắn vào món: nguyên liệu → mục cẩm nang, dinh dưỡng, tra cứu, kiểm tra công thức, hộp Cẩm nang
  diary.js            dòng cảm nhận dưới từng bữa, "Nhìn lại tuần", hộp ghi chi tiết
  community.js        Cộng đồng: đánh giá món (sao, bình luận, ảnh), màn Cộng đồng, hộp viết đánh giá, chia sẻ
  me.js               mục Cá nhân: thẻ hồ sơ, đặt tên, hồ sơ dạ dày, cài đặt (nhắc giờ, chữ, giao diện, màu, dữ liệu)
  scan.js             quét nguyên liệu bằng camera trong hộp Tủ lạnh (chụp ảnh rồi chạm chọn)
  cook.js             nấu từng bước: đọc to, hẹn giờ, giọng nói
  views-home.js       màn Hôm nay (vòng quay, tự chọn món, hành trình)
  views-explore.js    màn Món ăn (danh sách, trang món: hợp với bạn không, đi chợ cho món, đánh giá)
  views-plan.js       màn Thực đơn (tuần, đi chợ, nhắc nhở, nhìn lại tuần)
  views-about.js      Về dự án
  app.js              điều hướng (hash) và khởi động
assets/favicon.svg
```

Các địa chỉ: `#home`, `#explore`, `#me`, `#community`, `#dish-<mã>`, `#cook-<mã>`, `#plan`, `#plan-shop`, `#about`. Địa chỉ cũ vẫn mở đúng chỗ: `#guide…` (Cẩm nang mở thành hộp ở màn Món ăn), `#fridge` và `#plan-fridge` (tủ lạnh trong tab Đi chợ), `#remind` và `#plan-remind` (khối nhắc nhở ở màn Thực đơn), `#diary` (Thực đơn), `#community…` và `#rank` (màn Cộng đồng trong Cá nhân), `#more`, `#profile` và `#settings` (mục Cá nhân).

Mã dùng script thường (không module) nên chạy được cả khi mở bằng `file://`.

## Thêm nội dung

- **Thêm món**: thêm một object vào `RAW` trong `js/data/dishes.js`. Chi phí, món chay, năng lượng, độ khó, nguyên liệu chính và mức vị được tính tự động từ `ing`; `base: 'com'` tự thêm gạo và bước nấu cơm mềm. Món ăn ngoài khai báo thêm `prot: [...]` cho nguyên liệu chính. Mức vị của món không được vượt `H.FLAVOR_CAPS[care]`.
- **Thêm nguyên liệu**: `js/data/ingredients.js` (đơn vị, giá, có phải đồ có sẵn trong bếp không), rồi thêm hạn dùng (`H.SHELF_DAYS`), gói thường mua (`H.PACK`), từ khoá nhập nhanh (`H.ING_ALIASES`) và đồ thay thế (`H.SUBS`) trong `extras.js`. Nếu là nguồn đạm mới, thêm vào `H.PROTEINS` (extras.js) và `PROTEIN_OF` (dishes.js). Để khối "Hợp với bạn không?" nhận ra nguyên liệu mới, thêm một dòng vào `FOOD_OF` trong `js/guide.js` (mã nguyên liệu → mã mục trong `H.FOODS`; nguyên liệu chưa có dòng này thì khối cẩm nang của món bỏ qua nguyên liệu đó).
- **Thêm nhóm người dùng**: `H.PERSONAS` trong `extras.js` (ngân sách và thời gian phải nằm trong `COST_STEPS` / `TIME_STEPS`; `text: 'large'` để bật chữ to, `salt: 1` để mặc định nêm nhạt).
- **Đổi bảng màu**: màu mặc định là **lá trà**; sửa `--p-base` (màu chủ đạo) và `--accent-base` (màu nhấn) ở đầu `css/tokens.css`, mọi màu nền, chữ, viền đều sinh từ hai màu này (cả giao diện tối). Khi chốt màu theo poster, đổi thêm bốn chỗ cho khớp: mục đầu của `H.PALETTES` (extras.js, gồm `bgLight` và `bgDark` cho thanh trình duyệt), `<meta name="theme-color">` trong index.html, màu nền trong `assets/favicon.svg` và `--w1` đến `--w8` (màu các ô của vòng quay) nếu muốn đổi tông. Muốn thêm lựa chọn trong Cá nhân thì thêm vào `H.PALETTES` và một dòng `:root[data-palette="..."]` ở cuối tokens.css. Người dùng cũ chưa từng tự chọn màu sẽ tự chuyển sang bộ mặc định mới.
- **Thêm mục cẩm nang**: `H.FOODS` trong `js/data/guide.js`. `alias` là các cách gọi khác; "Kiểm tra công thức" dùng chính các alias này để nhận diện.
- **Mẹo chọn mua**: trường `buy` của từng nhóm trong `H.CATEGORIES` (`js/data/ingredients.js`).

## Hạn chế hiện tại và bước tiếp theo

Những thứ **chưa làm được vì cần máy chủ hoặc AI** (trang này chạy hoàn toàn trên máy người dùng nên không làm giả; các mục chỉ là chỗ giữ chỗ đã được bỏ khỏi giao diện):

- **Cộng đồng chung cho mọi người cùng thấy** (đánh giá, bình luận, ảnh của nhau), kết bạn và bảng xếp hạng thật: cần tài khoản đăng nhập, cơ sở dữ liệu (ví dụ Supabase hoặc Firebase) và kiểm duyệt nội dung (đặc biệt với ảnh người dùng đăng). Hiện đánh giá chỉ lưu trên máy người viết và chia sẻ bằng nút Chia sẻ.
- **Tự nhận ra nguyên liệu trong ảnh** (quét bằng AI) và **quét mã vạch**: cần dịch vụ nhận diện hình ảnh. Hiện bạn chụp ảnh rồi tự chạm chọn nguyên liệu; ngoài ra có nhập nhanh bằng chữ và chọn từ danh mục.
- **Dung lượng ảnh**: ảnh đánh giá lưu trong `localStorage` (khoảng 5 MB cho cả trang) nên giới hạn 24 ảnh; xoá trình duyệt hoặc đổi thiết bị thì mất ảnh. Cần máy chủ lưu trữ nếu muốn giữ lâu dài.
- **Nhắc đẩy khi đã đóng hẳn trình duyệt**: cần máy chủ gửi Web Push. Hiện nhắc khi tab còn mở, thông báo trình duyệt khi tab ở nền, và file lịch `.ics` cho điện thoại.
- **Đặt hàng tự động** trên sàn thương mại: hiện chỉ mở trang tìm kiếm của cửa hàng.
- **Giọng đọc và nhận giọng nói** phụ thuộc trình duyệt và thiết bị (một số máy chưa cài giọng tiếng Việt, iOS chưa hỗ trợ nghe liên tục).
- **Video chuyên gia**: cần danh sách video đã duyệt; hiện trang món chỉ có đường dẫn tìm kiếm YouTube.
- **Hình món** đang dùng emoji trên ô màu. Có thể thay bằng ảnh thật (cần ảnh có bản quyền rõ ràng).
- **Nội dung y khoa** được viết theo các hướng dẫn dinh dưỡng phổ biến và ghi rõ chỗ các nguồn chưa thống nhất (sữa, gừng, chất xơ, hải sản, đậu hạt...). Cần bác sĩ hoặc chuyên gia dinh dưỡng thẩm định, nhất là phân loại "mức dịu" của từng món, ngưỡng khoá mức vị (`H.FLAVOR_CAPS`), khối "Hợp với bạn không?" và khoảng cách giữa các bữa được gợi ý. Nhóm "người lớn tuổi" và "ăn lành mạnh" mới là **cài đặt sẵn về ngân sách, thời gian và cỡ chữ**; chưa có thực đơn riêng theo bệnh nền khác (tiểu đường, huyết áp, gout...), nhu cầu năng lượng theo tuổi và giới tính.
- Giá nguyên liệu và kcal là **ước tính**, chưa lấy từ nguồn giá thực tế theo vùng. Số liệu "Nhìn lại tuần" và gợi ý ngân sách chỉ là gợi ý từ dữ liệu của chính bạn, không phải kết luận y khoa.
- Chưa có tài khoản đăng nhập và đồng bộ giữa các thiết bị.
- Phần góp ý của giảng viên được rút ra từ **bản chuyển chữ tự động của một ghi âm nhiều tạp âm**, nên là diễn giải ý chứ không phải nguyên văn (xem `docs/gop-y-giang-vien.md`); nên đối chiếu lại với giảng viên.

## Tham khảo

Các trang đã tham khảo khi viết cẩm nang:
[NIDDK: Eating, Diet & Nutrition for Peptic Ulcers](https://www.niddk.nih.gov/health-information/digestive-diseases/peptic-ulcers-stomach-ulcers/eating-diet-nutrition),
[Mayo Clinic: Gastritis](https://www.mayoclinic.org/diseases-conditions/gastritis/diagnosis-treatment/drc-20355813),
[Vinmec: Bị viêm dạ dày cấp nên ăn gì?](https://www.vinmec.com/vie/bai-viet/bi-viem-da-day-cap-nen-an-gi-vi),
[Vinmec: Lưu ý trong chế độ dinh dưỡng cho người viêm loét dạ dày](https://www.vinmec.com/vie/bai-viet/luu-y-trong-che-do-dinh-duong-cho-nguoi-viem-loet-da-day-tranh-tai-phat-vi),
[Nhà thuốc Long Châu](https://nhathuoclongchau.com.vn/bai-viet/nhung-thuc-pham-nen-va-khong-nen-su-dung-trong-che-do-an-cho-nguoi-viem-loet-da-day.html),
[Pharmacity](https://www.pharmacity.vn/che-do-an-uong-nguoi-viem-loet-da-day.htm).
