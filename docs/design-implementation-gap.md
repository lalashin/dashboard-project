# 설계 vs 구현 정합성 점검

**기준 문서**: `docs/02-design/features/dashboard.design.md` (및 Plan의 데이터 모델)  
**점검 대상**: `index.html`, `scripts/app.js`, `scripts/supabase.js`, `vite.config.js`, `package.json`  
**점검 일자**: 2026-04-14 기준 저장소 상태  
**갱신**: 갭 **§2.1 테이블명** — Plan·도메인·코드·SETUP을 **`dashboard_data`** 로 통일 (2026-04-14 이후)

---

## Executive Summary

| 구분 | 판단 |
|------|------|
| **UI 골격** | 헤더·필터(7/30/90)·KPI 4개·차트·테이블 컬럼 → **설계와 대체로 일치** |
| **데이터 계층** | `dashboard_data` 쿼리·`db.js`·KPI(전기=직전 동일 N일 대비) → **설계와 일치** · 캐시·고급 필터 등은 **부분 구현** |
| **빌드/런타임** | 설계는 Vanilla + 경로 `js/` 가정 → 실제는 **Vite + `scripts/` + npm Chart/Supabase** |

---

## 1. 일치·부분 일치 항목

### 1.1 화면 구조 (컴포넌트 트리)

| 설계 | 구현 | 비고 |
|------|------|------|
| Header (제목·부제) | `dashboard-header`, `dashboard-title`, `dashboard-subtitle` | 일치 |
| 필터 7/30/90일 | `.filter-btn[data-days]` | 일치 (라벨은 설계 예시는 "최근 N일", 구현은 "N일") |
| KPI 4종 (매출·방문자·전환율·신규고객) | `data-kpi` + 동일 지표명 | 일치 |
| 차트 + `canvas` | `#revenueChart` | 일치 |
| 테이블 컬럼 5개 | `thead` 동일 | 일치 |
| KPI 증감 색상 클래스 (`positive` / `negative` 등) | CSS + `formatChangeDisplay` | 일치 |

### 1.2 필터 동작

- 설계: 빠른 필터 클릭 시 기간 변경 후 UI 갱신.
- 구현: `setupFilterButtons()` → `loadDashboardByDays(days)` → KPI·테이블·차트 재렌더.
- **일치** (커스텀 날짜·활성 기간 표시는 미구현 — 아래 갭).

### 1.3 Supabase 연동 (개념)

- 설계: Supabase에서 기간별 데이터 조회 후 UI 반영.
- 구현: `fetchSupabaseData` → 실패/빈 결과 시 `sample.json` 폴백.
- **개념 일치**, 세부는 아래 갭.

### 1.4 테이블 인터랙션

- 설계: 행 호버 강조.
- 구현: `styles/main.css` 등에서 줄무늬·hover.
- **일치**.

---

## 2. 불일치·갭 (우선순위 순)

### 2.1 데이터 모델: 테이블 이름 — **처리됨 (공식명 `dashboard_data`)**

| 출처 | 테이블명 |
|------|----------|
| Plan / Design / `docs/domain/supabase-sql-api.md` | **`dashboard_data`** |
| `scripts/app.js` (`METRICS_TABLE` / `fetchSupabaseData`) | **`dashboard_data`** (기본값, `.env`로 예외 가능) |

- **조치**: 문서·`SETUP.md`·앱 기본 조회 대상을 `dashboard_data` 로 맞춤.
- **예외**: DB에 예전 이름(`daily_metrics` 등)만 있으면 `VITE_SUPABASE_METRICS_TABLE` 또는 테이블 리네임으로 맞춤. 상세는 `docs/domain/supabase-sql-api.md`.

### 2.2 아키텍처·파일 분리

| 설계 | 구현 |
|------|------|
| `app.js` = Controller, `chart.js` = 차트 래퍼, **`db.js`** = Supabase·캐시·KPI 계산 | **`app.js`에 Chart import, Supabase fetch, 변환, KPI, 테이블, 차트가 집중** |
| `scripts/chart.js` (래퍼) 존재 가정 | **`chart.js`는 번들에 연결되지 않음**; 차트는 `app.js` 내 `renderRevenueChart` |

- **갭**: 관심사 분리·재사용 함수명(`createChart`/`updateChart` 등)은 설계와 다름. 유지보수 시 설계도 “단일 모듈” 기준으로 바꾸거나, 코드를 분리해 맞출 수 있음.

### 2.3 KPI·“전기 대비” 의미 — **처리됨 (설계·코드 정합)**

| 설계 (데이터 흐름 3.1) | 구현 (`db.js` `transformSupabaseData`) |
|------------------------|----------------------------------------|
| 선택 N일 구간 합계 vs **직전 동일 N일** 비교 | 동일: 캘린더로 현재/직전 구간 분리 후 매출·방문·신규는 합계 대비 **증감률(%)**, 전환율은 방문자 가중 % 대비 **퍼센트포인트 차이** |

- `sample.json` 폴백 시에는 JSON에 정의된 `changePercent`를 그대로 쓰므로, 데모 데이터 의미는 문서·수치에 따름(Supabase 경로와 별개).

### 2.4 필터 (설계 2.2.4)

| 항목 | 설계 | 구현 |
|------|------|------|
| 커스텀 날짜 (시작~종료 + 조회) | 있음 | **없음** |
| 활성 필터 표시 (조회기간 문구) | 있음 | **없음** |
| 버튼 `active` 스타일 | 예시 있음 | **있음** (`setupFilterButtons`) |

### 2.5 KPI 카드 마크업 (2.2.1)

| 설계 | 구현 |
|------|------|
| `kpi-icon` (이모지 등) | **없음** (타이틀·값·증감·라벨만) |

- 기능상 필수는 아니나 **설계 스냅샷과 UI 디테일 불일치**.

### 2.6 차트 (2.2.2)

| 항목 | 설계 | 구현 |
|------|------|------|
| 시각 | 단일 데이터셋 예시(일별 매출), 파란 계열 | **3개 라인**(매출·방문자·3번째 시리즈) 보라/파랑/초록 |
| 데이터 | 매출 중심 | 3번째 시리즈는 `trend.orders`인데 **범례/툴팁은 "신규고객"** — **지표와 라벨 불일치** 가능 |

- 설계는 “매출 추이 선 그래프” 중심이고, 구현은 **다지표 라인**으로 확장됨.
- `orders`를 신규고객처럼 표시하면 **의미 오류**이므로, 설계에 맞추려면 3번째 축은 `new_customers` 일별(또는 설계대로 매출만)으로 맞추는 편이 안전.

### 2.7 테이블 (2.2.3)

| 항목 | 설계 | 구현 |
|------|------|------|
| 정렬 | 날짜 **내림차순(최신순)** | 쿼리/배열 **오름차순(과거→최신)** 이 자연스러움 — **정렬 방향 불일치 가능** |
| 페이지네이션 | 한 페이지 **20행** | **전체 행 한 번에 렌더** |

### 2.8 로딩·성능 (설계 1·3·Executive Summary)

| 항목 | 설계 | 구현 |
|------|------|------|
| 로딩 스피너 | 있음 | **미구현** (콘솔 로그 위주) |
| 캐시 | 로컬 캐시 언급 | **미구현** |
| 페이지네이션·디바운싱·이벤트 위임 | 언급 | 테이블 페이지네이션·디바운스 **미구현** (필터는 단순 클릭) |

### 2.9 환경·보안

| 항목 | 설계 | 구현 |
|------|------|------|
| API 키 | `.env` / 환경 변수 | `vite.config.js`의 `define`으로 주입 가능 + **`supabase.js`에 URL/키 하드코딩** — **저장소에 올리면 유출 위험** (`.gitignore`·예시 파일만 커밋 권장) |

### 2.10 빌드 체인

- 설계 문서 일부는 **CDN Chart + `js/` 스크립트** 가정.
- 실제는 **Vite**, `import.meta.env`, npm `chart.js` / `@supabase/supabase-js`, `index.html`에서 **`/scripts/app.js` 모듈 단일 엔트리**.
- **의도된 스택 진화로 보면 OK**, 문서의 “파일 경로·로드 방식”만 최신화하면 일치시키기 쉬움.

---

## 3. 정합성 요약 표

| 영역 | 설계 대비 일치도 | 메모 |
|------|------------------|------|
| 페이지 레이아웃·주요 컴포넌트 | 높음 | 아이콘·부가 필터 UI 제외 |
| Supabase 테이블명 | 높음 | 코드·SETUP·Plan/Design이 `dashboard_data`로 통일됨 |
| 데이터·KPI 의미 | 높음 | Supabase 경로는 기간 합계·직전 N일 대비로 설계와 일치 |
| 모듈 구조 (`db.js` 등) | 낮음 | `app.js` 집중 |
| 필터·차트·테이블 고급 기능 | 중간~낮음 | 날짜 직접 선택·페이지네이션·스피너·캐시 미구현 |
| 차트 지표 수·라벨 | 검토 필요 | 3번째 시리즈 = orders vs “신규고객” 라벨 |

---

## 4. 권장 후속 작업 (우선순위)

1. ~~**테이블명 통일**~~ → 공식명 **`dashboard_data`** 로 문서·코드 반영 완료. Supabase Table Editor에 동일 이름 테이블이 있는지 확인.
2. ~~**KPI 정의 통일**~~ → “전기 대비” = 직전 동일 N일 대비로 설계·`transformSupabaseData` 반영 완료.
3. **차트 3번째 시리즈**: `new_customers` 일별을 쓸지, 매출 단일 라인으로 되돌릴지 설계와 동일하게.
4. **비밀 정보**: `supabase.js`에서 키 제거 → `.env` + Vite만 사용, 저장소에는 `.env.example`만.
5. **문서 업데이트**: `dashboard.design.md`의 파일 경로(`js/` → `scripts/`), 빌드(Vite), 실제 엔트리(`type="module"` 1개) 반영.

---

*이 문서는 갭 분석용이며, 기능 변경이 있으면 함께 갱신하세요.*
