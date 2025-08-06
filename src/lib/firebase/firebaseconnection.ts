// src/Auth.ts
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import type {IdTokenResult, Unsubscribe, UserCredential} from 'firebase/auth';

// src/firebaseConfig.ts
import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import type {User} from "../models/user";
import {
    getDatabase,
    ref,
    set,
    child,
    remove,
    get,
    onValue,
    push,
    update,
    serverTimestamp,
    onChildAdded,
    onChildRemoved,
    query,
    equalTo,
    orderByChild
} from 'firebase/database';
import {FirebaseUserAdder} from "./firebaseUserAdder";
import {FirebaseConstants} from "./firebaseConstants";
import type {Task, TaskMarker} from "../models/task";
import type {CompletedTaskInTeams} from "../models/completed-task-in-teams";
import type {Team, TeamCreationData} from '$lib/models/team';
import type {Game} from '$lib/models/game';
import type {Admin} from '$lib/models/admin';
import {FirebaseError} from 'firebase/app';
import {LoginError} from "./errors/login-error";
import {RegistrationError} from "./errors/register-error";

export interface FirebaseDataCallback<T> {
    onDataChanged: (data: T) => void
}

export interface FirebaseTeamUpdateCallback {
    onTeamRemovedFromGame: (teamId: string) => void,
    onTeamChangedOrAdded: (teamData: Team) => void
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

export class TeamGameIdNotFoundError extends TaskError {
    constructor(message: string) {
        super(message, "TEAMS_GAME_ID_NOT_FOUND_IN_FIREBASE")
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

    private userState: { uid: string; loggedIn: boolean } = {uid: '', loggedIn: false};

    private unsubscribeMethodsFromListeners: Unsubscribe[] = [];
    private teamUnsubscribeMethods: { [key: string]: Unsubscribe } = {};
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
                this.userState = {uid: '', loggedIn: false};
            }
        });
    }

    registerUserListener(callback: FirebaseDataCallback<User>) {
        const unsubscribe = onAuthStateChanged(getAuth(), (userCredential) => {
            if (userCredential) {
                callback.onDataChanged({firebaseUserID: this.userState.uid});
            } else {
                callback.onDataChanged({firebaseUserID: ''});
            }
        });
        this.unsubscribeMethodsFromListeners.push(unsubscribe);
    }

    registerTeamsListener(gameId: string, callback: FirebaseTeamUpdateCallback) {
        const db = getDatabase();
        const teamsRef = ref(
            db,
            `${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.GAMES_TEAMS}`
        );
        console.log('Registering listener for teams');
        // Register listener for all teams
        const childAddedUnsubscribe = onChildAdded(teamsRef, (snapshot) => {
            const teamId: string = snapshot.key!; //maybe dangerous to use ! here. Only time will tell.
            const unsubscribe = this.registerTeamListener(teamId, {
                onDataChanged: (team) => {
                    callback.onTeamChangedOrAdded(team);
                }
            });
            console.log(`Team added ${teamId}`);
        });
        const childRemovedUnsubscribe = onChildRemoved(teamsRef, (snapshot) => {
            const teamId: string = snapshot.key!; //maybe dangerous to use ! here. Only time will tell.
            callback.onTeamRemovedFromGame(teamId);

            // Unsubscribe the teams listener and delete reference to unsubscribe method
            const unsubscribe = this.teamUnsubscribeMethods[teamId];
            unsubscribe();
            delete this.teamUnsubscribeMethods[teamId];
        });

        this.unsubscribeMethodsFromListeners.push(childAddedUnsubscribe);
        this.unsubscribeMethodsFromListeners.push(childRemovedUnsubscribe);
    }

    registerTeamListenerOnUser(user: User, callback: FirebaseDataCallback<Team>) {
        const db = getDatabase();
        const teamID = user.firebaseUserID;
        // If any team listeners are registered then we assume that there was another session because we logged out and logged in
        if (Object.keys(this.teamUnsubscribeMethods).length > 0) {
            const key = Object.keys(this.teamUnsubscribeMethods)[0];
            this.teamUnsubscribeMethods[key]();
        }
        this.registerTeamListener(teamID, callback);
    }

    //register team listener and handle unsubscribe methods
    private registerTeamListener(teamId: string, callback: FirebaseDataCallback<Team>) {
        const db = getDatabase();
        const teamRef = ref(db, `${FirebaseConstants.TEAMS_ROOT}/${teamId}`);
        const unsubscribe = onValue(teamRef, (snapshot) => {
            let team: Team = snapshot.val();
            team.id = snapshot.key ?? ''; // to make compiler happy in a simple way lets just set the id to ´´ in the unlikely event that snapshot.key should bre null - which will probably never happen
            callback.onDataChanged(team);
        });
        this.teamUnsubscribeMethods[teamId] = unsubscribe;
    }

    registerGameListener(gameId: string, callback: FirebaseDataCallback<Game>) {
        const db = getDatabase();
        const gameRef = ref(db, `${FirebaseConstants.GAME_ROOT_NEW}/${gameId}`);
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

    async resetGameToWelcomeState(gameId: string) {
        const db = getDatabase();
        const updates: { [key: string]: any } = {};

        updates[`${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.GAME_STATE}`] =
            FirebaseConstants.GAME_STATE_WELCOME;
        updates[`${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.START_TIMESTAMP}`] =
            null;
        updates[`${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.STOP_TIMESTAMP}`] =
            null;

        await update(ref(db), updates);
    }

    async startGame(gameId: string) {
        const db = getDatabase();
        const updates: { [key: string]: any } = {};

        updates[`${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.GAME_STATE}`] =
            FirebaseConstants.GAME_STATE_STARTED;
        updates[`${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.START_TIMESTAMP}`] =
            serverTimestamp();

        await update(ref(db), updates);
    }

    async deactivateGame(gameId: string) {
        const db = getDatabase();
        await set(
            ref(db, `${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.GAME_STATE}`),
            FirebaseConstants.GAME_STATE_DEACTIVATED
        );
    }

    async stopGame(gameId: string) {
        const db = getDatabase();
        const updates: { [key: string]: any } = {};

        updates[`${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.GAME_STATE}`] =
            FirebaseConstants.GAME_STATE_STOPPED;
        updates[`${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.STOP_TIMESTAMP}`] =
            serverTimestamp();

        await update(ref(db), updates);
    }

    async setGameStarted(gameId: string) {
        const db = getDatabase();
        await set(
            ref(db, `${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.GAME_STATE}`),
            FirebaseConstants.GAME_STATE_STARTED
        );
    }

    async login(email: string, password: string): Promise<User> {
        try {
            const userCredential = await signInWithEmailAndPassword(getAuth(), email, password);
            return {firebaseUserID: userCredential.user.uid};
        } catch (error) {
            console.error('Login failed:', error);
            throw LoginError.toLoginError(error) //has a static conversion that handles converting from firebase errors automatically
        }
    }

    async logout(): Promise<void> {
        try {
            await signOut(getAuth());
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }


    async registerNewTeam(
        holdNavn: string,
        email: string,
        password: string,
        bonusTime: number,
        participants: number,
        gameId: string
    ): Promise<void> {

        try {
            const uidOfNewUser = await FirebaseUserAdder.createNewUser(holdNavn, email, password);

            const auth = getAuth(app);
            const currentUser = auth.currentUser;

            // Check if the user is authenticated
            if (!currentUser) {
                console.error('User is not authenticated. Please log in.');
                return;
            }

            await this.writeUserData(
                uidOfNewUser,
                holdNavn,
                password,
                email,
                bonusTime,
                participants,
                gameId
            );
        } catch (error) {
            console.log('Firebase gave error on team registration:', error);
            throw RegistrationError.toRegistrationError(error) //has a static conversion that handles converting from firebase errors automatically
        }

    }

    async writeUserData(
        uid: string,
        holdNavn: string,
        password: string,
        email: string,
        bonusTime: number,
        participants: number,
        gameId: string
    ) {
        const db = getDatabase(app);
        const teamData: TeamCreationData = {
            username: holdNavn,
            email: email,
            bonusTime: bonusTime,
            participants: participants,
            password: password,
            gameId: gameId
        };

        const userUpdate: { [key: string]: unknown } = {};
        userUpdate[`${FirebaseConstants.TEAMS_ROOT}/${uid}`] = teamData;
        userUpdate[
            `${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.GAMES_TEAMS}/${uid}`
            ] = uid;

        await update(ref(db, `/`), userUpdate);
    }

    async getTasks(gameId: string): Promise<{ [key: string]: Task }> {
        const db = getDatabase();
        const taskIdInGameRef = ref(
            db,
            `${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.GAME_TASKS}`
        );
        const taskIdsInGameSnapshot = await get(taskIdInGameRef);
        if (!taskIdsInGameSnapshot || !taskIdsInGameSnapshot.exists()) {
            throw new Error('Task data fetch error');
        }
        const taskIdsInGame: string[] = Object.keys(taskIdsInGameSnapshot.val());

        const allTasksSnapshot = await get(ref(db, FirebaseConstants.TASKS_ROOT));
        if (!allTasksSnapshot || !allTasksSnapshot.exists()) {
            throw new Error('Task data fetch error');
        }

        const tasksToReturn: { [key: string]: Task } = {};

        allTasksSnapshot.forEach((element) => {
            if (taskIdsInGame.indexOf(element.key) !== -1) {
                // Get the index where the id exists, when the id does not exist indexOf returns -1
                tasksToReturn[element.key] = element.val();
            }
        });

        return tasksToReturn;
    }

    async writeTaskCompleted(taskId: string): Promise<Task> {
        const auth = getAuth(app);
        const currentUser = auth.currentUser;

        // Check if the user is authenticated
        if (!currentUser) {
            console.error('User is not authenticated. Please log in.');
            throw new AuthenticationError('User is not authenticated. Please log in.');
        }

        if (await this.isTeamDead(currentUser.uid)) {
            throw new TeamIsDeadError("You cannot complete more tasks because you have run out of time")
        }

        const db = getDatabase(app);
        const taskSnapshot = await get(ref(db, `${FirebaseConstants.TASKS_ROOT}/${taskId}`));
        if (!taskSnapshot || !taskSnapshot.exists()) {
            console.error('This task does not exist in firebase');
            throw new TaskNotFoundError('Task not found in firebase');
        }

        const gameIDSnapshot = await get(
            ref(
                db,
                `${FirebaseConstants.TEAMS_ROOT}/${currentUser.uid}/${FirebaseConstants.TEAM_GAME_ID}`
            )
        );
        if (!gameIDSnapshot || !gameIDSnapshot.exists()) {
            console.error('This team has no game id in firebase');
            throw new TeamGameIdNotFoundError('Id not found in firebase');
        }
        const gameId: string = gameIDSnapshot.val();

        const gameStateSnapshot = await get(
            ref(db, `${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.GAME_STATE}`)
        );

        if (
            !gameStateSnapshot.exists() ||
            gameStateSnapshot.val() !== FirebaseConstants.GAME_STATE_STARTED
        ) {
            console.error('The game is not started');
            throw new GameNotStartedError('The game is not started');
        }

        const task: Task = taskSnapshot.val();

        const teamId = getAuth(app).currentUser?.uid;

        if (!teamId) {
            console.error('Firebase error uknown: errorcode ostemads');
            throw new Error('Firebase error uknown: errorcode ostemads');
        } //fixme if this ever happens in reality we fix it for real. Otherwise we remote it as it is a theoprwetical mistake

        const multiplier = await FirebaseConnection.getInstance().then(async (instance) => {
            return await instance.getGameMultiplier(gameId);
        });

        const teamDatabaseBasePath = `${FirebaseConstants.TEAMS_ROOT}/${teamId}`;

        const pathToCompletedTaskInTasks = `${teamDatabaseBasePath}/${FirebaseConstants.TEAM_TASKS}/${taskId}`;
        const snapshotOfTask = await get(ref(db, pathToCompletedTaskInTasks));
        if (snapshotOfTask.exists()) {
            console.error('The team has already solved this task');
            throw new AlreadySolvedTaskError('You have already solved this task');
        }

        const lastCompletedTaskPath = `${teamDatabaseBasePath}/${FirebaseConstants.LAST_COMPLETED_TASK}`;

        const lastTaskSnapsHot = await get(ref(db, lastCompletedTaskPath));
        const lastTask: TaskMarker = lastTaskSnapsHot.val();

        if (lastTaskSnapsHot.exists() && lastTask.letter === task.taskMarker.letter) {
            throw new TwoOfTheSameLetterTaskInARowError('Your last tasks was this same letter');
        }

        const updates: { [key: string]: unknown } = {};

        updates[pathToCompletedTaskInTasks] = {
            baseTime: task.baseTime,
            multiplier: multiplier,
            timeEarned: task.baseTime * multiplier,
            taskMarker: task.taskMarker
        };

        updates[lastCompletedTaskPath] = task.taskMarker;

        await update(ref(db), updates);
        return Promise.resolve(task);
    }

    async killAllListenersFromThisPage() {
        for (const unsubscribe of this.unsubscribeMethodsFromListeners) {
            unsubscribe();
        }

        for (const key in this.teamUnsubscribeMethods) {
            const unsubscribe = this.teamUnsubscribeMethods[key];
            unsubscribe();
        }

        this.gameUnsubscribeMethod?.();
        this.unsubscribeMethodsFromListeners = [];
    }

    async getTeam(user: User): Promise<Team | false> {
        const teamID = user.firebaseUserID;

        const db = getDatabase(app);
        const snapshot = await get(ref(db, `${FirebaseConstants.TEAMS_ROOT}/${teamID}`));
        if (!snapshot || !snapshot.exists()) {
            console.error('This team does not exist in firebase');
            return false;
        }
        const team: Team = snapshot.val();
        return team;
    }

    async getAdmin(): Promise<Admin | false> {

        const adminId = getAuth(app).currentUser?.uid;
        if (!adminId) return false; //since we used ? above it can be null therefore we check it and if it is null user is not loggedIn, and is not admin


        const db = getDatabase(app);
        const snapshot = await get(ref(db, `${FirebaseConstants.ADMIN_ROOT}/${adminId}`));
        if (!snapshot || !snapshot.exists()) {
            console.error('This team does not exist in firebase');
            return false;
        }
        const admin: Admin = snapshot.val();
        return admin;
    }

    async createTask(letter: string, number: number, baseTime: number, gameId: string) {
        const db = getDatabase(app);
        const taskData: Task = {
            baseTime: baseTime,
            taskMarker: {
                letter: letter,
                number: number
            }
        };
        // Create a new task reference with an auto-generated id
        const taskListRef = ref(db, FirebaseConstants.TASKS_ROOT);
        const newTaskRef = push(taskListRef);
        await set(newTaskRef, taskData);

        // Add task id to game tasks
        const gameRef = ref(
            db,
            `${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.GAME_TASKS}/${newTaskRef.key}`
        );
        await set(gameRef, newTaskRef.key);
    }

    async isAdmin(): Promise<boolean> {
        const uid = this.userState.uid;

        const db = getDatabase();
        return await get(ref(db, `${FirebaseConstants.ADMIN_ROOT}/${uid}`))
            .then((snapshot) => {
                return snapshot.exists();
            })
            .catch(() => {
                return false;
            });
    }

    async getGameMultiplier(gameId: string) {
        const db = getDatabase();
        const snap = await get(
            ref(db, `${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.MULTIPLIER}`)
        );
        return snap.val();
    }

    async setMultiplierValue(value: number, gameId: string) {
        const db = getDatabase();
        await set(
            ref(db, `${FirebaseConstants.GAME_ROOT_NEW}/${gameId}/${FirebaseConstants.MULTIPLIER}`),
            value
        );
    }

    async setTeamDead(userId: string): Promise<void> {
        const db = getDatabase();
        await set(
            ref(db, `${FirebaseConstants.TEAMS_ROOT}/${userId}/${FirebaseConstants.DEATH_TIMESTAMP}`),
            serverTimestamp()
        );
    }

    async isTeamDead(teamId: string): Promise<boolean> {
        const db = getDatabase();
        const snapshot = await get(
            ref(db, `${FirebaseConstants.TEAMS_ROOT}/${teamId}/${FirebaseConstants.DEATH_TIMESTAMP}`)
        );
        const isdead = snapshot.exists();
        return Promise.resolve(isdead);
    }

    isLoggedIn(): boolean {
        const auth = getAuth(app);
        const currentUser = auth.currentUser;

        // Check if the user is authenticated
        return currentUser !== null;
    }

    async getAdminDisplayName() {
        const db = getDatabase();
        const snapshot = await get(
            ref(
                db,
                `${FirebaseConstants.ADMIN_ROOT}/${this.userState.uid}/${FirebaseConstants.DISPLAY_NAME}`
            )
        );
        return snapshot.val();
    }

    // TODO: only kill teams that belong to game
    async resetAllTeams(gameId: string): Promise<void> {
        const db = getDatabase();
        const allTeamsRef = ref(db, `${FirebaseConstants.TEAMS_ROOT}`);

        // Retrieve all teams in game
        const teamsWithGameIdQueryRef = query(
            allTeamsRef,
            orderByChild(FirebaseConstants.TEAM_GAME_ID),
            equalTo(gameId)
        ); // TODO: add indexOn Rules
        const teamsWithGameIdSnapshot = await get(teamsWithGameIdQueryRef);

        console.log(teamsWithGameIdSnapshot.val());

        if (teamsWithGameIdSnapshot.exists()) {
            const teams = teamsWithGameIdSnapshot.val();

            // Iterate over all teams and remove the DEATH_TIMESTAMP for the user
            const promises = Object.keys(teams).map(async (teamId) => {
                console.log(teamId);
                const updates: { [key: string]: any } = {};
                updates[`${FirebaseConstants.TEAMS_ROOT}/${teamId}/${FirebaseConstants.DEATH_TIMESTAMP}`] =
                    null;
                updates[
                    `${FirebaseConstants.TEAMS_ROOT}/${teamId}/${FirebaseConstants.LAST_COMPLETED_TASK}`
                    ] = null;
                updates[`${FirebaseConstants.TEAMS_ROOT}/${teamId}/${FirebaseConstants.TEAM_TASKS}`] = null;

                await update(ref(db), updates);
            });

            // Wait for all removals to complete
            await Promise.all(promises);
            console.log(`Game data removed  in all teams`);
        } else {
            console.log('No teams found.');
        }
    }
}
