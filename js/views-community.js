/* Cộng đồng chia sẻ (bản demo lưu trên máy) và bảng xếp hạng món được chốt. */
(function (H) {
  'use strict';

  var U = H.util, esc = U.esc;

  var draft = { name: '', tag: 'Món ăn', stage: null, text: '' };

  function stageInfo(id) { return H.STAGES.filter(function (s) { return s.id === id; })[0]; }

  function timeLabel(ts) {
    if (!ts) return 'Bài mẫu';
    var diff = Date.now() - ts;
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' phút trước';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' giờ trước';
    return U.fmtDMY(new Date(ts));
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
      '<p class="post-text">' + esc(p.text) + '</p>' +
      '<div class="post-foot">' +
      '<button type="button" class="like' + (liked ? ' on' : '') + '" data-act="like" data-id="' + esc(p.id) + '" aria-pressed="' + liked + '">' + H.icon('thumb', { size: 16, fill: liked }) + 'Hữu ích <b>' + count + '</b></button>' +
      (p.sample ? '<span class="sample-note">Mẹo mẫu của trang, không phải lời kể của người thật</span>' : '') +
      (p.mine ? '<button type="button" class="link-btn danger" data-act="del-post" data-id="' + esc(p.id) + '">' + H.icon('trash', { size: 14 }) + 'Xoá</button>' : '') +
      '</div></li>';
  }

  function composer() {
    var stage = draft.stage || H.state.profile.stage;
    return '<section class="composer" aria-labelledby="comp-t"><h2 id="comp-t">Chia sẻ với mọi người</h2>' +
      '<label class="label" for="post-name">Tên hiển thị <small>(không bắt buộc)</small></label>' +
      '<input id="post-name" class="input" maxlength="24" placeholder="VD: Minh năm 2" value="' + esc(draft.name) + '" data-input="post-name" autocomplete="off">' +
      '<div class="label">Chủ đề</div><div class="chips" role="group" aria-label="Chủ đề">' + H.COMMUNITY_TAGS.map(function (t) {
        return H.ui.chip(esc(t), draft.tag === t, 'post-tag', { v: t });
      }).join('') + '</div>' +
      '<div class="label">Giai đoạn của bạn</div><div class="chips" role="group" aria-label="Giai đoạn">' + H.STAGES.map(function (s) {
        return H.ui.chip(s.emoji + ' ' + esc(s.short), stage === s.id, 'post-stage', { v: s.id });
      }).join('') + '</div>' +
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

  H.views.community = {
    title: 'Cộng đồng',
    render: function () {
      var posts = H.allPosts();
      return '<div class="community">' +
        H.ui.pageHead('CỘNG ĐỒNG', 'Cùng chia sẻ cho dạ dày vui', 'Nơi các bạn sinh viên cùng tình trạng trao đổi món ăn, mẹo nấu và kinh nghiệm.') +
        '<p class="note">' + H.icon('info', { size: 16 }) + '<span><strong>Bản thử nghiệm:</strong> bài viết hiện chỉ lưu trên thiết bị của bạn và chưa hiển thị cho người khác. Khi có máy chủ, mọi người sẽ thấy bài của nhau.</span></p>' +
        '<div class="community-grid"><div class="community-main">' + composer() +
        '<ul class="posts" aria-label="Bài viết">' + posts.map(postCard).join('') + '</ul></div>' +
        '<aside class="community-side">' + topThree() + '</aside></div>' +
        H.ui.disclaimer() + '</div>';
    }
  };

  H.inputs['post-name'] = function (el) { draft.name = el.value; };
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
    H.addPost({ name: draft.name.trim() || 'Ẩn danh', tag: draft.tag, stage: draft.stage || H.state.profile.stage, text: t });
    draft = { name: draft.name, tag: 'Món ăn', stage: null, text: '' };
    H.toast('Đã đăng bài (chỉ lưu trên máy bạn)', { icon: 'check' });
    H.render({ keepScroll: true });
  };
  H.actions.like = function (el) { H.toggleLike(el.dataset.id); H.render({ keepScroll: true }); };
  H.actions['del-post'] = function (el) {
    var id = el.dataset.id;
    H.confirm({ title: 'Xoá bài viết?', text: 'Bài viết sẽ bị xoá khỏi thiết bị này.', ok: 'Xoá', danger: true,
      onOk: function () { H.deletePost(id); H.render({ keepScroll: true }); } });
  };

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
