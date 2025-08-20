import { get as idbGet, set as idbSet } from 'idb-keyval'
import { supabase, isSupabaseConfigured } from './supabaseClient.js'

const CURRENT_SCHEMA_VERSION = '1.0.0'
const STORAGE_KEY = 'mindmirror_state'
const isAuthEnabled = (import.meta.env?.VITE_AUTH_ENABLED === 'true')

export class SupabasePersistenceAdapter {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    this.user = null
    this.authStateListeners = []
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { this.isOnline = true })
      window.addEventListener('offline', () => { this.isOnline = false })
    }
    if (isAuthEnabled && isSupabaseConfigured && supabase) {
      supabase.auth.getUser().then(({ data }) => {
        const u = data?.user || null
        this.user = u ? { ...u, uid: u.id } : null
      })
      this._sub = supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user || null
        this.user = u ? { ...u, uid: u.id } : null
        this.authStateListeners.forEach(l => l(this.user))
      })
    }
  }

  onAuthStateChanged(callback) {
    if (!isAuthEnabled) return () => {}
    this.authStateListeners.push(callback)
    return () => {
      this.authStateListeners = this.authStateListeners.filter(l => l !== callback)
    }
  }

  async loadLocal() {
    try {
      const data = await idbGet(STORAGE_KEY)
      if (!data) return null
      if (data.appVersion !== CURRENT_SCHEMA_VERSION) {
        return await this.runMigrations(data)
      }
      return data
    } catch {
      try {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : null
      } catch {
        return null
      }
    }
  }

  async saveLocal(state) {
    const saveData = {
      appVersion: CURRENT_SCHEMA_VERSION,
      lastSavedAt: Date.now(),
      ...state
    }
    try {
      await idbSet(STORAGE_KEY, saveData)
    } catch {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
    }
  }

  async runMigrations(oldData) {
    return { ...oldData, appVersion: CURRENT_SCHEMA_VERSION }
  }

  async login(provider = 'email', email = '', password = '') {
    if (!isAuthEnabled) throw new Error('Authentication is disabled. Set VITE_AUTH_ENABLED=true.')
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured.')

    if (provider === 'email') {
      if (!email || !password) throw new Error('Email and password required')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
        const u = signUpData.user
        this.user = u ? { ...u, uid: u.id } : null
        return this.user
      }
      {
        const u = signInData.user
        this.user = u ? { ...u, uid: u.id } : null
        return this.user
      }
    }

    const providerMap = {
      google: 'google',
      github: 'github',
      microsoft: 'azure'
    }
    const supaProvider = providerMap[provider]
    if (!supaProvider) throw new Error(`Provider ${provider} not supported`)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: supaProvider,
      options: { redirectTo: window.location.origin }
    })
    if (error) throw error
    return data?.user || null
  }

  async logout() {
    if (!isAuthEnabled) { this.user = null; return }
    if (!isSupabaseConfigured || !supabase) { this.user = null; return }
    await supabase.auth.signOut()
    this.user = null
  }

  async getUser() {
    if (!isAuthEnabled) return null
    if (!isSupabaseConfigured || !supabase) return this.user
    const { data } = await supabase.auth.getUser()
    const u = data?.user || this.user
    return u ? { ...u, uid: u.id } : null
  }

  async loadCloud(userId) {
    if (!isAuthEnabled || !isSupabaseConfigured || !supabase || !userId) return null
    const { data, error } = await supabase
      .from('users')
      .select('data, last_saved_at')
      .eq('id', userId)
      .single()
    if (error && !['PGRST116', '42P01'].includes(error.code)) throw error
    if (!data) return null
    const payload = data.data || null
    if (payload?.appVersion && payload.appVersion !== CURRENT_SCHEMA_VERSION) {
      return await this.runMigrations(payload)
    }
    return payload
  }

  async saveCloud(userId, data) {
    if (!isAuthEnabled) throw new Error('Authentication is disabled.')
    if (!isSupabaseConfigured || !supabase || !userId) throw new Error('Supabase not configured or user missing')
    const saveData = {
      ...data,
      appVersion: CURRENT_SCHEMA_VERSION,
      lastSavedAt: Date.now(),
      userId
    }
    const { error } = await supabase
      .from('users')
      .upsert({ id: userId, data: saveData, last_saved_at: saveData.lastSavedAt })
    if (error) throw error
  }

  async syncData(localData) {
    const user = await this.getUser()
    if (!user || !this.isOnline) return { synced: false, data: localData }
    const cloudData = await this.loadCloud(user.id)
    if (!cloudData) {
      await this.saveCloud(user.id, localData)
      return { synced: true, data: localData }
    }
    const localTimestamp = localData.lastSavedAt || 0
    const cloudTimestamp = cloudData.lastSavedAt || 0
    if (cloudTimestamp > localTimestamp) {
      return { synced: true, data: cloudData }
    } else if (localTimestamp > cloudTimestamp) {
      await this.saveCloud(user.id, localData)
      return { synced: true, data: localData }
    }
    return { synced: true, data: localData }
  }

  async exportData(state) {
    const exportData = {
      ...state,
      exportedAt: new Date().toISOString(),
      version: CURRENT_SCHEMA_VERSION
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mindmirror_backup_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          resolve(data)
        } catch {
          reject(new Error('Invalid JSON file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }
}
