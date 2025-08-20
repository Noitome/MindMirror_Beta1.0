import { createClient } from '@supabase/supabase-js'

const getEnvVar = (key) => {
  try {
    return import.meta.env?.[key] || ''
  } catch {
    return ''
  }
}

const url = getEnvVar('VITE_SUPABASE_URL')
const anonKey = getEnvVar('VITE_SUPABASE_ANON_KEY')

export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const isSupabaseConfigured = !!(url && anonKey)
