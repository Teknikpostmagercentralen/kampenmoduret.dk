<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { browser } from '$app/environment';
    import {ConfigConstants} from "../../../../lib/config/config-constants";
    import {goto} from "$app/navigation";
    import {catalog} from "$lib/language/index.js";

    let username: string | null = null;
    let password: string | null = null;
    let qrSrc = '';
    let errorMsg = '';

    onMount(() => {
        if (!browser) return;

        const params = new URLSearchParams(window.location.search);
        const username = params.get('username');
        const password = params.get('password');

        if (!username || !password) {
            errorMsg = 'Missing username or password in URL parameters.';
        } else {
            const baseURL = ConfigConstants.getURL();
            const params = new URLSearchParams({username, password});

            const loginUrl = `${baseURL}/user/login-qr?${params.toString()}`;
            qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(loginUrl)}`;
        }

    });

    function goBackToDashboard() {
       goto('/admin')
    }

    function createAnother() {
       goto('/admin/register-team');
    }
</script>

<style>
    .qr-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: calc(100vh - 4rem);
        padding: 1rem;
    }
    .qr-image {
        max-width: 90vw;
        max-height: 70vh;
        width: auto;
        height: auto;
    }
    .buttons-container {
        margin-top: 1rem;
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        justify-content: center;
    }
</style>

<section class="section">
    <div class="container qr-container">
        {#if errorMsg}
            <div class="notification is-danger">
                {errorMsg}
            </div>
        {:else}
            <figure class="image">
                <img src={qrSrc} alt="Login QR code" class="qr-image" />
            </figure>
            <div class="buttons-container">
                <button class="button is-link" on:click={goBackToDashboard}>
                    {catalog.button_texts.go_back_to_dashboard}
                </button>
                <button class="button is-primary" on:click={createAnother}>
                    {catalog.button_texts.create_another_team_button_text}
                </button>
            </div>
        {/if}
    </div>
</section>