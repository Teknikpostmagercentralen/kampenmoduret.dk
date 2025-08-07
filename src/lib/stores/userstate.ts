// src/stores/globalStore.ts
import {writable} from 'svelte/store';
import type {User} from "$lib/models/user";
import {browser} from "$app/environment";

export interface UserState {
    user: User;
    loggedIn: boolean
}

// Utility function to create a persistent writable store
function createPersistentStore<T>(key: string, initialValue: T) {
    let data = initialValue;

    if (browser) {
        const storedValue = localStorage.getItem(key);
        data = storedValue ? JSON.parse(storedValue) : initialValue;
    }

    const store = writable<T>(data);

    if (browser) {
        // Subscribe to store changes and update localStorage
        store.subscribe(value => {
            localStorage.setItem(key, JSON.stringify(value));
        });
    }

    return store;
}

// Create a writable store with a default value
export const userState = createPersistentStore<UserState>('userState', {
    user: {firebaseUserID: ""}, //null object pattern - just an empty user
    loggedIn: false
});


export async function resetUserState() {
    userState.update((state: UserState) => {
        return {
            ...state,
            loggedIn: false, user: {firebaseUserID: ""}
        };
    })

}