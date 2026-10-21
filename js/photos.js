/*
 * Kho ảnh nhỏ trên máy: ảnh người dùng chọn được thu nhỏ bằng canvas rồi lưu riêng khỏi trạng thái chính
 * (khoá hnag.photos.v1) để mỗi lần lưu thực đơn không phải ghi lại cả ảnh. Có giới hạn số ảnh và dung lượng
 * vì localStorage chỉ chứa khoảng 5 MB. Ảnh không bao giờ rời khỏi thiết bị trừ khi người dùng bấm Chia sẻ.
 */
(function (H) {
  'use strict';

  var KEY = 'hnag.photos.v1';
  var MAX_PHOTOS = 24;
  var MAX_CHARS = 2600000;    // tổng ký tự base64, khoảng 2,5 MB, chừa chỗ cho trạng thái chính
  var MAX_ONE = 260000;       // một ảnh sau khi nén không nên vượt quá mức này (khoảng 190 KB)
  var URL_OK = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]{20,}$/;   // chỉ nhận ảnh JPEG do chính trang này tạo ra
  var ID_OK = /^ph[a-z0-9]{4,24}$/;
  var P = H.photo = {};
  var store = null;           // { mã ảnh: data URL }
  var dirty = false;          // dữ liệu đã lưu có mục hỏng bị bỏ khi đọc: ghi lại bản sạch ở lần dọn tới

  function load() {
    var s = {};
    try {
      var raw = localStorage.getItem(KEY);
      var o = raw ? JSON.parse(raw) : {};
      if (o && typeof o === 'object' && !Array.isArray(o)) {
        var total = 0;
        Object.keys(o).forEach(function (id) {
          var v = o[id];
          if (!ID_OK.test(id) || typeof v !== 'string' || !URL_OK.test(v) || Object.keys(s).length >= MAX_PHOTOS || total + v.length > MAX_CHARS) { dirty = true; return; }
          s[id] = v; total += v.length;
        });
      } else if (raw) dirty = true;
    } catch (e) { dirty = true; /* dữ liệu hỏng hoặc bị chặn: coi như chưa có ảnh */ }
    return s;
  }
  function ensure() { if (!store) store = load(); return store; }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(ensure())); return true; } catch (e) { return false; }
  }

  // Giải mã ảnh từ một địa chỉ (blob: hoặc data:). Trả về Promise<HTMLImageElement>.
  function decode(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('decode')); };
      img.src = src;
    });
  }
  // Ưu tiên blob: (nhẹ bộ nhớ); khung nhúng không cho blob: thì đọc bằng FileReader ra data:.
  function readImage(file) {
    var url = null;
    try { url = URL.createObjectURL(file); } catch (e) { /* thử FileReader */ }
    var first = url ? decode(url).then(function (img) { URL.revokeObjectURL(url); return img; }, function (e) { URL.revokeObjectURL(url); throw e; }) : Promise.reject(new Error('no-blob'));
    return first.catch(function () {
      return new Promise(function (resolve, reject) {
        var r = new FileReader();
        r.onload = function () { decode(r.result).then(resolve, reject); };
        r.onerror = function () { reject(new Error('decode')); };
        r.readAsDataURL(file);
      });
    });
  }

  // Đọc một file ảnh, thu nhỏ cạnh dài về tối đa o.max điểm ảnh và nén JPEG. Trả về Promise<data URL>.
  // Ảnh PNG trong suốt được tô nền trắng. Quá nặng thì nén thêm vài lần cho vừa MAX_ONE.
  P.fromFile = function (file, o) {
    o = o || {};
    if (!file || !/^image\//.test(file.type || '')) return Promise.reject(new Error('not-image'));
    return readImage(file).then(function (img) {
      var w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) throw new Error('decode');
      var max = o.max || 800, q = o.q || 0.72, out = '';
      for (var i = 0; i < 4; i++) {
        var k = Math.min(1, max / Math.max(w, h));
        var cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(w * k)); cv.height = Math.max(1, Math.round(h * k));
        var cx = cv.getContext('2d');
        cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
        cx.drawImage(img, 0, 0, cv.width, cv.height);
        out = cv.toDataURL('image/jpeg', q);
        if (out.length <= MAX_ONE) break;
        max = Math.round(max * 0.8); q = Math.max(0.5, q - 0.1);
      }
      if (!URL_OK.test(out) || out.length > MAX_ONE * 1.5) throw new Error('decode');
      return out;
    });
  };

  P.get = function (id) { return typeof id === 'string' && ID_OK.test(id) ? ensure()[id] || '' : ''; };

  // Lưu một ảnh. Trả về { ok: true, id } hoặc { ok: false, why: 'bad' | 'full' | 'quota' }.
  P.put = function (dataUrl) {
    if (typeof dataUrl !== 'string' || !URL_OK.test(dataUrl)) return { ok: false, why: 'bad' };
    var s = ensure(), ids = Object.keys(s);
    var total = ids.reduce(function (a, k) { return a + s[k].length; }, 0);
    if (ids.length >= MAX_PHOTOS || total + dataUrl.length > MAX_CHARS) return { ok: false, why: 'full' };
    var id = 'ph' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    s[id] = dataUrl;
    if (!save()) { delete s[id]; return { ok: false, why: 'quota' }; }
    return { ok: true, id: id };
  };

  P.del = function (id) {
    var s = ensure();
    if (s[id] === undefined) return;
    delete s[id];
    save();
  };

  // Giữ lại đúng các ảnh còn được đánh giá nào dùng, xoá ảnh mồ côi.
  P.keep = function (ids) {
    var s = ensure(), keep = {}, changed = false;
    (ids || []).forEach(function (id) { keep[id] = true; });
    Object.keys(s).forEach(function (id) { if (!keep[id]) { delete s[id]; changed = true; } });
    if ((changed || dirty) && save()) dirty = false;
  };

  P.clear = function () {
    store = {};
    try { localStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ }
  };

  P.stats = function () {
    var s = ensure(), ids = Object.keys(s);
    var chars = ids.reduce(function (a, k) { return a + s[k].length; }, 0);
    return { n: ids.length, kb: Math.round(chars * 0.75 / 1024), max: MAX_PHOTOS };
  };

  // Ảnh trong kho -> File để mở hộp chia sẻ của hệ điều hành kèm ảnh (null nếu không có).
  P.toFile = function (id, name) {
    var url = P.get(id);
    if (!url || !window.File) return null;
    try {
      var bin = atob(url.slice(url.indexOf(',') + 1)), arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new File([arr], name || 'mon-an.jpg', { type: 'image/jpeg' });
    } catch (e) { return null; }
  };
})(window.HNAG = window.HNAG || {});
