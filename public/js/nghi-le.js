'use strict';

/* Hướng dẫn nghi lễ cưới hỏi truyền thống Việt Nam — nội dung tĩnh có cấu trúc.
 * Nguồn tham khảo: mimosawedding.vn, weddingwonders.vn, vuanem.com.
 * Lưu ý: trình tự & lễ vật có thể khác nhau theo vùng miền và gia đình. */
const CEREMONIES = [
  {
    key: 'dam-ngo', name: 'Dạm ngõ',
    intro: 'Lễ gặp mặt chính thức đầu tiên giữa hai gia đình, nhà trai sang "thưa chuyện" để hai bên tìm hiểu và cho phép đôi trẻ qua lại, bàn việc tiến tới hôn nhân.',
    steps: [
      'Nhà trai chuẩn bị lễ nhỏ: trầu cau, chè, thuốc, bánh kẹo (1 tráp gọn).',
      'Nhà trai sang nhà gái đúng giờ đã hẹn, số người gọn nhẹ (bố mẹ, người đại diện, chú rể).',
      'Đại diện nhà trai thưa chuyện, ngỏ ý xin cho đôi trẻ chính thức tìm hiểu.',
      'Nhà gái nhận lễ, thắp hương bàn thờ gia tiên.',
      'Hai gia đình trò chuyện, bàn sơ bộ kế hoạch lễ ăn hỏi và đám cưới.',
    ],
    roles: [
      'Nhà trai: bố mẹ chú rể + một người đại diện cao niên, ăn nói khéo.',
      'Nhà gái: bố mẹ cô dâu tiếp đón, chuẩn bị nước, hoa quả.',
      'Đôi trẻ: ra mắt, rót nước mời hai bên.',
    ],
  },
  {
    key: 'an-hoi', name: 'Ăn hỏi (Đám hỏi)',
    intro: 'Lễ đính hôn chính thức: nhà trai mang tráp/mâm quả sang nhà gái để xin cưới. Đây là nghi lễ quan trọng, đông đủ họ hàng hai bên.',
    steps: [
      'Nhà trai chuẩn bị và rước tráp (mâm quả) sang nhà gái theo giờ đẹp.',
      'Hai họ chào hỏi; đội bê tráp nhà trai trao tráp cho đội đỡ tráp nhà gái.',
      'Đội bê tráp và đỡ tráp trao lì xì "trao duyên – trả duyên" cho nhau.',
      'Cô dâu được mẹ dẫn ra mắt hai họ (trước đó không xuất hiện).',
      'Làm lễ gia tiên tại nhà gái (thắp hương báo cáo tổ tiên).',
      'Hai gia đình thưa chuyện, thống nhất ngày giờ và kế hoạch đám cưới.',
      'Nhà gái "lại quả" cho nhà trai (chia lại một phần lễ vật, thường 1/3, xé tay không dùng dao).',
    ],
    roles: [
      'Nhà trai vào theo thứ tự: người đại diện → ông bà → bố mẹ → chú rể → đội bê tráp.',
      'Người đại diện (cao niên, gia đình hoà thuận, ăn nói tốt) đứng ra điều hành nghi lễ.',
      'Đội bê tráp: nam thanh niên chưa vợ; đội đỡ tráp: nữ chưa chồng, số lượng bằng số tráp.',
      'Nhà gái: chuẩn bị bàn thờ gia tiên, nhận tráp và chuẩn bị phần lại quả.',
    ],
  },
  {
    key: 'nap-tai', name: 'Nạp tài',
    intro: 'Lễ nạp tài (lễ đen / tiền dẫn cưới) — nhà trai trao một khoản tiền và lễ vật thể hiện sự trân trọng, góp phần lo cho đám cưới. Ở nhiều nơi được gộp chung trong lễ ăn hỏi.',
    steps: [
      'Nhà trai chuẩn bị phong bao tiền nạp tài (số tiền theo thoả thuận/phong tục địa phương).',
      'Trao trong lễ ăn hỏi cùng các tráp lễ, đặt trang trọng lên bàn thờ gia tiên nhà gái.',
      'Nhà gái nhận, thắp hương báo cáo tổ tiên.',
    ],
    roles: [
      'Nhà trai: bố mẹ chú rể chuẩn bị và trao lễ.',
      'Nhà gái: đại diện nhận lễ; thường mẹ cô dâu cất giữ.',
    ],
  },
  {
    key: 'don-dau', name: 'Xin dâu & Đón dâu',
    intro: 'Ngày cưới chính: nhà trai sang xin dâu và rước cô dâu về nhà chồng, kèm lễ gia tiên ở cả hai nhà.',
    steps: [
      'Trước giờ đón dâu, mẹ chú rể cùng người đại diện sang làm lễ xin dâu (mang cơi trầu, chai rượu).',
      'Đoàn nhà trai vào nhà gái; trao hoa và quà cho cô dâu.',
      'Làm lễ gia tiên tại nhà gái; bố mẹ trao của hồi môn cho cô dâu.',
      'Nhà gái trao dâu; chú rể đón cô dâu, hai bên dặn dò.',
      'Rước dâu về nhà trai (chú ý giờ đẹp, đoàn rước).',
      'Làm lễ gia tiên tại nhà trai; cô dâu chú rể ra mắt họ hàng nhà trai.',
    ],
    roles: [
      'Nhà trai: người đại diện điều hành; mẹ chú rể đi xin dâu; chú rể đón dâu.',
      'Nhà gái: bố mẹ trao của hồi môn, dặn dò; người đại diện đáp lễ.',
      'Phù dâu – phù rể: hỗ trợ cô dâu chú rể trong suốt nghi lễ.',
    ],
  },
];

const tabsEl = document.getElementById('tabs');
const panelEl = document.getElementById('panel');
let active = CEREMONIES[0].key;

function renderTabs() {
  tabsEl.innerHTML = CEREMONIES.map((c) =>
    `<button type="button" class="nl-tab${c.key === active ? ' active' : ''}" data-key="${c.key}">${c.name}</button>`
  ).join('');
  tabsEl.querySelectorAll('.nl-tab').forEach((b) => b.addEventListener('click', () => {
    active = b.getAttribute('data-key');
    renderTabs();
    renderPanel();
  }));
}

function renderPanel() {
  const c = CEREMONIES.find((x) => x.key === active);
  if (!c) return;
  panelEl.innerHTML = `
    <h2 class="nl-name">${c.name}</h2>
    <p class="nl-intro">${c.intro}</p>
    <h3 class="nl-sub">Trình tự</h3>
    <ol class="nl-steps">${c.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
    <h3 class="nl-sub">Ai làm gì</h3>
    <ul class="nl-roles">${c.roles.map((r) => `<li>${r}</li>`).join('')}</ul>`;
}

renderTabs();
renderPanel();
