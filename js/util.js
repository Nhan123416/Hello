/* Hàm tiện ích dùng chung. */
(function (H) {
  'use strict';

  var U = H.util = {};

  U.$ = function (sel, root) { return (root || document).querySelector(sel); };
  U.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // Escape HTML. Mọi chuỗi do người dùng nhập đều phải đi qua hàm này.
  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  // Bỏ dấu tiếng Việt, về chữ thường: "Cà phê" -> "ca phe".
  U.norm = function (s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Gõ có dấu thì khớp đúng dấu ("cà" không ra "cá"); gõ không dấu thì khớp mọi dấu ("ca" ra cà, cá, cả...).
  U.searchMatch = function (rawHay, normHay, q) {
    q = String(q == null ? '' : q).trim();
    if (!q) return true;
    if (/[^\u0000-\u007f]/.test(q)) return rawHay.indexOf(q.toLowerCase()) >= 0;
    return normHay.indexOf(U.norm(q)) >= 0;
  };

  U.vnd = function (n) {
    return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + 'đ';
  };

  // 0.25 -> ¼, 1.5 -> 1½
  U.fmtNum = function (n) {
    var w = Math.floor(n + 1e-9);
    var f = Math.round((n - w) * 100) / 100;
    var frac = { 0.25: '¼', 0.5: '½', 0.75: '¾' }[f];
    if (f === 0) return String(w);
    if (frac) return (w ? w : '') + frac;
    return String(Math.round(n * 10) / 10).replace('.', ',');
  };

  U.fmtQty = function (qty, unit) {
    return U.fmtNum(qty) + (unit === 'g' ? 'g' : ' ' + unit);
  };

  // ── ngày tháng (theo giờ máy người dùng) ──
  U.iso = function (d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  U.parse = function (s) {
    var p = s.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  };
  U.addDays = function (d, n) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
  };
  U.weekStart = function (d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  };
  U.WD_LONG = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  U.WD_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  U.pad2 = function (n) { return String(n).padStart(2, '0'); };
  U.fmtDM = function (d) { return U.pad2(d.getDate()) + '/' + U.pad2(d.getMonth() + 1); };
  U.fmtDMY = function (d) { return U.fmtDM(d) + '/' + d.getFullYear(); };

  // ── ngẫu nhiên ──
  U.rand = function (n) { return Math.floor(Math.random() * n); };
  U.pick = function (arr) { return arr[U.rand(arr.length)]; };
  U.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = U.rand(i + 1);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  // Băm chuỗi -> số nguyên (FNV-1a) để chọn "gợi ý hôm nay" ổn định theo ngày.
  U.hash = function (str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  U.clamp = function (n, a, b) { return Math.min(b, Math.max(a, n)); };

  // Sao chép vào clipboard. Trả về true/false.
  U.copy = function (text) {
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch (e) { return false; }
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
      }
    } catch (e) { /* dùng fallback */ }
    return Promise.resolve(fallback());
  };

  // Cắt chuỗi cho vừa ô vòng quay, ưu tiên cắt ở ranh giới từ.
  U.short = function (s, n) {
    s = String(s);
    if (s.length <= n) return s;
    var cut = s.slice(0, n - 1);
    var sp = cut.lastIndexOf(' ');
    if (sp >= n * 0.55) cut = cut.slice(0, sp);
    return cut.replace(/[\s+,\-]+$/, '') + '…';
  };
})(window.HNAG = window.HNAG || {});
