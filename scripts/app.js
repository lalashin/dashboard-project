/**
 * Supabase의 dashboard_data 테이블에서 데이터를 불러와 카드·테이블에 반영합니다.
 * DB 연결 실패 시 sample.json으로 폴백합니다.
 */

import { supabase } from './supabase.js';
import Chart from 'chart.js/auto';

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
 * Supabase dashboard_data 테이블에서 지정한 일수만큼 데이터를 가져옵니다.
 * @param {number} days - 조회할 일수 (7, 30, 90)
 * @returns {Promise<Array|null>}
 */
async function fetchSupabaseData(days = 7) {
  if (!supabase) {
    console.warn('[Supabase] 클라이언트가 초기화되지 않음. sample.json으로 폴백합니다.');
    return null;
  }

  try {
    // 현재 날짜 기준으로 N일 전 날짜 계산
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);

    // YYYY-MM-DD 형식으로 변환
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startDateStr = formatDate(startDate);
    const todayStr = formatDate(today);

    console.log(`[Supabase] ${days}일 데이터 조회 시작: ${startDateStr} ~ ${todayStr}`);

    const { data, error } = await supabase
      .from('dashboard_data')
      .select('*')
      .gte('date', startDateStr)  // 시작일 이상
      .lte('date', todayStr)      // 오늘 이하
      .order('date', { ascending: true });  // 오름차순: 오래된 것부터

    if (error) {
      console.error('[Supabase] 쿼리 실패:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn(`[Supabase] ${startDateStr}~${todayStr} 범위에 데이터가 없습니다.`);
      return null;
    }

    console.log(`[Supabase] ${days}일 데이터 로드 성공:`, {
      rowCount: data.length,
      dateRange: `${data[0].date} ~ ${data[data.length - 1].date}`,
      data: data,
    });
    return data;
  } catch (e) {
    console.error('[Supabase] 예외 발생:', e);
    return null;
  }
}

/**
 * Supabase 데이터를 app.js 형식으로 변환합니다.
 * @param {Array} supabaseData
 * @returns {Object}
 */
function transformSupabaseData(supabaseData) {
  if (!supabaseData || supabaseData.length === 0) {
    return null;
  }

  // 날짜 오름차순으로 정렬 (차트 표시용)
  const sorted = [...supabaseData].reverse();

  // KPI 계산: 최근 데이터 기준
  const latestRecord = supabaseData[0];
  const previousRecord = supabaseData.length > 1 ? supabaseData[1] : null;

  const calculateChangePercent = (latest, previous) => {
    if (!previous) return 0;
    if (previous === 0) return latest > 0 ? 100 : 0;
    return ((latest - previous) / previous) * 100;
  };

  const json = {
    kpi: {
      revenue: {
        value: latestRecord.revenue || 0,
        changePercent: calculateChangePercent(
          latestRecord.revenue || 0,
          previousRecord?.revenue || 0,
        ),
      },
      visitors: {
        value: latestRecord.visitors || 0,
        changePercent: calculateChangePercent(
          latestRecord.visitors || 0,
          previousRecord?.visitors || 0,
        ),
      },
      conversionRate: {
        value: latestRecord.conversion_rate || 0,
        changePercent: calculateChangePercent(
          latestRecord.conversion_rate || 0,
          previousRecord?.conversion_rate || 0,
        ),
      },
      newCustomers: {
        value: latestRecord.new_customers || 0,
        changePercent: calculateChangePercent(
          latestRecord.new_customers || 0,
          previousRecord?.new_customers || 0,
        ),
      },
    },
    trend: {
      dates: sorted.map((r) => r.date),
      revenue: sorted.map((r) => r.revenue || 0),
      visitors: sorted.map((r) => r.visitors || 0),
      orders: sorted.map((r) => Math.round((r.visitors || 0) * ((r.conversion_rate || 0) / 100))),
    },
  };

  return json;
}

/**
 * 차트를 렌더링합니다. (Chart.js 사용)
 * @param {{ trend: { dates: string[], revenue: number[] } }} json
 */
function renderRevenueChart(json) {
  // Chart.js는 import에서 동적으로 로드되므로 이 함수가 실행되면 이미 로드됨

  const trend = json.trend;
  if (!trend || !trend.dates || !trend.revenue) {
    console.warn('[Chart] trend 데이터가 없습니다.');
    return;
  }

  // 날짜 포맷: YYYY-MM-DD → MM-DD
  const formatChartDate = (isoDate) => {
    const part = String(isoDate).split('T')[0];
    const [, month, day] = part.split('-');
    return month && day ? `${month}-${day}` : part;
  };

  const labels = trend.dates.map(formatChartDate);
  const revenueValues = trend.revenue;

  const canvas = document.getElementById('revenueChart');
  if (!canvas) {
    console.warn('[Chart] canvas#revenueChart를 찾을 수 없습니다.');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.warn('[Chart] canvas 컨텍스트를 가져올 수 없습니다.');
    return;
  }

  // 기존 차트 인스턴스 제거
  if (window.revenueChartInstance) {
    window.revenueChartInstance.destroy();
  }

  // 다중 라인 차트를 위해 트렌드 데이터 추출
  const visitorValues = trend.visitors || [];
  const orderValues = trend.orders || [];

  window.revenueChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '매출 (원)',
          data: revenueValues,
          borderColor: '#a78bfa',
          backgroundColor: 'rgba(167, 139, 250, 0.08)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#a78bfa',
          pointBorderColor: '#1a1a2e',
          pointBorderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: '방문자 (명)',
          data: visitorValues,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#1a1a2e',
          pointBorderWidth: 2,
          yAxisID: 'y1',
        },
        {
          label: '신규고객 (명)',
          data: orderValues,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#1a1a2e',
          pointBorderWidth: 2,
          yAxisID: 'y2',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.2,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#eee',
            font: { size: 12, weight: 'bold' },
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(167, 139, 250, 0.5)',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          callbacks: {
            title(ctx) {
              return `📅 ${ctx[0].label}`;
            },
            label(ctx) {
              const v = ctx.parsed.y;
              if (v == null) return '';
              if (ctx.datasetIndex === 0) {
                return `💰 매출: ${Number(v).toLocaleString('ko-KR')}원`;
              }
              if (ctx.datasetIndex === 1) {
                return `👥 방문자: ${Number(v).toLocaleString('ko-KR')}명`;
              }
              if (ctx.datasetIndex === 2) {
                return `🆕 신규고객: ${Number(v).toLocaleString('ko-KR')}명`;
              }
              return `값: ${Number(v).toLocaleString('ko-KR')}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.08)',
            drawBorder: false,
          },
          ticks: {
            color: '#a8a8b8',
            maxRotation: 45,
            font: { size: 11 },
          },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: '매출 (원)',
            color: '#a78bfa',
            font: { size: 12, weight: 'bold' },
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.08)',
            drawBorder: false,
          },
          ticks: {
            color: '#a8a8b8',
            font: { size: 11 },
            callback: (raw) => {
              const value = Number(raw);
              if (value >= 100000000) {
                return `${(value / 100000000).toFixed(1)}억`;
              }
              if (value >= 10000) {
                return `${Math.round(value / 10000)}만`;
              }
              return value.toLocaleString('ko-KR');
            },
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: '방문자 (명)',
            color: '#3b82f6',
            font: { size: 12, weight: 'bold' },
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: '#a8a8b8',
            font: { size: 11 },
            callback: (raw) => Number(raw).toLocaleString('ko-KR'),
          },
        },
        y2: {
          type: 'linear',
          display: false,
          position: 'right',
          ticks: {
            color: '#10b981',
            font: { size: 11 },
            callback: (raw) => Number(raw).toLocaleString('ko-KR'),
          },
        },
      },
    },
  });
}

/**
 * 지정된 일수의 데이터로 대시보드를 렌더링합니다.
 * @param {number} days - 조회할 일수 (7, 30, 90)
 * @returns {Promise<void>}
 */
async function loadDashboardByDays(days = 7) {
  try {
    console.log(`[App] ${days}일 데이터로 대시보드 로드 시작...`);

    // Step 1: Supabase에서 데이터 시도
    const supabaseData = await fetchSupabaseData(days);

    if (supabaseData && supabaseData.length > 0) {
      // Step 2: Supabase 데이터 변환 및 렌더링
      const json = transformSupabaseData(supabaseData);
      if (json) {
        renderKpiCards(json);
        renderTrendTable(json);
        renderRevenueChart(json);
        console.log(`[App] ${days}일 데이터 렌더링 완료`);
        return;
      }
    }

    // Step 3: 폴백 - sample.json 로드
    console.log('[App] Supabase 데이터 없음. sample.json으로 폴백합니다.');
    const res = await fetch(APP_SAMPLE_JSON_URL);
    if (!res.ok) {
      throw new Error(`sample.json 로드 실패: ${res.status}`);
    }
    const json = await res.json();
    renderKpiCards(json);
    renderTrendTable(json);
    renderRevenueChart(json);
  } catch (e) {
    console.error('[App] 데이터 로드 실패:', e);
  }
}

/**
 * 초기 대시보드 로드
 * @returns {Promise<void>}
 */
async function initDashboard() {
  // 기본값: 7일 데이터로 시작
  await loadDashboardByDays(7);

  // 필터 버튼 이벤트 리스너 등록
  setupFilterButtons();
}

/**
 * 필터 버튼에 이벤트 리스너를 등록합니다.
 */
function setupFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');

  console.log('[App] 필터 버튼 이벤트 리스너 등록:', filterButtons.length);

  filterButtons.forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const days = parseInt(event.target.dataset.days, 10);

      console.log(`[App] 필터 버튼 클릭: ${days}일`);

      // 활성 버튼 스타일 변경
      filterButtons.forEach((btn) => btn.classList.remove('active'));
      event.target.classList.add('active');

      // 데이터 로드
      console.log(`[App] ${days}일 데이터 로드 시작...`);
      await loadDashboardByDays(days);
      console.log(`[App] ${days}일 데이터 로드 완료!`);
    });
  });

  // 초기 활성 버튼 설정 (7일)
  const firstButton = document.querySelector('.filter-btn[data-days="7"]');
  if (firstButton) {
    firstButton.classList.add('active');
    console.log('[App] 초기 활성 버튼 설정 완료: 7일');
  }
}

document.addEventListener('DOMContentLoaded', initDashboard);
