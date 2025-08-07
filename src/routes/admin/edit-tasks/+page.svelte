<script lang="ts">
    import { onMount } from 'svelte';
    import { FirebaseConnection } from '../../../lib/firebase/firebaseconnection';
    import type { Task } from '$lib/models/task';
    import { writable } from 'svelte/store';
    import {goto} from "$app/navigation";

    let tasks: { [taskId: string]: Task } = {};
    let gameId: string;
    let selectedTaskId: string = '';
    let deletingTaskId: string = '';
    let showModal = false;

    let toastMessage: string = '';
    let toastType: 'success' | 'error' | '' = '';
    let baseTime = writable(0);
    let deletingAll = false;

    onMount(async () => {
        const instance = await FirebaseConnection.getInstance();
        await instance.onUserReady(async () => {
            const admin = await instance.getAdmin();
            gameId = Object.keys(admin.games)[0];
            tasks = await instance.getAllTasksInGame(gameId); // <-- DU SKAL IMPLEMENTERE DENNE
        });
    });

    function openEditModal(taskId: string) {
        selectedTaskId = taskId;
        baseTime.set(tasks[taskId].baseTime ?? 0);
        showModal = true;
    }

    async function saveChanges() {
        if (!(selectedTaskId && gameId)) return;

        const newBaseTime = $baseTime;

        // Tjek at baseTime er gyldigt
        if (newBaseTime === null || newBaseTime === undefined || isNaN(newBaseTime) || newBaseTime < 0) {
            showToast('Please enter a valid base time', 'error');
            return;
        }

        try {
            const instance = await FirebaseConnection.getInstance();
            await instance.updateTaskBaseTime(selectedTaskId, newBaseTime);
            tasks[selectedTaskId].baseTime = newBaseTime;
            showModal = false;
            showToast('Changes saved');
        } catch (e) {
            showToast('Failed to save changes', 'error');
        }
    }

    async function deleteAllTasks() {
        if (!gameId || Object.keys(tasks).length === 0) return;

        const confirmed = confirm('Are you absolutely sure you want to delete ALL tasks in this game? This action cannot be undone.');
        if (!confirmed) return;

        deletingAll = true;

        try {
            const instance = await FirebaseConnection.getInstance();
            const tasksToDelete = await instance.getAllTasksInGame(gameId);

            for (const taskId of Object.keys(tasksToDelete)) {
                await instance.removeTaskFromGame(gameId, taskId);
                delete tasks[taskId];
            }

            showToast('All tasks deleted', 'success');
        } catch (error) {
            console.error('Failed to delete all tasks', error);
            showToast('Failed to delete all tasks', 'error');
        } finally {
            deletingAll = false;
            location.href = location.pathname;  //force refresh when finished

        }
    }

    async function deleteTask(taskId: string) {
        if (confirm('Are you sure you want to delete this task?')) {
            deletingTaskId = taskId;
            try {
                const instance = await FirebaseConnection.getInstance();
                await instance.removeTaskFromGame(gameId, taskId); // <-- DU SKAL IMPLEMENTERE DENNE
                delete tasks[taskId];
                showToast('Task deleted successfully');
            } catch (error) {
                console.error(error);
                showToast('Failed to delete task');
            } finally {
                deletingTaskId = null;
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
        <a href="/admin" class="button is-light">← Back to dashboard</a>
    </div>
    <h1 class="title is-3">Manage Tasks</h1>

    <div class="box" style="overflow-x: auto">
        {#if Object.keys(tasks).length === 0}
            <div class="empty-box">
                <div class="empty-state">
                    <span class="icon is-large mb-3"><i class="fas fa-tasks fa-2x has-text-grey-light"></i></span>
                    <p class="has-text-grey-light is-size-5">No tasks found in this game yet.</p>
                </div>
            </div>
        {:else}
            <table class="table is-fullwidth is-striped is-hoverable">
                <thead>
                <tr>
                    <th>Marker</th>
                    <th>Number</th>
                    <th>Base Time (s)</th>
                    <th class="has-text-right">Actions</th>
                </tr>
                </thead>
                <tbody>
                {#each Object.entries(tasks) as [taskId, task] (taskId)}
                    <tr>
                        <td>{task.taskMarker?.letter ?? '-'}</td>
                        <td>{task.taskMarker?.number ?? '-'}</td>
                        <td>{task.baseTime ?? '-'}</td>
                        <td class="has-text-right">
                            <button class="button is-small is-light mr-2" on:click={() => openEditModal(taskId)}>
                                <span class="icon"><i class="fas fa-edit"></i></span>
                            </button>
                            <button
                                    class="button is-small is-danger"
                                    on:click={() => deleteTask(taskId)}
                                    disabled={deletingTaskId === taskId}>
                                {#if deletingTaskId === taskId}
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
            Deleting all tasks cannot be undone. Make sure you really want to remove all task data from this game.
        </p>
        <button class="button is-danger" on:click={deleteAllTasks} disabled={deletingAll || Object.keys(tasks).length === 0}>
            {#if deletingAll}
                <span class="icon"><i class="fas fa-spinner fa-spin"></i></span>
                <span>Deleting…</span>
            {:else}
                <span class="icon"><i class="fas fa-trash-alt"></i></span>
                <span>Delete all tasks</span>
            {/if}
        </button>
    </div>
</section>

{#if showModal && selectedTaskId}
    <div class="modal is-active">
        <div class="modal-background" on:click={() => (showModal = false)}></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Edit Task</p>
                <button class="delete" aria-label="close" on:click={() => (showModal = false)}></button>
            </header>
            <section class="modal-card-body">
                <div class="field">
                    <label class="label">Base time (seconds)</label>
                    <div class="control">
                        <input class="input" type="number" bind:value={$baseTime} min="0" />
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
</style>