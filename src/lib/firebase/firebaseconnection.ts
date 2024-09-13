// src/Auth.ts
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import type { IdTokenResult, Unsubscribe, UserCredential } from 'firebase/auth';

// src/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { User } from "../models/user";
import { getDatabase, ref, set, child, get } from 'firebase/database';
import { FirebaseUserAdder } from "./firebaseUserAdder";
import { FirebaseContants } from "./firebasecontants";
import type { Task } from "../models/task";
import type { CompletedTaskInTeams } from "../models/completed-task-in-teams";
import type { TeamCreationData } from '$lib/models/team';
import type { Game } from '$lib/models/game';

export interface FirebaseDataCallback<T> {
    onDataChanged: (data: T) => void
}

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

export class NotValidCredentialsError extends Error {
}

export class FirebaseConnection {
    private constructor() {
        
    }

    private static instance : FirebaseConnection;

    private userState : {uid: string, loggedIn: boolean} = {uid: "", loggedIn: false};

    private unsubscribeMethodsFromListeners: Unsubscribe[] = [];

    static async getInstance() : Promise<FirebaseConnection> {
        if (!FirebaseConnection.instance) {
            FirebaseConnection.instance = new FirebaseConnection();
            await FirebaseConnection.instance.registerInternalUserListenerToUpdateUserDataContinously();
        }
        return FirebaseConnection.instance;
    }

    private registerInternalUserListenerToUpdateUserDataContinously() {
        onAuthStateChanged(getAuth(), (userCredential) => {
            if (userCredential) {
                this.userState = {uid: userCredential.uid, loggedIn: true};
            } else {
                this.userState = {uid: "", loggedIn: false};
            }
        });
    }

    registerUserListener(callback: FirebaseDataCallback<User>) {
        const unsubscribe = onAuthStateChanged(getAuth(), (userCredential) => {
            if (userCredential) {
                callback.onDataChanged({ firebaseUserID: this.userState.uid })
            } else {
                callback.onDataChanged({ firebaseUserID: "" })
            }
        });
        this.unsubscribeMethodsFromListeners.push(unsubscribe);
    }

    onUserReady(callback : () => void) {
        const unsubscribe = onAuthStateChanged(getAuth(), (userCredential) => {
            if (userCredential) {
                callback();
                unsubscribe();
            }
        });
    }

    async login(email: string, password: string): Promise<User> {
        try {
            const userCredential = await signInWithEmailAndPassword(getAuth(), email, password);
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
            await signOut(getAuth());
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    async register(holdNavn: string, email: string, password: string, bonusTime: number, participants: number): Promise<void> {

        const uidOfNewUser = await FirebaseUserAdder.createNewUser(holdNavn, email, password)

        //fixme this is here to make sure firebase known who I am.
        //  otherwise it will not work when write.
        //  Fix this, it does not seem right
        //  And might give us more issues in the future
        /* await this.registerAuthCallback({
            onUnauthenticated(): void {
                console.log("error")
            }, onUserLoggedIn(user: User): void {
                console.log(`user ${user.firebaseUserID}`)
            }
        }) */

        const auth = getAuth(app);
        const currentUser = auth.currentUser;

        // Check if the user is authenticated
        if (!currentUser) {
            console.error("User is not authenticated. Please log in.");
            return;
        }

        await this.writeUserData(uidOfNewUser, holdNavn, password, email, bonusTime, participants);

    }

    async writeUserData(uid: string, holdNavn: string, password: string, email: string, bonusTime: number, participants: number) {
        const db = getDatabase(app);
        const teamData : TeamCreationData = {
            username: holdNavn,
            email: email,
            bonusTime : bonusTime,
            participants: participants,
            password: password
        }
        await set(ref(db, `${FirebaseContants.TEAMS_ROOT}/${uid}`), teamData);
    }

    async getGame(): Promise<Game | false> {
        const db = getDatabase(app);
        const snapshot = await get(ref(db, `${FirebaseContants.GAME_ROOT}`))
        if (!snapshot || !snapshot.exists()) {
            console.error("Game does not exist")
            return false
        }
        const game: Game = snapshot.val()
        return game
    }

    async writeTaskCompleted(taskID: string): Promise<void> {
        const auth = getAuth(app);
        const currentUser = auth.currentUser;

        // Check if the user is authenticated
        if (!currentUser) {
            console.error("User is not authenticated. Please log in.");
            return;
        }
        const db = getDatabase(app);
        const snapshot = await get(ref(db, `${FirebaseContants.TASKS_ROOT}/${taskID}`))
        if (!snapshot || !snapshot.exists()) {
            console.error("This task does not exist in firebase")
            return
        }
        const task: Task = snapshot.val()

        const teamId = getAuth(app).currentUser?.uid

        if (!teamId) {
            console.error("Firebase error uknown: errorcode ostemads")
            return
        } //fixme if this ever happens in reality we fix it for real. Otherwise we remote it as it is a theoprwetical mistake

        const game = await this.getGame()
        if (!game) return
        const multiplier = game.multiplier //todo: at some point we calculate the multiplier right here. FOr the moment its set to the value from the game always
        //todo think about weather or not this logic belongs in FirebaseConnector. Maybe multiplier to the game,

        const taskToWrite: CompletedTaskInTeams = { baseTime: task.baseTime, multiplier: 1, timeEarned: task.baseTime * multiplier, taskMarker: task.taskMarker }

        await set(ref(db, `${FirebaseContants.TEAMS_ROOT}/${teamId}/${FirebaseContants.TEAM_TASKS}/${taskID}`), taskToWrite)
        return Promise.resolve()
    }

    killAllListenersFromThisPage() {
		for (const unsubscribe of this.unsubscribeMethodsFromListeners) {
            unsubscribe();
        }
        this.unsubscribeMethodsFromListeners = [];
	}
}
