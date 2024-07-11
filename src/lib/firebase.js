// Import the functions you need from the Firebase SDKs
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';

// Testing DB
const firebaseConfig = {
    apiKey: "AIzaSyBaLYiiEg_WfGODl_XtHVy9rBiCSRxBEYU",
    authDomain: "testing-db9bc.firebaseapp.com",
    projectId: "testing-db9bc",
    storageBucket: "testing-db9bc.appspot.com",
    messagingSenderId: "960231204268",
    appId: "1:960231204268:web:84985d14203f0699404609"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, collection, addDoc, doc, getDoc, updateDoc };