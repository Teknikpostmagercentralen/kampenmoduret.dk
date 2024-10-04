<script lang="ts">
    import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
    import {goto} from '$app/navigation';
    import {browser} from '$app/environment';
    import {TaskError, TwoOfTheSameLetterTaskInARowError} from "../../../lib/firebase/firebaseconnection";
    import type {Task} from "../../../lib/models/task";
    import {onDestroy} from "svelte";

    /** @type {import('./$types').PageData} */
    export let data;
    let errormessage: string;
    let taskSolved: Task;
    let interval

    onDestroy(()=>{
        clearInterval(interval);
    })


    if (browser) {
        FirebaseConnection.getInstance().then((instance) => {
            interval = setInterval(()=>{
                if (!instance.isLoggedIn()) goto("/user/login")
            }, 2000)
            instance.onUserReady(() => {
                clearInterval(interval)
                instance.writeTaskCompleted(data.taskID).then((task: Task) => {
                    // No error, navigate immediately
                    taskSolved = task
                    setTimeout(() => {
                        goto('/game');
                    }, 3000); // Delay in milliseconds

                }).catch((reason: TaskError) => {
                    if (reason.name === "SAME_LETTER") errormessage = "You cannot check in tasks with the same letter twice in a row"
                    if (reason.name === "SAME_TASK_TWICE") errormessage = "You have already solved this task"
                    if (reason.name === "AUTHENTICATION") errormessage = "You have to log in before solving a task"
                    if (reason.name === "TASK_NOT_FOUND_IN_FIREBASE") errormessage = "Task was not solved in Firebase"
                    if (reason.name === "GAME_NOT_STARTED") errormessage = "Game not started, wait until ready before solving a task!"
                    if (reason.name === "TEAM_IS_DEAD") errormessage = "You have run out of time! So no more posts for you 😿️"
                    setTimeout(() => {
                        goto('/game');
                    }, 7000); // Delay in milliseconds
                })
            });
        });
    }


    // Define your list of positive emoji combinations with funny and celebratory themes
    const emojiCombinations = [
        "👏👏👏",
        "🎉🎈🎉",
        "🤩💥🤩",
        "💪🔥💪",
        "🌟✨🌟",
        "🎊🎁🎊",
        "🥳🎉🥳",
        "🙌👏🙌",
        "🚀🌕🚀",
        "🍕🍔🍟",
        "🦸‍️💥🦸‍️",
        "🎯🏆🎯",
        "⚡️⚡️⚡️",
        "🏅🥇🏅"
    ];

    // Function to pick a random emoji combination
    let randomEmojiCombination;

    $: if (taskSolved) {
        randomEmojiCombination = emojiCombinations[Math.floor(Math.random() * emojiCombinations.length)];
    }
</script>

<style>

    .big-emojis {
        font-size: 20vw; /* Fills about 30% of the viewport width */
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%; /* Full width of the container */
        position: absolute;
        top: 50%; /* Center vertically */
        left: 50%; /* Center horizontally */
        transform: translate(-50%, -50%); /* Ensure exact centering */
    }


</style>

{#if taskSolved}
    <p class="notification is-success is-size-3">You just solved {taskSolved.taskMarker.letter}{taskSolved.taskMarker.number} </p>
    <div class="big-emojis">{randomEmojiCombination}</div>

{/if}

{#if errormessage}
    <p class="notification is-danger is-size-3">{errormessage}</p>
    <div class="big-emojis">😢</div>
{/if}



