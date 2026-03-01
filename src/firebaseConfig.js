import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyCG0tR--tL23EEz90RDweQAEhL0Oe-cS1k',
  authDomain: 'deratorportal.firebaseapp.com',
  projectId: 'deratorportal',
  storageBucket: 'deratorportal.firebasestorage.app',
  messagingSenderId: '486835208038',
  appId: '1:486835208038:web:8fab86a23f970da5ec12a7',
  measurementId: 'G-JZLYR0PMPM',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Backward-compatible exports for code that used multi-project routing.
export function getAuthForProjectKey() {
  return auth
}

export function isProtokolyAuthConfigured() {
  return false
}
