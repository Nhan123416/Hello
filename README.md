# Hôm nay ăn gì? 🥣

Web gợi ý món ăn lành cho **người bị đau dạ dày / viêm loét dạ dày** đang tự nấu ăn, và cho bất kỳ ai muốn ăn nhẹ bụng: sinh viên ở trọ, người đi làm bận rộn, người lớn tuổi.
Giao diện kiểu app "chọn món bằng vòng quay" (mobile-first, bo tròn, sáng/tối) nhưng có bảng màu riêng (ngọc lam + vàng bơ, đổi được trong Cài đặt), nội dung xoay quanh một câu hỏi: **mua gì và nấu thế nào để không làm dạ dày nặng thêm?**

> ⚠️ Nội dung chỉ mang tính tham khảo, không thay thế chẩn đoán và điều trị của bác sĩ. Hãy để bác sĩ hoặc chuyên gia dinh dưỡng duyệt lại nội dung trước khi công bố rộng rãi.

## Ý tưởng

| | |
|---|---|
| **Vấn đề** | Người đau dạ dày khó tìm quán/dịch vụ phù hợp nên phải tự nấu, nhưng thiếu hướng dẫn cụ thể và đáng tin cậy. Rõ nhất ở sinh viên ở trọ, nhưng người đi làm và người lớn tuổi cũng gặp đúng khó khăn đó. |
| **Đối tượng** | Người bị đau dạ dày / viêm loét dạ dày tự nấu ăn (sinh viên, người đi làm, người lớn tuổi) và người không đau nhưng muốn ăn lành mạnh. |
| **HMW** | Làm sao để họ tự tin mua đúng nguyên liệu và nấu an toàn, không phải lo "lỡ ăn sai"? |

## Thiết kế gọn: luồng chính và tính năng phụ

Phản hồi từ người dùng thử: *"giao diện còn ôm đồm, quá nhiều tính năng cùng lúc"*. Cách xử lý là **ẩn dần (progressive disclosure)** thay vì để mọi thứ ngang hàng:

- **Luồng chính chỉ có ba việc**: quay/chọn một món → xếp thực đơn cả tuần → đi chợ theo danh sách. Trang chủ chỉ giữ vòng quay, kết quả, "Bữa hôm nay" và **một thẻ ngữ cảnh duy nhất** (hướng dẫn 3 bước cho người mới → nhắc giờ ăn đã trễ hoặc sắp tới trong 90 phút → đồ trong tủ lạnh cần chú ý → gợi ý bật nhắc giờ → mẹo trong ngày).
- **Thanh tab dưới gồm 5 mục**: Hôm nay · Món ăn · Thực đơn · Cẩm nang · **Thêm**. Tủ lạnh, nhắc giờ, nhật ký, cộng đồng, bảng xếp hạng, vuốt chọn món, mời bạn bè, hồ sơ và cài đặt nằm trong **Thêm**, mỗi mục là một trang riêng có nút quay về.
- **Người mới**: chào mừng đúng 2 bước (bạn thuộc nhóm nào → dạ dày đang thế nào), ngân sách / thời gian / giờ ăn / cỡ chữ được **đặt sẵn theo nhóm**; trang chủ có thẻ "Làm quen trong 3 bước" tự tích khi bạn làm xong.
- **Bộ lọc** chỉ có phần chính (tình trạng dạ dày, loại bữa, thời gian, ngân sách); mức vị, độ khó, nguyên liệu chính, cách ăn, năng lượng, chay, dụng cụ gập trong "Lọc thêm" (tự mở nếu bạn đang dùng). Sắp xếp và "hiện cả món chưa hợp" gom vào một nút.
- **Trang món** gọn hơn: nhãn mức vị một hàng, dụng cụ một dòng, nhãn "Đủ / Thiếu" từng nguyên liệu chỉ hiện khi bạn đã dùng tủ lạnh (không thì mỗi dòng đều "Chưa có"), nhật ký và bài chia sẻ gập lại.
- Các trang nhiều tuỳ chọn (Nhắc giờ, Tủ lạnh) gập phần ít dùng; lịch nhắc chỉ hiện các lời nhắc sắp tới, phần đã qua gập lại.
- **Đã bỏ hẳn** những thứ chưa làm được thật hoặc trùng lặp: tab "Bạn bè (sắp có)", nút "chụp ảnh tủ lạnh (sắp có)", khối giới thiệu 4 ô và dải "ý tưởng thiết kế" ở trang chủ, nút "Bộ lọc" thứ hai trên vòng quay, hàng 6 nút sắp xếp, thẻ "Vuốt chọn món" chiếm chỗ, huy hiệu cúp trên thanh trên.

## Tính năng

### Chọn món
- **Vòng quay "Hôm nay ăn gì?"**: quay ra món hợp với tình trạng dạ dày, kèm lý do hợp và nút **Chốt món** (ghim vào lịch tuần). Có danh sách "Vòng quay của bạn" (bỏ bớt món).
- **60 món** (53 nấu tại nhà + 7 gọi món an toàn ở quán), nhiều món thuần Việt: cháo đậu xanh, cháo tôm bí đỏ, canh bầu, canh mồng tơi mướp, canh rau ngót, canh khoai môn, canh bắp cải cuộn thịt, súp gà ngô, bí xanh nhồi thịt hấp, cá kho nhạt, gà kho gừng nhạt, tôm hấp gừng, bún gà, bánh canh cá, nước gạo rang, bánh cuốn và hủ tiếu ở quán... Món có đậu hạt, ngô, tôm, rau lá chỉ hiện khi dạ dày đã ổn định.
- **Hồ sơ dạ dày**: tình trạng (đợt cấp / đang đỡ / ổn định / **không đau dạ dày, ăn lành mạnh**) × mức độ (nhẹ / vừa / nặng). Mỗi món có mức "dịu" 1 đến 3 và chỉ hiện khi đủ dịu với hồ sơ.
- **Bộ lọc nhiều thang đo**: *thời gian nấu* (5, 10, 15, 20, 30, 45 phút, 1 giờ) và *ngân sách một bữa* (6.000đ đến 50.000đ) là hai mục riêng; thêm độ khó, nguyên liệu chính (gà, heo, bò, cá, tôm, trứng, đậu hũ), cách ăn, năng lượng, món chay, dụng cụ. Các bộ lọc đang bật hiện thành nhãn có nút xoá.
- **Mức vị tối đa (cay, mặn, chua, béo)**: bốn thang 0 đến 3, **tự khoá theo hồ sơ dạ dày** (đang đau cấp thì cay và chua khoá ở mức 0). Bạn chỉ hạ thấp thêm được, không nâng vượt mức an toàn. Trang món có nhãn mức vị và nhắc bỏ gừng, thay cà chua, nêm nhạt khi món vượt mức bạn đặt. Nhóm "không đau dạ dày" không bị khoá.
- **Món ăn**: tìm kiếm (có dấu hoặc không dấu), sắp xếp theo hợp nhất / rẻ nhất / nhanh nhất / ít kcal / chấm sao / dùng đồ sắp hết hạn.
- **Vuốt chọn món**: vuốt phải để thích, vuốt trái để bỏ khỏi vòng quay và kế hoạch, có nút, bàn phím (← → ↓ Z) và hoàn tác.
- **Chấm sao** 1 đến 5: món 4 đến 5 sao và món yêu thích được ưu tiên khi tự xếp thực đơn.

### Nhớ thói quen và ngân sách thực tế
- **Món bạn hay chọn**: đếm số lần bạn chốt món và số lần nấu. Món hay chọn được **gợi ý thường hơn** (gợi ý hằng ngày), **ưu tiên nhẹ khi tự xếp thực đơn** (vẫn không lặp trong tuần), và hiện thành hàng **"Bạn hay chọn"** một chạm khi chọn món cho một bữa.
- **Lặp lại thực đơn tuần trước**: một nút chép cả tuần trước sang tuần này (bỏ món không còn hợp hồ sơ, món đã bỏ, món bạn chấm 1 đến 2 sao; ô nào không chép được thì tự xếp bù).
- **Ngân sách thực tế**: ở tab Đi chợ bạn nhập số tiền đã chi thật (có thể gõ "180k"); không nhập thì mình tính từ giá các bữa đã nấu. Từ đó trang Thực đơn gợi ý **"Đặt ngân sách X đ/ngày?"** (làm tròn lên 5.000đ), bấm một lần là áp dụng, bấm "Để sau" thì không hỏi lại đúng mức đó.

### Nhiều đối tượng
- Chọn nhóm lúc bắt đầu hoặc trong Cài đặt > **Tôi là**: *Sinh viên* (≤ 20.000đ, ≤ 30 phút), *Người đi làm* (≤ 50.000đ, ≤ 30 phút, thực đơn tuần có cả bữa ăn ngoài), *Người lớn tuổi* (≤ 45 phút, nêm nhạt, **chữ to**, giờ ăn sớm hơn), *Ăn lành mạnh* (không đau dạ dày). Mỗi nhóm chỉ là **cài đặt sẵn**, vẫn đổi được từng mục; đổi nhóm có hộp xác nhận.
- **Chữ to** (Cài đặt > Cỡ chữ): mọi cỡ chữ tính theo rem nên tăng đồng loạt, đã kiểm tra không tràn ngang ở 360px.

### Nấu và mua
- **Thực đơn tuần**: tự xếp 21 bữa không lặp món theo hồ sơ, ngân sách và các giới hạn bạn đặt (thời gian, giá, độ khó, mức vị); ưu tiên món dùng đồ sắp hết hạn, món bạn chấm cao và món hay chọn. Mặc định chỉ xếp món nấu tại nhà; chọn **Cách ăn: Tất cả** (nhóm *Người đi làm* đã chọn sẵn) thì tuần có cả bữa ăn ngoài, bữa đó không tính vào danh sách đi chợ.
- **Danh sách đi chợ** = cần cho các bữa chưa nấu − đồ đang có trong tủ lạnh. Bấm "đã mua" thì cộng vào tủ lạnh. Có nút **Mua online** (mở trang tìm kiếm của Bách hoá Xanh, Shopee, Tiki, Lazada hoặc Google Maps).
- **Nấu từng bước** (`#cook-<mã món>`): chữ to, **đọc to** từng bước (giọng của trình duyệt), **hẹn giờ** tự nhận từ công thức ("12–15 phút"), điều khiển bằng giọng nói (thử nghiệm, Chrome/Edge), giữ màn hình sáng, nhãn hẹn giờ nổi khi sang trang khác.

### Trong mục "Thêm"
- **Tủ lạnh có số lượng và hạn dùng**: nhập nhanh bằng chữ ("trứng 6, gạo 1kg, bí đỏ 300g, tôm 200"), báo đồ hết hạn / sắp hết hạn / sắp hết, gợi ý **món nên nấu trước**, **nguyên liệu thay thế**. Đánh dấu "đã nấu" thì nguyên liệu tự trừ khỏi tủ.
- **Nhắc ăn đúng giờ**: nhắc **đi chợ** (tối hôm trước), **chuẩn bị nguyên liệu**, **bắt đầu nấu** (tính theo thời gian nấu của món để kịp giờ ăn) và **đến giờ ăn**; có "nhắc lại sau 10 phút", "đã ăn", "bỏ qua". Khoảng 45 phút sau khi bấm "Đã ăn", hỏi **bụng bạn thấy sao** để ghi nhật ký. Thông báo của trình duyệt (khi bạn cho phép) và **file lịch .ics 7 ngày** để điện thoại tự nhắc kể cả khi không mở trang. Chuông trên thanh trên cùng mở thẳng trang này.
- **Nhật ký ăn uống**: ghi cảm giác và triệu chứng sau mỗi bữa; thống kê 30 ngày chỉ ra món nên cẩn thận và món hợp với bạn.
- **Cộng đồng**: bảng tin (có thể gắn món, mỗi trang món có góc "mọi người nói gì"), **bảng xếp hạng** món được chốt. Mời bạn bè dùng thử (mở hộp chia sẻ hoặc sao chép lời mời).
- **Hồ sơ và cài đặt**, **Về dự án** (vấn đề, nguyên nhân gốc rễ, câu hỏi thiết kế, ai dùng được, việc làm được thật / chưa làm được).

### Cẩm nang
- Tra 69 nguyên liệu (nên dùng / dùng ít / nên tránh, kèm lý do), **kiểm tra công thức bất kỳ**, bảng thay thế, "Tưởng lành mà không lành", thói quen ăn uống, dấu hiệu cần đi khám ngay.
- Giao diện sáng / tối, **4 bộ màu** (Ngọc lam, Lá trà, Biển sâu, Mận chín), lưu dữ liệu trong trình duyệt (`localStorage`).

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
css/                  tokens (màu, chữ, chế độ tối, bộ màu) · base (kèm chữ to) · components · views
js/
  util.js             tiện ích (bỏ dấu, ngày tháng, sao chép...)
  icons.js            icon SVG + mascot "Bé Cháo"
  data/
    ingredients.js    nguyên liệu, giá ước tính, dụng cụ
    dishes.js         các món (công thức, mức dịu, độ khó, nguyên liệu chính, mức vị tính sẵn)
    guide.js          cẩm nang: nên/tránh, thay thế, cảnh báo, thói quen, tình trạng dạ dày, video
    extras.js         bộ màu, thang lọc, mức vị và ngưỡng khoá, nhóm người dùng, nguyên liệu thay thế, hạn dùng, gói thường mua, cửa hàng
  store.js            trạng thái, localStorage, lọc món, xếp thực đơn, thói quen, ngân sách thực tế, tủ lạnh, đi chợ, nhật ký
  ui.js               ô minh hoạ, sheet / hộp thoại, toast, hộp gập nhớ trạng thái
  wheel.js            vòng quay (SVG)
  sheets.js           bộ lọc, ghim lịch, chọn món, cài đặt, chào mừng 2 bước
  remind.js           lời nhắc ăn đúng giờ, hộp nhắc, file .ics
  pantry.js           tủ lạnh: giao diện, nhập nhanh, thay thế, mua online
  deck.js             vuốt chọn món
  cook.js             nấu từng bước: đọc to, hẹn giờ, giọng nói
  views-*.js          các màn hình (hôm nay, món ăn, thực đơn, cẩm nang, cộng đồng + nhật ký + xếp hạng, thêm + tủ lạnh + nhắc giờ, về dự án)
  app.js              điều hướng (hash) và khởi động
assets/favicon.svg
```

Các địa chỉ: `#home`, `#explore`, `#dish-<mã>`, `#cook-<mã>`, `#plan`, `#plan-shop`, `#guide…`, `#more`, `#fridge`, `#remind`, `#diary`, `#community`, `#rank`, `#about`. Địa chỉ cũ (`#plan-fridge`, `#plan-remind`, `#community-diary`, `#community-friends`) vẫn mở đúng trang.

Mã dùng script thường (không module) nên chạy được cả khi mở bằng `file://`.

## Thêm nội dung

- **Thêm món**: thêm một object vào `RAW` trong `js/data/dishes.js`. Chi phí, món chay, năng lượng, độ khó, nguyên liệu chính và mức vị được tính tự động từ `ing`; `base: 'com'` tự thêm gạo và bước nấu cơm mềm. Món ăn ngoài khai báo thêm `prot: [...]` cho nguyên liệu chính. Mức vị của món không được vượt `H.FLAVOR_CAPS[care]`.
- **Thêm nguyên liệu**: `js/data/ingredients.js` (đơn vị, giá, có phải đồ có sẵn trong bếp không), rồi thêm hạn dùng (`H.SHELF_DAYS`), gói thường mua (`H.PACK`), từ khoá nhập nhanh (`H.ING_ALIASES`) và đồ thay thế (`H.SUBS`) trong `extras.js`. Nếu là nguồn đạm mới, thêm vào `H.PROTEINS` (extras.js) và `PROTEIN_OF` (dishes.js).
- **Thêm nhóm người dùng**: `H.PERSONAS` trong `extras.js` (ngân sách và thời gian phải nằm trong `COST_STEPS` / `TIME_STEPS`; `text: 'large'` để bật chữ to, `salt: 1` để mặc định nêm nhạt).
- **Đổi bảng màu**: sửa `--p-base` và `--accent-base` trong `css/tokens.css`; mọi màu nền, chữ, viền đều sinh từ hai màu này (cả giao diện tối). Muốn thêm lựa chọn trong Cài đặt thì thêm vào `H.PALETTES` (extras.js) và một dòng `:root[data-palette="..."]` ở cuối tokens.css.
- **Thêm mục cẩm nang**: `H.FOODS` trong `js/data/guide.js`. `alias` là các cách gọi khác; "Kiểm tra công thức" dùng chính các alias này để nhận diện.
- **Thêm video chuyên gia**: điền `H.VIDEOS` trong `js/data/guide.js` (mẫu ở comment). Chỉ thêm video đã được kiểm duyệt nội dung.

## Hạn chế hiện tại và bước tiếp theo

Những thứ **chưa làm được vì cần máy chủ hoặc AI** (trang này chạy hoàn toàn trên máy người dùng nên không làm giả; các mục chỉ là chỗ giữ chỗ đã được bỏ khỏi giao diện):

- **Kết bạn, bài viết và bảng xếp hạng cho mọi người cùng thấy**: cần tài khoản đăng nhập, cơ sở dữ liệu (ví dụ Supabase hoặc Firebase) và kiểm duyệt nội dung. Hiện bài viết chỉ lưu trên máy người đăng, bảng xếp hạng "cộng đồng" là số liệu minh hoạ (có ghi chú trên giao diện).
- **Nhập nguyên liệu bằng ảnh / quét mã**: cần dịch vụ nhận diện hình ảnh. Hiện có nhập nhanh bằng chữ và chọn từ danh mục.
- **Nhắc đẩy khi đã đóng hẳn trình duyệt**: cần máy chủ gửi Web Push. Hiện nhắc khi tab còn mở, thông báo trình duyệt khi tab ở nền, và file lịch `.ics` cho điện thoại.
- **Đặt hàng tự động** trên sàn thương mại: hiện chỉ mở trang tìm kiếm của cửa hàng.
- **Giọng đọc và nhận giọng nói** phụ thuộc trình duyệt và thiết bị (một số máy chưa cài giọng tiếng Việt, iOS chưa hỗ trợ nghe liên tục).
- **Video chuyên gia**: mới có khung và các đường dẫn tìm kiếm YouTube. Cần danh sách video đã duyệt.
- **Hình món** đang dùng emoji trên ô màu. Có thể thay bằng ảnh thật (cần ảnh có bản quyền rõ ràng).
- **Nội dung y khoa** được viết theo các hướng dẫn dinh dưỡng phổ biến và ghi rõ chỗ các nguồn chưa thống nhất (sữa, gừng, chất xơ, hải sản, đậu hạt...). Cần bác sĩ hoặc chuyên gia dinh dưỡng thẩm định, nhất là phân loại "mức dịu" của từng món, ngưỡng khoá mức vị (`H.FLAVOR_CAPS`) và khoảng cách giữa các bữa được gợi ý. Nhóm "người lớn tuổi" và "ăn lành mạnh" mới là **cài đặt sẵn về ngân sách, thời gian và cỡ chữ**; chưa có thực đơn riêng theo bệnh nền khác (tiểu đường, huyết áp, gout...), nhu cầu năng lượng theo tuổi và giới tính.
- Giá nguyên liệu và kcal là **ước tính**, chưa lấy từ nguồn giá thực tế theo vùng. Số liệu thống kê trong nhật ký và gợi ý ngân sách chỉ là gợi ý từ dữ liệu của chính bạn, không phải kết luận y khoa.
- Chưa có tài khoản đăng nhập và đồng bộ giữa các thiết bị.

## Tham khảo

Các trang đã tham khảo khi viết cẩm nang:
[NIDDK: Eating, Diet & Nutrition for Peptic Ulcers](https://www.niddk.nih.gov/health-information/digestive-diseases/peptic-ulcers-stomach-ulcers/eating-diet-nutrition),
[Mayo Clinic: Gastritis](https://www.mayoclinic.org/diseases-conditions/gastritis/diagnosis-treatment/drc-20355813),
[Vinmec: Bị viêm dạ dày cấp nên ăn gì?](https://www.vinmec.com/vie/bai-viet/bi-viem-da-day-cap-nen-an-gi-vi),
[Vinmec: Lưu ý trong chế độ dinh dưỡng cho người viêm loét dạ dày](https://www.vinmec.com/vie/bai-viet/luu-y-trong-che-do-dinh-duong-cho-nguoi-viem-loet-da-day-tranh-tai-phat-vi),
[Nhà thuốc Long Châu](https://nhathuoclongchau.com.vn/bai-viet/nhung-thuc-pham-nen-va-khong-nen-su-dung-trong-che-do-an-cho-nguoi-viem-loet-da-day.html),
[Pharmacity](https://www.pharmacity.vn/che-do-an-uong-nguoi-viem-loet-da-day.htm).
