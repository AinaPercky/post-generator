import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDo39OrcCsdp4GA7xpzatGaF72_o7L4zig',
  authDomain: 'post-generator-bf2cd.firebaseapp.com',
  projectId: 'post-generator-bf2cd',
  storageBucket: 'post-generator-bf2cd.firebasestorage.app',
  messagingSenderId: '55453519528',
  appId: '1:55453519528:web:6550fe1ac77a3e02d4fc9d',
  measurementId: 'G-DLFY4398C2',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let analyticsInstance: Analytics | null = null;

void isSupported()
  .then((supported) => {
    if (supported) {
      analyticsInstance = getAnalytics(app);
    }
  })
  .catch((error) => {
    console.warn('Firebase Analytics is not available in this environment.', error);
  });

export const analytics = analyticsInstance;

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error('Error signing in with Google', error);
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out', error);
  }
};
