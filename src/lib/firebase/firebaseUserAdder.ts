import {initializeApp} from "firebase/app";
import type {FirebaseConfigProperties} from "./firebaseconnection";
import {
    createUserWithEmailAndPassword,
    getAuth,
    updateProfile,
    deleteUser,
    signInWithEmailAndPassword
} from "firebase/auth";
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


type UserAddedCallback = (userCredential: UserCredential) => void

class DeleteUserError implements Error {
    private code: string;

    constructor(code: string, message: string) {
        this.message = message
        this.code = code
    }

    message: string = "Could not delete user"
    name: string = "DELETE_FAILED"
}

export class FirebaseUserAdder {

    static app = initializeApp(firebaseConfig, "user-adder-app");

    static auth = getAuth(FirebaseUserAdder.app)

    static async createNewUser(holdNavn: string, email: string, password: string): Promise<string> {
        return await createUserWithEmailAndPassword(FirebaseUserAdder.auth, email, password).then(async (userCredential) => {
            await updateProfile(userCredential.user, {displayName: holdNavn});
            return userCredential.user.uid
        })
    }

    static async deleteUser(email: string, password: string): Promise<boolean> {

        const auth = getAuth(FirebaseUserAdder.app);
        console.log(email)

        return await signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                // Signed in
                console.log("hej")
                const user = userCredential.user;
                if (!user) return false

                return await deleteUser(user).then(() => {
                    console.log("firsr part sucess")
                    return true
                }).catch((error) => {
                    console.log("inderste catc")
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    throw new DeleteUserError(errorCode, errorMessage)
                });

            })
            .catch((error) => {
                console.log("yderste catch" + error.code)
                const errorCode = error.code;
                const errorMessage = error.message;
                throw new DeleteUserError(errorCode, errorMessage)
            });


    }

}