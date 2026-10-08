/* Cộng đồng (bảng tin, nhật ký ăn uống, bạn bè) và bảng xếp hạng món được chốt. */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;

  var draft = { name: '', tag: 'Món ăn', stage: null, text: '', dish: '' };

  function stageInfo(id) { return H.STAGES.filter(function (s) { return s.id === id; })[0]; }
  function slotInfo(id) { return id === 'khac' ? { id: 'khac', label: 'Lúc khác', short: 'Khác', emoji: '🍽️' } : H.SLOTS.filter(function (s) { return s.id === id; })[0]; }
  function feelInfo(n) { return H.FEELS.filter(function (f) { return f.id === n; })[0]; }

  function timeLabel(ts) {
    if (!ts) return 'Bài mẫu';
    var diff = Date.now() - ts;
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' phút trước';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' giờ trước';
    return U.fmtDMY(new Date(ts));
  }

  function dishChip(id) {
    var d = H.DISH_BY_ID[id];
    return d ? '<a class="post-dish" href="#dish-' + d.id + '">' + H.ui.tile(d, 'xs') + '<span>' + esc(d.name) + '</span>' + H.icon('chev-r', { size: 14 }) + '</a>' : '';
  }

  function postCard(p) {
    var liked = !!H.state.liked[p.id];
    var count = (p.likes || 0) + (liked ? 1 : 0);
    var st = p.stage ? stageInfo(p.stage) : null;
    var initial = (p.name || '?').trim().charAt(0).toUpperCase() || '?';
    return '<li class="post' + (p.sample ? ' sample' : '') + '">' +
      '<div class="post-head"><span class="avatar' + (p.sample ? ' mascot-av' : '') + '" aria-hidden="true">' + (p.sample ? '🥣' : esc(initial)) + '</span>' +
      '<div class="post-who"><strong>' + esc(p.name || 'Ẩn danh') + '</strong><small>' + timeLabel(p.ts) + (st ? ' · ' + st.emoji + ' ' + esc(st.short) : '') + '</small></div>' +
      '<span class="tag tag-soft">' + esc(p.tag) + '</span></div>' +
      '<p class="post-text">' + esc(p.text) + '</p>' + (p.dish ? dishChip(p.dish) : '') +
      '<div class="post-foot">' +
      '<button type="button" class="like' + (liked ? ' on' : '') + '" data-act="like" data-id="' + esc(p.id) + '" aria-pressed="' + liked + '">' + H.icon('thumb', { size: 16, fill: liked }) + 'Hữu ích <b>' + count + '</b></button>' +
      (p.sample ? '<span class="sample-note">Mẹo mẫu của trang, không phải lời kể của người thật</span>' : '') +
      (p.mine ? '<button type="button" class="link-btn danger" data-act="del-post" data-id="' + esc(p.id) + '">' + H.icon('trash', { size: 14 }) + 'Xoá</button>' : '') +
      '</div></li>';
  }

  H.postCard = postCard;

  function composer() {
    var stage = draft.stage || H.state.profile.stage;
    var dishes = H.DISHES.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'vi'); });
    return '<section class="composer" id="composer" aria-labelledby="comp-t"><h2 id="comp-t">Chia sẻ với mọi người</h2>' +
      '<label class="label" for="post-name">Tên hiển thị <small>(không bắt buộc)</small></label>' +
      '<input id="post-name" class="input" maxlength="24" placeholder="VD: Minh năm 2" value="' + esc(draft.name) + '" data-input="post-name" autocomplete="off">' +
      '<div class="label">Chủ đề</div><div class="chips" role="group" aria-label="Chủ đề">' + H.COMMUNITY_TAGS.map(function (t) {
        return H.ui.chip(esc(t), draft.tag === t, 'post-tag', { v: t });
      }).join('') + '</div>' +
      '<div class="label">Giai đoạn của bạn</div><div class="chips" role="group" aria-label="Giai đoạn">' + H.STAGES.map(function (s) {
        return H.ui.chip(s.emoji + ' ' + esc(s.short), stage === s.id, 'post-stage', { v: s.id });
      }).join('') + '</div>' +
      '<label class="label" for="post-dish">Nói về món nào? <small>(không bắt buộc)</small></label>' +
      '<select id="post-dish" class="input" data-input="post-dish"><option value="">Không gắn món</option>' + dishes.map(function (d) {
        return '<option value="' + d.id + '"' + (draft.dish === d.id ? ' selected' : '') + '>' + esc(d.emoji + ' ' + d.name) + '</option>';
      }).join('') + '</select>' +
      '<label class="label" for="post-text">Nội dung</label>' +
      '<textarea id="post-text" class="textarea" rows="4" maxlength="400" placeholder="Món bạn ăn thấy hợp, mẹo nấu, hay câu hỏi cho mọi người…" data-input="post-text">' + esc(draft.text) + '</textarea>' +
      '<div class="comp-foot"><span class="hint" id="post-count">' + draft.text.length + '/400</span>' +
      '<button type="button" class="btn btn-primary" data-act="post-submit">' + H.icon('plus', { size: 18 }) + 'Đăng bài</button></div>' +
      '<p class="hint">Đừng đăng thông tin cá nhân hoặc tự kê đơn thuốc cho người khác. Kinh nghiệm cá nhân không thay lời khuyên của bác sĩ.</p></section>';
  }

  function topThree() {
    var mine = H.myRank();
    var list = mine.length ? mine : H.DEMO_RANK;
    return '<section class="rankprev"><div class="rp-head"><h2>' + H.icon('trophy', { size: 20 }) + 'Món được chốt nhiều nhất</h2><a class="link" href="#rank">Xem bảng xếp hạng ' + H.icon('chev-r', { size: 14 }) + '</a></div>' +
      '<ol class="rp-list">' + list.slice(0, 3).map(function (r, i) {
        var d = H.DISH_BY_ID[r[0]];
        return '<li><span class="medal m' + (i + 1) + '" aria-hidden="true">' + ['🥇', '🥈', '🥉'][i] + '</span>' + H.ui.tile(d, 'sm') + '<strong>' + esc(d.name) + '</strong><em>' + r[1] + ' lần</em></li>';
      }).join('') + '</ol>' + (mine.length ? '' : '<p class="hint">Số liệu minh hoạ. Hãy chốt món để có bảng xếp hạng của riêng bạn.</p>') + '</section>';
  }

  // ───────────── Bảng tin ─────────────
  function feedTab() {
    var posts = H.allPosts();
    return '<p class="note">' + H.icon('info', { size: 16 }) + '<span><strong>Bản thử nghiệm:</strong> bài viết hiện chỉ lưu trên thiết bị của bạn và chưa hiển thị cho người khác. Khi có máy chủ, mọi người sẽ thấy bài của nhau.</span></p>' +
      '<div class="community-grid"><div class="community-main">' + composer() +
      '<ul class="posts" aria-label="Bài viết">' + posts.map(postCard).join('') + '</ul></div>' +
      '<aside class="community-side">' + topThree() + '</aside></div>';
  }

  // ───────────── Nhật ký ăn uống ─────────────
  var dd = null;   // bản nháp: { date, slot, feel, symptoms, dishes, note, touched, pickDate }

  function newDraft(date, slot) {
    var now = H.now();
    dd = { date: date || U.iso(now), slot: slot || H.autoMeal(now), feel: 0, symptoms: [], dishes: [], note: '', touched: false, pickDate: false };
    prefill();
  }
  // Món của bữa đó trong kế hoạch được điền sẵn (đến khi bạn tự sửa danh sách món).
  function prefill() {
    if (dd.touched || dd.slot === 'khac') return;
    var id = H.getMeal(dd.date, dd.slot);
    dd.dishes = id ? [id] : [];
    var old = H.diaryFor(dd.date, dd.slot);
    if (old) { dd.feel = old.feel; dd.symptoms = old.symptoms.slice(); dd.note = old.note; if (old.dishes.length) dd.dishes = old.dishes.slice(); }
  }

  function dayName(iso) {
    var t = H.today();
    if (iso === t) return 'Hôm nay';
    if (iso === U.iso(U.addDays(U.parse(t), -1))) return 'Hôm qua';
    var d = U.parse(iso);
    return U.WD_LONG[d.getDay()] + ' ' + U.fmtDM(d);
  }

  function formHtml() {
    var t = H.today(), yest = U.iso(U.addDays(U.parse(t), -1));
    var h = '<section class="composer diary-form" id="diary-form" aria-labelledby="dy-t"><h2 id="dy-t">Ghi nhanh cảm giác sau bữa ăn</h2>' +
      '<div class="label">Ngày</div><div class="chips" role="group" aria-label="Ngày">' +
      H.ui.chip('Hôm nay', dd.date === t && !dd.pickDate, 'dy-date', { v: t }) +
      H.ui.chip('Hôm qua', dd.date === yest && !dd.pickDate, 'dy-date', { v: yest }) +
      H.ui.chip('Chọn ngày khác', dd.pickDate, 'dy-pick') + '</div>' +
      (dd.pickDate ? '<input id="dy-date" class="input dy-date-in" type="date" max="' + t + '" value="' + esc(dd.date) + '" data-input="dy-date" aria-label="Chọn ngày">' : '') +
      '<div class="label">Bữa</div><div class="chips" role="group" aria-label="Bữa">' + H.SLOTS.concat([slotInfo('khac')]).map(function (s) {
        return H.ui.chip((s.emoji ? s.emoji + ' ' : '') + esc(s.short), dd.slot === s.id, 'dy-slot', { v: s.id });
      }).join('') + '</div>' +
      '<div class="label">Đã ăn món gì <small>(chạm vào món để bỏ)</small></div><div class="chips dy-dishes">' +
      dd.dishes.map(function (id) {
        var d = H.DISH_BY_ID[id];
        return '<button type="button" class="chip dy-dish" data-act="dy-dish-rm" data-id="' + id + '" aria-label="Bỏ ' + esc(d.name) + '">' + d.emoji + ' ' + esc(d.name) + H.icon('x', { size: 12, stroke: 3 }) + '</button>';
      }).join('') + (dd.dishes.length < 4 ? '<button type="button" class="chip" data-act="dy-dish-add">' + H.icon('plus', { size: 14, stroke: 3 }) + 'Thêm món</button>' : '') + '</div>' +
      '<div class="label" id="dy-feel-l">Bụng bạn thấy sao?</div><div class="feelbar" role="radiogroup" aria-labelledby="dy-feel-l">' + H.FEELS.map(function (f) {
        return '<button type="button" class="feel-btn" role="radio" aria-checked="' + (dd.feel === f.id) + '" data-act="dy-feel" data-v="' + f.id + '"><span aria-hidden="true">' + f.emoji + '</span><small>' + esc(f.label) + '</small></button>';
      }).join('') + '</div>' +
      '<div class="label">Có triệu chứng nào không? <small>(chọn nhiều được)</small></div><div class="chips" role="group" aria-label="Triệu chứng">' + H.SYMPTOMS.map(function (name) {
        return H.ui.chip(esc(name), dd.symptoms.indexOf(name) >= 0, 'dy-sym', { v: name });
      }).join('') + '</div>' +
      '<label class="label" for="dy-note">Ghi chú <small>(không bắt buộc)</small></label>' +
      '<textarea id="dy-note" class="textarea" rows="2" maxlength="200" placeholder="VD: ăn xong 30 phút thì hơi ợ chua" data-input="dy-note">' + esc(dd.note) + '</textarea>' +
      (H.diaryFor(dd.date, dd.slot) && dd.slot !== 'khac' ? '<p class="hint">Bữa này đã có mục nhật ký, lưu sẽ cập nhật mục đó.</p>' : '') +
      '<button type="button" class="btn btn-primary btn-lg btn-block dy-save" data-act="dy-save">' + H.icon('check', { size: 18, stroke: 3 }) + 'Lưu nhật ký</button></section>';
    return h;
  }

  function weekBars(series) {
    return '<ul class="dy-week" aria-label="Cảm giác trung bình 7 ngày gần nhất">' + series.map(function (x) {
      var d = U.parse(x.date), f = x.avg == null ? null : feelInfo(Math.min(4, Math.max(1, Math.round(x.avg))));
      return '<li' + (x.avg == null ? ' class="none"' : '') + '><span class="dy-e" aria-hidden="true">' + (f ? f.emoji : '·') + '</span><small>' + U.WD_SHORT[d.getDay()] + '</small>' +
        '<span class="sr-only">' + dayName(x.date) + ': ' + (f ? f.label : 'chưa ghi') + '</span></li>';
    }).join('') + '</ul>';
  }

  function insightsHtml() {
    var st = H.diaryStats(30);
    if (!st.total) {
      return '<section class="dy-ins dy-box"><h2>Mình đang chờ nhật ký của bạn</h2><p class="hint">Ghi vài bữa, mình sẽ chỉ ra món nào hay làm bạn khó chịu và món nào hợp với bạn. Cần ít nhất 2 lần ghi cho mỗi món.</p></section>';
    }
    var pct = Math.round(st.good / st.total * 100);
    var h = '<section class="dy-ins dy-box"><h2>30 ngày qua</h2><p class="dy-sum"><strong>' + st.total + '</strong> lần ghi · <strong>' + pct + '%</strong> thấy ổn (rất ổn hoặc ổn)</p>' + weekBars(st.series);
    if (st.symptoms.length) {
      h += '<div class="dy-sym-sum"><span>Hay gặp:</span>' + st.symptoms.slice(0, 3).map(function (x) { return '<span class="tag tag-soft">' + esc(x.name) + ' · ' + x.n + '</span>'; }).join('') + '</div>';
    }
    if (st.watch.length) {
      h += '<h3 class="dy-h warn">Nên cẩn thận</h3><ul class="rows">' + st.watch.slice(0, 4).map(function (r) {
        var d = H.DISH_BY_ID[r.id];
        return '<li><a class="row" href="#dish-' + d.id + '">' + H.ui.tile(d, 'sm') + '<span class="row-main"><strong>' + esc(d.name) + '</strong><small>Khó chịu ' + r.bad + ' trên ' + r.n + ' lần ăn</small></span></a></li>';
      }).join('') + '</ul><p class="hint">Mỗi người một cơ địa. Đây chỉ là thống kê từ nhật ký của bạn, chưa phải kết luận y khoa. Nếu món nào cứ gây khó chịu, hãy thử bỏ khỏi vòng quay và hỏi bác sĩ.</p>';
    }
    if (st.safe.length) {
      h += '<h3 class="dy-h good">Hợp với bạn</h3><ul class="rows">' + st.safe.slice(0, 4).map(function (r) {
        var d = H.DISH_BY_ID[r.id];
        return '<li><a class="row" href="#dish-' + d.id + '">' + H.ui.tile(d, 'sm') + '<span class="row-main"><strong>' + esc(d.name) + '</strong><small>Ăn ' + r.n + ' lần, chưa lần nào khó chịu</small></span></a></li>';
      }).join('') + '</ul>';
    }
    return h + '</section>';
  }

  function historyHtml() {
    var list = H.state.diary.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : b.ts - a.ts; }).slice(0, 40);
    if (!list.length) return '';
    var byDate = {}, order = [];
    list.forEach(function (e) { if (!byDate[e.date]) { byDate[e.date] = []; order.push(e.date); } byDate[e.date].push(e); });
    return '<section class="dy-hist dy-box"><h2>Đã ghi gần đây</h2>' + order.map(function (date) {
      return '<h3 class="dy-day">' + esc(dayName(date)) + '</h3><ul class="dy-list">' + byDate[date].map(function (e) {
        var f = feelInfo(e.feel), s = slotInfo(e.slot);
        return '<li class="dy-item f' + e.feel + '"><span class="dy-feel" title="' + esc(f.label) + '"><span aria-hidden="true">' + f.emoji + '</span><span class="sr-only">' + esc(f.label) + '</span></span>' +
          '<div class="dy-body"><strong>' + esc(s.label) + '</strong>' +
          (e.dishes.length ? '<span class="dy-dn">' + e.dishes.map(function (id) { var d = H.DISH_BY_ID[id]; return '<a href="#dish-' + d.id + '">' + esc(d.name) + '</a>'; }).join(', ') + '</span>' : '') +
          (e.symptoms.length ? '<span class="dy-sy">' + e.symptoms.map(esc).join(' · ') + '</span>' : '') +
          (e.note ? '<span class="dy-nt">' + esc(e.note) + '</span>' : '') + '</div>' +
          '<button type="button" class="btn-icon round" data-act="dy-del" data-id="' + esc(e.id) + '" aria-label="Xoá mục nhật ký ' + esc(s.label) + ' ' + esc(dayName(date)) + '">' + H.icon('trash', { size: 15 }) + '</button></li>';
      }).join('') + '</ul>';
    }).join('') + '</section>';
  }

  function diaryTab() {
    if (!dd) newDraft();
    return '<p class="note">' + H.icon('info', { size: 16 }) + '<span>Nhật ký chỉ lưu trên thiết bị này. Ghi lại sau mỗi bữa giúp bạn và bác sĩ nhận ra món nào hợp, món nào không.</span></p>' +
      '<div class="diary-grid">' + formHtml() + insightsHtml() + historyHtml() + '</div>';
  }

  // ───────────── Bạn bè ─────────────
  function friendsTab() {
    return '<section class="friends"><div class="fr-hero"><span class="fr-e" aria-hidden="true">🤝</span><div><h2>Kết nối bạn cùng tình trạng <span class="soon">Sắp có</span></h2>' +
      '<p>Tìm bạn cùng giai đoạn dạ dày hoặc cùng sở thích nấu ăn, trao đổi công thức, cùng nhắc nhau ăn đúng giờ và thi đua nấu món lành.</p></div></div>' +
      '<p class="note warn">' + H.icon('info', { size: 16 }) + '<span><strong>Chưa làm được trong bản này.</strong> Kết bạn cần tài khoản đăng nhập và máy chủ lưu danh sách bạn bè. Trang này đang chạy hoàn toàn trên máy bạn nên mình không làm giả tính năng này.</span></p>' +
      '<h3 class="fr-h">Dự kiến có</h3><ul class="fr-list">' +
      '<li><span aria-hidden="true">🔎</span><div><strong>Tìm bạn cùng giai đoạn</strong><small>Gợi ý người cùng mức độ và cùng sở thích nấu ăn.</small></div></li>' +
      '<li><span aria-hidden="true">📅</span><div><strong>Chia sẻ thực đơn tuần</strong><small>Gửi kế hoạch cho bạn, cùng đi chợ và nấu chung.</small></div></li>' +
      '<li><span aria-hidden="true">⏰</span><div><strong>Nhắc nhau ăn đúng giờ</strong><small>Bạn quên bữa, người thân được báo.</small></div></li>' +
      '<li><span aria-hidden="true">🏆</span><div><strong>Bảng xếp hạng thật</strong><small>Món được chốt nhiều nhất trong nhóm bạn.</small></div></li></ul>' +
      '<h3 class="fr-h">Làm được ngay bây giờ</h3><div class="stack">' +
      '<button type="button" class="btn btn-primary" data-act="share-site">' + H.icon('users', { size: 18 }) + 'Mời bạn bè dùng thử</button>' +
      '<button type="button" class="btn btn-soft" data-act="plan-copy-share">' + H.icon('copy', { size: 18 }) + 'Gửi thực đơn tuần này cho bạn</button></div>' +
      '<p class="hint">Mình chỉ mở hộp chia sẻ của điện thoại hoặc sao chép nội dung để bạn tự gửi qua Zalo, Messenger... Không có gì được tải lên máy chủ.</p></section>';
  }

  var TABS = [['feed', 'Bảng tin', 'users', 'community'], ['diary', 'Nhật ký', 'book', 'community-diary'], ['friends', 'Bạn bè', 'heart', 'community-friends']];

  H.views.community = {
    title: function (r) { return r.tab === 'diary' ? 'Nhật ký ăn uống' : (r.tab === 'friends' ? 'Bạn bè' : 'Cộng đồng'); },
    render: function (r) {
      var tab = r.tab || 'feed';
      var head = tab === 'diary' ? H.ui.pageHead('NHẬT KÝ', 'Hôm nay bụng bạn thế nào?', 'Ghi cảm giác sau mỗi bữa để tìm ra món hợp với riêng bạn.')
        : tab === 'friends' ? H.ui.pageHead('BẠN BÈ', 'Cùng nhau ăn lành', 'Kết nối với những bạn cùng cảnh ngộ.')
        : H.ui.pageHead('CỘNG ĐỒNG', 'Cùng chia sẻ cho dạ dày vui', 'Nơi các bạn sinh viên cùng tình trạng trao đổi món ăn, mẹo nấu và kinh nghiệm.');
      return '<div class="community">' + head +
        '<div class="seg three" role="tablist" aria-label="Chọn mục">' + TABS.map(function (t) {
          return '<a role="tab" class="seg-i' + (tab === t[0] ? ' on' : '') + '" aria-selected="' + (tab === t[0]) + '" href="#' + t[3] + '">' + H.icon(t[2], { size: 16 }) + '<span>' + t[1] + (t[0] === 'friends' ? ' <i class="soon-dot">sắp có</i>' : '') + '</span></a>';
        }).join('') + '</div>' +
        (tab === 'diary' ? diaryTab() : tab === 'friends' ? friendsTab() : feedTab()) +
        H.ui.disclaimer() + '</div>';
    }
  };

  H.inputs['post-name'] = function (el) { draft.name = el.value; };
  H.inputs['post-dish'] = function (el) { draft.dish = el.value; };
  H.inputs['post-text'] = function (el) {
    draft.text = el.value;
    var c = document.getElementById('post-count');
    if (c) c.textContent = draft.text.length + '/400';
  };
  H.actions['post-tag'] = function (el) { draft.tag = el.dataset.v; H.render({ keepScroll: true }); };
  H.actions['post-stage'] = function (el) { draft.stage = el.dataset.v; H.render({ keepScroll: true }); };
  H.actions['post-submit'] = function () {
    var t = draft.text.trim();
    if (t.length < 5) { H.toast('Hãy viết ít nhất vài chữ nhé', { icon: 'info' }); var ta = document.getElementById('post-text'); if (ta) ta.focus(); return; }
    H.addPost({ name: draft.name.trim() || 'Ẩn danh', tag: draft.tag, stage: draft.stage || H.state.profile.stage, text: t, dish: draft.dish });
    draft = { name: draft.name, tag: 'Món ăn', stage: null, text: '', dish: '' };
    H.toast('Đã đăng bài (chỉ lưu trên máy bạn)', { icon: 'check' });
    H.render({ keepScroll: true });
  };
  // Từ trang món: viết bài về chính món đó.
  H.actions['post-about'] = function (el) {
    draft.dish = el.dataset.id; draft.tag = 'Hỏi đáp';
    if (location.hash === '#community') { H.render(); } else location.hash = '#community';
    setTimeout(function () { var c = document.getElementById('composer'); if (c) { c.scrollIntoView({ block: 'start' }); var ta = document.getElementById('post-text'); if (ta) ta.focus({ preventScroll: true }); } }, 150);
  };
  H.actions.like = function (el) { H.toggleLike(el.dataset.id); H.render({ keepScroll: true }); };
  H.actions['del-post'] = function (el) {
    var id = el.dataset.id;
    H.confirm({ title: 'Xoá bài viết?', text: 'Bài viết sẽ bị xoá khỏi thiết bị này.', ok: 'Xoá', danger: true,
      onOk: function () { H.deletePost(id); H.render({ keepScroll: true }); } });
  };

  // nhật ký
  H.actions['dy-date'] = function (el) { dd.date = el.dataset.v; dd.pickDate = false; dd.touched = false; dd.feel = 0; dd.symptoms = []; dd.note = ''; prefill(); H.render({ keepScroll: true }); };
  H.actions['dy-pick'] = function () { dd.pickDate = true; H.render({ keepScroll: true }); };
  H.inputs['dy-date'] = function (el) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(el.value) || el.value > H.today()) return;
    dd.date = el.value; dd.touched = false; dd.feel = 0; dd.symptoms = []; dd.note = ''; prefill();
    H.render({ keepScroll: true });
    var again = document.getElementById('dy-date'); if (again) again.focus();
  };
  H.actions['dy-slot'] = function (el) { dd.slot = el.dataset.v; dd.touched = false; dd.feel = 0; dd.symptoms = []; dd.note = ''; prefill(); H.render({ keepScroll: true }); };
  H.actions['dy-feel'] = function (el) { dd.feel = Number(el.dataset.v); H.render({ keepScroll: true }); };
  H.actions['dy-sym'] = function (el) {
    var i = dd.symptoms.indexOf(el.dataset.v);
    if (i >= 0) dd.symptoms.splice(i, 1); else dd.symptoms.push(el.dataset.v);
    H.render({ keepScroll: true });
  };
  H.inputs['dy-note'] = function (el) { dd.note = el.value; };
  H.actions['dy-dish-rm'] = function (el) { dd.dishes = dd.dishes.filter(function (id) { return id !== el.dataset.id; }); dd.touched = true; H.render({ keepScroll: true }); };
  H.actions['dy-dish-add'] = function () {
    var q = '';
    H.sheet.open({
      title: 'Thêm món đã ăn',
      render: function () {
        var list = H.DISHES.filter(function (d) { return dd.dishes.indexOf(d.id) < 0 && U.searchMatch(d.searchRaw, d.searchText, q); });
        // món trong kế hoạch hôm đó và món hay chốt lên đầu
        var planned = {};
        H.slotsOn().forEach(function (s) { var id = H.getMeal(dd.date, s); if (id) planned[id] = 1; });
        list.sort(function (a, b) { return (planned[b.id] ? 1 : 0) - (planned[a.id] ? 1 : 0) || (H.state.picks[b.id] || 0) - (H.state.picks[a.id] || 0) || a.name.localeCompare(b.name, 'vi'); });
        return {
          body: '<div class="search"><span class="search-ic">' + H.icon('search', { size: 18 }) + '</span><input id="dy-q" type="search" placeholder="Tìm món…" autocomplete="off" value="' + esc(q) + '" data-input="dy-q" aria-label="Tìm món"></div>' +
            (list.length ? '<ul class="rows">' + list.map(function (d) {
              return '<li><button type="button" class="row pick" data-act="dy-dish-pick" data-id="' + d.id + '">' + H.ui.tile(d, 'sm') + '<span class="row-main"><strong>' + esc(d.name) + '</strong><small>' + esc(d.kind) + (planned[d.id] ? ' · đang trong kế hoạch hôm đó' : '') + '</small></span></button></li>';
            }).join('') + '</ul>' : H.ui.empty({ title: 'Không có món phù hợp', text: 'Thử từ khoá khác nhé.' }))
        };
      },
      onOpen: function (rec) { rec.dyQuery = function (v) { q = v; var pos = U.$('#dy-q', rec.el).selectionStart; rec.refresh(); var a = U.$('#dy-q', rec.el); if (a) { a.focus(); try { a.setSelectionRange(pos, pos); } catch (e) { /* bỏ qua */ } } }; },
      onClose: function () { H.render({ keepScroll: true }); }
    });
  };
  H.inputs['dy-q'] = function (el) { var t = H.sheet.top(); if (t && t.dyQuery) t.dyQuery(el.value); };
  H.actions['dy-dish-pick'] = function (el) {
    if (dd.dishes.length < 4 && dd.dishes.indexOf(el.dataset.id) < 0) dd.dishes.push(el.dataset.id);
    dd.touched = true;
    H.sheet.close();
  };
  H.actions['dy-save'] = function () {
    if (!dd.feel) { H.toast('Hãy chọn cảm giác của bạn trước nhé', { icon: 'info' }); return; }
    var e = H.addDiary({ date: dd.date, slot: dd.slot, feel: dd.feel, symptoms: dd.symptoms, dishes: dd.dishes, note: dd.note.trim() });
    if (!e) { H.toast('Chưa lưu được, hãy kiểm tra lại ngày và bữa', { icon: 'info' }); return; }
    H.toast('Đã lưu vào nhật ký', { icon: 'check' });
    var date = dd.date;
    newDraft(date, dd.slot === 'khac' ? 'khac' : (dd.slot === 'sang' ? 'trua' : dd.slot === 'trua' ? 'toi' : H.autoMeal(H.now())));
    H.render({ keepScroll: true });
  };
  H.actions['dy-del'] = function (el) {
    var id = el.dataset.id;
    H.confirm({ title: 'Xoá mục nhật ký?', text: 'Mục này sẽ bị xoá khỏi thiết bị.', ok: 'Xoá', danger: true,
      onOk: function () { H.deleteDiary(id); H.render({ keepScroll: true }); } });
  };

  // bạn bè: chỉ chia sẻ nội dung, không có gì lên máy chủ
  H.actions['share-site'] = function () {
    var data = { title: 'Hôm nay ăn gì?', text: 'Web gợi ý món lành cho người đau dạ dày, có vòng quay chọn món, nhắc ăn đúng giờ và danh sách đi chợ.', url: location.href.split('#')[0] };
    var text = data.text + (/^https?:/.test(data.url) ? ' ' + data.url : '');
    function copyIt() {
      U.copy(text).then(function (ok) {
        if (ok) H.toast('Đã sao chép lời mời, dán vào Zalo hay Messenger nhé', { icon: 'copy', ms: 3600 });
        else if (H.showTextSheet) H.showTextSheet('Lời mời bạn bè', text);
      });
    }
    if (navigator.share) {
      // Một số khung nhúng chặn chia sẻ hệ thống: khi đó chuyển sang sao chép (người dùng tự bấm huỷ thì thôi).
      navigator.share(data).catch(function (e) { if (!e || e.name !== 'AbortError') copyIt(); });
      return;
    }
    copyIt();
  };
  H.actions['plan-copy-share'] = function () { if (H.actions['plan-copy']) { H.ui.weekOffset = 0; H.actions['plan-copy'](); } };

  // ───────────── Bảng xếp hạng ─────────────
  function rankRows(list, unit) {
    return '<ol class="ranks">' + list.map(function (r, i) {
      var d = H.DISH_BY_ID[r[0]];
      var medal = i < 3 ? '<span class="medal m' + (i + 1) + '" aria-label="Hạng ' + (i + 1) + '">' + ['🥇', '🥈', '🥉'][i] + '</span>' : '<span class="rank-n">#' + (i + 1) + '</span>';
      return '<li class="rankrow r' + Math.min(i + 1, 4) + '"><a href="#dish-' + d.id + '">' + medal + H.ui.tile(d, 'md') +
        '<strong>' + esc(d.name) + '</strong><span class="rank-c"><b>' + r[1] + '</b><small>' + unit + '</small></span></a></li>';
    }).join('') + '</ol>';
  }

  H.views.rank = {
    title: 'Bảng xếp hạng',
    render: function () {
      var tab = H.ui.rankTab;
      var mine = H.myRank();
      var now = new Date();
      var body;
      if (tab === 'mine') {
        if (!mine.length) {
          body = H.ui.empty({ title: 'Bạn chưa chốt món nào', text: 'Quay vòng quay rồi nhấn “Chốt món này”, món đó sẽ lên bảng xếp hạng của bạn.',
            action: '<a class="btn btn-primary" href="#home">' + H.icon('wheel', { size: 18 }) + 'Quay món ngay</a>' });
        } else {
          var recent = H.state.log.slice(-6).reverse();
          body = rankRows(mine.slice(0, 10), 'lần chốt') +
            '<section class="block"><h2>Gần đây</h2><ul class="rows">' + recent.map(function (l) {
              var d = H.DISH_BY_ID[l.id]; if (!d) return '';
              var date = U.parse(l.date);
              return '<li><a class="row" href="#dish-' + d.id + '">' + H.ui.tile(d, 'sm') + '<span class="row-main"><strong>' + esc(d.name) + '</strong><small>' +
                U.WD_LONG[date.getDay()] + ' ' + U.fmtDM(date) + ' · ' + H.SLOTS.filter(function (s) { return s.id === l.slot; })[0].label + '</small></span></a></li>';
            }).join('') + '</ul></section>';
        }
      } else {
        body = '<p class="note">' + H.icon('info', { size: 16 }) + '<span><strong>Số liệu minh hoạ.</strong> Đây là bảng xếp hạng mẫu để bạn hình dung. Khi có máy chủ, số lần chốt sẽ tính từ tất cả người dùng.</span></p>' + rankRows(H.DEMO_RANK, 'lần chốt');
      }
      return '<div class="rank">' +
        '<div class="rank-top"><button type="button" class="btn-icon round" data-act="back-rank" aria-label="Quay lại">' + H.icon('chev-l', { size: 20 }) + '</button>' +
        '<div class="rank-title"><h1>Bảng xếp hạng</h1><p>' + U.fmtDMY(now) + ' · ' + U.pad2(now.getHours()) + ':' + U.pad2(now.getMinutes()) + '</p></div>' +
        '<span class="rank-trophy" aria-hidden="true">' + H.icon('trophy', { size: 26 }) + '</span></div>' +
        '<div class="seg two" role="tablist" aria-label="Loại bảng xếp hạng">' +
        '<button type="button" role="tab" class="seg-i' + (tab === 'demo' ? ' on' : '') + '" aria-selected="' + (tab === 'demo') + '" data-act="rank-tab" data-v="demo">Cộng đồng (minh hoạ)</button>' +
        '<button type="button" role="tab" class="seg-i' + (tab === 'mine' ? ' on' : '') + '" aria-selected="' + (tab === 'mine') + '" data-act="rank-tab" data-v="mine">Của tôi</button></div>' +
        '<div class="rank-body">' + body + '</div></div>';
    }
  };
  H.actions['rank-tab'] = function (el) { H.ui.rankTab = el.dataset.v; H.render({ keepScroll: true }); };
  H.actions['back-rank'] = function () { H.back('home'); };
})(window.HNAG = window.HNAG || {});
