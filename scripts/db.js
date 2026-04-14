/**
 * 메트릭 조회·변환(Model). Supabase 행 → 대시보드용 JSON(kpi + trend).
 * DOM/차트는 app.js — 설계의 db.js 역할과 동일한 경계.
 */

import { supabase } from './supabase.js';

/** @see .env — 미설정 시 공식 스키마 기본값 `dashboard_data` */
const METRICS_TABLE =
  String(import.meta.env.VITE_SUPABASE_METRICS_TABLE ?? '').trim() ||
  'dashboard_data';

/** 메모리 캐시 — 5분 TTL */
const dataCache = {
  data: null,
  timestamp: null,
  ttl: 5 * 60 * 1000,
};

/**
 * 캐시에 유효한 데이터가 있으면 반환, 없으면 null
 * @returns {Array|null}
 */
function getCachedData() {
  if (dataCache.data && Date.now() - dataCache.timestamp < dataCache.ttl) {
    return dataCache.data;
  }
  return null;
}

/**
 * 데이터를 캐시에 저장
 * @param {Array} data
 */
function setCachedData(data) {
  dataCache.data = data;
  dataCache.timestamp = Date.now();
}

/** 캐시를 강제 무효화 (필터 변경 시 사용) */
export function invalidateCache() {
  dataCache.data = null;
  dataCache.timestamp = null;
}

/**
 * 커스텀 날짜 범위로 데이터를 조회합니다 (캐시 미사용).
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Array|null>}
 */
/**
 * 커스텀 기간 + 전기(직전 동일 일수) KPI 비교에 필요한 행까지 한 번에 조회합니다.
 * @param {string} startDate - YYYY-MM-DD (선택 구간 시작)
 * @param {string} endDate - YYYY-MM-DD (선택 구간 끝)
 */
export async function fetchSupabaseDataByRange(startDate, endDate) {
  if (!supabase) {
    console.warn('[Supabase] 클라이언트가 초기화되지 않음.');
    return null;
  }

  const span = daysInclusive(startDate, endDate);
  const previousEnd = addCalendarDaysYmd(startDate, -1);
  const rangeStart = addCalendarDaysYmd(previousEnd, -(span - 1));

  try {
    console.log(
      `[Supabase] 커스텀+전기 조회: 선택 ${startDate}~${endDate} (+전기 ${rangeStart}~${previousEnd}), 실제 쿼리 ${rangeStart}~${endDate}`,
    );
    const { data, error } = await supabase
      .from(METRICS_TABLE)
      .select('*')
      .gte('date', rangeStart)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('[Supabase] 커스텀 범위 조회 실패:', error);
      return null;
    }
    return data ?? null;
  } catch (e) {
    console.error('[Supabase] 커스텀 범위 예외:', e);
    return null;
  }
}

/** @param {Date} date */
function formatLocalYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** YYYY-MM-DD 문자열에 일 수 더하기 (자정 건너뜀 완화로 정오 파싱) */
function addCalendarDaysYmd(ymdStr, deltaDays) {
  const d = new Date(`${ymdStr}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return formatLocalYmd(d);
}

/** 시작일~종료일 포함 일수 */
function daysInclusive(ymdStart, ymdEnd) {
  const s = new Date(`${ymdStart}T12:00:00`);
  const e = new Date(`${ymdEnd}T12:00:00`);
  return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Supabase 메트릭 테이블에서 「현재 N일 + 직전 동일 N일」비교에 필요한 행을 가져옵니다.
 * 5분 TTL 메모리 캐시 사용. 실패 시 최대 3회 재시도.
 * @param {number} days - 한 구간의 일수 (7, 30, 90). 총 약 2×N일치 날짜 범위.
 * @returns {Promise<Array|null>}
 */
export async function fetchSupabaseData(days = 7) {
  if (!supabase) {
    console.warn('[Supabase] 클라이언트가 초기화되지 않음. sample.json으로 폴백합니다.');
    return null;
  }

  // 캐시 히트 확인
  const cached = getCachedData();
  if (cached) {
    console.log('[Supabase] 캐시에서 데이터 반환');
    return cached;
  }

  const today = new Date();
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - (2 * days - 1));

  const startDateStr = formatLocalYmd(rangeStart);
  const todayStr = formatLocalYmd(today);

  const MAX_RETRY = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRY; attempt += 1) {
    try {
      console.log(
        `[Supabase] 테이블 "${METRICS_TABLE}" — ${days}일×2구간 조회: ${startDateStr} ~ ${todayStr} (시도 ${attempt}/${MAX_RETRY})`,
      );

      const { data, error } = await supabase
        .from(METRICS_TABLE)
        .select('*')
        .gte('date', startDateStr)
        .lte('date', todayStr)
        .order('date', { ascending: true });

      if (error) {
        console.warn(`[Supabase] 쿼리 실패 (시도 ${attempt}):`, error);
        lastError = error;
        continue;
      }

      if (!data || data.length === 0) {
        console.warn(`[Supabase] ${startDateStr}~${todayStr} 범위에 데이터가 없습니다.`);
        return null;
      }

      console.log(`[Supabase] ${days}일 데이터 로드 성공:`, {
        rowCount: data.length,
        dateRange: `${data[0].date} ~ ${data[data.length - 1].date}`,
      });

      setCachedData(data);
      return data;
    } catch (e) {
      console.warn(`[Supabase] 예외 발생 (시도 ${attempt}):`, e);
      lastError = e;
    }
  }

  console.error('[Supabase] 최대 재시도 횟수 초과:', lastError);
  return null;
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

/**
 * 커스텀 [startDate, endDate] 구간용 변환. "현재"는 선택 구간, "전기"는 그 직전 동일 일수.
 * fetch는 `fetchSupabaseDataByRange`와 같이 전기 행까지 포함된 배열을 넘겨야 함.
 * @param {Array} supabaseData
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Object|null}
 */
export function transformSupabaseDataForCustomRange(supabaseData, startDate, endDate) {
  if (!supabaseData || supabaseData.length === 0) {
    return null;
  }

  const span = daysInclusive(startDate, endDate);
  const previousEndStr = addCalendarDaysYmd(startDate, -1);
  const previousStartStr = addCalendarDaysYmd(previousEndStr, -(span - 1));

  const inRange = (dateStr, from, to) => dateStr >= from && dateStr <= to;

  const currentRows = supabaseData.filter((r) =>
    inRange(String(r.date), startDate, endDate),
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
  const convChangePp = curConv - prevConv;

  const sortedCurrent = [...currentRows].sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );

  return {
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
}
