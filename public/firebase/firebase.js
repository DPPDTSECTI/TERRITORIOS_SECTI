// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBCWKF6D6cB4PFDL65DyxM9_l12K6ZK26Y",
  authDomain: "secti-551ad.firebaseapp.com",
  projectId: "secti-551ad",
  storageBucket: "secti-551ad.firebasestorage.app",
  messagingSenderId: "854998983216",
  appId: "1:854998983216:web:f0c7188d151147db4743f5",
  measurementId: "G-F8MJSKY6YM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);