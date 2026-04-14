# 사내 성과 대시보드

> 팀 주간 성과를 KPI 카드·추이 차트·일별 테이블로 실시간 모니터링하는 단일 페이지 웹 앱

---

## 주요 기능

- **KPI 카드** — 매출·방문자·전환율·신규고객 수치와 전기 대비 증감률 표시
- **추이 차트** — 기간별 다중 라인 차트 (Chart.js)로 트렌드 시각화
- **기간 필터** — 최근 7일 / 30일 / 90일 버튼 + 커스텀 날짜 범위 선택
- **페이지네이션 테이블** — 일별 상세 메트릭을 20행 단위로 페이지 분할 표시
- **오프라인 폴백** — Supabase 미연결 시 `data/sample.json`으로 자동 전환

---

## 기술 스택

| 구분 | 사용 |
|------|------|
| UI | HTML5, CSS3, Vanilla JavaScript (ES modules) |
| 빌드 | [Vite](https://vitejs.dev/) 5 |
| 데이터 | [Supabase JS](https://supabase.com/docs/reference/javascript/introduction) |
| 차트 | [Chart.js](https://www.chartjs.org/) 4 |
| 배포 | [Vercel](https://vercel.com/) |

---

## 스크린샷

| PC | 모바일 |
|----|--------|
| _(추후 추가)_ | _(추후 추가)_ |

---

## 로컬 실행 방법

### 요구 사항

- Node.js 18+
- npm 또는 호환 패키지 매니저

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone <저장소 URL>
cd dashboard-project

# 2. 의존성 설치
npm install

# 3. 환경변수 설정 (아래 섹션 참고)
cp .env.example .env

# 4. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속합니다.

### 프로덕션 빌드

```bash
npm run build
npm run preview   # 빌드 결과 미리보기
```

---

## 환경변수 설정

### 규칙 (필독)

| 규칙 | 설명 |
|------|------|
| **`VITE_` 접두사** | Supabase URL·키·테이블명 등 **브라우저 번들에 실릴 설정**은 이름이 반드시 `VITE_`로 시작해야 한다. 그래야 Vite가 `import.meta.env`에 주입한다. |
| **`.env` 커밋 금지** | **`.env`는 Git에 올리지 않는다.** 저장소에는 `.env.example`만 두고, 로컬·배포 호스트(Vercel 환경 변수 등)에서만 실제 값을 넣는다. |

루트에 `.env` 파일을 만들고 `.env.example`을 참고해 값을 채웁니다.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key_here
VITE_SUPABASE_METRICS_TABLE=dashboard_data   # 선택. 기본값: dashboard_data
```

| 변수 | 필수 | 설명 |
|------|:----:|------|
| `VITE_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | anon(공개) 키 |
| `VITE_SUPABASE_METRICS_TABLE` | ❌ | 미설정 시 `dashboard_data` 사용 |

> Supabase 프로젝트 생성·테이블·RLS 설정은 **`SETUP.md`** 를 참고하세요.

---

## 배포 URL

[https://dashboard-project-sigma-seven.vercel.app](https://dashboard-project-sigma-seven.vercel.app)

---

## DB 테이블 구조

**테이블명**: `dashboard_data`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | `bigint` | 기본 키 (auto increment) |
| `date` | `date` | 날짜 (YYYY-MM-DD, unique) |
| `revenue` | `numeric` | 일별 매출 (원) |
| `visitors` | `integer` | 일별 방문자 수 |
| `conversion_rate` | `numeric` | 전환율 (%) |
| `new_customers` | `integer` | 신규 고객 수 |
| `created_at` | `timestamptz` | 생성 시각 (자동) |

```sql
CREATE TABLE dashboard_data (
  id             bigint generated always as identity primary key,
  date           date        not null unique,
  revenue        numeric     not null default 0,
  visitors       integer     not null default 0,
  conversion_rate numeric    not null default 0,
  new_customers  integer     not null default 0,
  created_at     timestamptz not null default now()
);
```

---

## 프로젝트 구조

```
dashboard-project/
├── index.html
├── styles/
│   └── main.css              # 전역·반응형 스타일
├── scripts/
│   ├── app.js                # UI·필터·차트·테이블 렌더
│   ├── db.js                 # Supabase 조회·KPI/트렌드 변환·캐싱
│   ├── supabase.js           # 클라이언트 초기화
│   └── chart.js              # 차트 래퍼
├── data/sample.json          # Supabase 미연결 시 폴백
├── docs/
│   ├── domain/               # Supabase·SQL·REST 참고
│   └── guide/                # 도구 역할 가이드
├── SETUP.md                  # Supabase·환경 설정 상세
├── CLAUDE.md                 # 코딩 컨벤션·커밋 정책
└── README.md                 # 이 파일
```

---

## 문서

| 문서 | 내용 |
|------|------|
| `SETUP.md` | Supabase 프로젝트·테이블·RLS 설정 |
| `docs/domain/supabase-sql-api.md` | 스키마·쿼리·REST 예시 |
| `docs/guide/claude-vs-cursor-agent.md` | Claude Code vs Cursor 역할 나누기 |
| `CLAUDE.md` | 코딩 컨벤션·커밋 정책·작업 흐름 |

---

## 라이선스

[MIT](LICENSE)
