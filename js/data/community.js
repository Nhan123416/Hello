/*
 * Bài mẫu cho Cộng đồng: vài đánh giá kèm tranh minh hoạ do nhóm làm web viết để màn Cộng đồng không trống (giống bản đầu).
 * Mỗi bài có nhãn "Bài mẫu" và gọi theo nhóm người dùng, KHÔNG phải lời kể hay ảnh chụp của người dùng thật; ảnh là tranh vẽ bằng SVG
 * ngay trong mã (không cần tải file) và người dùng ẩn được tất cả bài mẫu.
 *
 * Muốn dùng ảnh chụp của nhóm: đặt ảnh trong assets/community/ rồi ghi đường dẫn vào trường `img` (ví dụ img: 'assets/community/chao-ga.jpg');
 * khi có `img` thì không dùng `art` và nhãn trên ảnh đổi thành "Ảnh của nhóm". Khi đã có cộng đồng thật thì để mảng H.COMMUNITY_SEED rỗng.
 */
(function (H) {
  'use strict';

  // who: mã nhóm người dùng (H.PERSONAS). art: tên tranh minh hoạ bên dưới. Bài không có art và img thì chỉ có chữ.
  H.COMMUNITY_SEED = [
    { id: 'mau-1', who: 'sv', dish: 'chao-ga', stars: 5, art: 'chao-ga',
      text: 'Nấu một nồi vào tối chủ nhật, chia hộp bỏ tủ lạnh rồi hâm lại ăn trong hai ba ngày. Ăn ấm, xé gà nhỏ cho dễ nuốt, ăn xong thấy dễ chịu.' },
    { id: 'mau-2', who: 'dilam', dish: 'canh-bi-xanh-thit-bam', stars: 4, art: 'canh-bi',
      text: 'Khoảng nửa tiếng là xong cả cơm lẫn canh, hợp bữa tối nhẹ bụng. Mình chỉ rắc hành lá, không phi hành cho canh bớt béo.' },
    { id: 'mau-3', who: 'caotuoi', dish: 'ca-hap-gung-hanh', stars: 4, art: 'ca-hap',
      text: 'Cá hấp mềm, dễ nhai. Gừng thái sợi nhỏ, nêm nhạt, cả nhà ăn vừa miệng.' },
    { id: 'mau-4', who: 'khoe', dish: 'com-ga-luoc-rau-cu', stars: 5, art: 'com-ga',
      text: 'Gà luộc xong để nguội bớt rồi mới xé thì thịt giữ được độ mềm ngọt. Nước luộc nấu thêm canh rau củ, vừa ngọt vừa nhẹ.' },
    { id: 'mau-5', who: 'sv', dish: 'chao-bi-do-dau-hu', stars: 4, art: 'chao-bi-do',
      text: 'Rẻ mà đủ no, nấu bằng nồi cơm điện cũng được. Bí đỏ nhừ nên cháo tự ngọt, không cần nêm nhiều.' },
    { id: 'mau-6', who: 'caotuoi', dish: 'yen-mach-chuoi', stars: 3, art: '',
      text: 'Hơi ngọt với mình, lần sau mình giảm bớt chuối. Bữa sáng ăn nhanh, không phải đứng bếp lâu.' }
  ];

  H.sampleById = function (id) { return H.COMMUNITY_SEED.filter(function (s) { return s.id === id; })[0] || null; };

  // ───────────── tranh minh hoạ (SVG 640x480, vẽ phẳng, màu hợp tông lá trà) ─────────────
  // Tạo số ngẫu nhiên cố định theo hạt giống để mỗi lần vẽ ra đúng một bức tranh.
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function f(n) { return Math.round(n * 10) / 10; }

  var BG = {
    wood: '<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DDB784"/><stop offset="1" stop-color="#B98650"/></linearGradient></defs>' +
      '<rect width="640" height="480" fill="url(#bg)"/>' +
      '<g stroke="#8F6234" stroke-opacity=".28" stroke-width="3"><path d="M0 118H640M0 236H640M0 354H640"/></g>' +
      '<g stroke="#8F6234" stroke-opacity=".12" stroke-width="2" fill="none"><path d="M40 40q120-14 250 0t300 4M20 160q160 12 300 0t300 6M60 290q140-12 260 2t260-4M30 410q150 14 290 0t290 6"/></g>',
    linen: '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3EDDC"/><stop offset="1" stop-color="#E4DAC0"/></linearGradient>' +
      '<pattern id="ln" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 7H14M7 0V14" stroke="#CFC3A2" stroke-opacity=".35" stroke-width="1.2"/></pattern></defs>' +
      '<rect width="640" height="480" fill="url(#bg)"/><rect width="640" height="480" fill="url(#ln)"/>',
    slate: '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D4DCD5"/><stop offset="1" stop-color="#B5C2B8"/></linearGradient></defs>' +
      '<rect width="640" height="480" fill="url(#bg)"/>' +
      '<g stroke="#8FA095" stroke-opacity=".25" stroke-width="2" fill="none"><path d="M0 90Q160 70 320 92T640 80M0 400Q180 380 330 402T640 392"/></g>'
  };

  function steam(x, y) {
    var s = '';
    [[-26, 0], [0, -10], [26, 0]].forEach(function (d) {
      s += '<path d="M' + (x + d[0]) + ' ' + (y + d[1]) + 'c-12-18 12-30 0-48s12-30 0-48" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="7" stroke-linecap="round"/>';
    });
    return s;
  }

  // Cái bát nhìn chếch từ trên: cx, cy là tâm miệng bát; trả về lớp vẽ thân bát và miệng. Thức ăn vẽ lên trên bằng bowlFood().
  function bowlBack(cx, cy, rx, ry, depth) {
    return '<defs><linearGradient id="bw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E4ECE6"/><stop offset=".45" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D3DED6"/></linearGradient>' +
      '<filter id="bl" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="9"/></filter></defs>' +
      '<ellipse cx="' + cx + '" cy="' + f(cy + depth + 6) + '" rx="' + f(rx * 0.92) + '" ry="' + f(ry * 0.62) + '" fill="#2A1A08" opacity=".3" filter="url(#bl)"/>' +
      '<path d="M' + f(cx - rx * 0.3) + ' ' + f(cy + depth - 10) + 'h' + f(rx * 0.6) + 'v14q0 8-8 8h' + f(-rx * 0.6 + 16) + 'q-8 0-8-8z" fill="#CFDBD2"/>' +
      '<path d="M' + (cx - rx) + ' ' + cy + 'C' + (cx - rx) + ' ' + f(cy + depth * 0.95) + ' ' + f(cx - rx * 0.45) + ' ' + (cy + depth) + ' ' + cx + ' ' + (cy + depth) + 'S' + (cx + rx) + ' ' + f(cy + depth * 0.95) + ' ' + (cx + rx) + ' ' + cy + 'Z" fill="url(#bw)"/>' +
      '<path d="M' + f(cx - rx * 0.9) + ' ' + f(cy + depth * 0.34) + 'Q' + cx + ' ' + f(cy + depth * 0.7) + ' ' + f(cx + rx * 0.9) + ' ' + f(cy + depth * 0.34) + '" fill="none" stroke="#6F9A55" stroke-width="9" stroke-linecap="round" opacity=".9"/>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#FBFAF5" stroke="#DAD7CB" stroke-width="3"/>' +
      '<ellipse cx="' + cx + '" cy="' + f(cy + 3) + '" rx="' + f(rx * 0.92) + '" ry="' + f(ry * 0.88) + '" fill="#E7E3D7"/>';
  }
  // Mặt thức ăn trong bát: gradient từ a sang b.
  function bowlFood(cx, cy, rx, ry, a, b) {
    return '<defs><radialGradient id="fd" cx=".45" cy=".4" r=".75"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></radialGradient>' +
      '<clipPath id="fc"><ellipse cx="' + cx + '" cy="' + f(cy + 4) + '" rx="' + f(rx * 0.86) + '" ry="' + f(ry * 0.8) + '"/></clipPath></defs>' +
      '<ellipse cx="' + cx + '" cy="' + f(cy + 4) + '" rx="' + f(rx * 0.86) + '" ry="' + f(ry * 0.8) + '" fill="url(#fd)"/>';
  }
  function spoon(x, y, rot) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')"><rect x="-7" y="10" width="14" height="150" rx="7" fill="#F2EFE6" stroke="#D6D2C4" stroke-width="2"/>' +
      '<ellipse cx="0" cy="0" rx="30" ry="42" fill="#F7F5EE" stroke="#D6D2C4" stroke-width="2"/><ellipse cx="0" cy="4" rx="22" ry="32" fill="#E9E5D8"/></g>';
  }
  function rings(r, n, cx, cy, rx, ry, color, size) {
    var s = '';
    for (var i = 0; i < n; i++) {
      var a = r() * Math.PI * 2, d = Math.sqrt(r());
      s += '<circle cx="' + f(cx + Math.cos(a) * rx * d) + '" cy="' + f(cy + Math.sin(a) * ry * d) + '" r="' + f(size * (0.7 + r() * 0.5)) + '" fill="none" stroke="' + color + '" stroke-width="' + f(size * 0.55) + '"/>';
    }
    return s;
  }

  var ART = {
    // Bát cháo gà xé: cháo trắng, gà xé sợi, hành lá
    'chao-ga': function () {
      var r = rng(11), s = BG.linen + bowlBack(320, 214, 206, 76, 150) + bowlFood(320, 214, 206, 76, '#FFF8E4', '#EFE1B9');
      s += '<g clip-path="url(#fc)">';
      for (var i = 0; i < 7; i++) s += '<path d="M' + f(170 + r() * 80) + ' ' + f(190 + i * 12) + 'q' + f(60 + r() * 60) + ' ' + f(-8 + r() * 16) + ' ' + f(120 + r() * 80) + ' 0" fill="none" stroke="#E6D4A4" stroke-width="3" stroke-opacity=".7" stroke-linecap="round"/>';
      for (var k = 0; k < 34; k++) {
        var x = 300 + r() * 150, y = 190 + r() * 60, w = 40 + r() * 46;
        s += '<path d="M' + f(x) + ' ' + f(y) + 'q' + f(w * 0.4) + ' ' + f(-12 + r() * 20) + ' ' + f(w) + ' ' + f(-6 + r() * 12) + '" fill="none" stroke="' + (k % 3 ? '#E8C79A' : '#D4A66B') + '" stroke-width="' + f(4 + r() * 3) + '" stroke-linecap="round"/>';
      }
      s += rings(r, 26, 320, 218, 150, 44, '#5E9B3C', 6);
      s += '</g>' + spoon(528, 128, 28) + steam(300, 120);
      return s;
    },
    // Bát canh bí xanh: nước canh trong, bí xanh cắt miếng, thịt bằm viên nhỏ
    'canh-bi': function () {
      var r = rng(23), s = BG.wood + bowlBack(320, 220, 200, 74, 146) + bowlFood(320, 220, 200, 74, '#F6EEBF', '#E4D68A');
      s += '<g clip-path="url(#fc)">';
      for (var i = 0; i < 9; i++) {
        var x = 190 + r() * 250, y = 188 + r() * 62, a = r() * 360, w = 34 + r() * 14;
        s += '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(a) + ')"><rect x="' + f(-w / 2) + '" y="-14" width="' + f(w) + '" height="28" rx="9" fill="#D6EBB6" stroke="#9CCB74" stroke-width="3"/><path d="M' + f(-w / 2 + 7) + ' 0h' + f(w - 14) + '" stroke="#B6DB92" stroke-width="3" stroke-linecap="round"/><circle cx="' + f(-w / 5) + '" cy="-4" r="2" fill="#8DBB68"/><circle cx="' + f(w / 5) + '" cy="4" r="2" fill="#8DBB68"/></g>';
      }
      for (var m = 0; m < 12; m++) s += '<ellipse cx="' + f(200 + r() * 240) + '" cy="' + f(190 + r() * 62) + '" rx="' + f(8 + r() * 5) + '" ry="' + f(6 + r() * 4) + '" fill="#C58E78" stroke="#A9715C" stroke-width="2"/>';
      s += rings(r, 18, 320, 222, 150, 44, '#5E9B3C', 5);
      s += '</g>' + steam(330, 120);
      return s;
    },
    // Đĩa cá phi lê hấp gừng hành: hai miếng cá trắng, sợi gừng, hành lá, cà rốt thái lát, chút nước xốt nhạt
    'ca-hap': function () {
      var r = rng(37), s = BG.slate;
      s += '<defs><filter id="bl" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="10"/></filter><linearGradient id="fi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCF8EF"/><stop offset="1" stop-color="#E4D9C3"/></linearGradient></defs>';
      s += '<ellipse cx="322" cy="318" rx="270" ry="130" fill="#1C2A20" opacity=".3" filter="url(#bl)"/>';
      s += '<ellipse cx="320" cy="262" rx="270" ry="150" fill="#FBFAF5" stroke="#D5D3C7" stroke-width="3"/><ellipse cx="320" cy="262" rx="236" ry="124" fill="#F1EFE6" stroke="#7FA37A" stroke-width="3" stroke-opacity=".6"/>';
      s += '<ellipse cx="322" cy="272" rx="196" ry="70" fill="#C98E4B" opacity=".2"/>';
      // cà rốt thái lát dọc mép đĩa
      for (var c = 0; c < 7; c++) { var cx2 = 168 + c * 50, cy2 = 352 + Math.abs(c - 3) * -3; s += '<ellipse cx="' + cx2 + '" cy="' + cy2 + '" rx="17" ry="10" fill="#F28C3A" stroke="#D9701F" stroke-width="3"/><ellipse cx="' + cx2 + '" cy="' + cy2 + '" rx="7" ry="4" fill="#F7B26E"/>'; }
      // hai miếng phi lê chồng lên nhau, có vân thịt
      function fillet(cx, cy, w, h, rot) {
        var g = '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"><path d="M' + (cx - w) + ' ' + cy + 'C' + (cx - w) + ' ' + f(cy - h) + ' ' + f(cx - w * 0.3) + ' ' + f(cy - h * 1.12) + ' ' + cx + ' ' + f(cy - h) + 'S' + (cx + w) + ' ' + f(cy - h * 0.9) + ' ' + (cx + w) + ' ' + cy + 'S' + f(cx + w * 0.5) + ' ' + f(cy + h) + ' ' + cx + ' ' + f(cy + h * 0.95) + 'S' + (cx - w) + ' ' + f(cy + h * 0.8) + ' ' + (cx - w) + ' ' + cy + 'Z" fill="url(#fi)" stroke="#CDBFA4" stroke-width="3"/>';
        for (var i = 0; i < 6; i++) g += '<path d="M' + f(cx - w * 0.66 + i * w * 0.27) + ' ' + f(cy - h * 0.5) + 'q' + f(w * 0.12) + ' ' + f(h * 0.45) + ' 0 ' + f(h * 0.95) + '" fill="none" stroke="#D9CDB6" stroke-width="2.6" stroke-linecap="round"/>';
        return g + '</g>';
      }
      s += fillet(252, 262, 112, 56, -7) + fillet(392, 250, 108, 54, 6);
      // sợi gừng vàng và hành lá xanh rắc lên trên
      for (var g = 0; g < 54; g++) { var x = 170 + r() * 270, y = 214 + r() * 80; s += '<path d="M' + f(x) + ' ' + f(y) + 'q' + f(6 + r() * 8) + ' ' + f(-4 + r() * 8) + ' ' + f(14 + r() * 14) + ' ' + f(-6 + r() * 12) + '" fill="none" stroke="#EBD58A" stroke-width="3" stroke-linecap="round"/>'; }
      for (var h = 0; h < 18; h++) { var x2 = 160 + r() * 290, y2 = 206 + r() * 96; s += '<path d="M' + f(x2) + ' ' + f(y2) + 'q' + f(20 + r() * 20) + ' ' + f(-10 + r() * 20) + ' ' + f(46 + r() * 30) + ' ' + f(-8 + r() * 16) + '" fill="none" stroke="#5FA146" stroke-width="3.4" stroke-linecap="round"/>'; }
      s += steam(300, 150);
      return s;
    },
    // Đĩa cơm gà luộc rau củ: cơm, gà luộc xắt miếng, dưa leo, cà rốt
    'com-ga': function () {
      var r = rng(53), s = BG.wood;
      s += '<defs><filter id="bl" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="10"/></filter></defs>';
      s += '<ellipse cx="324" cy="322" rx="262" ry="128" fill="#2A1A08" opacity=".3" filter="url(#bl)"/>';
      s += '<ellipse cx="320" cy="258" rx="268" ry="170" fill="#FCFBF7" stroke="#DAD7CB" stroke-width="3"/><ellipse cx="320" cy="258" rx="226" ry="140" fill="#F3F1E8" stroke="#6F9A55" stroke-width="3" stroke-opacity=".55"/>';
      // cơm
      s += '<ellipse cx="226" cy="262" rx="100" ry="70" fill="#FFFFFF" stroke="#E6E2D4" stroke-width="3"/>';
      for (var i = 0; i < 70; i++) {
        var gx0 = 170 + r() * 110, gy0 = 224 + r() * 70;
        s += '<ellipse cx="' + f(gx0) + '" cy="' + f(gy0) + '" rx="5" ry="2.6" fill="#EDEAE0" transform="rotate(' + f(r() * 180) + ' ' + f(gx0) + ' ' + f(gy0) + ')"/>';
      }
      // gà luộc
      for (var k = 0; k < 6; k++) { var gx = 350 + k * 22, gy = 190 + (k % 2) * 12 + k * 6; s += '<g transform="rotate(' + (-22 + k * 5) + ' ' + gx + ' ' + gy + ')"><ellipse cx="' + gx + '" cy="' + gy + '" rx="46" ry="26" fill="#F5E1BC" stroke="#E7BE6E" stroke-width="4"/><path d="M' + (gx - 30) + ' ' + (gy - 2) + 'q30 10 60 0" fill="none" stroke="#E9CFA2" stroke-width="3" stroke-linecap="round"/></g>'; }
      // bí đỏ cắt miếng
      for (var d = 0; d < 5; d++) { var dx = 316 + d * 32, dy = 318 + (d % 2) * 12; s += '<g transform="rotate(' + (-12 + d * 7) + ' ' + dx + ' ' + dy + ')"><rect x="' + (dx - 22) + '" y="' + (dy - 16) + '" width="44" height="32" rx="10" fill="#F9CF6B" stroke="#E2A23C" stroke-width="4"/><rect x="' + (dx - 14) + '" y="' + (dy - 9) + '" width="24" height="9" rx="4" fill="#FCE3A0" opacity=".85"/></g>'; }
      // cà rốt
      for (var c = 0; c < 6; c++) { var cx2 = 190 + c * 26, cy2 = 340 + (c % 2) * 8; s += '<ellipse cx="' + cx2 + '" cy="' + cy2 + '" rx="18" ry="11" fill="#F6A24C" stroke="#E27F23" stroke-width="3"/><ellipse cx="' + cx2 + '" cy="' + cy2 + '" rx="7" ry="4" fill="#F9C078"/>'; }
      s += rings(r, 12, 430, 215, 60, 26, '#5E9B3C', 5) + steam(250, 160);
      return s;
    },
    // Bát cháo bí đỏ đậu hũ: cháo vàng cam, đậu hũ cắt khối, hành lá
    'chao-bi-do': function () {
      var r = rng(71), s = BG.linen + bowlBack(320, 216, 204, 76, 148) + bowlFood(320, 216, 204, 76, '#FAC970', '#EE9F37');
      s += '<g clip-path="url(#fc)">';
      for (var i = 0; i < 6; i++) s += '<path d="M' + f(170 + r() * 90) + ' ' + f(190 + i * 13) + 'q' + f(60 + r() * 60) + ' ' + f(-8 + r() * 16) + ' ' + f(120 + r() * 80) + ' 0" fill="none" stroke="#F4B04D" stroke-width="3" stroke-opacity=".6" stroke-linecap="round"/>';
      for (var k = 0; k < 9; k++) {
        var x = 215 + r() * 210, y = 192 + r() * 56, a = -20 + r() * 40;
        s += '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(a) + ')"><rect x="-20" y="-15" width="40" height="30" rx="7" fill="#FFF9E8" stroke="#E9D9AE" stroke-width="3"/><rect x="-14" y="-10" width="22" height="9" rx="4" fill="#FFFFFF" opacity=".7"/></g>';
      }
      s += rings(r, 22, 320, 220, 150, 44, '#5E9B3C', 6);
      s += '</g>' + spoon(520, 134, 26) + steam(320, 118);
      return s;
    }
  };

  var cache = {};
  // Địa chỉ ảnh của một bài mẫu: ảnh thật (img) nếu có, không thì tranh minh hoạ SVG nhúng sẵn (data URI), không thì rỗng.
  H.sampleImg = function (s) {
    if (!s) return '';
    if (s.img) return s.img;
    if (!s.art || !ART[s.art]) return '';
    if (!cache[s.art]) cache[s.art] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">' + ART[s.art]() + '</svg>');
    return cache[s.art];
  };
  H.SAMPLE_ART = Object.keys(ART);
})(window.HNAG = window.HNAG || {});
