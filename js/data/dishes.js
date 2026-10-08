/*
 * Danh sách món ăn.
 *
 * Mỗi món có:
 *  - care   : mức "dịu" cho dạ dày.  1 = rất dịu (dùng được cả khi đang đau cấp)
 *                                      2 = dịu (khi đã đỡ dần)
 *                                      3 = vừa (chỉ khi đã ổn định, thử từng chút)
 *  - meals  : bữa phù hợp (sang | trua | toi | phu)
 *  - tools  : dụng cụ nấu, chỉ cần có MỘT trong các dụng cụ này là làm được ('khong' = không cần nấu)
 *  - ing    : [[mã nguyên liệu, số lượng], ...] (mã trong ingredients.js)
 *  - base   : 'com' = tự thêm 60g gạo + bước nấu cơm mềm
 *  - swaps  : [[thành phần, thay bằng, lý do], ...]
 *  - mode   : 'home' (nấu tại nhà) | 'out' (ăn ngoài: có mục order / avoid thay cho công thức)
 *
 * Chi phí (cost) được tính tự động từ nguyên liệu. Veg (chay = không thịt, không cá) cũng tự suy ra.
 * Năng lượng (kcal) là ước tính cho 1 người / 1 bữa.
 */
(function (H) {
  'use strict';

  var COM = 'Vo gạo, nấu cơm mềm hơn thường một chút (cho nhiều hơn khoảng 10% nước) bằng nồi cơm điện.';
  var CHAO = 'Vo gạo, cho vào nồi cùng khoảng 500ml nước. Nấu lửa vừa (hoặc chế độ nấu cháo của nồi cơm điện) 25–30 phút, thỉnh thoảng khuấy, đến khi hạt gạo nở bung và cháo sánh mịn.';

  var RAW = [
    // ───────────── CHÁO & ĐIỂM TÂM ─────────────
    {
      id: 'chao-thit-bam', name: 'Cháo thịt bằm', emoji: '🥣', kind: 'Cháo',
      meals: ['sang', 'toi'], care: 1, time: 30, kcal: 290, tools: ['noi-com', 'bep'],
      ing: [['gao', 50], ['thit-nac', 60], ['ca-rot', 30], ['hanh-la', 5], ['muoi', 0.25]],
      steps: [
        CHAO,
        'Ướp thịt nạc băm với ¼ thìa cà phê muối trong 5 phút. Cà rốt gọt vỏ, bào nhỏ. Hành lá chỉ lấy phần lá xanh, thái nhỏ.',
        'Khi cháo đã nhừ, cho thịt và cà rốt vào, khuấy đều, nấu thêm 8–10 phút đến khi thịt chín kỹ, cà rốt mềm.',
        'Nêm nhạt, tắt bếp, rắc hành lá. Để nguội bớt cho ấm vừa miệng rồi ăn.'
      ],
      why: 'Cháo nhừ mềm, ít xơ thô và gần như không có chất béo nên dạ dày không phải co bóp nhiều khi tiêu hoá. Thịt nạc băm nhỏ cung cấp đạm mà ít mỡ.',
      tip: 'Không phi hành tỏi, không tiêu, không ớt. Có thể thay thịt heo bằng ức gà băm. Ăn ấm, nhai chậm.',
      swaps: [['Hành lá', 'Bỏ hẳn khi đang đau cấp', 'Cháo trắng với thịt vẫn đủ vị nhờ vị ngọt của thịt và cà rốt']]
    },
    {
      id: 'chao-ga', name: 'Cháo gà xé', emoji: '🍲', kind: 'Cháo',
      meals: ['sang', 'trua', 'toi'], care: 1, time: 35, kcal: 320, tools: ['noi-com', 'bep'],
      ing: [['gao', 50], ['uc-ga', 100], ['gung', 3], ['hanh-la', 5], ['muoi', 0.25]],
      steps: [
        'Rửa ức gà, luộc với 2–3 lát gừng mỏng và khoảng 700ml nước trong 12–15 phút đến khi chín kỹ. Vớt gà ra, để nguội rồi xé nhỏ theo thớ.',
        'Gạn nước luộc gà qua rây, vớt bỏ bọt và lớp mỡ nổi. Dùng phần nước này để nấu cháo.',
        'Vo gạo, nấu với nước luộc gà (thêm nước nếu thiếu) khoảng 25 phút đến khi cháo nhừ.',
        'Cho gà xé vào, nấu thêm 3 phút, nêm muối nhạt, rắc hành lá rồi tắt bếp.'
      ],
      why: 'Ức gà bỏ da là nguồn đạm nạc, ít béo. Nước luộc gà đã gạn mỡ cho cháo vị ngọt tự nhiên nên không cần hạt nêm hay gia vị mạnh.',
      tip: 'Gừng chỉ dùng vài lát mỏng khi luộc rồi vớt bỏ. Nếu bạn thấy nóng rát thì bỏ luôn gừng.',
      swaps: [['Gừng', 'Bỏ hẳn, thêm vài cọng hành lá nấu cùng', 'Tránh nóng rát khi đang đau']]
    },
    {
      id: 'chao-ca', name: 'Cháo cá phi lê', emoji: '🐟', kind: 'Cháo',
      meals: ['sang', 'trua', 'toi'], care: 1, time: 35, kcal: 300, tools: ['noi-com', 'bep'],
      ing: [['gao', 50], ['ca-phi-le', 100], ['gung', 3], ['hanh-la', 5], ['ca-rot', 20], ['muoi', 0.25]],
      steps: [
        CHAO,
        'Trong lúc nấu cháo, xếp cá phi lê lên đĩa cùng 2 lát gừng mỏng, hấp 8–10 phút đến khi cá chín trắng. Để nguội, gỡ thành miếng nhỏ và kiểm tra kỹ không còn xương.',
        'Cà rốt bào nhỏ, cho vào cháo khi gần nhừ, nấu thêm 5 phút.',
        'Thả cá vào, nấu thêm 2–3 phút. Nêm nhạt, rắc hành lá.'
      ],
      why: 'Cá trắng ít béo, thịt mềm và dễ tiêu. Hấp trước giúp cá không tanh mà không cần chiên hay thêm gia vị nặng.',
      tip: 'Dùng cá phi lê (basa, diêu hồng) để không lo xương. Không ăn kèm nước mắm ớt, tiêu hay chanh.',
      swaps: [['Gừng', 'Bỏ nếu thấy nóng rát', 'Cá phi lê hấp vẫn ngọt, ít tanh']]
    },
    {
      id: 'chao-bi-do-dau-hu', name: 'Cháo bí đỏ đậu hũ', emoji: '🎃', kind: 'Cháo',
      meals: ['sang', 'toi'], care: 1, time: 30, kcal: 250, tools: ['noi-com', 'bep'],
      ing: [['gao', 50], ['bi-do', 100], ['dau-hu', 60], ['hanh-la', 3], ['muoi', 0.25]],
      steps: [
        CHAO,
        'Bí đỏ gọt vỏ, cắt hạt lựu nhỏ. Đậu hũ cắt khối vuông nhỏ.',
        'Khi cháo đã nở, cho bí đỏ vào nấu 10–12 phút đến khi bí mềm tan, dùng muỗng dằm nhẹ cho cháo sánh.',
        'Thả đậu hũ vào, nấu thêm 3 phút. Nêm nhạt, rắc hành lá.'
      ],
      why: 'Bí đỏ nấu chín mềm, vị ngọt dịu, ít kích thích. Đậu hũ non bổ sung đạm thực vật mà không béo.',
      tip: 'Món chay (không thịt, không cá). Nếu ăn được trứng, đánh thêm 1 quả vào cháo cho đủ đạm hơn.',
      swaps: []
    },
    {
      id: 'chao-trung-ca-rot', name: 'Cháo trứng cà rốt', emoji: '🥚', kind: 'Cháo',
      meals: ['sang', 'toi'], care: 1, time: 25, kcal: 290, tools: ['noi-com', 'bep'],
      ing: [['gao', 50], ['trung-ga', 1], ['ca-rot', 30], ['hanh-la', 3], ['muoi', 0.25]],
      steps: [
        CHAO,
        'Cà rốt bào nhỏ, cho vào cháo khi gần nhừ, nấu thêm 5 phút.',
        'Đánh tan trứng. Khi cháo sôi nhẹ, đổ trứng thành dòng mỏng vào, khuấy nhẹ cho thành sợi và nấu thêm 2 phút để trứng chín hẳn.',
        'Nêm nhạt, rắc hành lá.'
      ],
      why: 'Trứng chín kỹ mềm, dễ tiêu và giàu đạm. Cháo nhừ giúp dạ dày nhẹ việc.',
      tip: 'Trứng phải chín hẳn, không ăn lòng đào. Không thêm tiêu, nước mắm cay hay ruốc.',
      swaps: []
    },
    {
      id: 'yen-mach-chuoi', name: 'Yến mạch nấu chuối', emoji: '🌾', kind: 'Điểm tâm',
      meals: ['sang', 'phu'], care: 1, time: 8, kcal: 280, tools: ['vi-song', 'bep'],
      ing: [['yen-mach', 40], ['chuoi', 1], ['sua-dau-nanh', 1]],
      steps: [
        'Cho yến mạch cán dẹt và 1 hộp sữa đậu nành (hoặc 200ml nước ấm) vào tô chịu nhiệt hoặc nồi nhỏ.',
        'Lò vi sóng 2–3 phút (khuấy giữa chừng) hoặc nấu bếp lửa nhỏ 5 phút, khuấy đều đến khi sánh mềm.',
        'Bóc chuối chín, cắt lát hoặc dằm nhẹ rồi trộn vào. Ăn khi còn ấm.'
      ],
      why: 'Yến mạch nấu mềm có chất xơ hoà tan, dễ chịu và no lâu. Chuối chín mềm, ít chua nên hiếm khi gây rát.',
      tip: 'Nếu uống sữa đậu nành dễ đầy hơi, nấu bằng nước lọc. Chọn yến mạch trơn, không đường, không hương liệu.',
      swaps: [['Sữa đậu nành', 'Nước lọc ấm', 'Nếu bạn dễ đầy hơi với đậu nành']]
    },

    // ───────────── SÚP & CANH ─────────────
    {
      id: 'sup-bi-do', name: 'Súp bí đỏ nghiền', emoji: '🫕', kind: 'Món canh',
      meals: ['trua', 'toi', 'phu'], care: 1, time: 25, kcal: 300, tools: ['bep'],
      ing: [['bi-do', 200], ['khoai-tay', 60], ['trung-ga', 1], ['banh-mi-sw', 2], ['muoi', 0.25]],
      steps: [
        'Bí đỏ và khoai tây gọt vỏ, cắt miếng nhỏ. Cho vào nồi với khoảng 400ml nước, nấu 15 phút đến khi mềm nhừ.',
        'Luộc 1 quả trứng chín kỹ (10 phút), bóc vỏ, thái lát.',
        'Dằm thật mịn bí và khoai bằng máy xay cầm tay hoặc muỗng, nấu lại cho sôi nhẹ 2 phút. Nêm nhạt.',
        'Múc ra tô, xếp trứng lên trên. Ăn kèm bánh mì sandwich mềm (cắt bỏ viền cứng nếu thấy cộm).'
      ],
      why: 'Súp nghiền mịn gần như không cần nhai nên dạ dày ít phải làm việc. Bí đỏ và khoai tây ngọt dịu, không chua, không cay.',
      tip: 'Không cho kem béo hay bơ. Muốn sánh hơn thì thêm khoai tây, đừng thêm sữa nguyên kem.',
      swaps: []
    },
    {
      id: 'sup-khoai-tay-ca-rot', name: 'Súp khoai tây cà rốt đậu hũ', emoji: '🥔', kind: 'Món canh',
      meals: ['trua', 'toi', 'phu'], care: 1, time: 25, kcal: 290, tools: ['bep'],
      ing: [['khoai-tay', 150], ['ca-rot', 60], ['dau-hu', 80], ['banh-mi-sw', 2], ['muoi', 0.25]],
      steps: [
        'Khoai tây, cà rốt gọt vỏ, cắt nhỏ, nấu với khoảng 400ml nước 15 phút đến nhừ.',
        'Dằm hoặc xay thô cho sánh, giữ lại ít miếng nhỏ cho đỡ ngán.',
        'Cho đậu hũ cắt hạt lựu vào, nấu thêm 3 phút. Nêm nhạt.',
        'Ăn ấm cùng bánh mì sandwich mềm.'
      ],
      why: 'Khoai tây và cà rốt nấu nhừ mềm, vị ngọt tự nhiên. Đậu hũ non thêm đạm mà không béo.',
      tip: 'Món chay (không thịt, không cá). Không thêm phô mai hay bơ.',
      swaps: []
    },
    {
      id: 'canh-bi-xanh-thit-bam', name: 'Canh bí xanh thịt bằm', emoji: '🥒', kind: 'Món canh', base: 'com',
      meals: ['trua', 'toi'], care: 1, time: 30, kcal: 350, tools: ['noi-com', 'bep'],
      ing: [['bi-xanh', 150], ['thit-nac', 60], ['hanh-la', 3], ['muoi', 0.25]],
      steps: [
        'Bí xanh gọt vỏ, bỏ phần ruột có hạt, thái miếng mỏng. Thịt nạc băm, ướp ¼ thìa cà phê muối 5 phút rồi vo viên nhỏ.',
        'Đun sôi khoảng 400ml nước, thả thịt viên vào nấu 5 phút, vớt bọt.',
        'Cho bí xanh vào nấu 8–10 phút đến khi bí mềm trong. Nêm nhạt, rắc hành lá rồi tắt bếp.'
      ],
      why: 'Bí xanh mềm, nhiều nước và vị thanh, nấu chín gần như tan nên rất nhẹ bụng. Canh không dầu mỡ, không gia vị kích thích.',
      tip: 'Không phi hành tỏi, không tiêu. Thịt nạc có thể thay bằng ức gà băm. Ăn kèm cơm mềm, nhai kỹ.',
      swaps: [['Hành lá', 'Bỏ nếu đang đau cấp', 'Canh bí vẫn ngọt nhờ thịt']]
    },
    {
      id: 'canh-su-su-ca-rot', name: 'Canh su su cà rốt thịt nạc', emoji: '🥕', kind: 'Món canh', base: 'com',
      meals: ['trua', 'toi'], care: 1, time: 35, kcal: 360, tools: ['noi-com', 'bep'],
      ing: [['su-su', 120], ['ca-rot', 50], ['thit-nac', 60], ['hanh-la', 3], ['muoi', 0.25]],
      steps: [
        'Su su gọt vỏ (nhựa su su dễ làm ngứa tay, nên ngâm nước hoặc đeo găng), bỏ ruột, thái miếng mỏng. Cà rốt thái lát mỏng. Thịt nạc băm, ướp chút muối.',
        'Đun sôi khoảng 400ml nước, cho cà rốt vào nấu 5 phút, thả thịt viên nấu thêm 5 phút.',
        'Cho su su vào nấu 10–12 phút đến khi mềm. Nêm nhạt, rắc hành lá.'
      ],
      why: 'Su su và cà rốt nấu mềm ít xơ thô, vị ngọt tự nhiên nên canh đậm đà mà không cần hạt nêm.',
      tip: 'Cà rốt thái mỏng hoặc bào để nhanh mềm. Không phi hành tỏi, không tiêu.',
      swaps: []
    },
    {
      id: 'canh-muop-thit-bam', name: 'Canh mướp thịt bằm', emoji: '🌿', kind: 'Món canh', base: 'com',
      meals: ['trua', 'toi'], care: 1, time: 25, kcal: 340, tools: ['noi-com', 'bep'],
      ing: [['muop', 150], ['thit-nac', 60], ['hanh-la', 3], ['muoi', 0.25]],
      steps: [
        'Mướp gọt vỏ, rửa sạch, cắt khúc vừa ăn. Thịt nạc băm, ướp chút muối rồi vo viên nhỏ.',
        'Đun sôi khoảng 400ml nước, thả thịt viên vào nấu 5 phút, vớt bọt.',
        'Cho mướp vào nấu 5–7 phút đến khi vừa mềm (đừng nấu quá lâu kẻo nhũn). Nêm nhạt, rắc hành lá.'
      ],
      why: 'Mướp mềm, ngọt thanh và nhiều nước, chín rất nhanh nên giữ được vị ngọt mà không cần nêm nhiều.',
      tip: 'Chọn mướp non, gọt sạch vỏ. Không thêm tiêu hay ớt.',
      swaps: []
    },
    {
      id: 'canh-bi-do-thit-bam', name: 'Canh bí đỏ thịt bằm', emoji: '🍲', kind: 'Món canh', base: 'com',
      meals: ['trua', 'toi'], care: 1, time: 30, kcal: 370, tools: ['noi-com', 'bep'],
      ing: [['bi-do', 150], ['thit-nac', 60], ['hanh-la', 3], ['muoi', 0.25]],
      steps: [
        'Bí đỏ gọt vỏ, bỏ hạt, cắt miếng nhỏ. Thịt nạc băm, ướp chút muối rồi vo viên.',
        'Đun sôi khoảng 400ml nước, thả thịt viên vào nấu 5 phút, vớt bọt.',
        'Cho bí đỏ vào nấu 10–12 phút đến khi nhừ, nước canh hơi sánh. Nêm nhạt, rắc hành lá.'
      ],
      why: 'Bí đỏ nấu nhừ có vị ngọt dịu, hoà vào nước canh làm canh sánh nhẹ nên không cần thêm gia vị.',
      tip: 'Dùng muỗng dằm bớt bí cho canh mịn hơn nếu bạn đang đau. Không phi hành tỏi.',
      swaps: []
    },
    {
      id: 'canh-bap-cai-thit-bam', name: 'Canh bắp cải thịt bằm', emoji: '🥬', kind: 'Món canh', base: 'com',
      meals: ['trua', 'toi'], care: 2, time: 30, kcal: 345, tools: ['noi-com', 'bep'],
      ing: [['bap-cai', 150], ['thit-nac', 60], ['ca-rot', 30], ['hanh-la', 3], ['muoi', 0.25]],
      steps: [
        'Bắp cải bỏ cuống cứng, thái sợi nhỏ. Cà rốt bào nhỏ. Thịt nạc băm, ướp chút muối.',
        'Đun sôi khoảng 400ml nước, cho thịt và cà rốt vào nấu 5 phút, vớt bọt.',
        'Cho bắp cải vào nấu ít nhất 10 phút đến khi thật mềm. Nêm nhạt, rắc hành lá.'
      ],
      why: 'Bắp cải nấu thật mềm có vị ngọt tự nhiên, không cần nêm đậm.',
      tip: 'Dân gian hay truyền tai bắp cải "tốt cho dạ dày" nhưng chưa có đủ bằng chứng. Bắp cải có thể gây đầy hơi ở vài người, nên ăn lượng vừa và nấu kỹ.',
      swaps: [['Bắp cải', 'Su su hoặc bí xanh', 'Nếu bạn hay bị đầy hơi sau khi ăn bắp cải']]
    },
    {
      id: 'canh-cai-ngot-thit-bam', name: 'Canh cải ngọt thịt bằm', emoji: '🥬', kind: 'Món canh', base: 'com',
      meals: ['trua', 'toi'], care: 3, time: 25, kcal: 340, tools: ['noi-com', 'bep'],
      ing: [['cai-ngot', 120], ['thit-nac', 60], ['hanh-la', 3], ['muoi', 0.25]],
      steps: [
        'Cải ngọt chọn lá non, bỏ cọng già, rửa kỹ, cắt khúc ngắn. Thịt nạc băm, ướp chút muối.',
        'Đun sôi khoảng 400ml nước, thả thịt băm vào nấu 5 phút, vớt bọt.',
        'Cho cải vào nấu 4–5 phút đến khi rau mềm. Nêm nhạt, tắt bếp.'
      ],
      why: 'Cải ngọt lá non nấu chín mềm, vị ngọt nhẹ, dễ ăn khi dạ dày đã ổn định và cần thêm rau xanh.',
      tip: 'Rau lá nhiều xơ nên chưa hợp khi đang đau cấp. Chọn lá non, nấu mềm và nhai kỹ.',
      swaps: [['Cải ngọt', 'Bí xanh hoặc su su', 'Khi đang đau, ưu tiên rau củ ít xơ']]
    },

    // ───────────── MÓN MẶN ─────────────
    {
      id: 'trung-hap-thit-bam', name: 'Trứng hấp thịt bằm nấm', emoji: '🍳', kind: 'Món mặn', base: 'com',
      meals: ['trua', 'toi'], care: 1, time: 25, kcal: 400, tools: ['noi-com', 'bep'],
      ing: [['trung-ga', 2], ['thit-nac', 40], ['nam', 30], ['hanh-la', 3], ['muoi', 0.25]],
      steps: [
        'Nấm rửa sạch, thái nhỏ, trộn với thịt bằm và một chút muối.',
        'Đánh trứng với khoảng 100ml nước ấm và chút muối, lọc qua rây cho trứng mịn.',
        'Cho hỗn hợp thịt nấm vào tô chịu nhiệt, đổ trứng lên, đậy một đĩa nhỏ để hơi nước không rơi vào.',
        'Hấp 10–12 phút lửa nhỏ (đặt tô lên vỉ trong nồi cơm điện khi cơm đã sôi, hoặc dùng nồi hấp) đến khi trứng đông mịn. Rắc hành lá.'
      ],
      why: 'Trứng hấp mềm mịn, không dầu mỡ, đạm dễ hấp thu. Hấp là cách nấu nhẹ nhất cho dạ dày.',
      tip: 'Hấp lửa nhỏ để trứng mịn, không bị rỗ. Không chiên trứng, không thêm tiêu hay nước mắm cay.',
      swaps: []
    },
    {
      id: 'dau-hu-hap-thit-bam', name: 'Đậu hũ non hấp thịt bằm', emoji: '🥘', kind: 'Món mặn', base: 'com',
      meals: ['trua', 'toi'], care: 1, time: 25, kcal: 340, tools: ['noi-com', 'bep'],
      ing: [['dau-hu', 150], ['thit-nac', 50], ['nam', 30], ['hanh-la', 3], ['nuoc-tuong', 0.5]],
      steps: [
        'Trộn thịt bằm với nấm thái nhỏ và một chút muối.',
        'Cắt đậu hũ non thành khối, xếp vào đĩa sâu lòng, phủ hỗn hợp thịt nấm lên trên.',
        'Hấp 10 phút (đặt trên vỉ trong nồi cơm điện hoặc nồi hấp) đến khi thịt chín.',
        'Rưới nửa thìa cà phê nước tương pha loãng với 1 thìa nước ấm, rắc hành lá.'
      ],
      why: 'Đậu hũ non mềm và thịt nạc hấp chín giữ được vị ngọt, không cần dầu hay gia vị cay.',
      tip: 'Nước tương dùng cực ít (hoặc bỏ). Rửa đậu hũ sạch trước khi dùng, chọn loại còn hạn.',
      swaps: [['Nước tương', 'Một chút muối nhạt', 'Giảm vị mặn']]
    },
    {
      id: 'com-ga-luoc-rau-cu', name: 'Cơm gà luộc rau củ', emoji: '🍗', kind: 'Món mặn', base: 'com',
      meals: ['trua', 'toi'], care: 1, time: 30, kcal: 450, tools: ['noi-com', 'bep'],
      ing: [['uc-ga', 120], ['ca-rot', 50], ['bi-do', 60], ['gung', 3], ['muoi', 0.25]],
      steps: [
        'Luộc ức gà với 2 lát gừng mỏng trong 12–15 phút đến chín kỹ. Vớt ra, để nguội rồi xé sợi, bỏ gừng.',
        'Cà rốt và bí đỏ cắt miếng vừa, luộc hoặc hấp 10–12 phút đến mềm.',
        'Trộn gà xé với một chút nước luộc gà và muối nhạt. Bày cùng rau củ và cơm.'
      ],
      why: 'Ức gà luộc và rau củ nấu mềm là bữa ăn gọn nhẹ: ít béo, không gia vị mạnh, vẫn đủ đạm và tinh bột.',
      tip: 'Không chấm nước mắm ớt hay chanh. Uống vài ngụm nước ấm sau bữa và đừng nằm ngay.',
      swaps: [['Gừng', 'Bỏ hẳn', 'Nếu bạn thấy nóng rát']]
    },
    {
      id: 'khoai-tay-nghien-ga', name: 'Khoai tây nghiền gà xé', emoji: '🥔', kind: 'Món mặn',
      meals: ['trua', 'toi'], care: 1, time: 30, kcal: 380, tools: ['bep', 'vi-song'],
      ing: [['khoai-tay', 200], ['uc-ga', 100], ['ca-rot', 40], ['muoi', 0.25]],
      steps: [
        'Khoai tây gọt vỏ, cắt miếng nhỏ. Cà rốt gọt vỏ, cắt hạt lựu. Luộc cùng nhau 15 phút đến mềm nhừ (hoặc cho vào tô, thêm ít nước, đậy kín, lò vi sóng 8 phút).',
        'Luộc ức gà 12–15 phút đến chín kỹ, để nguội, xé nhỏ.',
        'Dằm khoai khi còn nóng, thêm 3–4 thìa canh nước luộc gà cho mềm mịn. Trộn cà rốt vào.',
        'Rắc gà xé lên trên, nêm nhạt.'
      ],
      why: 'Khoai nghiền mềm mịn, tinh bột dễ tiêu, không dầu mỡ. Gà luộc là đạm nạc ít béo.',
      tip: 'Không cho bơ, sữa nguyên kem hay phô mai như món Tây. Dùng nước luộc gà để dằm mềm.',
      swaps: []
    },
    {
      id: 'ca-hap-gung-hanh', name: 'Cá hấp gừng hành', emoji: '🐟', kind: 'Món mặn', base: 'com',
      meals: ['trua', 'toi'], care: 2, time: 30, kcal: 400, tools: ['noi-com', 'bep'],
      ing: [['ca-phi-le', 130], ['gung', 4], ['hanh-la', 5], ['ca-rot', 40], ['nuoc-tuong', 0.5], ['muoi', 0.25]],
      steps: [
        'Rửa cá phi lê, thấm khô, ướp chút muối và 2 lát gừng mỏng trong 5 phút. Cà rốt thái lát mỏng.',
        'Xếp cá và cà rốt vào đĩa, hấp 8–10 phút đến khi cá chín trắng (đặt trên vỉ trong nồi cơm điện hoặc nồi hấp).',
        'Rưới nước tương pha loãng (không quá nửa thìa cà phê) và rắc hành lá xanh cho chín mềm trong hơi nóng.'
      ],
      why: 'Hấp giữ vị ngọt tự nhiên của cá, không dầu mỡ. Cá trắng ít béo, mềm, dễ tiêu.',
      tip: 'Bỏ gừng nếu thấy nóng rát. Không chấm nước mắm ớt, không thêm tiêu. Gỡ kỹ xương trước khi ăn.',
      swaps: [
        ['Gừng', 'Bỏ hẳn, thêm 1 thìa canh nước luộc gà gạn mỡ vào đĩa hấp', 'Tránh nóng rát'],
        ['Nước tương', 'Muối nhạt', 'Giảm vị mặn']
      ]
    },
    {
      id: 'thit-nac-rim-nhat', name: 'Thịt nạc rim nhạt', emoji: '🥩', kind: 'Món mặn', base: 'com',
      meals: ['trua', 'toi'], care: 2, time: 35, kcal: 430, tools: ['bep'],
      ing: [['thit-nac', 100], ['ca-rot', 60], ['hanh-la', 3], ['nuoc-mam', 1], ['duong', 0.5]],
      steps: [
        'Thái thịt nạc thăn thành miếng vuông nhỏ, ướp 1 thìa cà phê nước mắm và nửa thìa cà phê đường trong 10 phút. Cà rốt cắt khối nhỏ.',
        'Cho thịt, cà rốt và khoảng 150ml nước vào nồi nhỏ, đun sôi rồi hạ lửa nhỏ.',
        'Om 15–20 phút đến khi thịt mềm và nước sệt lại, thỉnh thoảng khuấy để không cháy cạnh. Rắc hành lá.'
      ],
      why: 'Thịt thăn là phần nạc, nấu bằng nước với lửa nhỏ nên mềm và ít mỡ. Không chiên, không làm nước màu cháy.',
      tip: 'Không cho ớt, tiêu, tỏi phi. Vớt bỏ váng mỡ nếu có. Nêm thật nhạt.',
      swaps: [['Nước mắm', 'Muối nhạt', 'Nếu bạn thấy nước mắm làm xót']]
    },
    {
      id: 'uc-ga-bong-cai', name: 'Ức gà hấp bông cải', emoji: '🥦', kind: 'Món mặn', base: 'com',
      meals: ['trua', 'toi'], care: 2, time: 30, kcal: 440, tools: ['noi-com', 'bep'],
      ing: [['uc-ga', 120], ['bong-cai', 100], ['ca-rot', 40], ['muoi', 0.25]],
      steps: [
        'Ức gà thái lát mỏng ngang thớ, ướp chút muối 10 phút. Bông cải tách bông nhỏ, cà rốt thái lát.',
        'Xếp gà, bông cải, cà rốt vào đĩa. Hấp 12–15 phút đến khi gà chín kỹ và bông cải thật mềm.',
        'Ăn kèm cơm mềm, chấm một chút nước hấp, không chấm nước mắm ớt.'
      ],
      why: 'Hấp giữ nguyên vị, không dầu mỡ. Ức gà nhiều đạm ít béo, rau củ hấp mềm dễ tiêu hơn rau sống hay rau xào.',
      tip: 'Bông cải phải hấp thật mềm. Ăn lượng vừa nếu bạn hay bị đầy hơi.',
      swaps: [['Bông cải xanh', 'Bí đỏ hoặc su su', 'Nếu bạn hay đầy hơi']]
    },
    {
      id: 'com-ga-nam-noi-com', name: 'Cơm gà nấm nồi cơm điện', emoji: '🍚', kind: 'Món mặn',
      meals: ['trua', 'toi'], care: 2, time: 45, kcal: 520, tools: ['noi-com'],
      ing: [['gao', 80], ['uc-ga', 100], ['nam', 50], ['ca-rot', 40], ['hanh-la', 3], ['nuoc-tuong', 1], ['dau-an', 0.5]],
      steps: [
        'Ức gà thái miếng nhỏ, ướp 1 thìa cà phê nước tương và chút muối 10 phút. Nấm và cà rốt thái hạt lựu.',
        'Vo gạo, cho vào nồi cơm điện, thêm nước nhiều hơn bình thường khoảng 20% để cơm mềm.',
        'Xếp gà, nấm, cà rốt lên mặt gạo, thêm nửa thìa cà phê dầu ăn, đậy nắp và nấu như cơm thường.',
        'Khi cơm chín, ủ thêm 5 phút rồi xới đều, rắc hành lá.'
      ],
      why: 'Món một nồi, không chiên xào, cơm mềm mà đủ đạm và rau. Rất tiện cho phòng trọ chỉ có nồi cơm điện.',
      tip: 'Nước tương dùng rất ít, không thêm tiêu, ớt, tỏi phi. Nếu cơm còn cứng, thêm chút nước ấm và ủ lại.',
      swaps: [['Nước tương', 'Muối nhạt', 'Giảm vị mặn']]
    },
    {
      id: 'bo-ham-ca-rot-khoai-tay', name: 'Bò hầm cà rốt khoai tây', emoji: '🍖', kind: 'Món mặn', base: 'com',
      meals: ['trua', 'toi'], care: 3, time: 70, kcal: 540, tools: ['bep', 'noi-com'],
      ing: [['thit-bo-nac', 100], ['ca-rot', 80], ['khoai-tay', 100], ['hanh-la', 3], ['muoi', 0.25]],
      steps: [
        'Thịt bò nạc cắt miếng vừa, chần qua nước sôi 1 phút rồi rửa sạch bọt. Cà rốt, khoai tây gọt vỏ, cắt khối.',
        'Cho thịt vào nồi với khoảng 500ml nước, đun sôi rồi hạ lửa nhỏ, hầm 40–45 phút đến khi thịt mềm (nồi cơm điện chế độ nấu cũng được).',
        'Thêm cà rốt, khoai tây, hầm thêm 15–20 phút. Nêm nhạt, rắc hành lá.'
      ],
      why: 'Bò nạc hầm lâu thì mềm, không cần chiên xào. Rau củ hầm nhừ giúp bữa ăn đầy đặn mà vẫn nhẹ nhàng.',
      tip: 'Hầm nhạt, không rượu, không cà chua, không hồi quế hay tiêu như bò sốt vang. Vớt bỏ váng mỡ. Chỉ nên ăn khi dạ dày đã ổn định.',
      swaps: [['Thịt bò', 'Ức gà', 'Nếu bạn muốn món nhẹ hơn và rẻ hơn']]
    },
    {
      id: 'trung-cuon-rau-cu', name: 'Trứng cuộn rau củ', emoji: '🍳', kind: 'Món mặn', base: 'com',
      meals: ['sang', 'trua', 'toi'], care: 3, time: 20, kcal: 420, tools: ['chao'],
      ing: [['trung-ga', 2], ['ca-rot', 30], ['hanh-la', 3], ['dau-an', 1], ['muoi', 0.25]],
      steps: [
        'Cà rốt bào nhỏ, hành lá thái nhỏ. Đánh trứng với cà rốt, hành lá và chút muối.',
        'Lau chảo chống dính bằng ít dầu (khoảng 1 thìa cà phê), đun lửa nhỏ, đổ một lớp trứng mỏng, khi mặt trên vừa se thì cuộn lại. Làm tiếp phần còn lại.',
        'Cắt khúc vừa ăn, ăn kèm cơm mềm.'
      ],
      why: 'Món có chút dầu nhưng rất ít. Trứng chín mềm, cà rốt thêm vị ngọt. Hợp khi dạ dày đã ổn định và bạn muốn đổi vị.',
      tip: 'Dùng chảo chống dính và lửa nhỏ, không để cháy cạnh. Khi đang đau cấp hãy chọn trứng hấp thay vì trứng chiên.',
      swaps: [['Trứng chiên', 'Trứng hấp', 'Khi đang đau cấp, tránh dầu mỡ']]
    },

    // ───────────── MÓN CHAY ─────────────
    {
      id: 'dau-hu-om-nam', name: 'Đậu hũ om nấm', emoji: '🍄', kind: 'Món chay', base: 'com',
      meals: ['trua', 'toi'], care: 2, time: 25, kcal: 380, tools: ['bep'],
      ing: [['dau-hu', 150], ['nam', 60], ['ca-rot', 30], ['hanh-la', 3], ['nuoc-tuong', 1], ['muoi', 0.25]],
      steps: [
        'Đậu hũ cắt miếng vuông. Nấm (rơm hoặc mỡ) rửa sạch, thái nhỏ. Cà rốt cắt hạt lựu.',
        'Cho nấm, cà rốt và 150ml nước vào nồi nhỏ, đun sôi 5 phút. Nêm 1 thìa cà phê nước tương và chút muối nhạt.',
        'Thả đậu hũ vào, om lửa nhỏ 8–10 phút cho ngấm. Rắc hành lá.'
      ],
      why: 'Đậu hũ và nấm nấu mềm. Vị ngọt tự nhiên từ nấm giúp món vẫn đậm đà dù nêm nhạt, không dầu mỡ.',
      tip: 'Món chay (không thịt, không cá). Thái nấm nhỏ và nấu kỹ để dễ tiêu, tránh nấm kim châm dai khi đang đau.',
      swaps: [['Nước tương', 'Muối nhạt', 'Giảm vị mặn']]
    },
    {
      id: 'dau-hu-sot-ca-chua', name: 'Đậu hũ sốt cà chua', emoji: '🍅', kind: 'Món chay', base: 'com',
      meals: ['trua', 'toi'], care: 3, time: 30, kcal: 400, tools: ['bep'],
      ing: [['dau-hu', 150], ['ca-chua', 1], ['hanh-la', 3], ['duong', 0.5], ['dau-an', 0.5], ['muoi', 0.25]],
      steps: [
        'Cà chua chín đỏ khoét cuống, khía dấu thập, nhúng nước sôi 1 phút rồi lột vỏ, bỏ hạt, băm nhuyễn.',
        'Đậu hũ cắt miếng, luộc sơ 3 phút rồi để ráo (không chiên).',
        'Đun cà chua với 100ml nước và nửa thìa cà phê dầu ăn, lửa nhỏ 10 phút đến khi nhừ sệt. Nêm nửa thìa cà phê đường và chút muối để dịu vị chua.',
        'Thả đậu hũ vào om 5 phút, rắc hành lá.'
      ],
      why: 'Đây là ví dụ cho cách dùng cà chua đúng cách: chín, nấu nhừ, bỏ vỏ và hạt, chỉ dùng ít. Cách này nhẹ hơn nhiều so với cà chua sống hay sốt cà đặc. Tuy vậy cà chua vẫn có vị chua nên món chỉ hợp khi dạ dày đã ổn định.',
      tip: 'Thử một lượng nhỏ trước. Nếu thấy ợ chua hoặc rát, đổi cà chua thành cà rốt + bí đỏ nấu nhừ nghiền (màu cam, vị ngọt, không chua).',
      swaps: [['Cà chua', 'Cà rốt + bí đỏ nấu nhừ, nghiền', 'Không chua nhưng màu và độ sệt tương tự']]
    },

    // ───────────── MÓN NƯỚC ─────────────
    {
      id: 'nui-thit-bam', name: 'Nui thịt bằm cà rốt', emoji: '🍝', kind: 'Món nước',
      meals: ['sang', 'trua', 'toi'], care: 2, time: 25, kcal: 400, tools: ['bep'],
      ing: [['nui', 60], ['thit-nac', 50], ['ca-rot', 40], ['hanh-la', 3], ['muoi', 0.25]],
      steps: [
        'Cà rốt bào sợi nhỏ hoặc cắt hạt lựu nhỏ. Thịt băm, ướp chút muối.',
        'Đun khoảng 400ml nước sôi, cho thịt vào nấu 5 phút, vớt bọt.',
        'Cho nui và cà rốt vào, nấu theo hướng dẫn trên bao bì rồi thêm 2–3 phút cho nui mềm hơn.',
        'Nêm nhạt, rắc hành lá. Ăn ấm.'
      ],
      why: 'Nui mềm trong nước dùng loãng, không dầu, không sốt cà hay gia vị cay. Vẫn có đạm và rau.',
      tip: 'Đừng dùng sốt cà chua đóng hộp hay xúc xích. Nấu hơi mềm hơn bình thường để dễ tiêu.',
      swaps: []
    },
    {
      id: 'mien-ga', name: 'Miến gà nước trong', emoji: '🍲', kind: 'Món nước',
      meals: ['sang', 'trua', 'toi'], care: 2, time: 30, kcal: 380, tools: ['bep'],
      ing: [['mien-dong', 40], ['uc-ga', 100], ['nam', 30], ['hanh-la', 3], ['muoi', 0.25]],
      steps: [
        'Luộc ức gà trong khoảng 600ml nước 12–15 phút đến chín kỹ. Vớt ra, xé nhỏ. Gạn nước luộc qua rây, vớt bỏ bọt và mỡ.',
        'Ngâm miến trong nước ấm 10–15 phút cho mềm.',
        'Đun sôi nước luộc gà, cho nấm thái nhỏ vào nấu 5 phút, thả miến nấu 3 phút.',
        'Cho gà xé vào, nêm nhạt, rắc hành lá.'
      ],
      why: 'Miến mềm trơn, nước dùng gà trong đã gạn mỡ nên nhẹ bụng. Không cần nước màu hay gia vị đậm.',
      tip: 'Không hành phi, không tiêu, ớt, chanh hay giá sống. Nấu miến cho thật mềm.',
      swaps: []
    },
    {
      id: 'pho-ga-nuoc-trong', name: 'Phở gà nước trong', emoji: '🍜', kind: 'Món nước',
      meals: ['sang', 'trua'], care: 2, time: 35, kcal: 420, tools: ['bep'],
      ing: [['banh-pho', 150], ['uc-ga', 100], ['gung', 4], ['hanh-la', 3], ['rau-thom', 3], ['muoi', 0.25]],
      steps: [
        'Luộc ức gà với 2–3 lát gừng trong khoảng 600ml nước 12–15 phút. Vớt gà, để nguội, xé hoặc thái mỏng.',
        'Gạn nước luộc, vớt bọt và mỡ, đun sôi lại và nêm nhạt.',
        'Trụng bánh phở tươi trong nước sôi 20–30 giây, cho vào tô.',
        'Xếp gà lên, chan nước dùng nóng vừa, rắc hành lá và rau thơm thái nhỏ (cho vào lúc cuối cho mềm).'
      ],
      why: 'Nước dùng gà trong, ít béo, nấu nhanh nên không đậm gia vị. Bánh phở mềm, dễ tiêu.',
      tip: 'Bỏ ớt, chanh, tỏi ngâm giấm, giá sống, quẩy. Đừng uống hết nước dùng nóng cùng một lúc.',
      swaps: [['Gừng', 'Bỏ hẳn', 'Nếu bạn thấy nóng rát'], ['Rau thơm', 'Bỏ nếu thấy cộm', 'Phở vẫn thơm nhờ nước luộc gà']]
    },

    // ───────────── ĂN SÁNG / ĂN PHỤ ─────────────
    {
      id: 'banh-mi-trung-luoc', name: 'Bánh mì sandwich trứng luộc', emoji: '🥪', kind: 'Điểm tâm',
      meals: ['sang', 'phu'], care: 2, time: 15, kcal: 390, tools: ['bep', 'noi-com'],
      ing: [['banh-mi-sw', 3], ['trung-ga', 2], ['dua-leo', 40], ['chuoi', 1]],
      steps: [
        'Luộc trứng 10 phút đến chín kỹ, ngâm nước lạnh, bóc vỏ, cắt lát.',
        'Dưa leo gọt vỏ, bỏ phần ruột nhiều hạt, thái lát mỏng.',
        'Kẹp trứng và dưa leo vào bánh mì sandwich mềm (cắt viền cứng nếu thấy cộm). Ăn kèm 1 quả chuối.'
      ],
      why: 'Bánh mì trắng mềm, trứng chín kỹ và chuối chín đều là món hiền, làm nhanh cho buổi sáng bận rộn.',
      tip: 'Không phết tương ớt, pate, mayonnaise hay bơ. Bánh mì ổ giòn có vỏ cứng nên cắt bỏ vỏ hoặc thay bằng sandwich.',
      swaps: [['Dưa leo', 'Bỏ hoặc thay bằng cà rốt luộc thái lát', 'Nếu bạn thấy đầy hơi']]
    },
    {
      id: 'khoai-lang-trung-luoc', name: 'Khoai lang hấp trứng luộc', emoji: '🍠', kind: 'Điểm tâm',
      meals: ['sang', 'phu'], care: 2, time: 25, kcal: 330, tools: ['noi-com', 'bep', 'vi-song'],
      ing: [['khoai-lang', 200], ['trung-ga', 1]],
      steps: [
        'Rửa sạch khoai lang, cắt khúc vừa. Hấp 20 phút (trên vỉ trong nồi cơm điện, nồi hấp, hoặc lò vi sóng 8–10 phút) đến khi mềm.',
        'Luộc trứng 10 phút đến chín kỹ, bóc vỏ.',
        'Bóc vỏ khoai, ăn ấm cùng trứng.'
      ],
      why: 'Khoai lang hấp mềm, tinh bột chậm, no lâu mà không cần dầu mỡ.',
      tip: 'Một số người ăn khoai lang bị đầy hơi hoặc ợ chua: bắt đầu với nửa củ và nhai kỹ. Không ăn khoai nướng cháy vỏ.',
      swaps: [['Khoai lang', 'Khoai tây hấp', 'Nếu bạn hay đầy hơi với khoai lang']]
    },
    {
      id: 'sua-dau-nanh-banh-quy', name: 'Sữa đậu nành ấm + bánh quy lạt', emoji: '🥛', kind: 'Ăn vặt',
      meals: ['phu'], care: 2, time: 5, kcal: 190, tools: ['khong'],
      ing: [['sua-dau-nanh', 1], ['banh-quy-lat', 4]],
      steps: [
        'Rót sữa đậu nành ra ly, hâm ấm vừa phải (lò vi sóng 30–40 giây hoặc ngâm ly vào nước nóng). Tránh uống sữa lạnh từ tủ.',
        'Ăn kèm 3–4 miếng bánh quy lạt, nhai chậm.'
      ],
      why: 'Bữa phụ nhẹ giúp dạ dày không bị trống quá lâu mà không gây quá no. Bánh quy lạt ít béo, ít ngọt.',
      tip: 'Chọn sữa ít đường. Tránh bánh quy kem, bánh bơ hay bánh mặn nhiều gia vị.',
      swaps: [['Sữa đậu nành', 'Nước gạo rang ấm', 'Nếu bạn dễ đầy hơi với đậu nành']]
    },
    {
      id: 'chuoi-sua-chua', name: 'Chuối chín + sữa chua không đường', emoji: '🍌', kind: 'Ăn vặt',
      meals: ['phu'], care: 2, time: 3, kcal: 200, tools: ['khong'],
      ing: [['chuoi', 1], ['sua-chua', 1]],
      steps: [
        'Lấy sữa chua ra khỏi tủ lạnh khoảng 10 phút cho bớt lạnh.',
        'Bóc chuối chín, cắt lát, ăn cùng sữa chua và ăn chậm. Nên ăn sau bữa chính 1–2 giờ, không ăn lúc bụng đói cồn cào.'
      ],
      why: 'Chuối chín mềm, ít chua. Sữa chua không đường có lợi khuẩn và được nhiều người dung nạp tốt.',
      tip: 'Các nguồn chưa thống nhất về sữa chua với dạ dày: thử lượng nhỏ, nếu ợ chua hay đầy bụng thì ngưng. Không chọn loại có đường hoặc có trái cây chua.',
      swaps: [['Sữa chua', 'Chuối + yến mạch nấu mềm', 'Nếu sữa chua làm bạn ợ chua']]
    },
    {
      id: 'tao-hap', name: 'Táo hấp', emoji: '🍎', kind: 'Tráng miệng',
      meals: ['phu'], care: 1, time: 15, kcal: 95, tools: ['noi-com', 'bep', 'vi-song'],
      ing: [['tao', 1]],
      steps: [
        'Gọt vỏ táo, bỏ lõi, cắt miếng vừa.',
        'Hấp 8–10 phút (hoặc lò vi sóng có đậy 2–3 phút) đến khi mềm.',
        'Ăn ấm, nhai chậm. Có thể dằm nhuyễn.'
      ],
      why: 'Táo chứa pectin (chất xơ hoà tan). Hấp mềm và gọt vỏ giúp dễ tiêu hơn ăn sống nguyên miếng giòn.',
      tip: 'Không vắt chanh hay thêm nước cốt chanh. Chọn táo ngọt, ít chua.',
      swaps: []
    },
    {
      id: 'du-du-chin', name: 'Đu đủ chín', emoji: '🥭', kind: 'Tráng miệng',
      meals: ['phu'], care: 1, time: 2, kcal: 90, tools: ['khong'],
      ing: [['du-du', 200]],
      steps: [
        'Chọn đu đủ chín vàng, mềm. Gọt vỏ, bỏ hạt, cắt miếng.',
        'Ăn sau bữa chính khoảng 1–2 giờ, ăn từ từ.'
      ],
      why: 'Đu đủ chín mềm, ngọt dịu và ít axit, dễ ăn cả khi khó ăn uống.',
      tip: 'Không ăn đu đủ xanh hay chưa chín. Nếu thấy lạnh bụng, để ở nhiệt độ phòng trước khi ăn.',
      swaps: []
    },

    // ───────────── ĂN NGOÀI (gọi món an toàn) ─────────────
    {
      id: 'out-chao', name: 'Cháo ở quán', emoji: '🥣', kind: 'Ăn ngoài', mode: 'out',
      meals: ['sang', 'trua', 'toi'], care: 1, costFixed: 30000, kcal: 330, tools: ['khong'], mapQuery: 'quán cháo',
      order: [
        'Gọi "cháo thịt bằm" hoặc "cháo gà", nhờ nấu nhừ.',
        'Dặn bỏ hành phi, tiêu, ớt, tỏi phi và không cho quẩy chiên.',
        'Thêm 1 quả trứng luộc chín kỹ hoặc thêm thịt nạc nếu muốn đủ đạm.',
        'Xin tô để nguội bớt trước khi ăn.'
      ],
      avoid: ['Cháo huyết, cháo lòng, cháo sườn (nhiều mỡ, nội tạng)', 'Gừng sợi, hành phi, tiêu rắc lên mặt', 'Chao, nước mắm ớt, dưa muối ăn kèm'],
      why: 'Cháo nấu nhừ rất mềm. Nếu dặn bỏ gia vị kích thích, đây là lựa chọn ăn ngoài dễ nhất cho người đau dạ dày.',
      tip: 'Quán thường nêm đậm. Hãy dặn "nhạt" ngay khi gọi.'
    },
    {
      id: 'out-pho-ga', name: 'Phở gà ở quán', emoji: '🍜', kind: 'Ăn ngoài', mode: 'out',
      meals: ['sang', 'trua'], care: 2, costFixed: 45000, kcal: 430, tools: ['khong'], mapQuery: 'phở gà',
      order: [
        'Gọi "phở gà ức", bỏ da, xin ít nước béo.',
        'Dặn bỏ hành sống, ớt, tỏi ngâm giấm, chanh, giá sống và quẩy.',
        'Rau thơm cho vào lúc cuối, thái nhỏ, hoặc bỏ nếu thấy cộm.',
        'Ăn chậm. Nếu quá no, chia làm hai lần, đừng uống hết nước nóng cùng một lúc.'
      ],
      avoid: ['Phở bò tái, gầu, nạm mỡ (nhiều mỡ, thịt tái)', 'Tương đen, tương ớt, chanh vắt vào tô', 'Quẩy chiên, trứng trần mỡ ăn kèm'],
      why: 'Nước dùng gà trong, ít béo hơn phở bò. Dặn bỏ gia vị kích thích là món ăn ngoài khá ổn.',
      tip: 'Xin nước dùng trong, không cho thêm mỡ gà hay hành phi.'
    },
    {
      id: 'out-mien-ga', name: 'Miến gà ở quán', emoji: '🍲', kind: 'Ăn ngoài', mode: 'out',
      meals: ['sang', 'trua', 'toi'], care: 2, costFixed: 40000, kcal: 390, tools: ['khong'], mapQuery: 'miến gà',
      order: [
        'Gọi "miến gà ức" (không da, không lòng, không gan).',
        'Dặn bỏ hành phi, tiêu, ớt và nước mắm ớt.',
        'Xin thêm nấm nếu có, nước dùng ít béo.',
        'Không ăn kèm giá sống hay rau sống.'
      ],
      avoid: ['Miến lòng gà, miến trộn nhiều mỡ hành', 'Hành phi, tiêu, ớt, chanh', 'Nước mắm ớt chấm kèm'],
      why: 'Miến mềm, nước dùng gà trong. Món ăn ngoài dễ dặn bỏ gia vị kích thích.',
      tip: 'Chọn quán nấu nước dùng trong, không phải quán nêm đậm.'
    },
    {
      id: 'out-com-ga-luoc', name: 'Cơm gà luộc ở quán', emoji: '🍗', kind: 'Ăn ngoài', mode: 'out',
      meals: ['trua', 'toi'], care: 2, costFixed: 45000, kcal: 520, tools: ['khong'], mapQuery: 'cơm gà luộc',
      order: [
        'Xin phần ức gà luộc, bỏ da.',
        'Chọn cơm trắng (không cơm chiên, không cơm mỡ hành).',
        'Thêm rau luộc hoặc canh rau củ nếu có.',
        'Dặn bỏ hành phi, gừng, nước mắm gừng/ớt.'
      ],
      avoid: ['Gà rán, gà quay da giòn', 'Cơm rang, cơm trộn mỡ hành', 'Dưa chua, đu đủ ngâm giấm ăn kèm'],
      why: 'Gà luộc bỏ da là đạm nạc ít béo. Chỉ cần dặn bỏ nước chấm cay chua là ăn được.',
      tip: 'Nước chấm hay có ớt và giấm: xin chén nước luộc gà thay thế.'
    },
    {
      id: 'out-com-binh-dan', name: 'Cơm bình dân (chọn đúng món)', emoji: '🍱', kind: 'Ăn ngoài', mode: 'out',
      meals: ['trua', 'toi'], care: 2, costFixed: 35000, kcal: 560, tools: ['khong'], mapQuery: 'cơm bình dân',
      order: [
        'Chọn canh rau củ (bí, su su, mướp), thịt hoặc cá luộc/hấp, trứng hấp, đậu hũ hấp hoặc om nhạt.',
        'Xin ít nước canh, ít dầu; ăn cơm vừa phải.',
        'Dặn chủ quán không rưới nước mắm ớt, không rắc hành phi.',
        'Uống nước ấm hoặc nước lọc, không uống trà đá đậm hay nước ngọt.'
      ],
      avoid: ['Món chiên, xào nhiều dầu', 'Thịt kho mỡ, sườn rim', 'Canh chua, dưa muối, nước mắm ớt'],
      why: 'Cơm bình dân có nhiều lựa chọn nên bạn tự ghép được một mâm cơm nhẹ bụng.',
      tip: 'Chọn món nấu nước thay vì món chiên xào. Món để lâu, nguội, nhiều mỡ thì bỏ qua.'
    }
  ];

  // ── hoàn thiện dữ liệu: nguyên liệu, giá, món chay... ──
  function round500(n) { return Math.max(1000, Math.round(n / 500) * 500); }

  function finalize(src) {
    var d = {
      mode: 'home', base: null, veg: true, hasEgg: false, hasDairy: false,
      swaps: [], tools: ['khong'], steps: [], ing: [], order: [], avoid: []
    };
    for (var k in src) d[k] = src[k];
    d.ing = (d.ing || []).map(function (x) { return [x[0], x[1]]; });
    d.steps = d.steps.slice();

    if (d.mode === 'home') {
      if (d.base === 'com') {
        d.ing.unshift(['gao', 60]);
        d.steps.unshift(COM);
      }
      var cost = 0;
      d.ing.forEach(function (pair) {
        var it = H.INGREDIENTS[pair[0]];
        if (!it) throw new Error('Thiếu nguyên liệu: ' + pair[0] + ' (món ' + d.id + ')');
        if (!it.staple) cost += it.price * pair[1];
        if (it.animal === 'meat') d.veg = false;
        if (it.animal === 'egg') d.hasEgg = true;
        if (it.animal === 'dairy') d.hasDairy = true;
      });
      d.cost = round500(cost);
    } else {
      d.cost = d.costFixed;
      d.veg = false;
      d.time = null;
    }

    d.energy = d.kcal < 300 ? 'thap' : (d.kcal <= 450 ? 'tb' : 'cao');
    var names = d.ing.map(function (p) { return H.INGREDIENTS[p[0]].name; }).join(' ');
    d.searchRaw = [d.name, d.kind, names].join(' ').toLowerCase();
    d.searchText = H.util.norm(d.searchRaw);
    return d;
  }

  H.DISHES = RAW.map(finalize);
  H.DISH_BY_ID = {};
  H.DISHES.forEach(function (d) { H.DISH_BY_ID[d.id] = d; });

  // Phân loại món (màu ô minh hoạ + nhãn)
  H.KINDS = {
    'Cháo': 'k-chao', 'Món canh': 'k-canh', 'Món mặn': 'k-man', 'Món chay': 'k-chay',
    'Món nước': 'k-nuoc', 'Điểm tâm': 'k-tam', 'Ăn vặt': 'k-vat', 'Tráng miệng': 'k-trang', 'Ăn ngoài': 'k-ngoai'
  };
})(window.HNAG = window.HNAG || {});
