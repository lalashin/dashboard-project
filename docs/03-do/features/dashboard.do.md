# Do: 사내 성과 대시보드 구현 가이드

## 📋 구현 개요

**현재 단계**: Do (구현)  
**기반 문서**: Design 가이드 (`docs/02-design/features/dashboard.design.md`)  
**예상 시간**: 4시간  
**구현 언어**: HTML5, CSS3, Vanilla JavaScript (ES6+)

---

## 🚀 빠른 시작

### 1단계: 환경 설정
```bash
# 프로젝트 디렉토리 이동
cd dashboard-project

# .env 파일 생성 (Supabase 자격증명 입력)
cp .env.example .env
# .env 파일 편집: SUPABASE_URL, SUPABASE_ANON_KEY 입력
```

### 2단계: 개발 서버 실행 (선택사항)
```bash
# Python 3 간단한 서버
python -m http.server 8000

# 또는 Node.js
npx http-server
```

### 3단계: 브라우저 접속
```
http://localhost:8000
```

---

## 📂 구현 순서 (7단계)

### 📍 1단계: HTML 구조 (index.html)

**파일**: `index.html`  
**예상 시간**: 30분  
**의존성**: 없음

**작업 내용**:
- 헤더 (제목, 부제목)
- 필터 섹션 (빠른 필터 버튼, 커스텀 날짜 선택)
- KPI 카드 섹션 (4개 카드)
- 차트 섹션 (Canvas)
- 테이블 섹션 (일별 데이터)
- 로딩 스피너

**체크리스트**:
- [ ] HTML5 시맨틱 태그 사용 (header, main, section)
- [ ] id/class 네이밍 규칙 준수 (예: `filter-section`, `kpi-cards`)
- [ ] 외부 라이브러리 CDN 로드 (Chart.js)
- [ ] 메타 태그 작성 (viewport, charset)

**핵심 HTML 구조**:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>사내 성과 대시보드</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/responsive.css">
</head>
<body>
  <!-- Header -->
  <header class="header">
    <h1>사내 성과 대시보드</h1>
    <p class="subtitle">실시간 성과 지표 모니터링</p>
  </header>

  <!-- Main Content -->
  <main class="container">
    <!-- Filter Section -->
    <section class="filter-section">
      <div class="filter-buttons">
        <button class="filter-btn active" data-days="7">최근 7일</button>
        <button class="filter-btn" data-days="30">최근 30일</button>
        <button class="filter-btn" data-days="90">최근 90일</button>
      </div>
      <div class="custom-date-picker">
        <input type="date" id="startDate" placeholder="시작일">
        <span>~</span>
        <input type="date" id="endDate" placeholder="종료일">
        <button id="submitDate">조회</button>
      </div>
      <div class="active-filter">
        <span id="activeFilterText">조회기간: 최근 7일</span>
      </div>
    </section>

    <!-- KPI Cards -->
    <section class="kpi-cards" id="kpiCards">
      <!-- JavaScript로 동적 생성 -->
    </section>

    <!-- Chart Section -->
    <section class="chart-section">
      <h2>매출 추이 (Revenue Trend)</h2>
      <canvas id="revenueChart"></canvas>
    </section>

    <!-- Table Section -->
    <section class="table-section">
      <h2>일별 상세 데이터</h2>
      <div class="table-wrapper">
        <table class="data-table" id="dataTable">
          <thead>
            <tr>
              <th>날짜</th>
              <th>매출</th>
              <th>방문자</th>
              <th>전환율</th>
              <th>신규고객</th>
            </tr>
          </thead>
          <tbody id="tableBody">
            <!-- JavaScript로 동적 생성 -->
          </tbody>
        </table>
      </div>
      <div class="pagination" id="pagination">
        <!-- JavaScript로 동적 생성 -->
      </div>
    </section>
  </main>

  <!-- Loading Spinner -->
  <div class="loading-spinner" id="loadingSpinner">
    <div class="spinner"></div>
    <p>데이터 로딩 중...</p>
  </div>

  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
  <script src="js/db.js"></script>
  <script src="js/chart.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

---

### 📍 2단계: 환경변수 템플릿 (.env.example)

**파일**: `.env.example`  
**예상 시간**: 5분  
**의존성**: 없음

**작업 내용**:
- Supabase URL 템플릿
- Supabase 공개 API Key 템플릿

**파일 내용**:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key_here

# 주의: 이 파일은 공개 가능한 정보만 포함합니다.
# 실제 .env 파일은 .gitignore에 포함되어 Git에 올라가지 않습니다.
```

---

### 📍 3단계: 기본 스타일 (css/style.css)

**파일**: `css/style.css`  
**예상 시간**: 1시간  
**의존성**: `index.html`

**작업 내용**:
- CSS 변수 정의 (색상, 폰트)
- 기본 레이아웃 (header, container, sections)
- KPI 카드 스타일
- 차트 섹션 스타일
- 테이블 스타일
- 필터 버튼 스타일
- 로딩 스피너 애니메이션

**체크리스트**:
- [ ] CSS 변수로 색상 정의
- [ ] Flexbox/Grid 사용하여 레이아웃
- [ ] Hover 상태 정의
- [ ] 로딩 스피너 애니메이션
- [ ] 색상: 증가(초록), 감소(빨강), 무변화(회색)

**핵심 CSS 구조**:
```css
/* CSS 변수 */
:root {
  --primary: #3b82f6;
  --success: #10b981;
  --danger: #ef4444;
  --neutral: #9ca3af;
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border: #e5e7eb;
}

/* 기본 스타일 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
  background: var(--bg-secondary);
  color: var(--text-primary);
  line-height: 1.6;
}

/* Header */
.header {
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, var(--primary), #667eea);
  color: white;
  border-bottom: 2px solid var(--border);
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.header .subtitle {
  font-size: 1.1rem;
  opacity: 0.95;
}

/* Container */
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* Filter Section */
.filter-section {
  background: var(--bg-primary);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 10px 20px;
  border: 2px solid var(--border);
  background: white;
  color: var(--text-primary);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.filter-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.custom-date-picker {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.custom-date-picker input {
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 1rem;
}

.custom-date-picker button {
  padding: 10px 20px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.custom-date-picker button:hover {
  background: #2563eb;
}

.active-filter {
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: 6px;
  font-size: 0.95rem;
  color: var(--text-secondary);
}

/* KPI Cards */
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.kpi-card {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.kpi-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.kpi-title {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.kpi-icon {
  font-size: 1.5rem;
}

.kpi-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.kpi-change {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.kpi-change.positive {
  color: var(--success);
}

.kpi-change.negative {
  color: var(--danger);
}

.kpi-change.neutral {
  color: var(--neutral);
}

.kpi-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* Chart Section */
.chart-section {
  background: var(--bg-primary);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-section h2 {
  font-size: 1.25rem;
  margin-bottom: 20px;
  color: var(--text-primary);
}

#revenueChart {
  max-height: 400px;
}

/* Table Section */
.table-section {
  background: var(--bg-primary);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-section h2 {
  font-size: 1.25rem;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: var(--bg-secondary);
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.data-table tbody tr:hover {
  background: var(--bg-secondary);
}

/* Loading Spinner */
.loading-spinner {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 20px;
  z-index: 1000;
}

.loading-spinner.active {
  display: flex;
}

.spinner {
  border: 4px solid var(--border);
  border-top: 4px solid var(--primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner p {
  color: white;
  font-size: 1.1rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 12px;
  border: 1px solid var(--border);
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.pagination button:hover {
  background: var(--bg-secondary);
}

.pagination button.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

### 📍 4단계: 반응형 스타일 (css/responsive.css)

**파일**: `css/responsive.css`  
**예상 시간**: 45분  
**의존성**: `style.css`

**작업 내용**:
- Tablet (768-1023px) 미디어 쿼리
- Mobile (<768px) 미디어 쿼리
- 터치 친화적 크기 (44px 이상)

**파일 내용**:
```css
/* ============================================
   Responsive Design
   ============================================ */

/* Tablet (768px ~ 1023px) */
@media (max-width: 1023px) and (min-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }

  .header .subtitle {
    font-size: 1rem;
  }

  .container {
    padding: 15px;
  }

  .kpi-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .custom-date-picker {
    flex-direction: column;
    align-items: stretch;
  }

  .custom-date-picker input,
  .custom-date-picker button {
    width: 100%;
  }

  .filter-buttons {
    gap: 8px;
  }

  .filter-btn {
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  .data-table th,
  .data-table td {
    padding: 10px;
    font-size: 0.9rem;
  }

  .kpi-value {
    font-size: 1.5rem;
  }

  .pagination button {
    padding: 6px 10px;
    font-size: 0.9rem;
  }
}

/* Mobile (<768px) */
@media (max-width: 767px) {
  .header {
    padding: 20px 15px;
    margin-bottom: 20px;
  }

  .header h1 {
    font-size: 1.5rem;
    margin-bottom: 5px;
  }

  .header .subtitle {
    font-size: 0.95rem;
  }

  .container {
    padding: 10px;
  }

  /* KPI Cards - 1열 레이아웃 */
  .kpi-cards {
    grid-template-columns: 1fr;
    gap: 15px;
    margin-bottom: 20px;
  }

  .kpi-card {
    padding: 15px;
  }

  .kpi-value {
    font-size: 1.5rem;
  }

  .kpi-change {
    font-size: 1rem;
  }

  /* Filter Section */
  .filter-section {
    padding: 15px;
    margin-bottom: 20px;
  }

  .filter-buttons {
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .filter-btn {
    padding: 8px 14px;
    font-size: 0.85rem;
    flex: 1;
    min-width: calc(33.333% - 6px);
  }

  .custom-date-picker {
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .custom-date-picker input,
  .custom-date-picker button {
    width: 100%;
    padding: 10px;
    font-size: 1rem; /* 터치 친화적 크기 */
    min-height: 44px; /* 터치 타겟 최소 크기 */
  }

  .custom-date-picker span {
    display: none;
  }

  .active-filter {
    padding: 8px;
    font-size: 0.85rem;
  }

  /* Chart Section */
  .chart-section {
    padding: 15px;
    margin-bottom: 20px;
  }

  .chart-section h2 {
    font-size: 1.1rem;
    margin-bottom: 15px;
  }

  #revenueChart {
    max-height: 300px;
  }

  /* Table Section */
  .table-section {
    padding: 15px;
  }

  .table-section h2 {
    font-size: 1.1rem;
    margin-bottom: 15px;
  }

  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .data-table {
    font-size: 0.85rem;
    min-width: 400px;
  }

  .data-table th,
  .data-table td {
    padding: 8px;
    min-width: 60px;
  }

  .data-table th {
    font-size: 0.8rem;
  }

  /* Pagination */
  .pagination {
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 15px;
  }

  .pagination button {
    padding: 6px 10px;
    font-size: 0.85rem;
    min-height: 40px;
    min-width: 40px;
  }

  /* Loading Spinner */
  .spinner {
    width: 30px;
    height: 30px;
  }

  .loading-spinner p {
    font-size: 1rem;
  }
}

/* Extra Small (<480px) */
@media (max-width: 479px) {
  .filter-btn {
    min-width: calc(50% - 4px);
  }

  .kpi-icon {
    font-size: 1.2rem;
  }

  .kpi-value {
    font-size: 1.3rem;
  }

  .header h1 {
    font-size: 1.3rem;
  }
}

/* Accessibility - 터치 친화적 크기 */
@media (hover: none) {
  button {
    min-height: 44px;
    min-width: 44px;
  }

  input {
    min-height: 44px;
  }
}
```

---

### 📍 5단계: Supabase 통합 (js/db.js)

**파일**: `js/db.js`  
**예상 시간**: 45분  
**의존성**: `.env` (환경변수)

**작업 내용**:
- Supabase 클라이언트 초기화
- `fetchMetrics()` - 데이터 조회
- `calculateKPIs()` - KPI 계산
- `cacheData()` - 캐싱 로직

**파일 내용**:
```javascript
// db.js - Supabase 데이터 관리

// 환경변수에서 Supabase 설정 로드
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// Supabase 클라이언트 초기화 (Supabase JS 라이브러리 필요)
// 참고: 또는 fetch API로 직접 호출 가능
let supabaseClient = null;

// 캐시 관리
const dataCache = {
  data: null,
  timestamp: null,
  ttl: 5 * 60 * 1000 // 5분 TTL
};

/**
 * Supabase 클라이언트 초기화
 * 참고: 간단한 구현을 위해 fetch API 사용
 */
async function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase 환경변수 설정 필요');
    return false;
  }
  return true;
}

/**
 * 지정된 기간의 메트릭 데이터 조회
 * @param {string} startDate - 시작일 (YYYY-MM-DD)
 * @param {string} endDate - 종료일 (YYYY-MM-DD)
 * @returns {Promise<Array|null>} 데이터 배열 또는 null
 */
async function fetchMetrics(startDate, endDate) {
  try {
    // 캐시 확인
    const cached = getCachedData();
    if (cached) {
      return cached;
    }

    showLoadingSpinner(true);

    // Supabase REST API 호출
    const url = `${SUPABASE_URL}/rest/v1/daily_metrics`;
    const params = new URLSearchParams();
    params.append('date', `gte.${startDate}`);
    params.append('date', `lte.${endDate}`);
    params.append('order', 'date.desc');

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }

    const data = await response.json();
    setCachedData(data);
    return data;
  } catch (error) {
    console.error('fetchMetrics 오류:', error);
    showErrorMessage('데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
    return null;
  } finally {
    showLoadingSpinner(false);
  }
}

/**
 * KPI 지표 계산
 * @param {Array} currentData - 현재 기간 데이터
 * @param {Array} previousData - 이전 기간 데이터
 * @returns {Object} KPI 데이터 및 변화율
 */
function calculateKPIs(currentData, previousData = []) {
  if (!currentData || currentData.length === 0) {
    return {
      revenue: 0,
      visitors: 0,
      conversionRate: 0,
      newCustomers: 0,
      changes: {
        revenue: 0,
        visitors: 0,
        conversionRate: 0,
        newCustomers: 0
      }
    };
  }

  // 현재 기간 KPI 계산
  const currentKPIs = {
    revenue: currentData.reduce((sum, d) => sum + (d.revenue || 0), 0),
    visitors: currentData.reduce((sum, d) => sum + (d.visitors || 0), 0),
    conversionRate: currentData[0]?.conversion_rate || 0,
    newCustomers: currentData.reduce((sum, d) => sum + (d.new_customers || 0), 0)
  };

  // 이전 기간 KPI 계산
  const previousKPIs = previousData.length > 0 ? {
    revenue: previousData.reduce((sum, d) => sum + (d.revenue || 0), 0),
    visitors: previousData.reduce((sum, d) => sum + (d.visitors || 0), 0),
    conversionRate: previousData[0]?.conversion_rate || 0,
    newCustomers: previousData.reduce((sum, d) => sum + (d.new_customers || 0), 0)
  } : {
    revenue: 1,
    visitors: 1,
    conversionRate: currentKPIs.conversionRate,
    newCustomers: 1
  };

  // 변화율 계산 (0 제외 방지)
  const calculateChangePercent = (current, previous) => {
    if (previous === 0) return 0;
    return (((current - previous) / Math.abs(previous)) * 100).toFixed(1);
  };

  const changes = {
    revenue: calculateChangePercent(currentKPIs.revenue, previousKPIs.revenue),
    visitors: calculateChangePercent(currentKPIs.visitors, previousKPIs.visitors),
    conversionRate: (currentKPIs.conversionRate - previousKPIs.conversionRate).toFixed(1),
    newCustomers: calculateChangePercent(currentKPIs.newCustomers, previousKPIs.newCustomers)
  };

  return {
    ...currentKPIs,
    changes
  };
}

/**
 * 변화율에 따른 상태 반환
 * @param {number} change - 변화율
 * @returns {string} 'positive' | 'negative' | 'neutral'
 */
function getChangeStatus(change) {
  if (change > 0) return 'positive';
  if (change < 0) return 'negative';
  return 'neutral';
}

/**
 * 캐시된 데이터 가져오기
 * @returns {Array|null}
 */
function getCachedData() {
  if (dataCache.data && Date.now() - dataCache.timestamp < dataCache.ttl) {
    return dataCache.data;
  }
  return null;
}

/**
 * 데이터 캐시에 저장
 * @param {Array} data
 */
function setCachedData(data) {
  dataCache.data = data;
  dataCache.timestamp = Date.now();
}

/**
 * 캐시 초기화
 */
function clearCache() {
  dataCache.data = null;
  dataCache.timestamp = null;
}

/**
 * 로딩 스피너 표시/숨김
 * @param {boolean} show
 */
function showLoadingSpinner(show) {
  const spinner = document.getElementById('loadingSpinner');
  if (show) {
    spinner?.classList.add('active');
  } else {
    spinner?.classList.remove('active');
  }
}

/**
 * 에러 메시지 표시
 * @param {string} message
 */
function showErrorMessage(message) {
  alert(message); // 또는 토스트 알림으로 개선 가능
}

// 모듈 내보내기
const db = {
  initSupabase,
  fetchMetrics,
  calculateKPIs,
  getChangeStatus,
  clearCache
};
```

---

### 📍 6단계: Chart.js 래퍼 (js/chart.js)

**파일**: `js/chart.js`  
**예상 시간**: 30분  
**의존성**: `db.js`, Chart.js CDN

**작업 내용**:
- Chart.js 초기화
- `createChart()` - 차트 생성
- `updateChart()` - 차트 업데이트
- `destroyChart()` - 차트 제거

**파일 내용**:
```javascript
// chart.js - Chart.js 래퍼 모듈

let chartInstance = null;

/**
 * 매출 추이 차트 생성
 * @param {Array} data - daily_metrics 배열
 */
function createChart(data) {
  if (!data || data.length === 0) {
    console.warn('차트 데이터가 없습니다');
    return;
  }

  const ctx = document.getElementById('revenueChart');
  if (!ctx) {
    console.error('Canvas 요소를 찾을 수 없습니다');
    return;
  }

  // 기존 차트 제거
  destroyChart();

  // 데이터 준비 (날짜 역순 정렬)
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sortedData.map(d => formatDate(d.date, 'MM-DD'));
  const revenues = sortedData.map(d => d.revenue);

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '일별 매출',
        data: revenues,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { size: 12 },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 11 },
          borderColor: '#3b82f6',
          borderWidth: 1,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              return `매출: ₩${formatCurrency(value)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₩' + formatCurrency(value);
            },
            font: { size: 11 }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: { size: 11 }
          }
        }
      }
    }
  });
}

/**
 * 차트 업데이트
 * @param {Array} data - 새로운 데이터
 */
function updateChart(data) {
  if (!chartInstance) {
    createChart(data);
    return;
  }

  if (!data || data.length === 0) {
    console.warn('업데이트할 데이터가 없습니다');
    return;
  }

  // 데이터 정렬
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sortedData.map(d => formatDate(d.date, 'MM-DD'));
  const revenues = sortedData.map(d => d.revenue);

  // 차트 데이터 업데이트
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = revenues;
  chartInstance.update('active');
}

/**
 * 차트 제거
 */
function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}

/**
 * 통화 포맷팅
 * @param {number} value
 * @returns {string}
 */
function formatCurrency(value) {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'K';
  }
  return value.toFixed(0);
}

/**
 * 날짜 포맷팅
 * @param {string} dateString - YYYY-MM-DD
 * @param {string} format - 'MM-DD' 또는 'YYYY-MM-DD'
 * @returns {string}
 */
function formatDate(dateString, format = 'YYYY-MM-DD') {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (format === 'MM-DD') {
    return `${month}-${day}`;
  }
  return `${year}-${month}-${day}`;
}

// 모듈 내보내기
const chartModule = {
  createChart,
  updateChart,
  destroyChart,
  formatCurrency,
  formatDate
};
```

---

### 📍 7단계: 메인 로직 (js/app.js)

**파일**: `js/app.js`  
**예상 시간**: 1시간  
**의존성**: `db.js`, `chart.js`, `index.html`

**작업 내용**:
- 페이지 초기화
- 이벤트 핸들러 등록
- 필터 로직
- UI 업데이트 함수
- 데이터 바인딩

**파일 내용**:
```javascript
// app.js - 메인 애플리케이션 로직

// 애플리케이션 상태
let appState = {
  currentData: [],
  previousData: [],
  kpis: {},
  startDate: null,
  endDate: null,
  filterDays: 7,
  currentPage: 1,
  pageSize: 20
};

/**
 * 애플리케이션 초기화
 */
async function initApp() {
  try {
    // Supabase 초기화
    const initialized = await db.initSupabase();
    if (!initialized) {
      showErrorMessage('Supabase 설정이 필요합니다. .env 파일을 확인해주세요.');
      return;
    }

    // 초기 날짜 설정 (최근 7일)
    const today = new Date();
    appState.endDate = formatDateISO(today);
    appState.startDate = formatDateISO(addDays(today, -7));

    // 초기 데이터 로드
    await loadDashboardData();

    // 이벤트 핸들러 등록
    registerEventHandlers();

    console.log('Dashboard 초기화 완료');
  } catch (error) {
    console.error('초기화 오류:', error);
    showErrorMessage('애플리케이션 초기화 중 오류가 발생했습니다.');
  }
}

/**
 * 대시보드 데이터 로드
 */
async function loadDashboardData() {
  try {
    showLoadingSpinner(true);

    // 현재 기간 데이터
    const currentData = await db.fetchMetrics(appState.startDate, appState.endDate);
    if (!currentData) {
      showErrorMessage('데이터 로드 실패');
      return;
    }

    appState.currentData = currentData;

    // 이전 기간 데이터 (변화율 계산용)
    const previousStartDate = formatDateISO(addDays(new Date(appState.startDate), -appState.filterDays));
    const previousEndDate = formatDateISO(addDays(new Date(appState.startDate), -1));
    const previousData = await db.fetchMetrics(previousStartDate, previousEndDate);
    appState.previousData = previousData || [];

    // KPI 계산
    appState.kpis = db.calculateKPIs(appState.currentData, appState.previousData);

    // UI 업데이트
    updateDashboard();
  } catch (error) {
    console.error('데이터 로드 오류:', error);
    showErrorMessage('데이터를 불러올 수 없습니다.');
  } finally {
    showLoadingSpinner(false);
  }
}

/**
 * 전체 대시보드 UI 업데이트
 */
function updateDashboard() {
  renderKPICards();
  chartModule.updateChart(appState.currentData);
  renderTable();
  updateActiveFilterDisplay();
}

/**
 * KPI 카드 렌더링
 */
function renderKPICards() {
  const container = document.getElementById('kpiCards');
  if (!container) return;

  const kpiConfig = [
    {
      title: '매출',
      key: 'revenue',
      icon: '📊',
      formatter: (val) => `₩${(val / 1000000).toFixed(1)}M`
    },
    {
      title: '방문자',
      key: 'visitors',
      icon: '👥',
      formatter: (val) => `${(val / 1000).toFixed(1)}k명`
    },
    {
      title: '전환율',
      key: 'conversionRate',
      icon: '📈',
      formatter: (val) => `${val}%`
    },
    {
      title: '신규고객',
      key: 'newCustomers',
      icon: '⭐',
      formatter: (val) => `${val}명`
    }
  ];

  container.innerHTML = kpiConfig.map(config => {
    const value = appState.kpis[config.key];
    const change = appState.kpis.changes[config.key];
    const changeStatus = db.getChangeStatus(change);

    return `
      <div class="kpi-card">
        <div class="kpi-header">
          <h3 class="kpi-title">${config.title}</h3>
          <span class="kpi-icon">${config.icon}</span>
        </div>
        <div class="kpi-value">${config.formatter(value)}</div>
        <div class="kpi-change ${changeStatus}">
          ${change > 0 ? '↑' : change < 0 ? '↓' : '→'} ${Math.abs(change)}%
        </div>
        <div class="kpi-label">전기 대비</div>
      </div>
    `;
  }).join('');
}

/**
 * 데이터 테이블 렌더링
 */
function renderTable() {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;

  const data = appState.currentData;
  const startIdx = (appState.currentPage - 1) * appState.pageSize;
  const endIdx = startIdx + appState.pageSize;
  const pageData = data.slice(startIdx, endIdx);

  tbody.innerHTML = pageData.map(row => `
    <tr>
      <td>${row.date}</td>
      <td>₩${(row.revenue || 0).toLocaleString()}</td>
      <td>${(row.visitors || 0).toLocaleString()}명</td>
      <td>${row.conversion_rate || 0}%</td>
      <td>${row.new_customers || 0}명</td>
    </tr>
  `).join('');

  // 페이지네이션 렌더링
  renderPagination(data.length);
}

/**
 * 페이지네이션 렌더링
 */
function renderPagination(totalItems) {
  const container = document.getElementById('pagination');
  if (!container) return;

  const totalPages = Math.ceil(totalItems / appState.pageSize);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const buttons = [];
  
  // 이전 버튼
  if (appState.currentPage > 1) {
    buttons.push(`<button onclick="goToPage(${appState.currentPage - 1})">◀</button>`);
  }

  // 페이지 번호
  for (let i = 1; i <= totalPages; i++) {
    const active = i === appState.currentPage ? 'active' : '';
    buttons.push(`<button class="${active}" onclick="goToPage(${i})">${i}</button>`);
  }

  // 다음 버튼
  if (appState.currentPage < totalPages) {
    buttons.push(`<button onclick="goToPage(${appState.currentPage + 1})">▶</button>`);
  }

  container.innerHTML = buttons.join('');
}

/**
 * 페이지 이동
 */
function goToPage(page) {
  appState.currentPage = page;
  renderTable();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 활성 필터 표시 업데이트
 */
function updateActiveFilterDisplay() {
  const element = document.getElementById('activeFilterText');
  if (!element) return;

  const startDate = new Date(appState.startDate);
  const endDate = new Date(appState.endDate);
  const days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  element.textContent = `조회기간: ${appState.startDate} ~ ${appState.endDate} (${days}일)`;
}

/**
 * 이벤트 핸들러 등록
 */
function registerEventHandlers() {
  // 빠른 필터 버튼
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', handleQuickFilter);
  });

  // 커스텀 날짜 제출
  document.getElementById('submitDate')?.addEventListener('click', handleCustomDate);

  // Enter 키로도 제출 가능
  document.getElementById('endDate')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleCustomDate();
  });
}

/**
 * 빠른 필터 처리
 */
async function handleQuickFilter(e) {
  const days = parseInt(e.target.dataset.days);
  
  // 활성 버튼 업데이트
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  e.target.classList.add('active');

  // 상태 업데이트
  appState.filterDays = days;
  const today = new Date();
  appState.endDate = formatDateISO(today);
  appState.startDate = formatDateISO(addDays(today, -days));
  appState.currentPage = 1;

  // 데이터 로드
  await loadDashboardData();
}

/**
 * 커스텀 날짜 처리
 */
async function handleCustomDate() {
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');

  const startDate = startDateInput?.value;
  const endDate = endDateInput?.value;

  if (!startDate || !endDate) {
    showErrorMessage('시작일과 종료일을 선택해주세요.');
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    showErrorMessage('종료일이 시작일보다 늦어야 합니다.');
    return;
  }

  // 상태 업데이트
  appState.startDate = startDate;
  appState.endDate = endDate;
  appState.currentPage = 1;

  // 빠른 필터 버튼 비활성화
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // 데이터 로드
  await loadDashboardData();
}

/**
 * 날짜 추가/차감 (일 단위)
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 날짜를 ISO 포맷으로 변환 (YYYY-MM-DD)
 */
function formatDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 로딩 스피너 표시/숨김
 */
function showLoadingSpinner(show) {
  const spinner = document.getElementById('loadingSpinner');
  if (show) {
    spinner?.classList.add('active');
  } else {
    spinner?.classList.remove('active');
  }
}

/**
 * 에러 메시지 표시
 */
function showErrorMessage(message) {
  alert(message); // 또는 토스트 알림으로 개선
}

// 페이지 로드 시 앱 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// 전역 함수 (HTML onclick에서 사용)
window.goToPage = goToPage;
```

---

## ✅ 구현 완료 체크리스트

### 파일별 완성도

- [ ] **1단계**: `index.html` - HTML 구조
- [ ] **2단계**: `.env.example` - 환경변수 템플릿
- [ ] **3단계**: `css/style.css` - 기본 스타일
- [ ] **4단계**: `css/responsive.css` - 반응형 CSS
- [ ] **5단계**: `js/db.js` - Supabase 통합
- [ ] **6단계**: `js/chart.js` - Chart.js 래퍼
- [ ] **7단계**: `js/app.js` - 메인 로직

### 기능 검증 체크리스트

**기능 테스트**:
- [ ] 페이지 로드 시 최근 7일 데이터 표시
- [ ] KPI 카드 표시 및 색상 적용 (증가/감소/무변화)
- [ ] 차트 렌더링 및 호버 시 상세값 표시
- [ ] 빠른 필터 버튼 (7일/30일/90일) 작동
- [ ] 커스텀 날짜 선택 및 조회 작동
- [ ] 테이블 페이지네이션 작동
- [ ] 로딩 스피너 표시/숨김

**반응형 테스트**:
- [ ] Desktop (1024px 이상): 4열 KPI 카드 확인
- [ ] Tablet (768-1023px): 2열 KPI 카드 확인
- [ ] Mobile (<768px): 1열 KPI 카드 확인

**성능 테스트**:
- [ ] 초기 로딩 시간 < 3초
- [ ] 필터 변경 후 업데이트 < 500ms
- [ ] 차트 렌더링 < 1초

---

## 🎓 개발 팁

### 1. Supabase 설정 확인
```javascript
// 개발자 도구 콘솔에서 확인
console.log('SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY);
```

### 2. API 호출 디버깅
```javascript
// Network 탭에서 API 요청 확인
// 응답 상태: 200이면 정상
// 401이면 API Key 오류
// 404이면 URL 또는 테이블명 오류
```

### 3. Chart.js 문제 해결
```javascript
// Canvas가 로드되지 않으면
document.addEventListener('DOMContentLoaded', () => {
  // 재시도
});
```

### 4. 반응형 테스트
```bash
# Chrome DevTools에서:
# 1. F12 열기
# 2. Toggle device toolbar (Ctrl+Shift+M)
# 3. 다양한 해상도 테스트
```

---

## 📞 다음 단계

구현이 완료되면 Check 단계를 실행하세요:

```bash
/pdca analyze dashboard
```

이 명령으로 Design 문서와 구현 코드를 비교하여:
- Gap 분석
- 매치율 계산 (90% 이상 목표)
- 개선 사항 식별

---

**작성일**: 2026-04-13  
**상태**: Do 단계 가이드 제공  
**다음 단계**: 7단계 구현 → Check 단계 (`/pdca analyze dashboard`)
