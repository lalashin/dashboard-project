# Plan: 사내 성과 대시보드

## Executive Summary

| 관점 | 설명 |
|------|------|
| **Problem** | 사내 성과 데이터를 실시간으로 시각화하고 관리할 수 있는 대시보드가 필요함 |
| **Solution** | Supabase DB와 Chart.js를 활용한 반응형 웹 대시보드 구축 |
| **Function UX Effect** | KPI 카드, 추이 차트, 필터 기능으로 직관적인 성과 분석 가능 |
| **Core Value** | 데이터 기반 의사결정을 위한 중앙화된 성과 모니터링 플랫폼 제공 |

---

## 1. 프로젝트 정보

### 1.1 프로젝트명
사내 성과 대시보드 (Internal Performance Dashboard)

### 1.2 목표
Vercel 배포를 통한 프로덕션 성과 대시보드 운영

### 1.3 프로젝트 기간
예상 개발 기간: 2-3주

### 1.4 기술 스택
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **차트**: Chart.js v3.x
- **Database**: Supabase (PostgreSQL)
- **배포**: Vercel

---

## 2. 요구사항 정의

### 2.1 기능 요구사항 (FR)

#### FR-01: KPI 카드 표시
- **설명**: 4개의 주요 성과 지표를 카드 형식으로 표시
- **상세 요구사항**:
  - 매출 (Revenue): 현재 기간 총 매출액
  - 방문자 (Visitors): 현재 기간 총 방문 수
  - 전환율 (Conversion Rate): 방문자 대비 구매 비율 (%)
  - 신규고객 (New Customers): 현재 기간 신규 고객 수
- **전기 대비**: 필터로 고른 **N일 구간**의 위 지표(매출·방문·신규는 기간 합계, 전환율은 방문자 가중 %)를 **바로 직전 동일 N일**과 비교. 매출·방문·신규는 증감 **%**, 전환율은 **퍼센트포인트** 차이.
- **표시 형식**: 
  - 지표명, 현재값, 전기 대비 변화 (위 규칙에 따른 % 또는 p.p.)
  - 변화율 색상: 증가(녹색), 감소(빨강), 무변화(회색)

#### FR-02: 매출 추이 차트
- **설명**: 선택된 기간 동안의 일별 매출 변화를 시각화
- **상세 요구사항**:
  - Chart.js Line Chart 사용
  - X축: 날짜, Y축: 매출액
  - 최근 7일 기본값
  - 마우스 호버 시 상세 값 표시 (Tooltip)

#### FR-03: 일별 데이터 테이블
- **설명**: 선택된 기간의 일별 상세 데이터 표시
- **상세 요구사항**:
  - 컬럼: 날짜, 매출, 방문자, 전환율, 신규고객
  - 데이터 정렬: 날짜 기준 (최신순)
  - 행 호버 효과
  - 스크롤 가능한 테이블 (모바일 지원)

#### FR-04: 날짜 필터
- **설명**: 사용자가 조회 기간을 선택할 수 있는 필터
- **상세 요구사항**:
  - 버튼식: 7일, 30일, 90일 (Quick Filter)
  - 커스텀 날짜 범위 선택 가능 (Date Picker)
  - 필터 변경 시 모든 UI 자동 업데이트

#### FR-05: Supabase DB 연동
- **설명**: 클라우드 DB에서 실시간 데이터 조회
- **상세 요구사항**:
  - 테이블명: `dashboard_data`
  - 컬럼: `id`, `date`, `revenue`, `visitors`, `conversion_rate`, `new_customers`
  - 인증: Supabase API Key (공개 가능)
  - 에러 처리: 네트워크 실패 시 재시도 로직

#### FR-06: 반응형 레이아웃
- **설명**: 다양한 화면 크기에서 최적의 사용자 경험 제공
- **상세 요구사항**:
  - Desktop: 1024px 이상 (2열 레이아웃)
  - Tablet: 768px - 1023px (1.5열 레이아웃)
  - Mobile: 768px 이하 (1열 레이아웃)
  - 터치 친화적인 요소 크기 (최소 44px)

---

## 3. 비기능 요구사항 (NFR)

### 3.1 성능 (Performance)
- 초기 로딩 시간: < 3초
- 데이터 필터링: < 500ms
- 차트 렌더링: < 1초

### 3.2 보안 (Security)
- Supabase API Key는 환경변수로 관리
- 클라이언트 사이드 인증은 Row-Level Security (RLS) 활용
- HTTPS 필수 (Vercel 자동 제공)

### 3.3 호환성 (Compatibility)
- Modern Browsers: Chrome, Firefox, Safari, Edge (최신 2개 버전)
- IE는 지원하지 않음

### 3.4 접근성 (Accessibility)
- WCAG 2.1 Level AA 기준 준수
- Semantic HTML 사용
- 색상 이외의 방법으로도 정보 전달

---

## 4. 데이터 모델

### 4.1 Supabase 테이블: `dashboard_data`

```sql
CREATE TABLE dashboard_data (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date DATE NOT NULL UNIQUE,
  revenue DECIMAL(15, 2) NOT NULL DEFAULT 0,
  visitors INT NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  new_customers INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 데이터 예시
- 일자: 2024-01-15
- 매출: 1,500,000 KRW
- 방문자: 2,500명
- 전환율: 3.5%
- 신규고객: 87명

---

## 5. 사용자 시나리오

### 5.1 기본 사용 사나리오
1. 대시보드 접속
2. 최근 7일 데이터 자동 로드
3. KPI 카드 확인 (전기 대비 성과)
4. 매출 추이 차트 분석
5. 일별 상세 데이터 테이블 검토

### 5.2 기간 변경 사나리오
1. "30일" 필터 버튼 클릭
2. 모든 UI (카드, 차트, 테이블) 자동 업데이트
3. 새로운 기간의 데이터 조회 및 변화율 재계산

### 5.3 커스텀 기간 사나리오
1. 날짜 선택 UI 열기
2. 시작일자 및 종료일자 선택
3. "조회" 버튼 클릭
4. 선택된 기간의 데이터만 표시

---

## 6. 구현 범위 (Scope)

### 6.1 포함 사항 (In Scope)
- ✅ 4개 KPI 카드 구현
- ✅ Chart.js 매출 추이 차트
- ✅ 일별 데이터 테이블
- ✅ 7일/30일/90일 필터 버튼
- ✅ 커스텀 날짜 범위 선택
- ✅ Supabase 데이터 연동
- ✅ 반응형 CSS 디자인
- ✅ Vercel 배포

### 6.2 제외 사항 (Out of Scope)
- ❌ 관리자 데이터 입력 기능 (현재)
- ❌ 사용자 인증 / 권한 관리
- ❌ 데이터 내보내기 (Excel, PDF)
- ❌ 실시간 알림 기능
- ❌ 모바일 앱 (웹만 제공)

---

## 7. 성공 기준 (Success Criteria)

| 기준 | 측정 방법 | 목표값 |
|------|---------|-------|
| 기능 완성도 | 모든 FR 구현 | 100% |
| 성능 | 초기 로딩 시간 | < 3초 |
| 반응형 테스트 | 주요 해상도별 테스트 | 통과 |
| 데이터 정확성 | Supabase 쿼리 검증 | 100% 일치 |
| 배포 성공 | Vercel 배포 | 성공 |

---

## 8. 위험 요소 및 대응책

| 위험 요소 | 영향도 | 확률 | 대응책 |
|---------|--------|------|-------|
| Supabase API 응답 지연 | 높음 | 낮음 | 로딩 스피너 추가, 재시도 로직 구현 |
| 대량 데이터 렌더링 성능 | 중간 | 중간 | 페이지네이션 또는 가상 스크롤 고려 |
| 브라우저 호환성 문제 | 중간 | 낮음 | 크로스 브라우저 테스트 수행 |
| Vercel 배포 실패 | 높음 | 매우 낮음 | 환경변수 설정 재확인, 빌드 로그 검토 |

---

## 9. 문서 및 리소스

### 9.1 외부 문서
- [Supabase 공식 문서](https://supabase.com/docs)
- [Chart.js 가이드](https://www.chartjs.org/docs/latest/)
- [Vercel 배포 가이드](https://vercel.com/docs)

### 9.2 프로젝트 구조
```
dashboard-project/
├── index.html
├── css/
│   ├── style.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── db.js
│   └── chart.js
├── docs/
│   ├── 01-plan/
│   ├── 02-design/
│   ├── 03-do/
│   ├── 04-analysis/
│   └── 05-report/
├── .env.example
├── .gitignore
└── README.md
```

---

## 10. 다음 단계

1. ✅ **Plan 단계 완료**
2. ⏳ **Design 단계**: 상세 설계 문서 작성
   - UI/UX 와이어프레임
   - 컴포넌트 구조 설계
   - API 엔드포인트 정의
3. ⏳ **Do 단계**: 개발 시작
4. ⏳ **Check 단계**: 설계와 구현 비교 (Gap Analysis)
5. ⏳ **Act 단계**: 개선 및 최적화
6. ⏳ **Report 단계**: 완료 보고서 작성

---

**작성일**: 2026-04-13  
**상태**: Plan 단계 완료  
**다음 단계**: `/pdca design dashboard` 실행
