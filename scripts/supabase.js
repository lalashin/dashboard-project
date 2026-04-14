/**
 * Supabase 클라이언트 — 강의 실습에서 연결합니다.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://axkryplbvmwytawkjvri.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sNMLC6-E7PR5SvUTorHcTQ_JZXOD3RE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
