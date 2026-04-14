/**
 * 메트릭 조회·변환(Model). Supabase 행 → 대시보드용 JSON(kpi + trend).
 * DOM/차트는 app.js — 설계의 db.js 역할과 동일한 경계.
 */

import { supabase } from './supabase.js';

/** @see .env — 미설정 시 공식 스키마 기본값 `dashboard_data` */
const METRICS_TABLE =
  String(import.meta.env.VITE_SUPABASE_METRICS_TABLE ?? '').trim() ||
  'dashboard_data';

/** @param {Date} date */
function formatLocalYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Supabase 메트릭 테이블에서 「현재 N일 + 직전 동일 N일」비교에 필요한 행을 가져옵니다.
 * @param {number} days - 한 구간의 일수 (7, 30, 90). 총 약 2×N일치 날짜 범위.
 * @returns {Promise<Array|null>}
 */
export async function fetchSupabaseData(days = 7) {
  if (!supabase) {
    console.warn('[Supabase] 클라이언트가 초기화되지 않음. sample.json으로 폴백합니다.');
    return null;
  }

  try {
    const today = new Date();
    const rangeStart = new Date(today);
    // 직전 N일 구간 시작 = 오늘에서 (2N-1)일 전 — 현재 N일 + 직전 N일 한 번에 조회
    rangeStart.setDate(rangeStart.getDate() - (2 * days - 1));

    const startDateStr = formatLocalYmd(rangeStart);
    const todayStr = formatLocalYmd(today);

    console.log(
      `[Supabase] 테이블 "${METRICS_TABLE}" — ${days}일×2구간 조회: ${startDateStr} ~ ${todayStr}`,
    );

    const { data, error } = await supabase
      .from(METRICS_TABLE)
      .select('*')
      .gte('date', startDateStr)
      .lte('date', todayStr)
      .order('date', { ascending: true }); // 오름차순: 오래된 것부터

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
 * 일별 행에서 방문자 가중 전환율(%) — 기간 합계 기준으로 일관되게 집계
 * @param {Array<{ visitors?: number, conversion_rate?: number }>} rows
 */
function weightedConversionPercent(rows) {
  const vSum = rows.reduce((s, r) => s + (Number(r.visitors) || 0), 0);
  if (vSum <= 0) return 0;
  const orderSum = rows.reduce(
    (s, r) => s + (Number(r.visitors) || 0) * ((Number(r.conversion_rate) || 0) / 100),
    0,
  );
  return (orderSum / vSum) * 100;
}

function sumField(rows, key) {
  return rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
}

/** 증감률(%): 직전 기간 대비. 분모 0은 기존과 동일 규칙 */
function relativeChangePercent(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Supabase 행 배열을 대시보드 렌더용 JSON(kpi + trend)으로 변환합니다.
 * 전기 대비: 선택 N일 구간 합계 vs 바로 직전 동일 N일 구간(설계 calculateKPIs와 동일 의미).
 * @param {Array} supabaseData
 * @param {number} days - 필터 N일 (7, 30, 90)
 * @returns {Object|null}
 */
export function transformSupabaseData(supabaseData, days = 7) {
  if (!supabaseData || supabaseData.length === 0) {
    return null;
  }

  const today = new Date();
  const todayStr = formatLocalYmd(today);

  const currentStart = new Date(today);
  currentStart.setDate(currentStart.getDate() - (days - 1));
  const currentStartStr = formatLocalYmd(currentStart);

  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousEndStr = formatLocalYmd(previousEnd);

  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - (days - 1));
  const previousStartStr = formatLocalYmd(previousStart);

  const inRange = (dateStr, from, to) => dateStr >= from && dateStr <= to;

  const currentRows = supabaseData.filter((r) =>
    inRange(String(r.date), currentStartStr, todayStr),
  );
  const previousRows = supabaseData.filter((r) =>
    inRange(String(r.date), previousStartStr, previousEndStr),
  );

  if (currentRows.length === 0) {
    return null;
  }

  const curRev = sumField(currentRows, 'revenue');
  const prevRev = sumField(previousRows, 'revenue');
  const curVis = sumField(currentRows, 'visitors');
  const prevVis = sumField(previousRows, 'visitors');
  const curNew = sumField(currentRows, 'new_customers');
  const prevNew = sumField(previousRows, 'new_customers');
  const curConv = weightedConversionPercent(currentRows);
  const prevConv = weightedConversionPercent(previousRows);

  // 전환율 증감은 설계 예시와 같이 퍼센트포인트 차이(상대율 아님)
  const convChangePp = curConv - prevConv;

  const sortedCurrent = [...currentRows].sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );

  const json = {
    kpi: {
      revenue: {
        value: curRev,
        changePercent: relativeChangePercent(curRev, prevRev),
      },
      visitors: {
        value: curVis,
        changePercent: relativeChangePercent(curVis, prevVis),
      },
      conversionRate: {
        value: curConv,
        changePercent: convChangePp,
      },
      newCustomers: {
        value: curNew,
        changePercent: relativeChangePercent(curNew, prevNew),
      },
    },
    trend: {
      dates: sortedCurrent.map((r) => r.date),
      revenue: sortedCurrent.map((r) => r.revenue || 0),
      visitors: sortedCurrent.map((r) => r.visitors || 0),
      orders: sortedCurrent.map((r) =>
        Math.round((r.visitors || 0) * ((r.conversion_rate || 0) / 100)),
      ),
    },
  };

  return json;
}
