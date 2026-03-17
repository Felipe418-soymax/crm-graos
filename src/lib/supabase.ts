import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

/** Lazy-initialized Supabase client (avoids build-time errors when env vars are missing) */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      const supabaseUrl = process.env.SUPABASE_URL || ''
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''
      _supabase = createClient(supabaseUrl, supabaseKey)
    }
    return (_supabase as any)[prop]
  },
})
