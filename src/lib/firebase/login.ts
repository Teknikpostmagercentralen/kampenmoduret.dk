import {LoginError} from "./login-error";
import {userState} from "../../stores/userstate";
import type {UserState} from "../../stores/userstate";
import {FirebaseConnection} from "./firebaseconnection";
import {goto} from "$app/navigation";


export async function doLoginWithUsername(username: string, password: string) {

    await doLoginWithEmailAndPassword(`${username}@kampenmoduret.dk`, password)

}

export async function doLoginWithEmailAndPassword(email: string, password: string) {

    try {
        const firebaseConnection = await FirebaseConnection.getInstance();
        const user = await firebaseConnection.login(email, password);
        console.log(`Logged in ${user.firebaseUserID}`);

        await userState.update((state: UserState) => {
            return {
                ...state,
                loggedIn: true,
                user: user
            };
        });

    } catch (e) {
        if (e instanceof LoginError) throw e
        else console.error(e)

    }

}


//successful

export function registerRedirectCallbackToHandleRedirectWhenLoginSuccessful(){

    FirebaseConnection.getInstance().then(async (instance) => {
        await instance.onUserReady(async () => {
            const firebaseConnection = await FirebaseConnection.getInstance();
            firebaseConnection.registerUserListener({
                onDataChanged: async (userUpdate) => {
                    const isAdmin = await firebaseConnection.isAdmin()
                    if (isAdmin) {
                        await goto("/admin")
                    } else {
                        await goto('/game');

                    }
                }
            });
        });
    });

}