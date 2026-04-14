/**
 * sample.json의 KPI·trend를 불러와 카드·테이블에 반영합니다.
 * chart.js와 별도로 fetch하므로 로컬 정적 서버 기준 경로를 사용합니다.
 */

/* chart.js와 전역 충돌 방지: 동일 이름 const 금지 */
const APP_SAMPLE_JSON_URL = 'data/sample.json';

/** data-kpi → sample.json kpi 키 */
const KPI_KEY_MAP = {
  revenue: 'revenue',
  visitors: 'visitors',
  conversion: 'conversionRate',
  'new-customers': 'newCustomers',
};

/**
 * @param {string} isoDate
 * @returns {string}
 */
function formatTableDate(isoDate) {
  const part = String(isoDate).split('T')[0];
  const [y, m, d] = part.split('-');
  if (!y || !m || !d) return part;
  return `${y}.${m}.${d}`;
}

/**
 * @param {string} dataKpi
 * @param {{ value: number, changePercent: number }} entry
 * @returns {string}
 */
function formatKpiValue(dataKpi, entry) {
  const v = entry.value;
  if (dataKpi === 'revenue') {
    return `${Number(v).toLocaleString('ko-KR')}원`;
  }
  if (dataKpi === 'visitors') {
    return `${Number(v).toLocaleString('ko-KR')}명`;
  }
  if (dataKpi === 'conversion') {
    return `${Number(v).toFixed(2)}%`;
  }
  if (dataKpi === 'new-customers') {
    return `${Number(v).toLocaleString('ko-KR')}명`;
  }
  return String(v);
}

/**
 * 증감률에 따른 클래스·표시 문자열 (양: 초록 ↑ / 음: 빨강 ↓)
 * @param {number} changePercent
 * @returns {{ className: string, text: string }}
 */
function formatChangeDisplay(changePercent) {
  const n = Number(changePercent);
  if (Number.isNaN(n)) {
    return { className: 'neutral', text: '—' };
  }
  if (n > 0) {
    return {
      className: 'positive',
      text: `↑ +${n.toFixed(1)}%`,
    };
  }
  if (n < 0) {
    return {
      className: 'negative',
      text: `↓ ${Math.abs(n).toFixed(1)}%`,
    };
  }
  return { className: 'neutral', text: '0%' };
}

/**
 * 주문 비율로 신규고객 일별 배분 (trend에 일별 신규고객 필드가 없을 때)
 * 최대 잔여법으로 합계가 totalNew와 일치하도록 맞춤.
 * @param {number[]} orders
 * @param {number} totalNew
 * @returns {number[]}
 */
function allocateNewCustomersByOrders(orders, totalNew) {
  const len = orders.length;
  if (len === 0) {
    return [];
  }
  if (totalNew <= 0) {
    return Array(len).fill(0);
  }
  const sumO = orders.reduce((a, b) => a + b, 0);
  if (sumO === 0) {
    const base = Math.floor(totalNew / len);
    const rem = totalNew - base * len;
    return orders.map((_, i) => base + (i < rem ? 1 : 0));
  }
  const exact = orders.map((o) => (o / sumO) * totalNew);
  const floors = exact.map((x) => Math.floor(x));
  let remainder = totalNew - floors.reduce((a, b) => a + b, 0);
  const byFrac = exact
    .map((x, i) => ({ i, frac: x - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floors];
  for (let k = 0; k < remainder; k += 1) {
    out[byFrac[k].i] += 1;
  }
  return out;
}

/**
 * @param {{ kpi: Record<string, { value: number, changePercent: number }> }} json
 */
function renderKpiCards(json) {
  const kpiRoot = json.kpi;
  if (!kpiRoot) return;

  Object.keys(KPI_KEY_MAP).forEach((dataKpi) => {
    const jsonKey = KPI_KEY_MAP[dataKpi];
    const entry = kpiRoot[jsonKey];
    if (!entry) return;

    const card = document.querySelector(`.kpi-card[data-kpi="${dataKpi}"]`);
    if (!card) return;

    const valueEl = card.querySelector('.kpi-value');
    const changeEl = card.querySelector('.kpi-change');
    const labelEl = card.querySelector('.kpi-label');

    if (valueEl) {
      valueEl.textContent = formatKpiValue(dataKpi, entry);
    }
    if (changeEl) {
      const { className, text } = formatChangeDisplay(entry.changePercent);
      changeEl.classList.remove('positive', 'negative', 'neutral');
      changeEl.classList.add(className);
      changeEl.textContent = text;
    }
    if (labelEl) {
      labelEl.textContent = '전기 대비';
    }
  });
}

/**
 * @param {{ kpi?: { newCustomers?: { value: number } }, trend: { dates: string[], revenue: number[], visitors: number[], orders: number[] } }} json
 */
function renderTrendTable(json) {
  const trend = json.trend;
  const tbody = document.querySelector('.metrics-table tbody');
  if (!trend || !tbody) return;

  const dates = trend.dates || [];
  const revenue = trend.revenue || [];
  const visitors = trend.visitors || [];
  const orders = trend.orders || [];
  const n = Math.min(dates.length, revenue.length, visitors.length, orders.length);

  const totalNew = json.kpi?.newCustomers?.value ?? 0;
  const newPerDay = allocateNewCustomersByOrders(orders.slice(0, n), totalNew);

  const rows = [];
  for (let i = 0; i < n; i += 1) {
    const v = visitors[i];
    const o = orders[i];
    const conv = v > 0 ? (o / v) * 100 : 0;

    rows.push(`
      <tr>
        <td>${formatTableDate(dates[i])}</td>
        <td>${Number(revenue[i]).toLocaleString('ko-KR')}원</td>
        <td>${Number(v).toLocaleString('ko-KR')}명</td>
        <td>${conv.toFixed(2)}%</td>
        <td>${Number(newPerDay[i] ?? 0).toLocaleString('ko-KR')}명</td>
      </tr>
    `);
  }

  tbody.innerHTML = rows.join('');
}

/**
 * @returns {Promise<void>}
 */
async function initDashboard() {
  try {
    const res = await fetch(APP_SAMPLE_JSON_URL);
    if (!res.ok) {
      throw new Error(`sample.json 로드 실패: ${res.status}`);
    }
    const json = await res.json();
    renderKpiCards(json);
    renderTrendTable(json);
  } catch (e) {
    console.error(e);
  }
}

document.addEventListener('DOMContentLoaded', initDashboard);
