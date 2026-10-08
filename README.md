# Hôm nay ăn gì? 🥣

Web gợi ý món ăn cho **sinh viên bị đau dạ dày / viêm loét dạ dày** đang tự nấu ăn ở nhà trọ.
Giao diện lấy cảm hứng từ các app "chọn món bằng vòng quay" (cam, kem, bo tròn, mobile-first), nhưng nội dung xoay quanh một câu hỏi: **mua gì và nấu thế nào để không làm dạ dày nặng thêm?**

> ⚠️ Nội dung chỉ mang tính tham khảo, không thay thế chẩn đoán và điều trị của bác sĩ. Hãy để bác sĩ hoặc chuyên gia dinh dưỡng duyệt lại nội dung trước khi công bố rộng rãi.

## Ý tưởng

| | |
|---|---|
| **Vấn đề** | Sinh viên đau dạ dày khó tìm quán/dịch vụ phù hợp nên phải tự nấu, nhưng thiếu hướng dẫn cụ thể và đáng tin cậy. |
| **Đối tượng** | Sinh viên bị đau dạ dày / viêm loét dạ dày, ở một mình hoặc ở trọ, tự nấu ăn. |
| **HMW** | Làm sao để họ tự tin mua đúng nguyên liệu và nấu an toàn, không phải lo "lỡ ăn sai"? |

## Tính năng (phiên bản đầu)

- **Vòng quay "Hôm nay ăn gì?"**: quay ra món hợp với giai đoạn dạ dày, kèm lý do hợp và nút **Chốt món** (ghim vào lịch tuần). Có bộ lọc, danh sách "Vòng quay của bạn" (bỏ bớt món), gợi ý cố định theo ngày để trang luôn có nội dung.
- **Hồ sơ dạ dày**: giai đoạn (đợt cấp / đang đỡ / ổn định) × mức độ (nhẹ / vừa / nặng). Mỗi món có mức "dịu" 1 đến 3 và chỉ hiện khi đủ dịu với hồ sơ của bạn.
- **Khám phá món**: 35 món nấu tại nhà + 5 món ăn ngoài (cách gọi món an toàn). Tìm kiếm (gõ có dấu hoặc không dấu), lọc theo bữa, năng lượng, thời gian, giá, chay, dụng cụ phòng trọ (nồi cơm điện, bếp, chảo, lò vi sóng).
- **Công thức từng món**: nguyên liệu theo khẩu phần 1 người, giá ước tính, các bước nấu, vì sao hợp dạ dày, nguyên liệu đổi được.
- **Kế hoạch tuần**: tự xếp 21 bữa không lặp món (hoặc 28 bữa nếu thêm bữa phụ), theo hồ sơ và ngân sách mỗi ngày. Đánh dấu "đã nấu", đổi món, chọn món thủ công.
- **Danh sách đi chợ**: gộp nguyên liệu cả tuần, trừ đồ đã có trong tủ lạnh, ước tính tiền, sao chép để gửi bạn bè.
- **Tủ lạnh**: chọn nguyên liệu đang có, nhận gợi ý món nấu được ngay hoặc chỉ thiếu 1 đến 2 thứ.
- **Cẩm nang**: tra 69 nguyên liệu (nên dùng / dùng ít / nên tránh, kèm lý do), **kiểm tra công thức bất kỳ** (dán danh sách nguyên liệu để thấy thành phần cần kiêng và gợi ý thay thế), bảng thay thế, mục **"Tưởng lành mà không lành"**, thói quen ăn uống, dấu hiệu cần đi khám ngay.
- **Cộng đồng** và **Bảng xếp hạng** món được chốt (xem mục Hạn chế).
- **Về dự án**: trang trình bày vấn đề, nguyên nhân gốc rễ, câu hỏi thiết kế và cách trang này giải quyết.
- Giao diện sáng / tối, chạy trên điện thoại và máy tính, lưu dữ liệu trong trình duyệt (`localStorage`).

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
css/                  tokens (màu, chữ, chế độ tối) · base · components · views
js/
  util.js             tiện ích (bỏ dấu, ngày tháng, sao chép...)
  icons.js            icon SVG + mascot "Bé Cháo"
  data/
    ingredients.js    nguyên liệu, giá ước tính, dụng cụ
    dishes.js         các món (công thức, mức dịu, bữa phù hợp...)
    guide.js          cẩm nang: nên/tránh, thay thế, cảnh báo, thói quen, video
  store.js            trạng thái, localStorage, bộ chọn món, xếp thực đơn, đi chợ
  ui.js               ô minh hoạ, sheet / hộp thoại, toast
  wheel.js            vòng quay (SVG)
  sheets.js           bộ lọc, ghim lịch, chọn món, cài đặt, chào mừng
  views-*.js          các màn hình (hôm nay, khám phá, kế hoạch, cẩm nang, cộng đồng, về dự án)
  app.js              điều hướng (hash) và khởi động
assets/favicon.svg
```

Mã dùng script thường (không module) nên chạy được cả khi mở bằng `file://`.

## Thêm nội dung

- **Thêm món**: thêm một object vào `RAW` trong `js/data/dishes.js`. Chi phí, món chay, mức năng lượng được tính tự động từ `ing` (nguyên liệu); `base: 'com'` tự thêm gạo và bước nấu cơm mềm. Giải thích các trường nằm ở đầu file.
- **Thêm nguyên liệu**: `js/data/ingredients.js` (đơn vị, giá, có phải đồ có sẵn trong bếp không).
- **Thêm mục cẩm nang**: `H.FOODS` trong `js/data/guide.js`. `alias` là các cách gọi khác; chức năng "Kiểm tra công thức" dùng chính các alias này để nhận diện.
- **Thêm video chuyên gia**: điền `H.VIDEOS` trong `js/data/guide.js` (mẫu ở comment). Chỉ thêm video đã được kiểm duyệt nội dung.

## Hạn chế hiện tại và bước tiếp theo

- **Cộng đồng** hiện chỉ là bản thử nghiệm: bài viết lưu trên máy người đăng và không hiển thị cho người khác. Cần máy chủ (ví dụ Supabase hoặc Firebase) cùng kiểm duyệt nội dung để chạy thật.
- **Bảng xếp hạng "cộng đồng"** là số liệu minh hoạ (có ghi chú trên giao diện). Bảng "Của tôi" là số liệu thật từ các lần bạn bấm Chốt.
- **Video chuyên gia**: mới có khung và các đường dẫn tìm kiếm YouTube. Cần danh sách video đã duyệt.
- **Hình món** đang dùng emoji trên ô màu. Có thể thay bằng ảnh thật (cần ảnh có bản quyền rõ ràng).
- **Nội dung y khoa** được viết theo các hướng dẫn dinh dưỡng phổ biến và ghi rõ chỗ các nguồn chưa thống nhất (sữa, gừng, chất xơ...). Cần bác sĩ hoặc chuyên gia dinh dưỡng thẩm định, nhất là phân loại "mức dịu" của từng món và thực đơn cho giai đoạn đợt cấp.
- Giá nguyên liệu và kcal là **ước tính**, chưa lấy từ nguồn giá thực tế theo vùng.
- Chưa có tài khoản đăng nhập và đồng bộ giữa các thiết bị.

## Tham khảo

Các trang đã tham khảo khi viết cẩm nang:
[NIDDK: Eating, Diet & Nutrition for Peptic Ulcers](https://www.niddk.nih.gov/health-information/digestive-diseases/peptic-ulcers-stomach-ulcers/eating-diet-nutrition),
[Mayo Clinic: Gastritis](https://www.mayoclinic.org/diseases-conditions/gastritis/diagnosis-treatment/drc-20355813),
[Vinmec: Bị viêm dạ dày cấp nên ăn gì?](https://www.vinmec.com/vie/bai-viet/bi-viem-da-day-cap-nen-an-gi-vi),
[Vinmec: Lưu ý trong chế độ dinh dưỡng cho người viêm loét dạ dày](https://www.vinmec.com/vie/bai-viet/luu-y-trong-che-do-dinh-duong-cho-nguoi-viem-loet-da-day-tranh-tai-phat-vi),
[Nhà thuốc Long Châu](https://nhathuoclongchau.com.vn/bai-viet/nhung-thuc-pham-nen-va-khong-nen-su-dung-trong-che-do-an-cho-nguoi-viem-loet-da-day.html),
[Pharmacity](https://www.pharmacity.vn/che-do-an-uong-nguoi-viem-loet-da-day.htm).
