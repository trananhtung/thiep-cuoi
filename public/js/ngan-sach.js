/* Công cụ ngân sách cưới — thuần client-side, lưu localStorage. */
(function () {
  'use strict';
  var KEY = 'thiep-ngan-sach';

  // Hạng mục gợi ý theo đám cưới Việt Nam
  var DEFAULTS = {
    budget: '',
    rows: [
      { name: 'Đặt tiệc nhà hàng', est: '', act: '', paid: false },
      { name: 'Chụp ảnh cưới (pre-wedding)', est: '', act: '', paid: false },
      { name: 'Quay phim / chụp phóng sự ngày cưới', est: '', act: '', paid: false },
      { name: 'Váy cưới & vest chú rể', est: '', act: '', paid: false },
      { name: 'Trang điểm cô dâu', est: '', act: '', paid: false },
      { name: 'Nhẫn cưới', est: '', act: '', paid: false },
      { name: 'Hoa cưới & trang trí', est: '', act: '', paid: false },
      { name: 'Thiệp cưới', est: '', act: '', paid: false },
      { name: 'Mâm quả / lễ vật ăn hỏi', est: '', act: '', paid: false },
      { name: 'Xe hoa / xe đưa đón', est: '', act: '', paid: false },
      { name: 'Nhạc công / MC / ca sĩ', est: '', act: '', paid: false },
      { name: 'Tuần trăng mật', est: '', act: '', paid: false },
    ],
  };

  var state = load();

  var elRows = document.getElementById('rows');
  var elBudget = document.getElementById('budget');

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && Array.isArray(p.rows)) return p;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function num(v) { var n = parseFloat(v); return isFinite(n) && n > 0 ? n : 0; }
  function fmt(n) { return Math.round(n).toLocaleString('vi-VN') + ' ₫'; }

  function render() {
    elBudget.value = state.budget || '';
    elRows.innerHTML = '';
    state.rows.forEach(function (r, i) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><input type="text" data-i="' + i + '" data-k="name" value="" /></td>' +
        '<td class="num"><input type="number" min="0" step="100000" inputmode="numeric" data-i="' + i + '" data-k="est" /></td>' +
        '<td class="num"><input type="number" min="0" step="100000" inputmode="numeric" data-i="' + i + '" data-k="act" /></td>' +
        '<td class="col-pay"><input type="checkbox" class="bg-paid" data-i="' + i + '" data-k="paid" /></td>' +
        '<td class="act"><button type="button" class="bg-del" data-del="' + i + '" aria-label="Xoá hạng mục">✕</button></td>';
      // gán giá trị an toàn (tránh chèn HTML)
      tr.querySelector('[data-k="name"]').value = r.name || '';
      tr.querySelector('[data-k="est"]').value = r.est || '';
      tr.querySelector('[data-k="act"]').value = r.act || '';
      tr.querySelector('[data-k="paid"]').checked = !!r.paid;
      elRows.appendChild(tr);
    });
    recalc();
  }

  function recalc() {
    var est = 0, act = 0, paid = 0;
    state.rows.forEach(function (r) {
      est += num(r.est);
      act += num(r.act);
      if (r.paid) paid += 1;
    });
    var budget = num(state.budget);
    var remain = budget - act;

    document.getElementById('totalEst').textContent = fmt(est);
    document.getElementById('totalAct').textContent = fmt(act);
    document.getElementById('paidCount').textContent = paid + '/' + state.rows.length;

    var pct = budget > 0 ? Math.min(100, Math.round((act / budget) * 100)) : 0;
    var over = budget > 0 && act > budget;
    var bar = document.getElementById('bar');
    bar.style.width = pct + '%';
    bar.className = over ? 'over' : '';
    document.getElementById('barNote').textContent = budget > 0
      ? ('Đã chi ' + pct + '% ngân sách' + (over ? ' — VƯỢT ngân sách!' : ''))
      : 'Nhập tổng ngân sách để xem tiến độ chi tiêu.';

    var sum = document.getElementById('summary');
    sum.innerHTML =
      stat('Ngân sách', fmt(budget), '') +
      stat('Tổng dự kiến', fmt(est), '') +
      stat('Đã chi (thực)', fmt(act), '') +
      stat(remain >= 0 ? 'Còn lại' : 'Vượt', fmt(Math.abs(remain)), budget > 0 ? (remain >= 0 ? 'ok' : 'over') : '');
  }

  function stat(label, value, cls) {
    return '<div class="bg-stat ' + cls + '"><small>' + label + '</small><b>' + value + '</b></div>';
  }

  // Sự kiện nhập liệu
  elRows.addEventListener('input', function (e) {
    var t = e.target;
    var i = t.getAttribute('data-i');
    var k = t.getAttribute('data-k');
    if (i === null || !k) return;
    var row = state.rows[+i];
    if (!row) return;
    if (k === 'paid') row.paid = t.checked;
    else row[k] = t.value;
    save();
    recalc();
  });
  elRows.addEventListener('change', function (e) {
    if (e.target.getAttribute('data-k') === 'paid') {
      var i = +e.target.getAttribute('data-i');
      if (state.rows[i]) { state.rows[i].paid = e.target.checked; save(); recalc(); }
    }
  });
  elRows.addEventListener('click', function (e) {
    var del = e.target.getAttribute('data-del');
    if (del === null) return;
    state.rows.splice(+del, 1);
    save();
    render();
  });

  elBudget.addEventListener('input', function () {
    state.budget = elBudget.value;
    save();
    recalc();
  });

  document.getElementById('addRow').addEventListener('click', function () {
    state.rows.push({ name: '', est: '', act: '', paid: false });
    save();
    render();
    var inputs = elRows.querySelectorAll('[data-k="name"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  document.getElementById('resetBtn').addEventListener('click', function () {
    if (!confirm('Khôi phục danh sách hạng mục mặc định? Dữ liệu hiện tại sẽ bị xoá.')) return;
    state = JSON.parse(JSON.stringify(DEFAULTS));
    save();
    render();
  });

  render();
})();
