<script lang="ts">
    import {onMount} from 'svelte';
    import {browser} from '$app/environment';
    import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
    import type {Team} from '$lib/models/team';
    import {ConfigConstants} from '$lib/config/config-constants';
    import {catalog} from "$lib/language/index.js";

    let teams: { [teamId: string]: Team } = {};
    let gameId: string;

    async function loadTeams() {
        const instance = await FirebaseConnection.getInstance();
        await instance.onUserReady(async () => {
            const admin = await instance.getAdmin();
            gameId = Object.keys(admin.games)[0];
            teams = await instance.getAllTeamsInGame(gameId);
        });
    }

    function generateLoginUrl(team: Team): string {
        const baseURL = ConfigConstants.getURL();
        const username = stripAfterAt(team.email)
        return `${baseURL}/user/login-qr?username=${encodeURIComponent(username)}&password=${encodeURIComponent(team.password)}`;


    }

    function generateQrUrl(team: Team): string {
        const url = generateLoginUrl(team)
        return `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(url)}`;
    }

    function stripAfterAt(email: string): string {
        return email.split('@')[0];
    }

    if (browser) {
        loadTeams();
    }
</script>

<style>
    @media print {
        body {
            background: white;
            color: black;
            margin: 0;
        }

        .columns {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            page-break-inside: avoid;
        }

        .column.is-half {
            width: 48%; /* instead of Bulma’s default 50% */
            margin-bottom: 2rem;
        }

        .qr-box {
            padding: 1.5rem;
            border: 1px solid #ccc;
            border-radius: 0.5rem;
            box-shadow: none;
            page-break-inside: avoid;
        }

        .qr-box img {
            max-width: 60%;
            width: 60%;
            height: auto;
        }

        .title.is-4 {
            font-size: 1.2rem;
        }

        p {
            font-size: 0.9rem;
        }

        .no-print {
            display: none !important;
        }
    }

    .qr-box {
        background: white;
        border: 1px solid #ddd;
        padding: 2rem;
        margin-bottom: 3rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        text-align: center;
    }

    .qr-box h2 {
        margin-bottom: 1rem;
    }

    .qr-box p {
        margin: 0.25rem 0;
        font-size: 1rem;
        word-break: break-word;
    }

    .qr-box img {
        margin-top: 1rem;
        width: 100%;
        max-width: 18rem;
        height: auto;
    }
</style>

<section class="section">
    <div class="no-print mb-4">
        <a href="/admin" class="button is-light">
            ← Back to dashboard
        </a>
    </div>
    <div class="box has-background-info has-text-white mb-6">
        <div class="columns is-vcentered is-variable is-6">
            <div class="column">
                <h2 class="title is-4 has-text-white">{catalog.screens.printTeamsLogin.headlineInfo}</h2>

                <p class="is-size-5 mb-3">{catalog.screens.printTeamsLogin.beforeScanning}</p>
                <p class="is-size-5 mb-3">{catalog.screens.printTeamsLogin.timeWarning}</p>
                <p class="is-size-5 mb-3">{catalog.screens.printTeamsLogin.gameRisk}</p>
                <p class="is-size-5 mb-3">{catalog.screens.printTeamsLogin.qrExplanation}</p>
                <p class="is-size-5 mb-3">{catalog.screens.printTeamsLogin.fallbackInfo}</p>
                <p class="is-size-5 mb-3">{catalog.screens.printTeamsLogin.qrSecurity}</p>
                <p class="is-size-5 mb-3">{catalog.screens.printTeamsLogin.autoLoginWarning}</p>
            </div>

            <div class="column is-narrow has-text-centered">
                <figure class="image" style="margin: 0 auto;">
                    <img
                            src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https%3A%2F%2Fgoogle.com"
                            alt="Check time QR code"
                    />
                </figure>
                <p class="is-size-7 mt-2 has-text-white">Tjek tid QR</p>
            </div>
        </div>
    </div>
    <h1 class="title is-3 has-text-centered mb-6">Team Login QR Codes</h1>
    {#if Object.keys(teams).length > 0}
        <div class="columns is-multiline">
            {#each Object.entries(teams) as [teamId, team] (teamId)}
                <div class="column is-half">
                    <div class="qr-box">
                        <h2 class="title is-4">{team.username}</h2>
                        <p><strong>Username:</strong> {stripAfterAt(team.email)}</p>
                        <p><strong>Password:</strong> {team.password}</p>
                        <img src={generateQrUrl(team)} alt="QR Code for {team.username}"/>
                        <p class="no-print is-size-7">
                            {generateLoginUrl(team)}
                        </p>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <p class="has-text-centered">Loading teams...</p>
    {/if}
</section>