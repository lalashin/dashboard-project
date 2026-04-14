/**
 * Supabase 클라이언트 — 강의 실습에서 연결합니다.
 * .env 파일의 환경변수를 읽어 Supabase 클라이언트를 초기화합니다.
 * (Vite 빌드 시스템을 통해 import.meta.env로 접근 가능)
 */
import { createClient } from '@supabase/supabase-js';

/**
 * 환경변수에서 Supabase 설정을 읽습니다.
 * Vite를 사용 중: import.meta.env.VITE_SUPABASE_URL
 * 또는 localStorage에서 동적으로 읽기
 */
const SUPABASE_URL =
  import.meta.env?.VITE_SUPABASE_URL ||
  localStorage.getItem('SUPABASE_URL') ||
  '';

const SUPABASE_ANON_KEY =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  localStorage.getItem('SUPABASE_ANON_KEY') ||
  '';

let supabase = null;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[Supabase] VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 설정되지 않았습니다.\n' +
    '다음 중 하나를 선택하세요:\n' +
    '1. Vite 빌드 시스템 사용 → npm install vite && vite build\n' +
    '2. localStorage에 수동 입력 → localStorage.setItem("SUPABASE_URL", "your_url")',
  );
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('[Supabase] 클라이언트 초기화 완료:', {
    url: SUPABASE_URL.substring(0, 30) + '...',
    key: SUPABASE_ANON_KEY.substring(0, 20) + '...',
  });
}

export { supabase };
