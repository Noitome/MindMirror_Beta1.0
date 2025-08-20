import { FirebasePersistenceAdapter } from './persistence.firebase.js'
import { SupabasePersistenceAdapter } from './persistence.supabase.js'

const backend = (import.meta.env?.VITE_BACKEND || 'supabase').toLowerCase()

export const persistence = backend === 'firebase'
  ? new FirebasePersistenceAdapter()
  : new SupabasePersistenceAdapter()
