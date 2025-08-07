<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import { browser } from '$app/environment';
    import { catalog } from '$lib/language/index.js';

    const dispatch = createEventDispatcher();

    let show = false;
    let clickCount = 0;
    let clickResetTimer: number | undefined;
    let hideTimer: number | undefined;

    const CLICK_WINDOW  = 5000;   // ms to accumulate clicks
    const CLICK_COUNT_BEFORE_BUTTON_IS_SHOWN = 20 // number of times to click within window before button is shown
    const SHOW_DURATION = 10000;  // ms to show the QA button


    function trigger() {
        if (hideTimer != null) clearTimeout(hideTimer);
        show = true;
        hideTimer = window.setTimeout(() => {
            show = false;
        }, SHOW_DURATION);
    }

    function resetClickCount() {
        clickCount = 0;
        clickResetTimer = undefined;
    }

    function onClick() {
        clickCount++;

        if (clickCount === 1) {
            clickResetTimer = window.setTimeout(resetClickCount, CLICK_WINDOW);
        }

        if (clickCount === CLICK_COUNT_BEFORE_BUTTON_IS_SHOWN) {
            if (clickResetTimer != null) clearTimeout(clickResetTimer);
            resetClickCount();
            trigger();
        }
    }

    onMount(() => {
        if (!browser) return;
        window.addEventListener('click', onClick);
    });

    onDestroy(() => {
        if (!browser) return;
        if (clickResetTimer != null) clearTimeout(clickResetTimer);
        if (hideTimer       != null) clearTimeout(hideTimer);
        window.removeEventListener('click', onClick);
    });
</script>

<style>
    .secret-btn {
        position: fixed;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
    }
</style>

{#if show}
    <button
            class="button is-white secret-btn"
            on:click={() => {
      dispatch('activate');
      show = false;   // hide immediately if you want
      clearTimeout(hideTimer);
    }}
    >
        {catalog.game.buttons.secret_logout_button}️
    </button>
{/if}