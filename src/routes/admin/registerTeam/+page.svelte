<script lang="ts">
	import { browser } from "$app/environment";
	import { goto, invalidateAll } from "$app/navigation";
    import {FirebaseConnection} from "../../../lib/firebase/firebaseconnection";

    let email: string;
    let teamName: string;
    let password: string;
    let bonusTime: number;
    let participants: number;
    let success: boolean | undefined;
    let error: { code: string; message: string };
    let user = {uid: "geh"} //fixme Delete this line

    function resetForm() {
        email = "";
        teamName = "";
        password = "";
        bonusTime = 0;
        participants = 0;
    }
    function register() {
        if (browser) {
            FirebaseConnection.getInstance().then((instance)=>{
                instance.onUserReady(()=>{
                    instance.register(teamName, email, password, bonusTime, participants);
                    goto('/admin');
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
            <div class="field">
                <label class="label">Email</label>
                <div class="control">
                    <input
                        type="email"
                        class="input"
                        placeholder="Email"
                        required
                        bind:value={email}
                    />
                </div>
            </div>
            <div class="field">
                <label class="label">Password</label>
                <div class="control">
                    <input
                        type="password"
                        class="input"
                        placeholder="Password"
                        required
                        bind:value={password}
                    />
                </div>
            </div>

            <button type="submit" class="button is-primary">Register</button>
        </form>
        {#if !success && success !== undefined}
            <div class="notification is-danger">
                {error?.message}
            </div>
        {/if}

        {#if success && success !== undefined}
            <div class="notification is-success">
                User {teamName} with user id {user.uid} was created!🎉
            </div>
        {/if}
    </div>
</section>
