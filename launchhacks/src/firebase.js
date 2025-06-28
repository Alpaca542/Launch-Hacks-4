// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyByTZ08eCsc2wv0VIWUHNtHSdmAA_JI5hM",
    authDomain: "tinkproject-78374a.firebaseapp.com",
    projectId: "tinkproject-78374a",
    storageBucket: "tinkproject-78374a.firebasestorage.app",
    messagingSenderId: "785731389668",
    appId: "1:785731389668:web:f57803cf98bdd9bf5d84f1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firestore
export const db = getFirestore(app);
// Initialize Auth
export const auth = getAuth(app);

export default app;