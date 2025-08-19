import { get as idbGet, set as idbSet, keys as idbKeys } from 'idb-keyval'
import { auth, db, isFirebaseConfigured } from './firebase.js'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  GithubAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore'

const CURRENT_SCHEMA_VERSION = '1.0.0'
const STORAGE_KEY = 'mindmirror_state'

export class PersistenceAdapter {
  constructor() {
    this.isOnline = navigator.onLine
    this.user = null
    this.authStateListeners = []
    
    window.addEventListener('online', () => {
      this.isOnline = true
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })

    if (isFirebaseConfigured && auth) {
      onAuthStateChanged(auth, (user) => {
        this.user = user
        this.authStateListeners.forEach(listener => listener(user))
      })
    }
  }

  onAuthStateChanged(callback) {
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
  
  async login(provider = 'email', email = '', password = '') {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase not configured. Please set up environment variables.')
    }

    let result
    
    try {
      switch (provider) {
        case 'google':
          const googleProvider = new GoogleAuthProvider()
          googleProvider.addScope('email')
          googleProvider.addScope('profile')
          result = await signInWithPopup(auth, googleProvider)
          break
          
        case 'facebook':
          const facebookProvider = new FacebookAuthProvider()
          facebookProvider.addScope('email')
          result = await signInWithPopup(auth, facebookProvider)
          break
          
        case 'github':
          const githubProvider = new GithubAuthProvider()
          githubProvider.addScope('user:email')
          result = await signInWithPopup(auth, githubProvider)
          break
          
        case 'microsoft':
          const microsoftProvider = new OAuthProvider('microsoft.com')
          microsoftProvider.addScope('mail.read')
          microsoftProvider.addScope('user.read')
          result = await signInWithPopup(auth, microsoftProvider)
          break
          
        case 'linkedin':
          const linkedinProvider = new OAuthProvider('oidc.linkedin')
          result = await signInWithPopup(auth, linkedinProvider)
          break
          
        case 'email':
          if (!email || !password) {
            throw new Error('Email and password required for email authentication')
          }
          try {
            result = await signInWithEmailAndPassword(auth, email, password)
          } catch (error) {
            if (error.code === 'auth/user-not-found') {
              result = await createUserWithEmailAndPassword(auth, email, password)
            } else {
              throw error
            }
          }
          break
          
        default:
          throw new Error(`Provider ${provider} not supported`)
      }
      
      this.user = result.user
      return result.user
    } catch (error) {
      console.error('Authentication error:', error)
      throw error
    }
  }

  async logout() {
    if (!isFirebaseConfigured || !auth) {
      this.user = null
      return
    }
    
    try {
      await signOut(auth)
      this.user = null
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }
  
  async getUser() {
    if (isFirebaseConfigured && auth) {
      return auth.currentUser || this.user
    }
    return this.user
  }
  
  async loadCloud(userId) {
    if (!isFirebaseConfigured || !db || !userId) {
      return null
    }
    
    try {
      const docRef = doc(db, 'users', userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.appVersion !== CURRENT_SCHEMA_VERSION) {
          return await this.runMigrations(data)
        }
        return data
      }
      return null
    } catch (error) {
      console.error('Cloud load error:', error)
      throw error
    }
  }
  
  async saveCloud(userId, data) {
    if (!isFirebaseConfigured || !db || !userId) {
      throw new Error('Firebase not configured or user not authenticated')
    }
    
    try {
      const saveData = {
        ...data,
        appVersion: CURRENT_SCHEMA_VERSION,
        lastSavedAt: Date.now(),
        userId
      }
      
      const docRef = doc(db, 'users', userId)
      await setDoc(docRef, saveData, { merge: true })
      
      await addDoc(collection(db, 'users', userId, 'events'), {
        type: 'data_sync',
        timestamp: Date.now(),
        dataSize: JSON.stringify(data).length
      })
      
    } catch (error) {
      console.error('Cloud save error:', error)
      throw error
    }
  }

  async syncData(localData) {
    const user = await this.getUser()
    if (!user || !this.isOnline) {
      return { synced: false, data: localData }
    }

    try {
      const cloudData = await this.loadCloud(user.uid)
      
      if (!cloudData) {
        await this.saveCloud(user.uid, localData)
        return { synced: true, data: localData }
      }

      const localTimestamp = localData.lastSavedAt || 0
      const cloudTimestamp = cloudData.lastSavedAt || 0

      if (cloudTimestamp > localTimestamp) {
        return { synced: true, data: cloudData }
      } else if (localTimestamp > cloudTimestamp) {
        await this.saveCloud(user.uid, localData)
        return { synced: true, data: localData }
      }

      return { synced: true, data: localData }
    } catch (error) {
      console.error('Sync error:', error)
      return { synced: false, data: localData, error }
    }
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
