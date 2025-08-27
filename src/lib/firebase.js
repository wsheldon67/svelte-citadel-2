// place files you want to import through the `$lib` alias in this folder.
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { browser } from '$app/environment'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCsJgf892X_K5tICRwZ0KiI9CLHz3aKWvA",
  authDomain: "citadel-bc67c.firebaseapp.com",
  projectId: "citadel-bc67c",
  storageBucket: "citadel-bc67c.firebasestorage.app",
  messagingSenderId: "601181094277",
  appId: "1:601181094277:web:77b2f74b023a4962efc4ec",
  measurementId: "G-EYG8THPKJ9"
}

// Check if we're in test mode (either from environment or test header)
const isTestMode = () => {
  if (browser && typeof window !== 'undefined') {
    // Check for test mode indicator from Playwright
    const sessionFlag = sessionStorage.getItem('firebase-emulator-mode') === 'true';
    const isLocalhost = window.location.hostname === 'localhost';
    const isTestPort = window.location.port === '4173' || window.location.port === '5173';
    
    console.log('Firebase mode check:', {
      sessionFlag,
      isLocalhost,
      isTestPort,
      hostname: window.location.hostname,
      port: window.location.port
    });
    
    return sessionFlag && isLocalhost && isTestPort;
  }
  return import.meta.env.MODE === 'test' || process.env.NODE_ENV === 'test'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

// Connect to emulators in test mode
if (isTestMode() && browser) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    console.log('Connected to Firebase emulators for testing')
    // Set a flag to indicate emulator mode is active
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('firebase-emulator-mode', 'true')
    }
  } catch (error) {
    // Emulators might already be connected, ignore the error
    console.log('Firebase emulators connection status:', error instanceof Error ? error.message : 'Unknown error')
  }
}