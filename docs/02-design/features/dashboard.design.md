# Design: 사내 성과 대시보드

## Executive Summary

| 관점 | 설명 |
|------|------|
| **Architecture** | 3계층 아키텍처 (Presentation/Logic/Data) - Vanilla JS MVC 패턴으로 관심사 분리 |
| **Components** | KPI 카드, 차트, 테이블 4개 주요 컴포넌트 + 필터 시스템 구성 |
| **Data Flow** | Supabase API → 캐시 → UI 업데이트 (반응형 데이터 바인딩) |
| **Performance Strategy** | 페이지네이션, 디바운싱, 이벤트 위임으로 최적화 |

---

## 1. 아키텍처 설계

### 1.1 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    HTML Presentation Layer                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Header | Filter UI | KPI Cards | Chart | Table    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕ (DOM Events)
┌─────────────────────────────────────────────────────────────┐
│                 JavaScript Logic Layer (MVC)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ app.js (Controller) ← events/state ← UI interaction│  │
│  │ ├─ Filter Handler                                    │  │
│  │ ├─ Data Transform                                    │  │
│  │ └─ Event Coordination                                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ chart.js (Model) - Chart.js 래퍼 & 렌더링 로직      │  │
│  │ ├─ createChart(data)                                 │  │
│  │ ├─ updateChart(data)                                 │  │
│  │ └─ destroyChart()                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ db.js (Model) - 데이터 관리 & Supabase 통신       │  │
│  │ ├─ fetchMetrics(startDate, endDate)                 │  │
│  │ ├─ calculateKPIs(data)                               │  │
│  │ └─ cacheData(data)                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕ (HTTP/Fetch)
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Data Layer                        │
│       PostgreSQL (daily_metrics table + RLS)                │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 3계층 설계 설명

| 계층 | 책임 | 파일 | 주요 함수 |
|------|------|------|---------|
| **Presentation** | HTML/CSS/DOM | index.html, css/ | - |
| **Logic (MVC Controller)** | 이벤트 처리, 상태 관리 | js/app.js | handleFilterChange(), renderUI(), updateDashboard() |
| **Model - Chart** | Chart.js 래퍼 | js/chart.js | createChart(), updateChart() |
| **Model - Data** | DB 통신, 캐싱 | js/db.js | fetchMetrics(), calculateKPIs() |
| **Data Store** | PostgreSQL 저장소 | Supabase | daily_metrics 테이블 |

---

## 2. 컴포넌트 설계

### 2.1 컴포넌트 트리

```
Dashboard (Root)
├── Header
│   └── Title + Subtitle
├── FilterSection
│   ├── QuickFilterButtons (7d, 30d, 90d)
│   ├── CustomDatePicker
│   │   ├── startDate input
│   │   ├── endDate input
│   │   └── "조회" button
│   └── ActiveFilterDisplay
├── KPICardsSection
│   ├── KPICard (Revenue)
│   │   ├── Icon
│   │   ├── Title
│   │   ├── CurrentValue
│   │   ├── ChangePercent (colored)
│   │   └── ComparisonLabel
│   ├── KPICard (Visitors)
│   ├── KPICard (Conversion Rate)
│   └── KPICard (New Customers)
├── ChartSection
│   ├── ChartTitle
│   └── Canvas (for Chart.js)
├── TableSection
│   ├── TableTitle
│   ├── Table
│   │   ├── thead
│   │   │   └── tr: Date | Revenue | Visitors | Conversion Rate | New Customers
│   │   └── tbody
│   │       └── tr (multiple rows, paginated)
│   └── Pagination (optional)
└── LoadingSpinner (overlay, shown during fetch)
```

### 2.2 개별 컴포넌트 명세

#### 2.2.1 KPI Card Component

**목적**: 주요 성과 지표를 시각적으로 표시

**구조**:
```html
<div class="kpi-card">
  <div class="kpi-header">
    <h3 class="kpi-title">매출 (Revenue)</h3>
    <span class="kpi-icon">📊</span>
  </div>
  <div class="kpi-value">₩1,500,000</div>
  <div class="kpi-change positive">+12.5%</div>
  <div class="kpi-label">전기 대비</div>
</div>
```

**상태 표시**:
- `positive` (녹색): 증가
- `negative` (빨강): 감소
- `neutral` (회색): 변화 없음

**반응형**:
- Desktop: 4열 (grid-template-columns: repeat(4, 1fr))
- Tablet: 2열
- Mobile: 1열

#### 2.2.2 Chart Component (Chart.js 래퍼)

**목적**: 매출 추이를 선 그래프로 시각화

**특징**:
- 캔버스 크기: 최소 400px 높이
- 호버 시 상세값 표시
- X축: 날짜 (MM-DD 형식)
- Y축: 매출액 (숫자 포맷)
- 범례: 자동 표시

**설정**:
```javascript
{
  type: 'line',
  data: {
    labels: ['01-01', '01-02', ...],
    datasets: [{
      label: '일별 매출',
      data: [1500000, 1600000, ...],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `₩${context.parsed.y.toLocaleString()}`
        }
      }
    }
  }
}
```

#### 2.2.3 Data Table Component

**목적**: 일별 상세 데이터를 표 형식으로 표시

**컬럼**:
| 컬럼 | 데이터 타입 | 포맷 | 정렬 |
|------|----------|------|------|
| 날짜 | DATE | YYYY-MM-DD | 내림차순 (최신순) |
| 매출 | DECIMAL | ₩ 통화 포맷 | - |
| 방문자 | INT | 천 단위 구분 | - |
| 전환율 | DECIMAL | 백분율 (%) | - |
| 신규고객 | INT | 숫자 | - |

**인터랙션**:
- 행 호버: 배경색 변경
- 클릭 가능성: 향후 상세보기 (현재 Out of Scope)
- 페이지네이션: 한 페이지 20행

#### 2.2.4 Filter Component

**빠른 필터 (Quick Filter)**:
```html
<div class="filter-buttons">
  <button class="filter-btn active" data-days="7">최근 7일</button>
  <button class="filter-btn" data-days="30">최근 30일</button>
  <button class="filter-btn" data-days="90">최근 90일</button>
</div>
```

**커스텀 날짜 선택**:
```html
<div class="custom-date-picker">
  <input type="date" id="startDate" placeholder="시작일">
  <span>~</span>
  <input type="date" id="endDate" placeholder="종료일">
  <button id="submitDate">조회</button>
</div>
```

**활성 필터 표시**:
```html
<div class="active-filter">
  <span>조회기간: 2026-04-06 ~ 2026-04-13 (7일)</span>
</div>
```

---

## 3. 데이터 흐름 설계

### 3.1 초기 로딩 플로우

```
1. 페이지 로드
   ↓
2. app.js 초기화
   ↓
3. db.js fetchMetrics() 호출
   → Supabase 쿼리: SELECT * FROM daily_metrics WHERE date >= ? ORDER BY date DESC
   ↓
4. 데이터 받음 → 로컬 캐시 저장
   ↓
5. calculateKPIs() 실행
   → 이전 기간과 비교하여 변화율 계산
   ↓
6. UI 렌더링
   ├─ renderKPICards()
   ├─ createChart()
   └─ renderTable()
   ↓
7. 로딩 스피너 제거
```

### 3.2 필터 변경 플로우

```
사용자: 필터 버튼 클릭 (예: "30일")
   ↓
handleFilterChange() 트리거
   ↓
필터 상태 업데이트 + UI 표시
   ↓
로딩 스피너 표시
   ↓
db.js fetchMetrics(newStartDate, newEndDate) 호출
   ↓
데이터 받음 → 캐시 갱신
   ↓
calculateKPIs() 재실행
   ↓
updateDashboard() 호출
   ├─ updateKPICards()
   ├─ updateChart()
   └─ updateTable()
   ↓
로딩 스피너 제거
```

### 3.3 Supabase 쿼리 설계

#### 메트릭 조회 쿼리
```javascript
// db.js fetchMetrics() 함수
async function fetchMetrics(startDate, endDate) {
  const { data, error } = await supabase
    .from('daily_metrics')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Supabase error:', error);
    return null; // 재시도 로직으로 처리
  }
  return data;
}
```

#### KPI 계산 로직
```javascript
function calculateKPIs(currentData, previousData) {
  const currentKPIs = {
    revenue: currentData.reduce((sum, d) => sum + d.revenue, 0),
    visitors: currentData.reduce((sum, d) => sum + d.visitors, 0),
    conversionRate: (currentData[0]?.conversion_rate ?? 0),
    newCustomers: currentData.reduce((sum, d) => sum + d.new_customers, 0)
  };
  
  const previousKPIs = {
    revenue: previousData.reduce((sum, d) => sum + d.revenue, 0),
    visitors: previousData.reduce((sum, d) => sum + d.visitors, 0),
    conversionRate: (previousData[0]?.conversion_rate ?? 0),
    newCustomers: previousData.reduce((sum, d) => sum + d.new_customers, 0)
  };
  
  // 변화율 계산
  return {
    ...currentKPIs,
    changes: {
      revenue: ((currentKPIs.revenue - previousKPIs.revenue) / previousKPIs.revenue * 100).toFixed(1),
      visitors: ((currentKPIs.visitors - previousKPIs.visitors) / previousKPIs.visitors * 100).toFixed(1),
      conversionRate: (currentKPIs.conversionRate - previousKPIs.conversionRate).toFixed(1),
      newCustomers: ((currentKPIs.newCustomers - previousKPIs.newCustomers) / previousKPIs.newCustomers * 100).toFixed(1)
    }
  };
}
```

---

## 4. 파일 구조 및 구현 순서

### 4.1 최종 파일 구조

```
dashboard-project/
├── index.html                    (1순위)
├── .env.example                  (2순위)
├── css/
│   ├── style.css                 (3순위 - 기본 스타일)
│   └── responsive.css            (4순위 - 반응형 스타일)
├── js/
│   ├── app.js                    (5순위 - 메인 로직)
│   ├── db.js                     (6순위 - DB 통신)
│   └── chart.js                  (7순위 - 차트 렌더링)
├── docs/
│   ├── 01-plan/features/
│   │   └── dashboard.plan.md     (✅ 완료)
│   ├── 02-design/features/
│   │   └── dashboard.design.md   (🔄 현재 단계)
│   ├── 03-do/features/
│   ├── 04-analysis/
│   ├── 05-report/
│   └── compact/
├── .env                          (실제 환경변수 - Git 제외)
├── .env.example                  (예시 파일 - Git 포함)
├── .gitignore                    (✅ 완료)
└── README.md                     (마지막 - 개발 완료 후)
```

### 4.2 구현 순서 (Do 단계에서 실행)

| 순서 | 파일 | 작업 | 예상 시간 | 의존성 |
|------|------|------|---------|--------|
| 1 | index.html | HTML 구조 작성 (헤더, 필터, 카드, 차트, 테이블) | 30분 | - |
| 2 | .env.example | 환경변수 템플릿 생성 | 5분 | - |
| 3 | css/style.css | 기본 스타일 (색상, 레이아웃, 카드, 테이블) | 1시간 | HTML |
| 4 | css/responsive.css | 반응형 CSS (미디어 쿼리, Tablet, Mobile) | 45분 | style.css |
| 5 | js/db.js | Supabase 초기화, fetchMetrics(), calculateKPIs() | 45분 | HTML, .env |
| 6 | js/chart.js | Chart.js 초기화, createChart(), updateChart() | 30분 | db.js |
| 7 | js/app.js | 메인 로직 (이벤트 핸들링, 상태 관리, UI 업데이트) | 1시간 | 모든 파일 |

**예상 총 시간**: 약 4시간

---

## 5. UI 와이어프레임

### 5.1 Desktop 레이아웃 (1024px 이상)

```
┌─────────────────────────────────────────────────────┐
│  사내 성과 대시보드                      [logo]      │
│  실시간 성과 지표 모니터링                          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 필터:  [7일] [30일] [90일]                          │
│       [시작일 ▼] ~ [종료일 ▼] [조회 버튼]         │
│       활성: 2026-04-06 ~ 2026-04-13 (7일)         │
└─────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│    매출      │   방문자     │   전환율     │  신규고객    │
│ ₩1,500,000   │   2,500명    │   3.5%       │    87명      │
│   +12.5% ↑   │   +8.2% ↑    │   +0.5% →    │  +15.3% ↑   │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────────────┐
│ 매출 추이 (Revenue Trend)                           │
│                                                      │
│  ₩2,000,000 ┤                                        │
│  ₩1,500,000 ┤    ╱╲                                  │
│  ₩1,000,000 ┤   ╱  ╲    ╱╲     ╱╲                    │
│    ₩500,000 ┤  ╱    ╲  ╱  ╲   ╱  ╲                  │
│            ├─────────────────────────                │
│          2026-04-06 → 2026-04-13                     │
│  [마우스 호버 시 상세값 표시]                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 일별 상세 데이터                                    │
├──────────┬──────────┬──────────┬──────────┬──────────┤
│   날짜   │   매출   │  방문자  │  전환율  │신규고객 │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 2026-04-13│₩1,600,000│  2,600명 │   3.8%  │   95명  │
│ 2026-04-12│₩1,550,000│  2,480명 │   3.4%  │   92명  │
│ 2026-04-11│₩1,480,000│  2,350명 │   3.2%  │   88명  │
│    ...    │   ...   │   ...   │   ...   │   ...   │
├─ 페이지네이션: [<] 1 2 3 [>] ─────────────────────┤
└─────────────────────────────────────────────────────┘
```

### 5.2 Tablet 레이아웃 (768-1023px)

```
┌──────────────────────────────────┐
│  사내 성과 대시보드   [logo]      │
│  실시간 성과 지표 모니터링       │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ 필터: [7일][30일][90일]          │
│      [시작일▼] ~ [종료일▼]      │
│      [조회]                      │
│ 활성: 7일                        │
└──────────────────────────────────┘

┌──────────────┬──────────────┐
│    매출      │   방문자     │
│ ₩1,500,000   │   2,500명    │
│   +12.5% ↑   │   +8.2% ↑    │
├──────────────┼──────────────┤
│    전환율    │  신규고객    │
│     3.5%     │     87명     │
│   +0.5% →    │  +15.3% ↑    │
└──────────────┴──────────────┘

┌──────────────────────────────────┐
│ 매출 추이                        │
│  [차트]                          │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ 일별 상세 데이터                │
│ ┌─────────┬────────┬─────────┐  │
│ │  날짜   │  매출  │ 방문자  │  │
│ ├─────────┼────────┼─────────┤  │
│ │04-13    │1,600k  │ 2,600명 │  │
│ │04-12    │1,550k  │ 2,480명 │  │
│ │  ...    │  ...   │  ...    │  │
│ └─────────┴────────┴─────────┘  │
└──────────────────────────────────┘
```

### 5.3 Mobile 레이아웃 (<768px)

```
┌──────────────────┐
│사내 성과 대시보드│
│실시간 지표 모니터│
└──────────────────┘

┌──────────────────┐
│필터: [7일][30일] │
│     [90일]       │
│ [시작일▼][종료일▼]
│    [조회]        │
└──────────────────┘

┌──────────────────┐
│      매출        │
│  ₩1,500,000     │
│    +12.5% ↑      │
└──────────────────┘

┌──────────────────┐
│     방문자       │
│    2,500명       │
│    +8.2% ↑       │
└──────────────────┘

┌──────────────────┐
│     전환율       │
│      3.5%        │
│    +0.5% →       │
└──────────────────┘

┌──────────────────┐
│    신규고객      │
│      87명        │
│    +15.3% ↑      │
└──────────────────┘

┌──────────────────┐
│   매출 추이      │
│    [차트]        │
└──────────────────┘

┌──────────────────┐
│ 일별 데이터      │
│ 날짜: 2026-04-13│
│ 매출: 1,600,000 │
│ 방문자: 2,600명 │
│ 전환율: 3.8%    │
│ 신규: 95명       │
│ ────────────────│
│ 날짜: 2026-04-12│
│ 매출: 1,550,000 │
│ ...              │
└──────────────────┘
```

---

## 6. CSS 아키텍처

### 6.1 스타일 설계 (style.css)

**색상 팔레트**:
```css
:root {
  --primary: #3b82f6;        /* 파란색 - 주요 요소 */
  --secondary: #6366f1;      /* 인디고 - 보조 요소 */
  --success: #10b981;        /* 초록색 - 증가 */
  --danger: #ef4444;         /* 빨강 - 감소 */
  --neutral: #9ca3af;        /* 회색 - 변화 없음 */
  --bg-primary: #ffffff;     /* 흰색 배경 */
  --bg-secondary: #f9fafb;   /* 밝은 회색 배경 */
  --text-primary: #111827;   /* 진한 회색 텍스트 */
  --text-secondary: #6b7280; /* 중간 회색 텍스트 */
  --border: #e5e7eb;         /* 경계선 */
}
```

**기본 레이아웃**:
```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.header {
  padding: 20px 0;
  border-bottom: 2px solid var(--border);
  margin-bottom: 30px;
}

.container {
  background: var(--bg-primary);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

**KPI 카드 스타일**:
```css
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
  transition: all 0.3s ease;
}

.kpi-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.kpi-change.positive { color: var(--success); }
.kpi-change.negative { color: var(--danger); }
.kpi-change.neutral { color: var(--neutral); }
```

**테이블 스타일**:
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.data-table thead {
  background: var(--bg-secondary);
  font-weight: 600;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table tbody tr:hover {
  background: var(--bg-secondary);
  cursor: pointer;
}
```

### 6.2 반응형 설계 (responsive.css)

**미디어 쿼리 breakpoints**:
```css
/* Tablet (768px ~ 1023px) */
@media (max-width: 1023px) and (min-width: 768px) {
  .kpi-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  body {
    padding: 15px;
  }
}

/* Mobile (<768px) */
@media (max-width: 767px) {
  .kpi-cards {
    grid-template-columns: 1fr;
  }
  
  .filter-buttons {
    flex-wrap: wrap;
  }
  
  .data-table {
    font-size: 14px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px;
  }
  
  .custom-date-picker {
    flex-direction: column;
  }
}
```

---

## 7. 성능 최적화 전략

### 7.1 로딩 성능

| 대상 | 목표 | 전략 |
|------|------|------|
| 초기 로딩 | < 3초 | - Supabase 쿼리 최소화<br>- Chart.js 라이브러리 CDN 사용<br>- 로딩 스피너 표시 |
| 필터링 | < 500ms | - 클라이언트 사이드 캐싱<br>- 디바운싱 (300ms)<br>- 필터 결과 메모이제이션 |
| 차트 렌더링 | < 1초 | - Chart.js 기본 설정 사용<br>- 데이터 세트 제한 (최대 90일) |

### 7.2 캐싱 전략

```javascript
// db.js - 메모리 캐싱
let dataCache = {
  data: null,
  timestamp: null,
  ttl: 5 * 60 * 1000  // 5분 TTL
};

function getCachedData() {
  if (dataCache.data && Date.now() - dataCache.timestamp < dataCache.ttl) {
    return dataCache.data;
  }
  return null;
}

function setCachedData(data) {
  dataCache.data = data;
  dataCache.timestamp = Date.now();
}
```

### 7.3 사용자 경험 최적화

- **로딩 스피너**: 데이터 로딩 중 표시
- **점진적 렌더링**: KPI 카드 → 차트 → 테이블 순서로 표시
- **에러 메시지**: 네트워크 오류 시 명확한 메시지 표시
- **재시도 로직**: 실패 시 최대 3회 자동 재시도

---

## 8. 보안 설계

### 8.1 API Key 관리

```bash
# .env.example (Git 포함)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_key_here

# .env (Git 제외)
VITE_SUPABASE_URL=https://actual-project.supabase.co
VITE_SUPABASE_ANON_KEY=actual_public_key_12345
```

### 8.2 Row-Level Security (RLS)

```sql
-- Supabase RLS 정책 (선택사항 - 공개 읽기)
CREATE POLICY "allow_select_public" ON daily_metrics
  FOR SELECT
  USING (true);  -- 모두 읽기 가능 (공개 대시보드)
```

---

## 9. 테스트 계획

### 9.1 수동 테스트 체크리스트

**기능 테스트**:
- [ ] 페이지 로드 시 최근 7일 데이터 자동 로드
- [ ] KPI 카드 표시 및 변화율 색상 적용
- [ ] 차트 마우스 호버 시 상세값 표시
- [ ] 7일/30일/90일 버튼 클릭 시 데이터 업데이트
- [ ] 커스텀 날짜 선택 후 조회 시 데이터 업데이트
- [ ] 테이블 페이지네이션 작동 확인

**반응형 테스트**:
- [ ] Desktop (1024px): 4열 KPI 카드 확인
- [ ] Tablet (768px): 2열 KPI 카드 확인
- [ ] Mobile (375px): 1열 KPI 카드 확인
- [ ] 모든 요소 터치 친화적 크기 (44px 이상)

**성능 테스트**:
- [ ] 초기 로딩 시간 < 3초
- [ ] 필터 변경 후 업데이트 < 500ms
- [ ] 차트 렌더링 < 1초

**브라우저 호환성**:
- [ ] Chrome (최신 2개 버전)
- [ ] Firefox (최신 2개 버전)
- [ ] Safari (최신 2개 버전)
- [ ] Edge (최신 2개 버전)

---

## 10. 구현 가이드라인

### 10.1 코드 컨벤션

**파일명**:
- 소문자, 하이픈 사용: `app.js`, `db.js`, `chart.js`

**함수명**:
- 카멜케이스: `fetchMetrics()`, `calculateKPIs()`, `renderKPICards()`
- 접두사: `init*` (초기화), `handle*` (이벤트), `render*` (UI), `update*` (갱신)

**변수명**:
- 상수: 대문자 언더스코어: `CACHE_TTL`, `MAX_DAYS`
- 함수 변수: 카멜케이스: `startDate`, `kpiCards`, `isLoading`

### 10.2 주석 정책

- 복잡한 로직에만 주석 추가
- 함수 위에 목적과 파라미터 설명
- 예: `// Supabase에서 지정된 기간의 메트릭 데이터 조회`

### 10.3 에러 처리

```javascript
try {
  const data = await fetchMetrics(startDate, endDate);
  if (!data) {
    showErrorMessage('데이터를 불러올 수 없습니다.');
    return;
  }
  updateDashboard(data);
} catch (error) {
  console.error('Dashboard error:', error);
  showErrorMessage('시스템 오류가 발생했습니다.');
}
```

---

## 11. 다음 단계

### 11.1 Do 단계 (구현)

```bash
/pdca do dashboard
```

**구현 순서**:
1. index.html 작성 (HTML 구조)
2. css/style.css + responsive.css (스타일링)
3. .env.example 생성 (환경변수 템플릿)
4. js/db.js (Supabase 통합)
5. js/chart.js (Chart.js 래퍼)
6. js/app.js (메인 로직)

### 11.2 Check 단계 (검증)

```bash
/pdca analyze dashboard
```

- Design 문서와 구현 코드 비교
- Gap 분석 및 매치율 계산
- 90% 이상 달성 여부 확인

### 11.3 Act 단계 (개선)

필요시 자동 개선:
```bash
/pdca iterate dashboard
```

---

**작성일**: 2026-04-13  
**상태**: Design 단계 완료  
**다음 단계**: `/pdca do dashboard` 실행
