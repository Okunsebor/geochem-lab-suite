import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie, deleteCookie } from '@tanstack/react-start/server'
import { Database } from '../services/supabase'

export function getServerSupabase() {
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          const cookies = getCookies()
          return Object.keys(cookies).map(name => ({ name, value: cookies[name] }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (!value) {
              deleteCookie(name, options)
            } else {
              setCookie(name, value, options)
            }
          })
        },
      },
    }
  )
}
