import { get as idbGet, set as idbSet, keys as idbKeys } from 'idb-keyval'

const CURRENT_SCHEMA_VERSION = '1.0.0'
const STORAGE_KEY = 'mindmirror_state'

export class PersistenceAdapter {
  constructor() {
    this.isOnline = navigator.onLine
    this.user = null
    
    window.addEventListener('online', () => {
      this.isOnline = true
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }
  
  async loadLocal() {
    try {
      const data = await idbGet(STORAGE_KEY)
      if (!data) return null
      
      if (data.appVersion !== CURRENT_SCHEMA_VERSION) {
        return await this.runMigrations(data)
      }
      
      return data
    } catch (error) {
      console.warn('IndexedDB failed, falling back to localStorage:', error)
      try {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : null
      } catch (fallbackError) {
        console.error('Both IndexedDB and localStorage failed:', fallbackError)
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
    } catch (error) {
      console.warn('IndexedDB save failed, falling back to localStorage:', error)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
      } catch (fallbackError) {
        console.error('Both IndexedDB and localStorage save failed:', fallbackError)
        throw fallbackError
      }
    }
  }
  
  async runMigrations(oldData) {
    console.log(`Migrating from ${oldData.appVersion} to ${CURRENT_SCHEMA_VERSION}`)
    return {
      ...oldData,
      appVersion: CURRENT_SCHEMA_VERSION
    }
  }
  
  async login(provider = 'email') {
    throw new Error('Authentication not implemented yet')
  }
  
  async getUser() {
    return this.user
  }
  
  async loadCloud(userId) {
    throw new Error('Cloud sync not implemented yet')
  }
  
  async saveCloud(userId, data) {
    throw new Error('Cloud sync not implemented yet')
  }
  
  async exportData(state) {
    const exportData = {
      ...state,
      exportedAt: new Date().toISOString(),
      version: CURRENT_SCHEMA_VERSION
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
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
        } catch (error) {
          reject(new Error('Invalid JSON file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }
}

export const persistence = new PersistenceAdapter()
