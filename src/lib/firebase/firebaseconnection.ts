// src/Auth.ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';

// src/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { User } from "../models/user";
import { getDatabase, ref, set } from 'firebase/database';

export type FirebaseConfigProperties = {
    apiKey: string,
    authDomain: string,
    databaseURL: string,
    projectId: string,
    storageBucket: string,
    messagingSenderId: string,
    appId: string,
    measurementId: string
}

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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export class NotValidCredentialsError extends Error {
}

class FirebaseConnectionHandler {

    async login(email: string, password: string): Promise<User> {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { firebaseUserID: userCredential.user.uid };
        } catch (error) {
            console.error('Login failed:', error);
            throw new NotValidCredentialsError("Credentials not found")
            //TODO HAndle all them login errors
            error = "YOU COULD NOT LOGIN SORRY"
        }
    }

    async logout(): Promise<void> {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    async register(holdNavn: string, email: string, password: string): Promise<void> {
        await createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential: UserCredential) => {
                await updateProfile(userCredential.user, { displayName: holdNavn });
                await this.writeUserData(userCredential.user.uid, holdNavn, password, email);
            })
            .catch((newError: any) => {
            });
    }
    writeUserData(uid: string, holdNavn: string, password: string, email: string) {
        const db = getDatabase();
        set(ref(db, `teams/${uid}`), {
            username: holdNavn,
            email: email,
            password: password,
        });
    }
}



export const FirebaseConnection = new FirebaseConnectionHandler();
