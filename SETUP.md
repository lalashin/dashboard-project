# 대시보드 프로젝트 셋업 가이드

## 📋 단계별 설치

### 1단계: 의존성 설치

```bash
npm install
```

이 명령어는 다음을 설치합니다:
- `vite`: 빌드 및 개발 서버
- `@supabase/supabase-js`: Supabase 클라이언트
- `chart.js`: 차트 라이브러리

### 2단계: 환경변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 다음 정보를 입력합니다:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key_here

# 다른 테이블명만 쓸 때(기본은 dashboard_data). 예: daily_metrics만 있으면
# VITE_SUPABASE_METRICS_TABLE=daily_metrics
```

**Supabase 키 얻는 방법:**
1. [supabase.com](https://supabase.com) 방문
2. 프로젝트 생성 또는 기존 프로젝트 선택
3. `Settings` → `API` → `Project URL`과 `anon public` 키 복사

### 3단계: Supabase 테이블 생성

공식 스키마 테이블명은 **`dashboard_data`** (`docs/domain/supabase-sql-api.md` 동일). 새 프로젝트는 콘솔 SQL에서 실행:

```sql
CREATE TABLE IF NOT EXISTS dashboard_data (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date DATE NOT NULL UNIQUE,
  revenue DECIMAL(15, 2) NOT NULL DEFAULT 0,
  visitors INTEGER NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  new_customers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_data_date ON dashboard_data(date DESC);

ALTER TABLE dashboard_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"
  ON dashboard_data FOR SELECT
  USING (true);
```

### 4단계: 샘플 데이터 입력

Supabase 콘솔 SQL 에디터에서 실행:

```sql
INSERT INTO dashboard_data (date, revenue, visitors, conversion_rate, new_customers)
VALUES
  ('2026-04-08', 2500000, 1500, 3.2, 48),
  ('2026-04-09', 2750000, 1620, 3.5, 57),
  ('2026-04-10', 3100000, 1900, 3.8, 72),
  ('2026-04-11', 2900000, 1750, 3.4, 60),
  ('2026-04-12', 3350000, 2050, 3.9, 80),
  ('2026-04-13', 3600000, 2200, 4.1, 90),
  ('2026-04-14', 3800000, 2350, 4.2, 98);
```

### 5단계: 개발 서버 실행

```bash
npm run dev
```

브라우저가 자동으로 열리며, `http://localhost:3000` 에서 대시보드를 확인할 수 있습니다.

## 🔍 동작 확인

### 콘솔 확인
1. 브라우저 개발자 도구 (`F12`) 열기
2. `Console` 탭 확인
3. 다음 중 하나가 출력되어야 함:
   - `[Supabase] 데이터 로드 성공:` → Supabase 연결 성공 ✅
   - `[App] Supabase 데이터 없음. sample.json으로 폴백합니다.` → 폴백 모드 실행 ⚠️

### Network 탭 확인
1. 개발자 도구 `Network` 탭 열기
2. 페이지 새로고침
3. `supabase.co` 도메인으로 요청이 있는지 확인

## 📦 프로덕션 빌드

```bash
npm run build
```

결과물은 `dist/` 디렉토리에 생성됩니다.

### Vercel에 배포

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 로그인
vercel login

# 3. 배포
vercel --prod
```

## ⚠️ 문제 해결

### "VITE_SUPABASE_URL이 설정되지 않았습니다" 에러

**원인**: `.env` 파일이 없거나 변수가 비어있음

**해결책**:
1. `.env` 파일 생성 확인
2. 정확한 Supabase URL과 키 입력
3. `npm run dev` 재시작

### "Cannot query database" 에러

**원인**: Supabase 테이블이 없거나 RLS 정책 오류

**해결책**:
1. Supabase 콘솔에서 `dashboard_data` 테이블 존재 확인
2. RLS 정책에서 SELECT 권한 확인
3. 테이블 스키마 재확인

### 차트가 표시되지 않음

**원인**: Chart.js 로드 실패 또는 데이터 형식 오류

**해결책**:
1. 개발자 도구에서 에러 메시지 확인
2. 샘플 데이터가 정상 로드되는지 확인 (Network 탭)
3. 브라우저 캐시 초기화 (`Ctrl+Shift+Delete`)

---

**문서 작성일**: 2026-04-14  
**마지막 수정**: 2026-04-14
