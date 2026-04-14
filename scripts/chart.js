/**
 * sample.json의 trend로 매출 라인 차트를 그립니다.
 * Chart.js 전역(UMD)에 의존합니다.
 */

const CHART_SAMPLE_JSON_URL = 'data/sample.json';

/** 보라 라인 / 반투명 면 (다크 UI용) */
const LINE_COLOR = '#a78bfa';
const FILL_RGBA = 'rgba(167, 139, 250, 0.22)';

/** 축·눈금 (배경 #1a1a2e 계열과 조화) */
const AXIS_TICK = '#a8a8b8';
const GRID_LINE = 'rgba(255, 255, 255, 0.08)';

let revenueChartInstance = null;

/**
 * YYYY-MM-DD → MM-DD (차트 X축 라벨)
 * @param {string} isoDate
 * @returns {string}
 */
function formatChartDateLabel(isoDate) {
  const part = String(isoDate).split('T')[0];
  const [, month, day] = part.split('-');
  if (!month || !day) return part;
  return `${month}-${day}`;
}

/**
 * @param {number} value
 * @returns {string}
 */
function formatRevenueAxis(value) {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억`;
  }
  if (value >= 10000) {
    return `${Math.round(value / 10000)}만`;
  }
  return value.toLocaleString('ko-KR');
}

/**
 * @returns {Promise<object>}
 */
async function fetchSampleJson() {
  const res = await fetch(CHART_SAMPLE_JSON_URL);
  if (!res.ok) {
    throw new Error(`sample.json 로드 실패: ${res.status}`);
  }
  return res.json();
}

/**
 * @param {string[]} labels
 * @param {number[]} revenueValues
 */
function renderRevenueLineChart(labels, revenueValues) {
  const canvas = document.getElementById('revenueChart');
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  if (typeof Chart === 'undefined') {
    console.error('Chart.js가 로드되지 않았습니다.');
    return;
  }

  if (revenueChartInstance) {
    revenueChartInstance.destroy();
  }

  revenueChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '매출',
          data: revenueValues,
          borderColor: LINE_COLOR,
          backgroundColor: FILL_RGBA,
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: LINE_COLOR,
          pointBorderColor: '#1a1a2e',
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          labels: {
            color: '#eee',
            font: { size: 12 },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          titleColor: '#eee',
          bodyColor: '#eee',
          borderColor: 'rgba(167, 139, 250, 0.4)',
          borderWidth: 1,
          callbacks: {
            label(ctx) {
              const v = ctx.parsed.y;
              if (v == null) return '';
              return `매출: ${Number(v).toLocaleString('ko-KR')}원`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: GRID_LINE,
            drawBorder: false,
          },
          ticks: {
            color: AXIS_TICK,
            maxRotation: 0,
          },
        },
        y: {
          grid: {
            color: GRID_LINE,
            drawBorder: false,
          },
          ticks: {
            color: AXIS_TICK,
            callback: (raw) => formatRevenueAxis(Number(raw)),
          },
        },
      },
    },
  });
}

async function initRevenueChart() {
  try {
    const json = await fetchSampleJson();
    const trend = json.trend;
    if (!trend || !Array.isArray(trend.dates) || !Array.isArray(trend.revenue)) {
      console.error('trend.dates / trend.revenue 형식이 올바르지 않습니다.');
      return;
    }

    const labels = trend.dates.map((d) => formatChartDateLabel(d));
    renderRevenueLineChart(labels, trend.revenue);
  } catch (e) {
    console.error(e);
  }
}

document.addEventListener('DOMContentLoaded', initRevenueChart);
