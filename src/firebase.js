// Import the functions you need from the Firebase SDKs
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// // Replace this with your Firebase project config
// const firebaseConfig = {
//     apiKey: "AIzaSyAZ-pizvGCoPpwMV_2C7WeYkA9P9WfD980",
//     authDomain: "mail-gen-954be.firebaseapp.com",
//     projectId: "mail-gen-954be",
//     storageBucket: "mail-gen-954be.appspot.com",
//     messagingSenderId: "215018720728",
//     appId: "1:215018720728:web:4ef6bc526ca2daa12276ad"
// };

const firebaseConfig = {
    apiKey: "AIzaSyBaLYiiEg_WfGODl_XtHVy9rBiCSRxBEYU",
    authDomain: "testing-db9bc.firebaseapp.com",
    projectId: "testing-db9bc",
    storageBucket: "testing-db9bc.appspot.com",
    messagingSenderId: "960231204268",
    appId: "1:960231204268:web:84985d14203f0699404609"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

export default db;
