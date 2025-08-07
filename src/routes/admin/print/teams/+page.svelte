<script lang="ts">
    import {onMount} from 'svelte';
    import {browser} from '$app/environment';
    import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
    import type {Team} from '$lib/models/team';
    import {ConfigConstants} from '$lib/config/config-constants';
    import {catalog} from "$lib/language/index.js";

    let teams: { [teamId: string]: Team } = {};
    let gameId: string;
    let loading = true;

    async function loadTeams() {
        const instance = await FirebaseConnection.getInstance();
        await instance.onUserReady(async () => {
            const admin = await instance.getAdmin();
            gameId = Object.keys(admin.games)[0];
            teams = await instance.getAllTeamsInGame(gameId);
            loading = false;
        });
    }

    function generateDeviceCheckQRImageURL(): string {
        const url = `${ConfigConstants.getURL()}/device-check`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(url)}`;
    }

    function generateLoginUrl(team: Team): string {
        const baseURL = ConfigConstants.getURL();
        const username = stripAfterAt(team.email)
        return `${baseURL}/user/login-qr?username=${encodeURIComponent(username)}&password=${encodeURIComponent(team.password)}`;


    }

    function generateQrUrl(team: Team): string {
        const url = generateLoginUrl(team)
        return encodeUrlInQRImageLink(url)
    }

    function encodeUrlInQRImageLink(url: string): string {
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
            font-size: 1rem;
        }


        .is-size-5 {
            font-size: 0.6rem !important;
        }

        .is-size-6 {
            font-size: 0.5rem;
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

    .empty-state {
        border: 1px solid #ddd;
        padding: 3rem 2rem;
        border-radius: 8px;
        background-color: #f9f9f9;
        text-align: center;
        max-width: 400px;
        margin: 4rem auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .empty-state .icon {
        margin-bottom: 1rem;
        color: #7a7a7a;
    }
</style>

<section class="section">
    <div class="no-print mb-4">
        <a href="/admin" class="button is-light">
            ← {catalog.general_button_texts.go_back_to_dashboard}
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
                            src={generateDeviceCheckQRImageURL()}
                            alt="Check time QR code"
                    />
                </figure>
                <p class="is-size-7 mt-2 has-text-white">Tjek tid QR</p>
            </div>
        </div>
    </div>
    <h1 class="title is-3 has-text-centered mb-6">Team Login QR Codes</h1>
    {#if loading}
        <p class="has-text-centered">Loading teams...</p>
    {:else if Object.keys(teams).length === 0}
        <div class="empty-state">
		<span class="icon is-large">
			<i class="fas fa-users-slash fa-3x"></i>
		</span>
            <h2 class="title is-5 has-text-grey">Ingen hold fundet</h2>
            <p class="has-text-grey-dark is-size-6 mt-2">
                Du kan oprette hold fra admin-dashboardet.
            </p>
        </div>
    {:else}
        <div class="columns is-multiline">
            {#each Object.entries(teams) as [teamId, team] (teamId)}
                <div class="column is-half">
                    <div class="qr-box">
                        <h2 class="title is-4">{team.username}</h2>

                        <div class="mb-1">
                            <span class="has-text-weight-bold has-text-grey-dark is-size-6 mb-0">Username: </span>
                            <span class="is-size-6">{stripAfterAt(team.email)}</span>
                        </div>

                        <div class="mb-1">
                            <span class="has-text-weight-bold has-text-grey-dark is-size-6 mb-0">Password</span>
                            <span class="is-size-6">{team.password}</span>
                        </div>

                        <img src={generateQrUrl(team)} alt="QR Code for {team.username}"/>

                        <p class="no-print is-size-7 mt-2 has-text-grey">
                            {generateLoginUrl(team)}
                        </p>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</section>