// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyDlhVwhcwRD1sWu4s_GXsjPfZANawaVQvs',
  authDomain: 'real-estate-8a31f.firebaseapp.com',
  projectId: 'real-estate-8a31f',
  storageBucket: 'real-estate-8a31f.appspot.com',
  messagingSenderId: '979711646051',
  appId: '1:979711646051:web:d71a5570681940685f5b56',
  measurementId: 'G-HBD6E6J907',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore();
export const database = getDatabase(app);
export const analytics = getAnalytics(app);
