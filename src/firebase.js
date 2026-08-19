import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCo54IHp32XGXx4IXeGdW71LyKnfk9EVm4",
  authDomain: "liquid-8c4d5.firebaseapp.com",
  projectId: "liquid-8c4d5",
  storageBucket: "liquid-8c4d5.firebasestorage.app",
  messagingSenderId: "580828713397",
  appId: "1:580828713397:web:f32d6ec8040bdf91e489fc"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged };

export const loginWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const logoutUser = async () => {
  return await signOut(auth);
};
