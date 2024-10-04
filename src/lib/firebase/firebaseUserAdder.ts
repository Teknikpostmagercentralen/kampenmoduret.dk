import {initializeApp} from "firebase/app";
import type {FirebaseConfigProperties} from "./firebaseconnection";
import {createUserWithEmailAndPassword, getAuth, updateProfile, } from "firebase/auth";
import type {UserCredential} from "firebase/auth";


const firebaseConfig: FirebaseConfigProperties = {
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

type UserAddedCallback = (userCredential: UserCredential)=> void

export class FirebaseUserAdder {

    static app = initializeApp(firebaseConfig, "user-adder-app");

    static auth = getAuth(FirebaseUserAdder.app)


    static async createNewUser(holdNavn: string, email: string, password: string): Promise<string> {
        return await createUserWithEmailAndPassword(FirebaseUserAdder.auth, email, password).then(async (userCredential) => {
            await updateProfile(userCredential.user, {displayName: holdNavn});
            return userCredential.user.uid
        })
    }

}