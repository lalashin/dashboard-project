/**
 * Supabase 클라이언트 — .env의 환경변수로 초기화합니다.
 * 미설정 시 null을 export하며, 각 호출부에서 null 가드 후 sample.json으로 폴백합니다.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export { supabase };
