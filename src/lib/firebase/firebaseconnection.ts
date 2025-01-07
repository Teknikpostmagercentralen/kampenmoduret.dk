// src/Auth.ts
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import type {IdTokenResult, Unsubscribe, UserCredential} from 'firebase/auth';

// src/firebaseConfig.ts
import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import type {User} from "../models/user";
import {getDatabase, ref, set, child, remove, get, onValue, push, update, serverTimestamp} from 'firebase/database';
import {FirebaseUserAdder} from "./firebaseUserAdder";
import {FirebaseContants} from "./firebasecontants";
import type {Task, TaskMarker} from "../models/task";
import type {CompletedTaskInTeams} from "../models/completed-task-in-teams";
import type {Team, TeamCreationData} from '$lib/models/team';
import type {Game} from '$lib/models/game';
import {constants} from "../../gamecontants";
import {updated} from "$app/stores";
import {PUBLIC_FIREBASE_API_KEY, PUBLIC_FIREBASE_APP_ID, PUBLIC_FIREBASE_AUTHDOMAIN, PUBLIC_FIREBASE_DATABASE_URL, PUBLIC_FIREBASE_MEASUREMENT_ID, PUBLIC_FIREBASE_MESSAGING_SENDER_ID, PUBLIC_FIREBASE_PROJECT_ID, PUBLIC_FIREBASE_STORAGE_BUCKET} from "$env/static/public";
import {userState} from "../../stores/userstate";

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


/*const firebaseConfig: FirebaseConfigProperties = {
    databaseURL: PUBLIC_FIREBASE_DATABASE_URL || "",
    measurementId: PUBLIC_FIREBASE_MEASUREMENT_ID || "",
    apiKey: PUBLIC_FIREBASE_API_KEY || "",
    authDomain: PUBLIC_FIREBASE_AUTHDOMAIN || "",
    projectId: PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: PUBLIC_FIREBASE_APP_ID || ""
};*/
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


const app = initializeApp(firebaseConfig);

export class NotValidCredentialsError extends Error {
}

export class TaskError implements Error {
    constructor(message: string, name: string) {
        this.message = message
        this.name = name
    }

    message: string;
    name: string;

}

export class AuthenticationError extends TaskError {

    constructor(message: string) {
        super(message, "AUTHENTICATION")
    }
}
export class TaskNotFoundError extends TaskError {

    constructor(message: string) {
        super(message, "TASK_NOT_FOUND_IN_FIREBASE")
    }
}
export class GameNotStartedError extends TaskError {

    constructor(message: string) {
        super(message, "GAME_NOT_STARTED")
    }
}
export class TeamIsDeadError extends TaskError {

    constructor(message: string) {
        super(message, "TEAM_IS_DEAD")
    }
}

export class TwoOfTheSameLetterTaskInARowError extends TaskError {

    constructor(message: string) {
        super(message, "SAME_LETTER")
    }

}

export class AlreadySolvedTaskError extends TaskError {
    constructor(message: string) {
        super(message, "SAME_TASK_TWICE")
    }
}

export class FirebaseConnection {
    private constructor() {

    }

    private static instance: FirebaseConnection;

    private userState: { uid: string, loggedIn: boolean } = {uid: "", loggedIn: false};

    private unsubscribeMethodsFromListeners: Unsubscribe[] = [];
    private teamUnsubscribeMethod: Unsubscribe | undefined;
    private gameUnsubscribeMethod: Unsubscribe | undefined;

    static async getInstance(): Promise<FirebaseConnection> {
        if (!FirebaseConnection.instance) {
            FirebaseConnection.instance = new FirebaseConnection();
            await FirebaseConnection.instance.registerInternalUserListenerToUpdateUserDataContinously();
        }
        return FirebaseConnection.instance;
    }

    private registerInternalUserListenerToUpdateUserDataContinously() {
        onAuthStateChanged(getAuth(), async (userCredential) => {
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
                callback.onDataChanged({firebaseUserID: this.userState.uid})
            } else {
                callback.onDataChanged({firebaseUserID: ""})
            }
        });
        this.unsubscribeMethodsFromListeners.push(unsubscribe);
    }

    registerTeamsListener(callback: FirebaseDataCallback<Team[]>) {
        const db = getDatabase();
        const teamsRef = ref(db, FirebaseContants.TEAMS_ROOT);
        console.log("Registering listener for teams")
        const unsubscribe = onValue(teamsRef, (snapshot) => {
            callback.onDataChanged(snapshot.val());
        });
        this.unsubscribeMethodsFromListeners.push(unsubscribe);
    }

    registerTeamListener(user: User, callback: FirebaseDataCallback<Team>) {
        const db = getDatabase();
        const teamID = user.firebaseUserID
        const teamRef = ref(db, `${FirebaseContants.TEAMS_ROOT}/${teamID}`);
        this.teamUnsubscribeMethod; // This might be a function or null. If null nothing happens else it unsubscribes.
        const unsubscribe = onValue(teamRef, (snapshot) => {
            callback.onDataChanged(snapshot.val());
        });
        this.teamUnsubscribeMethod = unsubscribe;
    }

    registerGameListener(callback: FirebaseDataCallback<Game>) {
        const db = getDatabase();
        const gameRef = ref(db, FirebaseContants.GAME_ROOT);
        this.gameUnsubscribeMethod; // This might be a function or null. If null nothing happens else it unsubscribes.
        const unsubscribe = onValue(gameRef, (snapshot) => {
            callback.onDataChanged(snapshot.val());
        });
        this.gameUnsubscribeMethod = unsubscribe;
    }

    onUserReady(callback: () => void) {
        const unsubscribe = onAuthStateChanged(getAuth(), (userCredential) => {
            if (userCredential) {
                callback();
                unsubscribe();
            }
        });
    }

    async startGame() {
        const db = getDatabase()
        const updates: { [key: string]: any } = {}

        updates[`${FirebaseContants.GAME_ROOT}/${FirebaseContants.GAME_STARTED}`] = true
        updates[`${FirebaseContants.GAME_ROOT}/${FirebaseContants.START_TIMESTAMP}`] = serverTimestamp()

        await update(ref(db), updates)
    }

    async stopGame() {
        const db = getDatabase()
        await set(ref(db, `${FirebaseContants.GAME_ROOT}/${FirebaseContants.GAME_STARTED}`), null)

    }

    async setGameStarted() {
        const db = getDatabase()
        await set(ref(db, `${FirebaseContants.GAME_ROOT}/${FirebaseContants.GAME_STARTED}`), true)

    }


    async login(email: string, password: string): Promise<User> {
        try {
            const userCredential = await signInWithEmailAndPassword(getAuth(), email, password);
            return {firebaseUserID: userCredential.user.uid};
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
        const teamData: TeamCreationData = {
            username: holdNavn,
            email: email,
            bonusTime: bonusTime,
            participants: participants,
            password: password
        }
        await set(ref(db, `${FirebaseContants.TEAMS_ROOT}/${uid}`), teamData);
    }

    async getAllTeams(): Promise<Team[]> {
        const db = getDatabase()
        const teamsSnapshot = await get(ref(db, `${FirebaseContants.TEAMS_ROOT}`))
        const teams = teamsSnapshot.val()
        //FIXME this will not work should be repackaged to team[]

        return teams

    }

    async getGame(): Promise<Game | false> { //fixme eewwww this should probably be null object or undefined.
        const db = getDatabase(app);
        const snapshot = await get(ref(db, `${FirebaseContants.GAME_ROOT}`))
        if (!snapshot || !snapshot.exists()) {
            console.error("Game does not exist")
            return false
        }
        const game: Game = snapshot.val()
        return game
    }

    async getTasks(): Promise<Task[]> {
        const db = getDatabase();
        const snapshot = await get(ref(db, FirebaseContants.TASKS_ROOT))
        if (!snapshot || !snapshot.exists()) {
            throw new Error('Task data fetch error');
        }
        const tasks: Task[] = snapshot.val();
        return tasks;
    }

    async writeTaskCompleted(taskID: string): Promise<Task> {
        const auth = getAuth(app);
        const currentUser = auth.currentUser;

        // Check if the user is authenticated
        if (!currentUser) {
            console.error("User is not authenticated. Please log in.");
            throw new AuthenticationError("User is not authenticated. Please log in.");
        }

        // if(await this.isTeamDead(currentUser.uid)) {
        //     throw new TeamIsDeadError("You cannot complete more tasks because you have run out of time")
        // }

        const db = getDatabase(app);
        const snapshot = await get(ref(db, `${FirebaseContants.TASKS_ROOT}/${taskID}`))
        if (!snapshot || !snapshot.exists()) {
            console.error("This task does not exist in firebase")
            throw new TaskNotFoundError("Task not found in firebase")
        }
        const gameSnapshot = await get(ref(db, `${FirebaseContants.GAME_ROOT}/${FirebaseContants.GAME_STARTED}`))

        if (!gameSnapshot.exists() || gameSnapshot.val() === false) {
            console.error("The game is not started")
            throw new GameNotStartedError("The game is not started")
        }

        const task: Task = snapshot.val()

        const teamId = getAuth(app).currentUser?.uid

        if (!teamId) {
            console.error("Firebase error uknown: errorcode ostemads")
            throw new Error("Firebase error uknown: errorcode ostemads")
        } //fixme if this ever happens in reality we fix it for real. Otherwise we remote it as it is a theoprwetical mistake

        const multiplier = await FirebaseConnection.getInstance().then(async (instance) => {
            return await instance.getGameMultiplier()
        })

        const teamDatabaseBasePath = `${FirebaseContants.TEAMS_ROOT}/${teamId}`

        const pathToCompletedTaskInTasks = `${teamDatabaseBasePath}/${FirebaseContants.TEAM_TASKS}/${taskID}`
        const snapshotOfTask = await get(ref(db, pathToCompletedTaskInTasks))
        if (snapshotOfTask.exists()) {
            console.error("The team has already solved this task")
            throw new AlreadySolvedTaskError("You have already solved this task")
        }

        const lastCompletedTaskPath = `${teamDatabaseBasePath}/${FirebaseContants.LAST_COMPLETED_TASK}`

        const lastTaskSnapsHot = await get(ref(db, lastCompletedTaskPath))
        const lastTask: TaskMarker = lastTaskSnapsHot.val()

     if (lastTaskSnapsHot.exists() && lastTask.letter === task.taskMarker.letter) {
            throw new TwoOfTheSameLetterTaskInARowError("Your last tasks was this same letter")
        }

        const updates: { [key: string]: any } = {}

        updates[pathToCompletedTaskInTasks] = {
            baseTime: task.baseTime,
            multiplier: multiplier,
            timeEarned: task.baseTime * multiplier,
            taskMarker: task.taskMarker
        }

        updates[lastCompletedTaskPath] = task.taskMarker

        await update(ref(db), updates)
        return Promise.resolve(task)
    }


    async killAllListenersFromThisPage() {
        for (const unsubscribe of this.unsubscribeMethodsFromListeners) {
            unsubscribe();
        }

        this.teamUnsubscribeMethod?.();
        this.gameUnsubscribeMethod?.();
        this.unsubscribeMethodsFromListeners = [];
    }

    async getTeam(user: User): Promise<Team | false> {
        const teamID = user.firebaseUserID;

        const db = getDatabase(app);
        const snapshot = await get(ref(db, `${FirebaseContants.TEAMS_ROOT}/${teamID}`));
        if (!snapshot || !snapshot.exists()) {
            console.error("This team does not exist in firebase");
            return false;
        }
        const team: Team = snapshot.val();
        return team;
    }

    async createTask(letter: string, number: number, baseTime: number) {
        const db = getDatabase(app);
        const taskData: Task = {
            baseTime: baseTime,
            taskMarker: {
                letter: letter,
                number: number
            }
        }
        // Create a new task reference with an auto-generated id
        const taskListRef = ref(db, FirebaseContants.TASKS_ROOT);
        const newTaskRef = push(taskListRef);
        await set(newTaskRef, taskData);
    }

    async isAdmin(): Promise<boolean> {

        const uid = this.userState.uid

        const db = getDatabase()
        return await get(ref(db, `${FirebaseContants.ADMIN_ROOT}/${uid}`)).then((snapshot) => {
            return snapshot.exists()
        }).catch(() => {
            return false
        })
    }

    async getGameMultiplier() {
        const db = getDatabase()
        const snap = await get(ref(db, `${FirebaseContants.GAME_ROOT}/${FirebaseContants.MULTIPLIER}`))
        return snap.val()
    }

    async setMultiplierValue(value: number) {
        const db = getDatabase()
        await set(ref(db, `${FirebaseContants.GAME_ROOT}/${FirebaseContants.MULTIPLIER}`), value)

    }

    async undeathTeam(userId: string): Promise<void> {
        const db = getDatabase()
        await set(ref(db, `${FirebaseContants.TEAMS_ROOT}/${userId}/${FirebaseContants.DEATH_TIMESTAMP}`), null)

    }
    async setTeamDead(userId: string): Promise<void> {
        const db = getDatabase()
        await set(ref(db, `${FirebaseContants.TEAMS_ROOT}/${userId}/${FirebaseContants.DEATH_TIMESTAMP}`), serverTimestamp())
    }

    async isTeamDead(teamId: string): Promise<boolean> {
        const db = getDatabase()
        const snapshot = await get(ref(db, `${FirebaseContants.TEAMS_ROOT}/${teamId}/${FirebaseContants.DEATH_TIMESTAMP}`))
        const isdead = snapshot.exists()
        console.log(isdead)
        return Promise.resolve(isdead)
    }

    isLoggedIn(): boolean {
        const auth = getAuth(app);
        const currentUser = auth.currentUser;

        // Check if the user is authenticated
        return currentUser !== null
    }

    async getAdminDisplayName(){
        const db = getDatabase();
        const snapshot = await get(ref(db, `${FirebaseContants.ADMIN_ROOT}/${this.userState.uid}/${FirebaseContants.DISPLAY_NAME}`));
        return snapshot.val()
    }

    async resetAllTeams(): Promise<void> {
        const db = getDatabase();
        const snapshot = await get(ref(db, `${FirebaseContants.TEAMS_ROOT}`));

        // Retrieve all teams

        if (snapshot.exists()) {
            const teams = snapshot.val();

            // Iterate over all teams and remove the DEATH_TIMESTAMP for the user
            const promises = Object.keys(teams).map(async (teamId) => {
                console.log(teamId)
                const updates: { [key: string]: any } = {}
                updates[`${FirebaseContants.TEAMS_ROOT}/${teamId}/${FirebaseContants.DEATH_TIMESTAMP}`] = null
                updates[`${FirebaseContants.TEAMS_ROOT}/${teamId}/${FirebaseContants.LAST_COMPLETED_TASK}`] = null
                updates[`${FirebaseContants.TEAMS_ROOT}/${teamId}/${FirebaseContants.TEAM_TASKS}`] = null

                await update(ref(db), updates)

            });

            // Wait for all removals to complete
            await Promise.all(promises);
            console.log(`Game data removed  in all teams`);
        } else {
            console.log("No teams found.");
        }
    }

}
