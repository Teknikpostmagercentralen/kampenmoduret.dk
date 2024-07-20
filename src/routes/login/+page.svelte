<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let email: string = '';
    let password: string = '';
    let error: string | null = null;

    function handleLogin() {
        // Placeholder login logic - replace with actual login logic
        if (email === 'user@example.com' && password === 'password123') {
            dispatch('login', { email });
            console.log('Login successful');
            error = null;
        } else {
            error = 'Invalid email or password';
        }
    }
</script>

<style>
    .login-container {
        max-width: 400px;
        margin: 0 auto;
        padding: 20px;
    }
</style>

<main>
    <div class="login-container">
        <h1 class="title">Login</h1>
        <div class="field">
            <label class="label" for="email">Email</label>
            <div class="control">
                <input class="input" type="email" id="email" bind:value={email} placeholder="e.g. alex@example.com" />
            </div>
        </div>
        <div class="field">
            <label class="label" for="password">Password</label>
            <div class="control">
                <input class="input" type="password" id="password" bind:value={password} placeholder="********" />
            </div>
        </div>
        {#if error}
            <p class="has-text-danger">{error}</p>
        {/if}
        <div class="field">
            <div class="control">
                <button class="button is-primary" on:click={handleLogin}>Login</button>
            </div>
        </div>
    </div>
</main>