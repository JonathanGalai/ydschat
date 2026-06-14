import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyAwxS8rcHGeSDR2UoIdPKUmjYH8zMPia6U',
  authDomain: 'chattdd-6b567.firebaseapp.com',
  databaseURL: 'https://chattdd-6b567-default-rtdb.firebaseio.com',
  projectId: 'chattdd-6b567',
  storageBucket: 'chattdd-6b567.firebasestorage.app',
  messagingSenderId: '110878751824',
  appId: '1:110878751824:web:d0b934765491afc9f9a555',
  measurementId: 'G-HPDVQJTS0E',
}

export const app = initializeApp(firebaseConfig)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null
export const auth = getAuth(app)
export const db = getDatabase(app)
export const googleProvider = new GoogleAuthProvider()
