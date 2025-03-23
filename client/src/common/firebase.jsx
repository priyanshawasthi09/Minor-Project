import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDf5GbPEeaP766g_83xPf--NBAsqdniyIo",
  authDomain: "react-js-blog-website-e8283.firebaseapp.com",
  projectId: "react-js-blog-website-e8283",
  storageBucket: "react-js-blog-website-e8283.firebasestorage.app",
  messagingSenderId: "579455041810",
  appId: "1:579455041810:web:124b9e9b2837d8d946f3cb",
};

// Ensure this file is correctly set up

const app = initializeApp(firebaseConfig);
const provider = new GoogleAuthProvider();
const auth = getAuth(app);

export const authWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!user) {
      throw new Error("No user found");
    }

    const idToken = await user.getIdToken(); // Get Firebase ID token

    console.log("User authenticated with Google:", user);
    console.log("Firebase ID Token:", idToken); // Debugging log

    return { user, idToken };
  } catch (error) {
    console.error("Google Auth Error:", error);
    throw error; // Ensure the calling function knows there was an error
  }
};
