// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGMFplibZpvyxbBUCyhd-oXsRKcDvBp8g",
  authDomain: "record-work-b704c.firebaseapp.com",
  projectId: "record-work-b704c",
  storageBucket: "record-work-b704c.firebasestorage.app",
  messagingSenderId: "398176263629",
  appId: "1:398176263629:web:ca4e257b4d5216ec6db884",
  measurementId: "G-3BS70PFK26",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
