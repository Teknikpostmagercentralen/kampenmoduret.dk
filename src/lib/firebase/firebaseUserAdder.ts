import {initializeApp} from "firebase/app";
import type {FirebaseConfigProperties} from "./firebaseconnection";
import {createUserWithEmailAndPassword, getAuth, updateProfile, } from "firebase/auth";
import type {UserCredential} from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBp6w5HC94OVbJvFLAV4aT28PtHO3NO5JA",
    authDomain: "kampen-mod-tiden.firebaseapp.com",
    databaseURL: "https://kampen-mod-tiden-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "kampen-mod-tiden",
    storageBucket: "kampen-mod-tiden.appspot.com",
    messagingSenderId: "719178463301",
    appId: "1:719178463301:web:f7b89a188aacce35110b2c",
    measurementId: "G-ZKE0FSGP3Y"
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