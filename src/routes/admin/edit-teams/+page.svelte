<script lang="ts">
    import { onMount } from 'svelte';
    import { FirebaseConnection } from '../../../lib/firebase/firebaseconnection';
    import type { Team } from '$lib/models/team';
    import { writable } from 'svelte/store';
    import {catalog} from "$lib/language/index.js";

    let teams: { [teamId: string]: Team } = {};
    let gameId: string;
    let selectedTeamId: string = ''
    let deletingTeamId: string = ''
    let showModal = false;

    let toastMessage: string = ''
    let toastType: 'success' | 'error' | '' = ''
    let participants = writable(0);
    let bonusTime = writable(0);
    let deletingAllTeams = false;

    onMount(async () => {
        const instance = await FirebaseConnection.getInstance();
        await instance.onUserReady(async () => {
            const admin = await instance.getAdmin();
            gameId = Object.keys(admin.games)[0];
            teams = await instance.getAllTeamsInGame(gameId);
        });
    });

    function openEditModal(teamId: string) {
        selectedTeamId = teamId;
        participants.set(teams[teamId].participants ?? 0);
        bonusTime.set(teams[teamId].bonusTime ?? 0);
        showModal = true;
    }

    async function saveChanges() {
        if (!(selectedTeamId && gameId)) {
            return;
        }
        try {

            const instance = await FirebaseConnection.getInstance();
            const team = teams[selectedTeamId];
            const newParticipants = $participants;
            const newBonusTime = $bonusTime;
            await instance.updateTeamFields(gameId, selectedTeamId, {
                participants: newParticipants,
                bonusTime: newBonusTime
            });
            teams[selectedTeamId].participants = newParticipants;
            teams[selectedTeamId].bonusTime = newBonusTime;
            showModal = false;
            showToast('Changes saved');
            showModal = false;
        } catch (e) {
            showToast('Failed to save changes');
        }

    }

    async function deleteAllTeams() {
        if (!gameId || Object.keys(teams).length === 0) return;

        const confirmed = confirm('Are you absolutely sure you want to delete ALL teams in this game? This action cannot be undone.');
        if (!confirmed) return;

        deletingAllTeams = true;
        try {
            const instance = await FirebaseConnection.getInstance();
            const teamsToBeDeleted = await instance.getAllTeamsInGame(gameId);

            for (const teamId of Object.keys(teamsToBeDeleted)) {
                await instance.removeTeamFromGameAndDeleteTeam(gameId, teamId);
            }

            showToast('All teams deleted', 'success');
            location.href = location.pathname; // force reload
        } catch (error) {
            console.error('Failed to delete all teams', error);
            showToast('Failed to delete all teams', 'error');
            deletingAllTeams = false;
        }
    }

    async function deleteTeam(teamId: string) {
        if (confirm('Are you sure you want to delete this team?')) {
            deletingTeamId = teamId;
            try {
                const instance = await FirebaseConnection.getInstance();
                await instance.removeTeamFromGameAndDeleteTeam(gameId, teamId);
                delete teams[teamId];
                showToast('Team deleted successfully');
            } catch (error) {
                console.error(error);
                showToast('Failed to delete team');
            } finally {
                deletingTeamId = null;
            }
        }
    }

    function showToast(message: string, type: 'success' | 'error' = 'success', duration = 3000) {
        toastMessage = message;
        toastType = type;

        setTimeout(() => {
            toastMessage = null;
            toastType = null;
        }, duration);
    }
</script>

{#if toastMessage}
    <div class="notification is-info toast">{toastMessage}</div>
{/if}

<section class="section">
    <div class="no-print mb-4">
        <a href="/admin" class="button is-light">
            ← {catalog.general_button_texts.go_back_to_dashboard}
        </a>
    </div>
    <h1 class="title is-3">Manage Teams</h1>
    <div class="box" style="overflow-x: auto">
        {#if Object.keys(teams).length === 0}
            <div class="empty-box">
                <div class="empty-state">
                    <span class="icon is-large mb-3"><i class="fas fa-users-slash fa-2x has-text-grey-light"></i></span>
                    <p class="has-text-grey-light is-size-5">No teams found in this game yet.</p>
                </div>
            </div>
        {:else}
        <table class="table is-fullwidth is-striped is-hoverable">
            <thead>
            <tr>
                <th>Team Name</th>
                <th>Participants</th>
                <th>Bonus Time</th>
                <th class="has-text-right">Actions</th>
            </tr>
            </thead>
            <tbody>

            {#each Object.entries(teams) as [teamId, team] (teamId)}
                <tr>
                    <td>{team.username ?? teamId}</td>
                    <td>{team.participants ?? '-'}</td>
                    <td>{team.bonusTime ?? '-'}</td>
                    <td class="has-text-right">
                        <button class="button is-small is-light mr-2" on:click={() => openEditModal(teamId)}>
                            <span class="icon"><i class="fas fa-edit"></i></span>
                        </button>
                        <button
                                class="button is-small is-danger"
                                on:click={() => deleteTeam(teamId)}
                                disabled={deletingTeamId === teamId}>
                            {#if deletingTeamId === teamId}
                                <span class="icon is-small"><i class="fas fa-spinner fa-spin"></i></span>
                            {:else}
                                <span class="icon"><i class="fas fa-trash"></i></span>
                            {/if}
                        </button>
                    </td>
                </tr>
            {/each}
            </tbody>
        </table>
                {/if}
    </div>
    <div class="box has-background-danger-light">
        <h2 class="title is-5 has-text-danger">Danger zone</h2>
        <p class="mb-4">
            Deleting all teams cannot be undone. Make sure you really want to remove all team data from this game.
        </p>
        <button class="button is-danger" on:click={deleteAllTeams} disabled={Object.keys(teams).length === 0 || deletingAllTeams}>
            {#if deletingAllTeams}
                <span class="icon"><i class="fas fa-spinner fa-spin"></i></span>
                <span>Deleting...</span>
            {:else}
                <span class="icon"><i class="fas fa-trash-alt"></i></span>
                <span>Delete all teams</span>
            {/if}
        </button>
    </div>

</section>

{#if showModal && selectedTeamId}
    <div class="modal is-active">
        <div class="modal-background" on:click={() => (showModal = false)}></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Edit Team</p>
                <button class="delete" aria-label="close" on:click={() => (showModal = false)}></button>
            </header>
            <section class="modal-card-body">
                <div class="field">
                    <label class="label">Number of participants</label>
                    <div class="control">
                        <input class="input" type="number" bind:value={$participants} min="0" />
                    </div>
                </div>
                <div class="field">
                    <label class="label">Bonus time (seconds)</label>
                    <div class="control">
                        <input class="input" type="number" bind:value={$bonusTime} min="0" />
                    </div>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" on:click={saveChanges}>Save changes</button>
                <button class="button" on:click={() => (showModal = false)}>Cancel</button>
            </footer>
        </div>
    </div>
{/if}

<style>
    .modal-card {
        width: 100%;
        max-width: 480px;
    }
    .toast {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        z-index: 1000;
        opacity: 0.95;
    }

    .empty-box {
        min-height: 200px;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 2rem;
    }

    .empty-state {
        text-align: center;
        margin: 2rem;
    }

    .toast {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        z-index: 1000;
        opacity: 0.95;
    }

</style>