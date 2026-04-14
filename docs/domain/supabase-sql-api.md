# Supabase 도메인: SQL · REST API · JS 클라이언트

**역할**: 이 프로젝트의 Supabase 관련 **테이블명·쿼리·API 패턴·환경 변수**를 한 파일에서 참조합니다.  
**캐논 테이블명**: `dashboard_data` (`docs/01-plan/features/dashboard.plan.md` 및 설계서와 동일)

**다른 이름의 테이블만 있을 때**: 예를 들어 DB에 `daily_metrics`만 있는 경우 `.env`에 `VITE_SUPABASE_METRICS_TABLE=daily_metrics` 로 지정하거나, SQL로 `dashboard_data`로 리네임·이관합니다(`SETUP.md` 참고).

---

## 1. 테이블 개요

| 항목 | 설명 |
|------|------|
| **이름** | `public.dashboard_data` |
| **용도** | 일별 성과 지표(매출·방문자·전환율·신규고객) 저장 |
| **키** | `date` 유니크(일 1행) |

### 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | `BIGINT` | PK, `GENERATED ALWAYS AS IDENTITY` |
| `date` | `DATE` | 일자 `YYYY-MM-DD`, **NOT NULL UNIQUE** |
| `revenue` | `DECIMAL(15,2)` | 일 매출(원) |
| `visitors` | `INT` | 방문자 수 |
| `conversion_rate` | `DECIMAL(5,2)` | 전환율(%) |
| `new_customers` | `INT` | 신규 고객 수 |
| `created_at` | `TIMESTAMP` | 생성 시각 |
| `updated_at` | `TIMESTAMP` | 수정 시각 |

> **이전 문서와의 정리**: 예전 자료에서 `daily_metrics` 등 다른 이름을 썼다면, 본 저장소의 **공식 테이블명은 `dashboard_data`** 입니다. 기존 DB 이름을 바꾸거나 앱에서 `VITE_SUPABASE_METRICS_TABLE` 로 맞춥니다.

---

## 2. DDL (스키마 생성)

Supabase **SQL Editor**에서 실행:

```sql
CREATE TABLE IF NOT EXISTS dashboard_data (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date DATE NOT NULL UNIQUE,
  revenue DECIMAL(15, 2) NOT NULL DEFAULT 0,
  visitors INT NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  new_customers INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 3. RLS (Row Level Security)

클라이언트에서 `anon` 키로 읽으려면 **SELECT 허용 정책**이 필요합니다.

```sql
ALTER TABLE dashboard_data ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 전용 대시보드(예시): 모든 사용자 SELECT 허용
CREATE POLICY "allow_select_public"
  ON dashboard_data
  FOR SELECT
  USING (true);
```

운영 정책에 맞게 `USING` 조건을 좁히거나, `authenticated` 전용으로 바꿉니다.

---

## 4. SQL 레시피 (콘솔·검증용)

### 4.1 전체 조회 (최신순)

```sql
SELECT id, date, revenue, visitors, conversion_rate, new_customers, created_at
FROM dashboard_data
ORDER BY date DESC;
```

### 4.2 기간 필터 (예: 최근 7일)

```sql
SELECT date, revenue, visitors, conversion_rate, new_customers
FROM dashboard_data
WHERE date >= CURRENT_DATE - INTERVAL '6 day'
  AND date <= CURRENT_DATE
ORDER BY date ASC;
```

### 4.3 시드 데이터 (30일 예시)

중복 `date`가 있으면 `UNIQUE` 제약으로 실패합니다. 초기화 시 `DELETE`는 **주의해서** 사용하세요.

```sql
-- 필요 시만: 전체 삭제 후 시드
-- DELETE FROM dashboard_data;
```

아래는 **2026-03-16 ~ 2026-04-14** (30일) 샘플을 한 번에 넣는 예시입니다.

```sql
INSERT INTO dashboard_data (date, revenue, visitors, conversion_rate, new_customers)
VALUES
  ('2026-03-16', 2100000, 1200, 2.8, 34),
  ('2026-03-17', 2350000, 1350, 3.1, 42),
  ('2026-03-18', 2600000, 1500, 3.4, 51),
  ('2026-03-19', 2450000, 1420, 3.2, 45),
  ('2026-03-20', 2850000, 1680, 3.7, 62),
  ('2026-03-21', 3100000, 1850, 3.9, 72),
  ('2026-03-22', 2950000, 1750, 3.5, 61),
  ('2026-03-23', 3250000, 1950, 4.1, 80),
  ('2026-03-24', 3500000, 2100, 4.3, 90),
  ('2026-03-25', 3350000, 2000, 4.0, 85),
  ('2026-03-26', 3700000, 2200, 4.5, 99),
  ('2026-03-27', 3900000, 2350, 4.7, 110),
  ('2026-03-28', 4100000, 2450, 4.9, 120),
  ('2026-03-29', 4350000, 2600, 5.1, 135),
  ('2026-03-30', 4500000, 2750, 5.2, 145),
  ('2026-03-31', 4200000, 2550, 4.8, 130),
  ('2026-04-01', 4600000, 2850, 5.3, 150),
  ('2026-04-02', 4800000, 2950, 5.4, 160),
  ('2026-04-03', 5100000, 3100, 5.6, 175),
  ('2026-04-04', 5350000, 3250, 5.8, 190),
  ('2026-04-05', 5600000, 3400, 6.0, 205),
  ('2026-04-06', 5850000, 3550, 6.2, 220),
  ('2026-04-07', 6100000, 3700, 6.4, 235),
  ('2026-04-08', 6350000, 3850, 6.6, 250),
  ('2026-04-09', 6550000, 3950, 6.8, 265),
  ('2026-04-10', 6750000, 4050, 7.0, 280),
  ('2026-04-11', 6900000, 4150, 7.1, 295),
  ('2026-04-12', 7100000, 4250, 7.3, 310),
  ('2026-04-13', 7350000, 4400, 7.5, 330),
  ('2026-04-14', 7600000, 4550, 7.7, 350);
```

한 줄만 추가할 때:

```sql
INSERT INTO dashboard_data (date, revenue, visitors, conversion_rate, new_customers)
VALUES ('2026-04-15', 7800000, 4700, 7.9, 365);
```

### 4.4 데이터 삭제 후 ID 시퀀스 (선택)

`DELETE FROM dashboard_data` 후 PK를 맞추고 싶을 때만 (운영 DB에서는 신중히):

```sql
-- PostgreSQL identity 시퀀스 이름은 환경마다 다를 수 있음
-- SELECT pg_get_serial_sequence('dashboard_data', 'id');
-- SELECT setval(pg_get_serial_sequence('dashboard_data', 'id'), 1, false);
```

### 4.5 행 수·기간 확인

```sql
SELECT COUNT(*) AS total_rows FROM dashboard_data;
SELECT MIN(date) AS earliest, MAX(date) AS latest FROM dashboard_data;
```

---

## 5. REST API (PostgREST)

Supabase는 PostgREST를 통해 테이블을 REST로 노출합니다.

| 항목 | 값 |
|------|-----|
| **Base URL** | `https://<project-ref>.supabase.co` |
| **REST 엔드포인트** | `GET/POST/PATCH/DELETE` `https://<project-ref>.supabase.co/rest/v1/dashboard_data` |
| **헤더** | `apikey: <anon key>` |
| | `Authorization: Bearer <anon key>` |
| **Content-Type** | JSON 사용 시 `application/json` |

### 예시: 최근 행만 (curl)

```http
GET /rest/v1/dashboard_data?select=date,revenue,visitors,conversion_rate,new_customers&order=date.desc&limit=7
Host: <project-ref>.supabase.co
apikey: <anon>
Authorization: Bearer <anon>
```

---

## 6. JavaScript 클라이언트 (`@supabase/supabase-js`)

프로젝트에서는 `createClient` 후 `.from('dashboard_data')` 로 접근합니다.

```javascript
const { data, error } = await supabase
  .from('dashboard_data')
  .select('date, revenue, visitors, conversion_rate, new_customers')
  .gte('date', startIsoDate)
  .lte('date', endIsoDate)
  .order('date', { ascending: true });
```

- **환경 변수**: 프로젝트 루트 `.env.example` 참고 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **브라우저 정적 호스팅**: `.env`를 직접 읽을 수 없으므로, 실습/배포 방식에 맞게 키 주입(빌드·런타임 설정)을 맞춥니다.
- **anon 키**: 대시보드 **Settings → API → anon (public)** 의 JWT 형식 키를 사용합니다. (일부 `sb_publishable_` 전용 키는 REST와 다를 수 있음.)

---

## 7. 관련 문서 링크

| 문서 | 용도 |
|------|------|
| `docs/01-plan/features/dashboard.plan.md` | 요구사항·데이터 모델 개요 |
| `docs/02-design/features/dashboard.design.md` | RLS 예시·아키텍처 |
| `.env.example` | 변수 이름 규약 |

---

*정리 기준: 도메인 지식은 이 파일을 우선 갱신하고, Plan/Design과 차이가 나면 본 문서 또는 상위 문서를 함께 맞춥니다.*
