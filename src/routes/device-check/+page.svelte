<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import {catalog} from "$lib/language/index.js";

    let utcTime = '';
    let localTime = '';
    let timezone = '';
    let timer: NodeJS.Timeout;

    function pad(n: number): string {
        return String(n).padStart(2, '0');
    }

    function updateTimes() {
        const now = new Date();
        utcTime = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
        localTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }

    onMount(() => {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        updateTimes();
        timer = setInterval(updateTimes, 1000);
    });

    onDestroy(() => {
        clearInterval(timer);
    });
</script>

<style>
    :root {
        --container-max-width: 480px;
        --container-padding: clamp(1rem, 5vw, 2rem);
    }

    .time-check {
        background-color: #FF6201;
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        min-height: 100vh;
        padding: var(--container-padding);
        box-sizing: border-box;
        text-align: center;
        position: relative;
    }

    .time-box {
        background-color: rgba(255, 255, 255, 0.12);
        border-radius: 1rem;
        padding: clamp(1.5rem, 3vw, 2rem) clamp(1rem, 4vw, 1.5rem);
        margin-block: clamp(2rem, 10vh, 6rem);
        width: 100%;
        max-width: var(--container-max-width);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .utc-footer {
        margin-top: auto;
        padding-top: clamp(1rem, 5vh, 2rem);
        font-size: 0.8rem;
        line-height: 1.2;
        text-align: center;
        color: white;
    }

    @media (max-height: 500px) or (max-width: 320px) {
        .time-box {
            margin-block: clamp(1rem, 5vh, 2rem);
            padding: 1rem;
        }

        .utc-footer {
            font-size: 0.7rem;
            padding-top: 1rem;
        }
    }
</style>

<section class="time-check">
    <h1 class="title is-4 has-text-white mb-2 mt-6">
        {catalog.screens.deviceCheck.intro_text}
    </h1>
    <p class="is-size-6 has-text-white mb-5 mt-4">
        ⚠️️{catalog.screens.deviceCheck.correctness_warning}⚠️️
    </p>

    <div class="time-box">
        <div class="is-size-6 has-text-weight-medium mb-4">{catalog.screens.deviceCheck.local_time}</div>
        <div class="is-size-1 has-text-weight-bold mb-2">{localTime}</div>
        <div class="is-size-6">{catalog.screens.deviceCheck.time_zone}: {timezone}</div>
    </div>

    <p class="is-size-5 has-text-white has-text-weight-semibold mt-4">
        {catalog.screens.deviceCheck.end_warning}
    </p>

    <div class="utc-footer">
        <div>{catalog.screens.deviceCheck.utc_time}: {utcTime}</div>
    </div>
</section>