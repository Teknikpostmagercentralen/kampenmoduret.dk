<script lang="ts">
    import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
    import {goto} from '$app/navigation';
    import {browser} from "$app/environment";
    import {catalog} from '$lib/language';
    import {LoginError, LoginErrorType} from "../../../lib/firebase/errors/login-error";
    import {
        doLoginWithEmailAndPassword,
        doLoginWithUsername,
        registerRedirectCallbackToHandleRedirectWhenLoginSuccessful
    } from "../../../lib/firebase/login-page-utils";


    let password: string = '';
    let username: string = '';
    let error: string | null = null;


    if (browser) {
        registerRedirectCallbackToHandleRedirectWhenLoginSuccessful()
    }


    async function handleLogin() {
        try {

            await doLoginWithUsername(username, password)

        } catch (e) {

            if (e instanceof LoginError) {
                switch (e.type) {
                    case LoginErrorType.InvalidCredentials:
                        error = catalog.login.errors.invalidCredentialsUsername;
                        break;
                    case LoginErrorType.UserNotFound:
                        error = catalog.login.errors.userNotFound;
                        break;
                    case LoginErrorType.WrongPassword:
                        error = catalog.login.errors.wrongPassword;
                        break;
                    case LoginErrorType.InvalidEmail:
                        error = catalog.login.errors.invalidEmailUsername;
                        break;
                    case LoginErrorType.UserDisabled:
                        error = catalog.login.errors.userDisabled;
                        break;
                    case LoginErrorType.TooManyRequests:
                        error = catalog.login.errors.tooManyRequests;
                        break;
                    case LoginErrorType.NetworkError:
                        error = catalog.login.errors.networkError;
                        break;
                    default:
                        error = catalog.login.errors.unknown;
                }
            }

        }
    }
</script>

<main>
    <div class="login-container">
        <h1 class="title">Login</h1>
        <div class="field">
            <label class="label" for="username">Username</label>
            <div class="control">
                <input
                        class="input"
                        type="text"
                        id="username"
                        bind:value={username}
                        placeholder={catalog.login.username_example_text}
                />
            </div>
        </div>
        <div class="field">
            <label class="label" for="password">Password</label>
            <div class="control">
                <input
                        class="input"
                        type="password"
                        id="password"
                        bind:value={password}
                        placeholder="********"
                />
            </div>
        </div>
        {#if error}
            <div class="notification is-danger">
                {error}
            </div>
        {/if}


        <div class="has-text-centered mt-3">
            <a class="is-size-6 has-text-grey" href="/user/login-admin">
                {catalog.login.adminLinkText}
            </a>
        </div>

        <div class="field">
            <div class="control">
                <button class="button is-primary" on:click={handleLogin}>Login</button>
            </div>
        </div>
    </div>
</main>

<style>
    .login-container {
        max-width: 400px;
        margin: 0 auto;
        padding: 20px;
    }
</style>
