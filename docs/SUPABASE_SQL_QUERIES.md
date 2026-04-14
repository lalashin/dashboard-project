# Supabase SQL 쿼리 가이드

## 📊 현재 데이터 조회

Supabase 콘솔의 SQL 에디터에서 다음 쿼리를 실행하여 현재 데이터를 확인할 수 있습니다.

### 1. 현재 저장된 모든 데이터 조회

```sql
-- 현재 dashboard_data 테이블의 모든 데이터 조회
SELECT 
  id,
  date,
  revenue,
  visitors,
  conversion_rate,
  new_customers,
  created_at
FROM dashboard_data
ORDER BY date DESC;
```

### 2. 최근 7일 데이터만 조회

```sql
SELECT 
  date,
  revenue,
  visitors,
  conversion_rate,
  new_customers
FROM dashboard_data
ORDER BY date DESC
LIMIT 7;
```

---

## 📝 30일 샘플 데이터 추가

**다음 쿼리를 복사해서 Supabase 콘솔 → SQL Editor에 붙여넣기하세요.**

> ⚠️ 주의: 이미 같은 날짜의 데이터가 있으면 중복될 수 있습니다. 
> 필요시 먼저 `DELETE FROM dashboard_data;` 로 기존 데이터를 삭제하세요.

### 30일 데이터 INSERT

```sql
-- 2026년 3월 16일 ~ 4월 14일 (30일치) 샘플 데이터 추가
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

---

## 🎯 직접 수동으로 데이터 추가하기

위의 쿼리가 너무 길면, 한 줄씩 직접 추가할 수도 있습니다:

```sql
-- 예시: 2026-04-15 데이터 추가
INSERT INTO dashboard_data (date, revenue, visitors, conversion_rate, new_customers)
VALUES ('2026-04-15', 7800000, 4700, 7.9, 365);
```

매일 하나씩 추가하려면 날짜와 수치만 바꾸면 됩니다.

---

## 🗑️ 기존 데이터 삭제 (필요시)

만약 기존 데이터를 모두 삭제하고 새로 시작하고 싶으면:

```sql
-- ⚠️ 주의: 이 쿼리는 모든 데이터를 삭제합니다!
DELETE FROM dashboard_data;

-- 삭제 후 ID 시퀀스 초기화 (선택사항)
ALTER SEQUENCE dashboard_data_id_seq RESTART WITH 1;
```

---

## ✅ 데이터 입력 후 확인

데이터를 추가한 후 다음을 실행하여 정상 입력되었는지 확인하세요:

```sql
-- 추가된 데이터 개수 확인
SELECT COUNT(*) as total_rows FROM dashboard_data;

-- 날짜 범위 확인
SELECT MIN(date) as earliest, MAX(date) as latest FROM dashboard_data;

-- 최신 10개 데이터 확인
SELECT date, revenue, visitors, conversion_rate, new_customers
FROM dashboard_data
ORDER BY date DESC
LIMIT 10;
```

---

## 🚀 브라우저에서 확인

1. **30일 데이터를 모두 추가한 후**
2. **브라우저를 새로고침하면** (`F5` 또는 `Ctrl+R`)
3. **차트에 30개의 라인 데이터가 표시됩니다!**

### 예상 결과

- 📈 **3개 라인 차트**: 매출(보라색), 방문자(파란색), 신규고객(초록색)
- 📊 **30개 데이터 포인트** 표시
- 💡 **마우스 호버**: 날짜별 상세 데이터 표시

---

## 📋 데이터 구조

각 행의 의미:

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `date` | DATE | 데이터 수집 날짜 (YYYY-MM-DD) | `2026-04-14` |
| `revenue` | DECIMAL | 일일 매출 (원) | `7600000` |
| `visitors` | INT | 일일 방문자 수 (명) | `4550` |
| `conversion_rate` | DECIMAL | 전환율 (%) | `7.7` |
| `new_customers` | INT | 신규 고객 수 (명) | `350` |

---

## 🔧 추가 팁

### Supabase 콘솔 접속
1. [supabase.com](https://supabase.com) 로그인
2. 프로젝트 선택
3. 왼쪽 사이드바 → `SQL Editor`
4. 새 쿼리 작성 또는 위의 쿼리 복사

### 데이터 자동 생성 (선택사항)
더 현실적인 데이터가 필요하면, 다음과 같이 난수로 생성할 수 있습니다:

```sql
-- PostgreSQL 함수로 자동 생성 (고급)
WITH RECURSIVE dates AS (
  SELECT '2026-03-16'::date as d
  UNION ALL
  SELECT d + interval '1 day' FROM dates WHERE d < '2026-04-14'
)
INSERT INTO dashboard_data (date, revenue, visitors, conversion_rate, new_customers)
SELECT 
  d,
  FLOOR(2000000 + RANDOM() * 5600000)::BIGINT,
  FLOOR(1000 + RANDOM() * 3500)::INT,
  FLOOR(RANDOM() * 100) / 10,
  FLOOR(10 + RANDOM() * 340)::INT
FROM dates;
```

---

**문서 작성일**: 2026-04-14
