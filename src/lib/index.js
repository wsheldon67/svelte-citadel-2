// place files you want to import through the `$lib` alias in this folder.
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

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

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)