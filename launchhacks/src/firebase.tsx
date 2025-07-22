// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAO9TXM7A0SNeiEXzYo27fW0wdTXqXDEyc",
    authDomain: "tinkproject-78374a.firebaseapp.com",
    projectId: "tinkproject-78374a",
    storageBucket: "tinkproject-78374a.firebasestorage.app",
    messagingSenderId: "785731389668",
    appId: "1:785731389668:web:f57803cf98bdd9bf5d84f1",
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore
export const db: Firestore = getFirestore(app);

// Initialize Auth
export const auth: Auth = getAuth(app);

//Initialize Firebase Functions
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
export const functions = getFunctions(app, "us-central1");

if (true) {
    connectFunctionsEmulator(functions, "localhost", 5001);
}
