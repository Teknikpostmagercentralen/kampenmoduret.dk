<script lang="ts">
    // This page simply displays a "Logging you in" loading state
    import {catalog} from "$lib/language/index.js";
    import {
        doLoginWithEmailAndPassword,
        doLoginWithUsername,
        registerRedirectCallbackToHandleRedirectWhenLoginSuccessful
    } from "../../../lib/firebase/login";
    import {onMount} from "svelte";
    import {LoginError, LoginErrorType} from "../../../lib/firebase/login-error";
    import {browser} from "$app/environment";
    import {goto} from "$app/navigation";
    import {FirebaseConnection} from "../../../lib/firebase/firebaseconnection";

    let error: string | null = null;


        if (browser) {
            registerRedirectCallbackToHandleRedirectWhenLoginSuccessful()
        }


    async function handleLoginFromQuery() {
        // Parse ?username=…&password=… from the URL
        const params = new URLSearchParams(window.location.search);
        const username = params.get('username');
        const password = params.get('password');

        if (!username || !password) {
            error = catalog.login.messages.invalid_data_in_request;
            return;
        }
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
                        error = catalog.login.errors.invalidEmail;
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

    onMount(() => {
        handleLoginFromQuery();
    });

</script>


<main>
    {#if error}
        <!-- ERROR STATE -->
        <section
                class="hero is-fullheight is-flex is-justify-content-center is-align-items-center has-background-danger"
        >
            <p class="title is-size-3-mobile is-size-2-tablet has-text-white has-text-centered">
                {error}
            </p>
        </section>
    {:else}
        <!-- LOADING STATE -->
        <section
                class="hero is-fullheight is-flex is-flex-direction-column is-justify-content-center is-align-items-center has-background-info"
        >
            <p class="title is-1 has-text-centered">
                {catalog.login.messages.status_message_logging_you_in}
            </p>
            <progress
                    class="progress is-black is-two-thirds"
                    max="100"
                    style="width: 66%;"
            ></progress>
        </section>
    {/if}
</main>