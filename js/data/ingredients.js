/*
 * Danh mục nguyên liệu dùng trong công thức, danh sách đi chợ và "Tủ lạnh".
 *
 *  - unit  : đơn vị tính của số lượng trong công thức
 *  - price : giá ước tính (đồng) cho 1 đơn vị, theo giá chợ / siêu thị mini ở thành phố lớn.
 *            Chỉ để ước lượng chi phí, giá thực tế thay đổi theo khu vực và mùa vụ.
 *  - staple: đồ có sẵn trong bếp (muối, đường, dầu ăn...). Không tính tiền, không đưa vào danh sách đi chợ.
 *  - animal: 'meat' (thịt / cá), 'egg', 'dairy' để tự suy ra món chay.
 */
(function (H) {
  'use strict';

  // buy: mẹo chọn mua, hiện trong phần "Đi chợ cho món này" ở trang từng món.
  H.CATEGORIES = [
    { id: 'tinhbot', name: 'Tinh bột', emoji: '🍚', buy: 'Gạo, nui: xem hạn dùng, bao bì kín. Bún, bánh phở, bánh canh tươi nên mua trong ngày. Khoai chọn củ chắc, không mọc mầm.' },
    { id: 'dam', name: 'Đạm', emoji: '🍗', buy: 'Thịt nạc màu hồng tươi, không mùi lạ. Cá thịt chắc, mắt trong. Tôm vỏ cứng, không nhớt. Trứng vỏ sạch, không nứt. Đậu hũ còn hạn, không chua.' },
    { id: 'rau', name: 'Rau củ', emoji: '🥬', buy: 'Chọn rau lá non, xanh, không dập úa. Bí, bầu, mướp chọn quả non, vỏ mịn. Cà rốt chắc tay, không héo.' },
    { id: 'traicay', name: 'Trái cây', emoji: '🍌', buy: 'Chọn quả chín vừa, không dập, không thâm. Táo chọn quả chắc tay.' },
    { id: 'khac', name: 'Sữa & khác', emoji: '🥛', buy: 'Sữa đậu nành, sữa chua: xem hạn dùng, chọn loại ít đường hoặc không đường.' },
    { id: 'giavi', name: 'Gia vị cơ bản', emoji: '🧂', buy: '' }
  ];

  H.INGREDIENTS = {
    // Tinh bột
    'gao': { name: 'Gạo', emoji: '🍚', cat: 'tinhbot', unit: 'g', price: 22 },
    'yen-mach': { name: 'Yến mạch cán dẹt', emoji: '🌾', cat: 'tinhbot', unit: 'g', price: 90 },
    'banh-mi-sw': { name: 'Bánh mì sandwich', emoji: '🍞', cat: 'tinhbot', unit: 'lát', price: 1500 },
    'khoai-tay': { name: 'Khoai tây', emoji: '🥔', cat: 'tinhbot', unit: 'g', price: 30 },
    'khoai-lang': { name: 'Khoai lang', emoji: '🍠', cat: 'tinhbot', unit: 'g', price: 25 },
    'mien-dong': { name: 'Miến dong (khô)', emoji: '🍜', cat: 'tinhbot', unit: 'g', price: 90 },
    'banh-pho': { name: 'Bánh phở tươi', emoji: '🍜', cat: 'tinhbot', unit: 'g', price: 25 },
    'nui': { name: 'Nui', emoji: '🍝', cat: 'tinhbot', unit: 'g', price: 40 },
    'banh-quy-lat': { name: 'Bánh quy lạt', emoji: '🍘', cat: 'tinhbot', unit: 'miếng', price: 600 },
    'bun': { name: 'Bún tươi', emoji: '🍜', cat: 'tinhbot', unit: 'g', price: 20 },
    'banh-canh': { name: 'Bánh canh (sợi tươi)', emoji: '🍜', cat: 'tinhbot', unit: 'g', price: 25 },
    'khoai-mon': { name: 'Khoai môn', emoji: '🥔', cat: 'tinhbot', unit: 'g', price: 30 },
    'dau-xanh': { name: 'Đậu xanh bóc vỏ', emoji: '🫘', cat: 'tinhbot', unit: 'g', price: 55 },
    'bap-ngo': { name: 'Ngô ngọt (hạt)', emoji: '🌽', cat: 'tinhbot', unit: 'g', price: 35 },

    // Đạm
    'uc-ga': { name: 'Ức gà phi lê', emoji: '🍗', cat: 'dam', unit: 'g', price: 85, animal: 'meat' },
    'thit-nac': { name: 'Thịt nạc heo (thăn / xay)', emoji: '🥩', cat: 'dam', unit: 'g', price: 125, animal: 'meat' },
    'thit-bo-nac': { name: 'Thịt bò nạc', emoji: '🍖', cat: 'dam', unit: 'g', price: 250, animal: 'meat' },
    'ca-phi-le': { name: 'Cá phi lê (basa, diêu hồng)', emoji: '🐟', cat: 'dam', unit: 'g', price: 95, animal: 'meat' },
    'tom': { name: 'Tôm thẻ (bóc vỏ)', emoji: '🦐', cat: 'dam', unit: 'g', price: 190, animal: 'meat' },
    'trung-ga': { name: 'Trứng gà', emoji: '🥚', cat: 'dam', unit: 'quả', price: 3500, animal: 'egg' },
    'dau-hu': { name: 'Đậu hũ non', emoji: '🫘', cat: 'dam', unit: 'g', price: 40 },

    // Rau củ
    'bi-do': { name: 'Bí đỏ', emoji: '🎃', cat: 'rau', unit: 'g', price: 25 },
    'bi-xanh': { name: 'Bí xanh (bí đao)', emoji: '🥒', cat: 'rau', unit: 'g', price: 20 },
    'ca-rot': { name: 'Cà rốt', emoji: '🥕', cat: 'rau', unit: 'g', price: 25 },
    'su-su': { name: 'Su su', emoji: '🥬', cat: 'rau', unit: 'g', price: 20 },
    'muop': { name: 'Mướp', emoji: '🌿', cat: 'rau', unit: 'g', price: 25 },
    'bau': { name: 'Bầu', emoji: '🥒', cat: 'rau', unit: 'g', price: 20 },
    'mong-toi': { name: 'Mồng tơi', emoji: '🥬', cat: 'rau', unit: 'g', price: 25 },
    'rau-ngot': { name: 'Rau ngót', emoji: '🌿', cat: 'rau', unit: 'g', price: 30 },
    'bap-cai': { name: 'Bắp cải', emoji: '🥬', cat: 'rau', unit: 'g', price: 20 },
    'cai-ngot': { name: 'Cải ngọt', emoji: '🥬', cat: 'rau', unit: 'g', price: 25 },
    'bong-cai': { name: 'Bông cải xanh', emoji: '🥦', cat: 'rau', unit: 'g', price: 45 },
    'nam': { name: 'Nấm (rơm, mỡ)', emoji: '🍄', cat: 'rau', unit: 'g', price: 90 },
    'ca-chua': { name: 'Cà chua chín', emoji: '🍅', cat: 'rau', unit: 'quả', price: 3000 },
    'dua-leo': { name: 'Dưa leo', emoji: '🥒', cat: 'rau', unit: 'g', price: 20 },
    'hanh-la': { name: 'Hành lá', emoji: '🌱', cat: 'rau', unit: 'g', price: 40 },
    'rau-thom': { name: 'Rau thơm (ngò, húng)', emoji: '🌿', cat: 'rau', unit: 'g', price: 50 },
    'gung': { name: 'Gừng', emoji: '🫚', cat: 'rau', unit: 'g', price: 40 },

    // Trái cây
    'chuoi': { name: 'Chuối chín', emoji: '🍌', cat: 'traicay', unit: 'quả', price: 3000 },
    'du-du': { name: 'Đu đủ chín', emoji: '🥭', cat: 'traicay', unit: 'g', price: 20 },
    'tao': { name: 'Táo', emoji: '🍎', cat: 'traicay', unit: 'quả', price: 10000 },

    // Sữa & khác
    'sua-dau-nanh': { name: 'Sữa đậu nành (hộp 180ml)', emoji: '🥛', cat: 'khac', unit: 'hộp', price: 6000 },
    'sua-chua': { name: 'Sữa chua không đường', emoji: '🥛', cat: 'khac', unit: 'hộp', price: 7000, animal: 'dairy' },

    // Gia vị cơ bản (đồ có sẵn)
    'muoi': { name: 'Muối', emoji: '🧂', cat: 'giavi', unit: 'thìa cà phê', price: 0, staple: true },
    'duong': { name: 'Đường', emoji: '🧂', cat: 'giavi', unit: 'thìa cà phê', price: 0, staple: true },
    'dau-an': { name: 'Dầu ăn', emoji: '🫒', cat: 'giavi', unit: 'thìa cà phê', price: 0, staple: true },
    'nuoc-mam': { name: 'Nước mắm', emoji: '🧂', cat: 'giavi', unit: 'thìa cà phê', price: 0, staple: true },
    'nuoc-tuong': { name: 'Nước tương', emoji: '🧂', cat: 'giavi', unit: 'thìa cà phê', price: 0, staple: true }
  };

  // Dụng cụ nấu: nhiều bếp nhỏ (nhà trọ, căn hộ) chỉ có một vài món, nên cho người dùng chọn.
  H.TOOLS = [
    { id: 'noi-com', name: 'Nồi cơm điện', emoji: '🍚' },
    { id: 'bep', name: 'Bếp + nồi', emoji: '🔥' },
    { id: 'chao', name: 'Chảo chống dính', emoji: '🍳' },
    { id: 'vi-song', name: 'Lò vi sóng', emoji: '📟' }
  ];
})(window.HNAG = window.HNAG || {});
