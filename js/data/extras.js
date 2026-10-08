/*
 * Dữ liệu bổ sung: bộ màu, thang lọc, mức gia vị, nguyên liệu thay thế, nhật ký, sắp xếp, liên kết mua hàng.
 */
(function (H) {
  'use strict';

  // ───────────── Bộ màu giao diện (xem css/tokens.css) ─────────────
  H.PALETTES = [
    { id: 'ngoc-lam', name: 'Ngọc lam', p: '#0E7C86', accent: '#FFC93C', bgLight: '#F0F7F8', bgDark: '#07181B' },
    { id: 'la-tra', name: 'Lá trà', p: '#2F7D4F', accent: '#F2C94C', bgLight: '#F2F7F4', bgDark: '#0A1816' },
    { id: 'bien-sau', name: 'Biển sâu', p: '#2F5DA8', accent: '#FFC857', bgLight: '#F2F5FA', bgDark: '#0A151E' },
    { id: 'man-chin', name: 'Mận chín', p: '#8E3A8C', accent: '#FFC857', bgLight: '#F8F3F8', bgDark: '#12121B' }
  ];

  // ───────────── Các thang lọc ─────────────
  // Thời gian nấu tối đa (phút). 0 = không giới hạn.
  H.TIME_STEPS = [0, 5, 10, 15, 20, 30, 45, 60];
  // Ngân sách tối đa cho 1 bữa (đồng). 0 = không giới hạn.
  H.COST_STEPS = [0, 6000, 10000, 15000, 20000, 30000, 50000];

  // Độ khó của món (xem finishFilters trong dishes.js)
  H.LEVELS = [
    { id: 1, name: 'Rất dễ', hint: 'Tối đa 3 bước, không quá 15 phút' },
    { id: 2, name: 'Dễ', hint: 'Vài bước, dưới 45 phút' },
    { id: 3, name: 'Công phu', hint: 'Nhiều bước hoặc nấu từ 45 phút' }
  ];

  H.PROTEINS = [
    { id: 'ga', name: 'Gà', emoji: '🍗' },
    { id: 'heo', name: 'Thịt heo', emoji: '🥩' },
    { id: 'bo', name: 'Thịt bò', emoji: '🍖' },
    { id: 'ca', name: 'Cá', emoji: '🐟' },
    { id: 'trung', name: 'Trứng', emoji: '🥚' },
    { id: 'dauhu', name: 'Đậu hũ', emoji: '🫘' }
  ];

  // ───────────── Thang mức gia vị (khoá theo bệnh lý) ─────────────
  // Mỗi thang có 4 mức 0 đến 3. Mức tối đa được phép phụ thuộc "mức dịu" cho phép của hồ sơ (1, 2, 3).
  H.FLAVORS = [
    { id: 'cay', name: 'Cay', emoji: '🌶️', levels: ['Không cay', 'Cay rất nhẹ', 'Cay vừa', 'Cay nhiều'],
      why: 'Chất cay hay làm rát và đau niêm mạc dạ dày.' },
    { id: 'man', name: 'Mặn', emoji: '🧂', levels: ['Không nêm', 'Nhạt', 'Vừa', 'Đậm'],
      why: 'Ăn mặn thường xuyên không tốt cho niêm mạc dạ dày.' },
    { id: 'chua', name: 'Chua', emoji: '🍋', levels: ['Không chua', 'Chua nhẹ', 'Chua vừa', 'Chua nhiều'],
      why: 'Vị chua (axit) làm tăng cảm giác rát, ợ chua.' },
    { id: 'beo', name: 'Béo (dầu mỡ)', emoji: '🫒', levels: ['Không dầu mỡ', 'Rất ít dầu', 'Vừa', 'Nhiều'],
      why: 'Món nhiều dầu mỡ làm dạ dày phải làm việc lâu, dễ ợ nóng.' }
  ];
  // Mức vị tối đa được phép theo mức "dịu" (care) mà hồ sơ dạ dày cho phép. Cao hơn mức này bị khoá trên giao diện.
  // Mọi món có care = c đều có mức vị không vượt quá FLAVOR_CAPS[c] (kiểm tra trong test).
  H.FLAVOR_CAPS = {
    1: { cay: 0, man: 1, chua: 0, beo: 1 },
    2: { cay: 1, man: 2, chua: 0, beo: 1 },
    3: { cay: 1, man: 2, chua: 1, beo: 2 }
  };

  // ───────────── Nguyên liệu thay thế khi thiếu hoặc phải kiêng ─────────────
  // [mã nguyên liệu thay thế, ghi chú ngắn]
  H.SUBS = {
    'uc-ga': [['thit-nac', 'thịt nạc heo cũng được'], ['dau-hu', 'đậu hũ nếu muốn món chay']],
    'thit-nac': [['uc-ga', 'ức gà băm'], ['dau-hu', 'đậu hũ nếu muốn món chay']],
    'thit-bo-nac': [['uc-ga', 'ức gà nhẹ bụng và rẻ hơn'], ['thit-nac', 'thịt nạc heo']],
    'ca-phi-le': [['dau-hu', 'đậu hũ non hấp'], ['uc-ga', 'ức gà luộc']],
    'trung-ga': [['dau-hu', 'đậu hũ non thay đạm']],
    'dau-hu': [['trung-ga', 'trứng hấp'], ['thit-nac', 'thịt nạc băm']],
    'bi-xanh': [['su-su', 'su su nấu mềm'], ['muop', 'mướp']],
    'su-su': [['bi-xanh', 'bí xanh'], ['muop', 'mướp']],
    'muop': [['bi-xanh', 'bí xanh'], ['su-su', 'su su']],
    'bi-do': [['ca-rot', 'cà rốt nấu nhừ'], ['khoai-lang', 'khoai lang']],
    'ca-rot': [['bi-do', 'bí đỏ nấu nhừ']],
    'bap-cai': [['su-su', 'su su ít gây đầy hơi hơn'], ['bi-xanh', 'bí xanh']],
    'cai-ngot': [['bap-cai', 'bắp cải nấu mềm'], ['bi-xanh', 'bí xanh']],
    'bong-cai': [['bi-do', 'bí đỏ hấp'], ['ca-rot', 'cà rốt hấp']],
    'nam': [['dau-hu', 'đậu hũ'], ['ca-rot', 'cà rốt thái nhỏ']],
    'khoai-tay': [['khoai-lang', 'khoai lang hấp'], ['bi-do', 'bí đỏ']],
    'khoai-lang': [['khoai-tay', 'khoai tây hấp']],
    'ca-chua': [['ca-rot', 'cà rốt + bí đỏ nấu nhừ, không chua'], ['bi-do', 'bí đỏ nghiền']],
    'dua-leo': [['ca-rot', 'cà rốt luộc']],
    'mien-dong': [['banh-pho', 'bánh phở'], ['nui', 'nui']],
    'banh-pho': [['mien-dong', 'miến dong'], ['nui', 'nui']],
    'nui': [['mien-dong', 'miến dong'], ['banh-pho', 'bánh phở']],
    'chuoi': [['du-du', 'đu đủ chín'], ['tao', 'táo hấp']],
    'du-du': [['chuoi', 'chuối chín'], ['tao', 'táo hấp']],
    'tao': [['chuoi', 'chuối chín'], ['du-du', 'đu đủ chín']],
    'sua-chua': [['chuoi', 'chuối chín']],
    'sua-dau-nanh': [['gao', 'nước gạo rang ấm']],
    'yen-mach': [['gao', 'cháo trắng']],
    'hanh-la': [['rau-thom', 'bỏ cũng được, món vẫn thơm nhờ nước luộc']],
    'gung': [['hanh-la', 'bỏ hẳn gừng nếu thấy nóng rát']],
    'rau-thom': [['hanh-la', 'bỏ cũng được']]
  };

  // Hạn dùng ước tính (ngày) khi để trong tủ lạnh. 0 = để lâu, không cần theo dõi.
  H.SHELF_DAYS = {
    'gao': 0, 'yen-mach': 0, 'nui': 0, 'banh-quy-lat': 0, 'mien-dong': 0,
    'banh-mi-sw': 3, 'banh-pho': 2, 'khoai-tay': 14, 'khoai-lang': 10,
    'uc-ga': 2, 'thit-nac': 2, 'thit-bo-nac': 2, 'ca-phi-le': 2, 'trung-ga': 21, 'dau-hu': 3,
    'bi-do': 14, 'bi-xanh': 7, 'ca-rot': 14, 'su-su': 7, 'muop': 4, 'bap-cai': 7, 'cai-ngot': 3, 'bong-cai': 4,
    'nam': 4, 'ca-chua': 5, 'dua-leo': 5, 'hanh-la': 4, 'rau-thom': 3, 'gung': 14,
    'chuoi': 3, 'du-du': 3, 'tao': 10, 'sua-dau-nanh': 90, 'sua-chua': 10
  };

  // Gói thường mua cho từng nguyên liệu: qty = lượng mặc định khi bấm thêm vào tủ lạnh, low = dưới mức này thì báo "sắp hết",
  // step = bước tăng giảm khi bấm + / −. Đơn vị theo H.INGREDIENTS (g, quả, lát, hộp, miếng).
  H.PACK = {
    'gao': { qty: 1000, low: 200, step: 100 }, 'yen-mach': { qty: 400, low: 80, step: 50 }, 'banh-mi-sw': { qty: 10, low: 2, step: 1 },
    'khoai-tay': { qty: 500, low: 150, step: 100 }, 'khoai-lang': { qty: 500, low: 150, step: 100 }, 'mien-dong': { qty: 200, low: 50, step: 50 },
    'banh-pho': { qty: 300, low: 100, step: 100 }, 'nui': { qty: 400, low: 100, step: 50 }, 'banh-quy-lat': { qty: 10, low: 2, step: 1 },
    'uc-ga': { qty: 300, low: 100, step: 50 }, 'thit-nac': { qty: 300, low: 100, step: 50 }, 'thit-bo-nac': { qty: 200, low: 80, step: 50 },
    'ca-phi-le': { qty: 300, low: 100, step: 50 }, 'trung-ga': { qty: 6, low: 2, step: 1 }, 'dau-hu': { qty: 300, low: 80, step: 50 },
    'bi-do': { qty: 500, low: 150, step: 100 }, 'bi-xanh': { qty: 500, low: 150, step: 100 }, 'ca-rot': { qty: 300, low: 80, step: 50 },
    'su-su': { qty: 300, low: 80, step: 50 }, 'muop': { qty: 300, low: 80, step: 50 }, 'bap-cai': { qty: 400, low: 100, step: 100 },
    'cai-ngot': { qty: 300, low: 80, step: 50 }, 'bong-cai': { qty: 300, low: 80, step: 50 }, 'nam': { qty: 200, low: 50, step: 50 },
    'ca-chua': { qty: 3, low: 1, step: 1 }, 'dua-leo': { qty: 300, low: 80, step: 50 }, 'hanh-la': { qty: 50, low: 10, step: 10 },
    'rau-thom': { qty: 30, low: 10, step: 10 }, 'gung': { qty: 50, low: 10, step: 10 },
    'chuoi': { qty: 5, low: 1, step: 1 }, 'du-du': { qty: 400, low: 100, step: 100 }, 'tao': { qty: 3, low: 1, step: 1 },
    'sua-dau-nanh': { qty: 4, low: 1, step: 1 }, 'sua-chua': { qty: 4, low: 1, step: 1 }
  };
  H.packOf = function (id) {
    return H.PACK[id] || { qty: 1, low: 0, step: 1 };
  };

  // Từ khoá nhận diện nguyên liệu khi nhập nhanh bằng chữ ("trứng 6, gạo 1kg, bí đỏ").
  H.ING_ALIASES = {
    'gao': ['gạo'], 'yen-mach': ['yến mạch'], 'banh-mi-sw': ['bánh mì sandwich', 'bánh mì', 'sandwich'],
    'khoai-tay': ['khoai tây'], 'khoai-lang': ['khoai lang'], 'mien-dong': ['miến dong', 'miến'],
    'banh-pho': ['bánh phở', 'phở'], 'nui': ['nui'], 'banh-quy-lat': ['bánh quy lạt', 'cracker'],
    'uc-ga': ['ức gà', 'thịt gà', 'gà'], 'thit-nac': ['thịt nạc', 'thịt heo', 'thịt băm', 'thịt xay', 'thịt'],
    'thit-bo-nac': ['thịt bò', 'bò'], 'ca-phi-le': ['cá phi lê', 'cá basa', 'cá diêu hồng', 'cá'],
    'trung-ga': ['trứng gà', 'trứng'], 'dau-hu': ['đậu hũ', 'đậu phụ', 'tàu hũ'],
    'bi-do': ['bí đỏ', 'bí ngô'], 'bi-xanh': ['bí xanh', 'bí đao'], 'ca-rot': ['cà rốt'], 'su-su': ['su su'],
    'muop': ['mướp'], 'bap-cai': ['bắp cải', 'cải bắp'], 'cai-ngot': ['cải ngọt'], 'bong-cai': ['bông cải', 'súp lơ'],
    'nam': ['nấm'], 'ca-chua': ['cà chua'], 'dua-leo': ['dưa leo', 'dưa chuột'], 'hanh-la': ['hành lá'],
    'rau-thom': ['rau thơm', 'ngò', 'húng quế'], 'gung': ['gừng'], 'chuoi': ['chuối'], 'du-du': ['đu đủ'],
    'tao': ['táo'], 'sua-dau-nanh': ['sữa đậu nành'], 'sua-chua': ['sữa chua']
  };

  // ───────────── Sắp xếp danh sách món ─────────────
  H.SORTS = [
    { id: 'hop', label: 'Hợp nhất', hint: 'Món dịu trước' },
    { id: 'gia', label: 'Rẻ nhất', hint: 'Giá tăng dần' },
    { id: 'nhanh', label: 'Nhanh nhất', hint: 'Thời gian nấu tăng dần' },
    { id: 'kcal', label: 'Ít kcal', hint: 'Năng lượng tăng dần' },
    { id: 'sao', label: 'Được chấm cao', hint: 'Số sao giảm dần' },
    { id: 'han', label: 'Dùng đồ sắp hết hạn', hint: 'Món dùng nguyên liệu sắp hết hạn trước' }
  ];

  // ───────────── Nhật ký ăn uống ─────────────
  H.FEELS = [
    { id: 1, emoji: '😊', label: 'Rất ổn' },
    { id: 2, emoji: '🙂', label: 'Ổn' },
    { id: 3, emoji: '😕', label: 'Hơi khó chịu' },
    { id: 4, emoji: '😣', label: 'Đau, khó chịu nhiều' }
  ];
  H.SYMPTOMS = ['Ợ chua', 'Đầy bụng', 'Buồn nôn', 'Đau rát', 'Xót ruột', 'Khó tiêu'];

  // ───────────── Mua online (chỉ là liên kết tìm kiếm, chưa kết nối đặt hàng) ─────────────
  H.STORES = [
    { id: 'shopee', name: 'Shopee', url: function (q) { return 'https://shopee.vn/search?keyword=' + encodeURIComponent(q); } },
    { id: 'tiki', name: 'Tiki', url: function (q) { return 'https://tiki.vn/search?q=' + encodeURIComponent(q); } },
    { id: 'lazada', name: 'Lazada', url: function (q) { return 'https://www.lazada.vn/catalog/?q=' + encodeURIComponent(q); } },
    { id: 'bhx', name: 'Bách hoá Xanh', url: function (q) { return 'https://www.bachhoaxanh.com/tim-kiem?key=' + encodeURIComponent(q); } },
    { id: 'maps', name: 'Cửa hàng gần bạn (Google Maps)', url: function (q) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q + ' gần đây'); } }
  ];
})(window.HNAG = window.HNAG || {});
