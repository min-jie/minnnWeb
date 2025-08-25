// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDk9O4sipvSWdATrFittWNF5Fgv309K-c4",
  authDomain: "minnn-project.firebaseapp.com",
  projectId: "minnn-project",
  storageBucket: "minnn-project.firebasestorage.app",
  messagingSenderId: "56180259453",
  appId: "1:56180259453:web:c567ae11bb435bc9088f14",
  measurementId: "G-M7RY9GKRT0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);