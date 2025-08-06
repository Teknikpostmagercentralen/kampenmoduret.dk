<script lang="ts">
    import {browser} from "$app/environment";
    import {goto, invalidateAll} from "$app/navigation";
    import {FirebaseConnection} from "../../../lib/firebase/firebaseconnection";
    import {encodeUsername} from "../../../lib/firebase/username-encoder";
    import {RegistrationError, RegistrationErrorType} from "../../../lib/firebase/errors/register-error";
    import {catalog} from "../../../lib/language";
    import {generatePassword} from "../../../lib/firebase/generate-passwords";

    let teamName: string;
    let bonusTime: number;
    let participants: number;
    let error: string = ''

    function register() {
        if (browser) {
            error = ''; // clear previous errors
            if (!teamName?.trim() || bonusTime == null || participants == null) {
                error = catalog.registerTeam.fields_not_filled;
                return;
            }

            const password = generatePassword()
            const username = encodeUsername(teamName)
            const email = `${username}@kampenmoduret.dk`

            FirebaseConnection.getInstance().then((instance) => {
                instance.onUserReady(async () => {
                    const admin = await instance.getAdmin()
                    const gameId = Object.keys(admin.games)[0];

                    try{

                        await instance.registerNewTeam(teamName, email, password, bonusTime, participants, gameId);
                        const params = new URLSearchParams({username, password});
                        goto(`/admin/register-team/show-team-qr?${params.toString()}`);

                    } catch (e) {
                        if (e instanceof RegistrationError) {
                            switch (e.type) {
                                case RegistrationErrorType.EmailAlreadyInUse:
                                    error = catalog.registerTeam.errors.emailAlreadyInUse;
                                    break;
                                case RegistrationErrorType.InvalidEmail:
                                    error = catalog.registerTeam.errors.invalidEmail;
                                    break;
                                case RegistrationErrorType.OperationNotAllowed:
                                    error = catalog.registerTeam.errors.operationNotAllowed;
                                    break;
                                case RegistrationErrorType.WeakPassword:
                                    error = catalog.registerTeam.errors.weakPassword;
                                    break;
                                case RegistrationErrorType.TooManyRequests:
                                    error = catalog.registerTeam.errors.tooManyRequests;
                                    break;
                                case RegistrationErrorType.NetworkError:
                                    error = catalog.registerTeam.errors.networkError;
                                    break;
                                default:
                                    error = catalog.registerTeam.errors.unknown;
                            }
                        }

                        console.log(error)
                    }

                });
            });
        }
    }

</script>

<svelte:head>
    <title>Register</title>
</svelte:head>
<section class="section">
    <div class="container is-max-desktop">
        <h1 class="title">Register</h1>

        <form class="box" on:submit|preventDefault={register}>
            <div class="field">
                <label class="label">Team name</label>
                <div class="control">
                    <input
                            type="text"
                            class="input"
                            placeholder="Team name"
                            required
                            bind:value={teamName}
                    />
                </div>
            </div>
            <div class="field">
                <label class="label">Bonus Time</label>
                <div class="control">
                    <input
                            type="number"
                            class="input"
                            placeholder="0"
                            required
                            bind:value={bonusTime}
                    />
                </div>
            </div>
            <div class="field">
                <label class="label">Number of participants</label>
                <div class="control">
                    <input
                            type="number"
                            class="input"
                            placeholder="0"
                            required
                            bind:value={participants}
                    />
                </div>
            </div>

            <button type="submit" class="button is-primary">Register</button>
        </form>
        {#if error}
            <div class="notification is-danger">
                {error}
            </div>
        {/if}
    </div>
</section>
