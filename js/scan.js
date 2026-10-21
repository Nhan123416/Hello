/*
 * Quét nguyên liệu bằng camera, mở từ hộp Tủ lạnh. Bạn chụp tủ lạnh hoặc túi đồ vừa mua (hoặc chọn ảnh có sẵn), rồi chạm vào
 * những thứ thấy trong ảnh để thêm vào tủ lạnh. Tự nhận ra nguyên liệu trong ảnh bằng AI chưa có (cần dịch vụ nhận diện hình ảnh),
 * nên giao diện ghi rõ "sắp có". Ảnh chỉ nằm trong bộ nhớ khi hộp đang mở, không lưu lại.
 */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;
  var st = null;   // { photo (data URL), busy, manual, sel: { mã nguyên liệu: true } }

  function shortName(id) { return H.pantry.shortName(id); }

  function chip(id) {
    var it = H.INGREDIENTS[id];
    if (H.stockOf(id) > 0) {
      return '<span class="chip had" role="img" aria-label="' + esc(shortName(id)) + ': đã có trong tủ">' + it.emoji + ' ' + esc(shortName(id)) + ' <i aria-hidden="true">✓</i></span>';
    }
    return H.ui.chip(it.emoji + ' ' + esc(shortName(id)), !!st.sel[id], 'scan-toggle', { id: id });
  }

  function catalog() {
    var h = '';
    H.CATEGORIES.forEach(function (c) {
      if (c.id === 'giavi') return;
      var ids = Object.keys(H.INGREDIENTS).filter(function (id) { return H.INGREDIENTS[id].cat === c.id && !H.INGREDIENTS[id].staple; });
      if (!ids.length) return;
      h += '<h4 class="st-cat">' + c.emoji + ' ' + esc(c.name) + '</h4><div class="chips wrap">' + ids.map(chip).join('') + '</div>';
    });
    return h;
  }

  function addLabel(n) { return 'Thêm ' + n + ' nguyên liệu vào tủ lạnh'; }

  function render() {
    var n = Object.keys(st.sel).length, body, foot = '';
    if (!st.photo && !st.manual) {
      body = '<div class="scan-hero"><span class="scan-ic" aria-hidden="true">' + H.icon('camera', { size: 34 }) + '</span>' +
        '<h3>Chụp tủ lạnh hoặc túi đồ vừa mua</h3>' +
        '<p>Mình chưa tự nhận ra nguyên liệu trong ảnh (tự nhận diện bằng AI: <strong>sắp có</strong>). Bạn chụp ảnh rồi chạm vào những thứ thấy trong ảnh, mình thêm vào tủ lạnh giúp.</p>' +
        (st.busy ? '<p class="hint" role="status">Đang xử lý ảnh…</p>' :
          '<div class="scan-btns">' + H.community.fileBtn('Chụp ảnh', 'btn btn-primary btn-lg', 'scan-file', '', true) +
          H.community.fileBtn('Chọn ảnh có sẵn', 'btn btn-soft btn-lg', 'scan-file', '', false, 'image') + '</div>' +
          '<button type="button" class="link-btn" data-act="scan-manual">Không chụp được? Chọn nguyên liệu bằng tay</button>') +
        '<p class="hint scan-priv">' + H.icon('lock', { size: 14 }) + ' Ảnh chỉ nằm trên máy bạn lúc này và không được lưu lại.</p></div>';
    } else {
      body = (st.photo ? '<figure class="scan-photo"><img src="' + st.photo + '" alt="Ảnh bạn vừa chụp"></figure>' +
          '<div class="scan-photo-acts">' + H.community.fileBtn('Chụp lại', 'btn btn-ghost btn-sm', 'scan-file', '', true) + '</div>' : '') +
        '<p class="scan-note" id="scan-note"><span>' + (st.photo ? 'Chạm vào những thứ bạn thấy trong ảnh.' : 'Chạm vào những thứ bạn đang có.') + '</span><b id="scan-n">' + n + ' đã chọn</b></p>' +
        catalog();
      foot = '<button type="button" class="btn btn-primary btn-lg btn-block" id="scan-add" data-act="scan-add"' + (n ? '' : ' disabled') + '>' + H.icon('plus', { size: 18, stroke: 3 }) + '<span>' + addLabel(n) + '</span></button>';
    }
    return { body: body, foot: foot };
  }

  H.openScan = function () {
    st = { photo: '', busy: false, manual: false, sel: {} };
    H.sheet.open({
      title: 'Quét nguyên liệu', cls: 'overlay-scan', render: render,
      onClose: function () {
        st = null;
        var t = H.sheet.top();
        if (t && t.isFridge) t.refresh();
        H.render({ keepScroll: true });
      }
    });
  };
  H.actions['open-scan'] = function () { H.openScan(); };

  H.inputs['scan-file'] = function (el, e) {
    if (e && e.type === 'input') return;
    var f = el.files && el.files[0];
    el.value = '';
    if (!f || !st) return;
    st.busy = true; H.sheet.refresh();
    H.photo.fromFile(f, { max: 720, q: 0.7 }).then(function (url) {
      if (!st) return;
      st.busy = false; st.photo = url; H.sheet.refresh();
    }, function (err) {
      if (!st) return;
      st.busy = false; H.sheet.refresh();
      H.toast(err && err.message === 'not-image' ? 'Hãy chọn một file ảnh (JPG hoặc PNG)' : 'Không đọc được ảnh này, thử ảnh khác nhé', { icon: 'info', ms: 3400 });
    });
  };
  H.actions['scan-manual'] = function () { if (st) { st.manual = true; H.sheet.refresh(); } };

  // Chạm một nguyên liệu: đổi nhãn và bộ đếm tại chỗ (không vẽ lại cả hộp để ảnh khỏi nháy).
  H.actions['scan-toggle'] = function (el) {
    var id = el.dataset.id;
    if (!st || !H.INGREDIENTS[id]) return;
    if (st.sel[id]) delete st.sel[id]; else st.sel[id] = true;
    el.setAttribute('aria-pressed', st.sel[id] ? 'true' : 'false');
    var n = Object.keys(st.sel).length;
    var c = document.getElementById('scan-n'); if (c) c.textContent = n + ' đã chọn';
    var b = document.getElementById('scan-add');
    if (b) { b.disabled = !n; var s = b.querySelector('span'); if (s) s.textContent = addLabel(n); }
  };

  H.actions['scan-add'] = function () {
    if (!st) return;
    var ids = Object.keys(st.sel).filter(function (id) { return H.INGREDIENTS[id] && !(H.stockOf(id) > 0); });
    if (!ids.length) return;
    ids.forEach(function (id) { H.addStock(id, H.packOf(id).qty); });
    H.toast('Đã thêm ' + ids.length + ' nguyên liệu vào tủ lạnh', { icon: 'check' });
    H.sheet.close();
  };
})(window.HNAG = window.HNAG || {});
