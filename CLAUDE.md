# 사내 성과 대시보드 프로젝트 가이드

## 📋 프로젝트 개요

**프로젝트명**: 사내 성과 대시보드 (Internal Performance Dashboard)  
**목적**: 팀 주간 성과 실시간 모니터링  
**개발 기간**: 2-3주  
**배포 플랫폼**: Vercel  

---

## 🛠️ 기술 스택

| 카테고리 | 기술 | 용도 |
|---------|------|------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) | UI/사용자 상호작용 |
| **Database** | Supabase (PostgreSQL) | 성과 데이터 저장소 |
| **차트** | Chart.js v3.x | 데이터 시각화 |
| **배포** | Vercel | 프로덕션 호스팅 |
| **버전관리** | Git | 코드 관리 |

---

## 📁 파일 구조

```
dashboard-project/
├── index.html                  # 메인 HTML (뷰 레이어)
├── styles/
│   ├── main.css               # 기본 스타일
│   └── responsive.css         # 반응형 CSS
├── scripts/
│   ├── app.js                 # 메인 애플리케이션 로직
│   ├── supabase.js            # Supabase 데이터 관리
│   └── chart.js               # Chart.js 래퍼
├── data/
│   └── sample.json            # 샘플 데이터
├── .env.example               # 환경변수 템플릿
├── .gitignore                 # Git 제외 파일 설정
├── docs/
│   ├── 01-plan/features/
│   ├── 02-design/features/
│   ├── 03-do/features/
│   ├── 04-analysis/
│   ├── 05-report/
│   └── compact/
├── CLAUDE.md                  # 이 파일 (개발 가이드)
└── README.md                  # 프로젝트 설명서
```

---

## 🎯 코딩 컨벤션

### 1. 함수명 (camelCase)

```javascript
// ✅ 올바른 예
loadDashboardData()
renderKPICards()
calculateChangePercent()
updateChartData()

// ❌ 피할 것
load_dashboard_data()      // snake_case
LoadDashboardData()        // PascalCase
```

### 2. 파일명 (kebab-case)

```
✅ 올바른 예:
- app.js
- supabase.js
- chart.js
- main.css

❌ 피할 것:
- app_main.js
- AppMain.js
```

### 3. 변수명

**상수**: UPPER_SNAKE_CASE
```javascript
const CACHE_TTL = 5 * 60 * 1000;
const MAX_RETRY_COUNT = 3;
```

**변수**: camelCase
```javascript
let currentData = [];
let isLoading = false;
let kpiCards = [];
```

**Boolean**: is/has/can 접두사
```javascript
let isLoading = false;
let hasError = false;
```

### 4. JSDoc 주석 형식

**함수 주석**:
```javascript
/**
 * 지정된 기간의 메트릭 데이터를 Supabase에서 조회합니다.
 * @param {string} startDate - 시작일 (YYYY-MM-DD)
 * @param {string} endDate - 종료일 (YYYY-MM-DD)
 * @returns {Promise<Array|null>} 메트릭 데이터 배열 또는 null
 * @example
 * const data = await fetchMetrics('2026-04-01', '2026-04-13');
 */
async function fetchMetrics(startDate, endDate) {
  // 구현...
}
```

### 5. 들여쓰기: 2칸 (공백)

```javascript
// ✅ 올바른 예
function renderKPICards() {
  const container = document.getElementById('kpiCards');
  if (!container) {
    return;
  }

  const cards = [];
  for (let i = 0; i < data.length; i++) {
    cards.push(createCard(data[i]));
  }
  
  container.innerHTML = cards.join('');
}
```

---

## 💾 Git 커밋 규칙 (Conventional Commits)

### 커밋 형식

```
<type>(<scope>): <subject>

<body>
```

### Type 종류

| Type | 설명 | 예시 |
|------|------|------|
| **feat** | 새로운 기능 추가 | `feat(chart): 매출 추이 차트 추가` |
| **fix** | 버그 수정 | `fix(supabase): API 응답 에러 처리` |
| **docs** | 문서 수정 | `docs: README 업데이트` |
| **style** | 코드 스타일 | `style: 2칸 들여쓰기 수정` |
| **refactor** | 코드 리팩토링 | `refactor(app): 데이터 로드 로직 간소화` |
| **test** | 테스트 추가 | `test: KPI 계산 함수 테스트` |
| **chore** | 빌드, 의존성 등 | `chore: Chart.js 업그레이드` |
| **perf** | 성능 개선 | `perf(cache): 캐싱으로 성능 개선` |

### Scope

- `app` - 메인 애플리케이션
- `supabase` - 데이터베이스 통신
- `chart` - 차트 렌더링
- `ui` - UI 컴포넌트
- `styles` - 스타일시트

### 커밋 예시

```bash
git commit -m "feat(chart): 매출 추이 선 차트 추가"

git commit -m "fix(supabase): 날짜 필터링 오류 수정

- Supabase 쿼리 조건 수정
- 날짜 형식 일관성 확보"

git commit -m "refactor(app): 데이터 로드 함수 분리"
```

---

## 🔄 작업 흐름

### 1단계: 기능 개발

```bash
# 1. 코드 작성 (컨벤션 준수, JSDoc 주석 추가)
# 2. 기능 테스트

# 3. 변경사항 확인
git status
git diff

# 4. 파일 스테이징
git add scripts/chart.js styles/main.css

# 5. 커밋
git commit -m "feat(chart): 매출 추이 차트 기능 추가"

# 6. 푸시
git push origin main
```

### 2단계: 기능 테스트

**수동 테스트 체크리스트**:
- [ ] 기능이 정상 작동하는가?
- [ ] 브라우저 콘솔에 에러가 없는가?
- [ ] 모바일에서도 정상 표시되는가?
- [ ] 로딩 시간이 3초 이내인가?

---

## 🌐 환경 설정

### .env 파일

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key_here
```

### 환경변수 로드

```javascript
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase 환경변수가 설정되지 않았습니다.');
}
```

---

## 📊 PDCA 주기

프로젝트는 PDCA 방식으로 관리됩니다:

```bash
# 현재 상태 확인
/pdca status

# Gap 분석 (Check 단계)
/pdca analyze dashboard

# 자동 개선 (Act 단계)
/pdca iterate dashboard

# 완료 보고서
/pdca report dashboard
```

---

## 📝 컨텍스트 압축 규칙

장기 세션에서 컨텍스트가 길어질 경우, 다음 규칙에 따라 자동으로 압축됩니다:

### 압축 저장 위치
- **경로**: `docs/compact/`
- **파일명**: `YYYYMMDD_HHMMSS_session_summary.md`
- **예시**: `20260413_065406_session_summary.md`

### 압축 내용
압축된 요약 파일에는 다음 정보가 포함됩니다:

1. **PDCA 진행 상황**
   - 현재 활성 기능
   - 현재 단계 (Plan/Design/Do/Check/Act/Report)
   - 매치율 (Match Rate)

2. **프로젝트 개요**
   - 프로젝트명, 목표, 예상 기간
   - 기술 스택

3. **핵심 요구사항**
   - 기능 요구사항 (FR) 테이블
   - 성능 요구사항 (NFR)
   - 반응형 디자인 요구사항

4. **데이터 모델**
   - Supabase 테이블 스키마
   - SQL 정의

5. **프로젝트 구조**
   - 파일/폴더 트리

6. **완료된 작업**
   - 현재까지 생성된 문서 및 파일 목록

7. **Executive Summary**
   - 4가지 관점 테이블 (Problem/Solution/Function UX Effect/Core Value)

8. **다음 단계**
   - 권장 명령어와 설명

### 압축 후 작업 재개
새 세션에서 작업을 재개할 때:
1. 압축 요약 파일 (`docs/compact/YYYYMMDD_HHMMSS_session_summary.md`) 확인
2. 이 파일이 현재 프로젝트 상태를 대표함
3. PDCA 단계 확인 후 다음 단계 실행

### 주의사항
- 압축 파일은 자동 생성되므로 수정하지 말 것
- 실제 작업 문서는 `docs/` 폴더의 각 단계별 파일 참고
- 압축 파일은 컨텍스트 참고용으로만 사용

---

## ✅ 개발 체크리스트

### 매일 확인사항

- [ ] 코드 컨벤션 준수
- [ ] Git commit 메시지 형식 확인
- [ ] 기능 테스트 완료
- [ ] 콘솔 에러 없음

### 기능 완성 후

- [ ] 수동 테스트 통과
- [ ] 반응형 테스트 (Desktop/Tablet/Mobile)
- [ ] 성능 테스트 (로딩 < 3초)
- [ ] JSDoc 주석 완성

---

## 📞 문제 해결

### Supabase API 401 에러
- ✅ `.env` 파일 확인
- ✅ `VITE_SUPABASE_ANON_KEY` 확인

### 차트가 렌더링되지 않음
- ✅ Canvas 요소 확인 (`id="revenueChart"`)
- ✅ Chart.js CDN 로드 확인

### 반응형 레이아웃 문제
- ✅ viewport 메타 태그 확인
- ✅ 미디어 쿼리 breakpoint 확인

---

**작성일**: 2026-04-13  
**버전**: 1.0.0
