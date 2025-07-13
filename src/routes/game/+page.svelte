<script lang="ts">
    import {browser} from '$app/environment';
    import {FirebaseConnection} from '../../lib/firebase/firebaseconnection';
    import {onDestroy} from 'svelte';
    import type {Team} from '$lib/models/team';
    import {getTimeLeft, shouldTeamBeMarkedDead} from '$lib/game/gameLogic';
    import type {Game} from '$lib/models/game';
    import type {User} from '../../lib/models/user';
    import {goto} from "$app/navigation";
    import {GameState} from "$lib/models/game-state.js";
    import {TimeFormatter} from "$lib/game/time-formatter.js";

    let user: User;
    let timeLeft: number; // Set the starting time
    let team: Team;
    let game: Game;
    let timeout: NodeJS.Timeout;

    async function getUser() {
        const firebaseConnection = await FirebaseConnection.getInstance();
        firebaseConnection.registerUserListener({
            onDataChanged: async (userUpdate) => {
                user = userUpdate;
                if (user.firebaseUserID === "") await goto("/user/login") //if not logged in redirect to login page
                firebaseConnection.registerTeamListener(user, {
                    onDataChanged: async (teamUpdate) => {
                        team = teamUpdate;
                    }
                });
                firebaseConnection.registerGameListener({
                    onDataChanged: async (gameUpdate) => {
                        game = gameUpdate;
                        console.log(gameUpdate)
                    }
                });
            }
        });
    }

    onDestroy(async () => {
        clearTimeout(timeout);
        await FirebaseConnection.getInstance().then((instance) => {
            instance.killAllListenersFromThisPage();
        });
    });

    function updateTimeLeft() {
        timeout = setTimeout(async () => {
            if (team && game) {
                try {
                    timeLeft = await getTimeLeft(team, game);

                    await FirebaseConnection.getInstance().then(async (instance) =>{
                        let dead = await instance.isTeamDead(user.firebaseUserID)
                        if(!dead){
                            let shouldbeDead = shouldTeamBeMarkedDead(game, team, user.firebaseUserID, timeLeft)
                            if(shouldbeDead) {
                                await instance.setTeamDead(user.firebaseUserID)
                                console.log("You dead jim: " + team.username + " - " + user.firebaseUserID)
                                console.log("timeleft: " + timeLeft)
                            }
                        }

                    })
                } catch (e) {
                    //empty catch
                }

            }




            updateTimeLeft();
        }, 1000);
    }


    if (browser) {
        getUser();
        updateTimeLeft();
    }

</script>

<main>
    {#if timeLeft !== undefined && game && game.gameState === GameState.STARTED}
        <div
                class={`hero is-fullheight is-flex is-justify-content-center is-align-items-center ${timeLeft === 0 ? 'has-background-danger' : 'has-background-success'}`}
        >
            <div class="has-text-white has-text-centered" style="font-size: 8rem;">
                {TimeFormatter.formatTime(timeLeft)}
            </div>

            <!-- Lower right corner number -->
            <div
                    class="has-text-white"
                    style="position: absolute; bottom: 20px; right: 20px; font-size: 2.5rem;"
            >
                {team.participants}
            </div>
        </div>
    {:else if game && game.gameState === GameState.STOPPED}
        <div
                class={`hero is-fullheight is-flex is-justify-content-center is-align-items-center has-background-danger`}
        >
            <p class="title is-1 has-text-centered has-text-white">Game Over!</p>
            <p class="title is-4 has-text-centered has-text-white">Thanks for playing!</p>
        </div>
    {:else if game && game.gameState === GameState.WELCOME}
        <div
                class={`hero is-fullheight is-flex is-justify-content-center is-align-items-center has-background-link`}
        >
            <p class="title is-1 has-text-centered has-text-white">All set!</p>
            <p class="title is-4 has-text-centered has-text-white">Waiting for game to start</p>
        </div>
    {:else}
        <div
                class={`hero is-fullheight is-flex is-justify-content-center is-align-items-center has-background-warning`}
        >
            {#if game && game.gameState === GameState.DEACTIVATED}
                <p class="title is-1 has-text-centered">Game paused!</p>
                <p class="title is-4 has-text-centered">Waiting for game to resume</p>
            {:else}
                <p class="title is-1 has-text-centered">Loading</p>
            {/if}
            <progress class="progress is-info is-two-thirds" max="100" style="width: 66%;"></progress>
        </div>
    {/if}
</main>
