import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const getEnvVar = (key) => {
  try {
    return import.meta.env?.[key] || ''
  } catch (error) {
    return ''
  }
}

const isAuthEnabled = getEnvVar('VITE_AUTH_ENABLED') === 'true'

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID')
}

let app = null
let auth = null
let db = null

if (isAuthEnabled && firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
  } catch (error) {
    console.warn('Firebase initialization failed:', error)
  }
}

export { auth, db, isAuthEnabled }
export const isFirebaseConfigured = !!(isAuthEnabled && firebaseConfig.apiKey && firebaseConfig.projectId)
