import {LoginError} from "./login-error";
import {userState} from "../../stores/userstate";
import type {UserState} from "../../stores/userstate";
import {FirebaseConnection} from "./firebaseconnection";

export async function doLogin(email: string, password: string) {

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