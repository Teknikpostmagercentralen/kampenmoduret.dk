import {initializeApp} from "firebase/app";
import type {FirebaseConfigProperties} from "./firebaseconnection";
import {createUserWithEmailAndPassword, getAuth, updateProfile, } from "firebase/auth";
import type {UserCredential} from "firebase/auth";
import {PUBLIC_FIREBASE_API_KEY, PUBLIC_FIREBASE_APP_ID, PUBLIC_FIREBASE_AUTHDOMAIN, PUBLIC_FIREBASE_DATABASE_URL, PUBLIC_FIREBASE_MEASUREMENT_ID, PUBLIC_FIREBASE_MESSAGING_SENDER_ID, PUBLIC_FIREBASE_PROJECT_ID, PUBLIC_FIREBASE_STORAGE_BUCKET} from "$env/static/public";


const firebaseConfig: FirebaseConfigProperties = {
    databaseURL: PUBLIC_FIREBASE_DATABASE_URL || "",
    measurementId: PUBLIC_FIREBASE_MEASUREMENT_ID || "",
    apiKey: PUBLIC_FIREBASE_API_KEY || "",
    authDomain: PUBLIC_FIREBASE_AUTHDOMAIN || "",
    projectId: PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: PUBLIC_FIREBASE_APP_ID || ""
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