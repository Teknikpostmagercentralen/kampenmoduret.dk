<script>
    let colors = ["#ff7e5f", "#feb47b", "#86A8E7", "#D16BA5"];
</script>
<style>
    /* Gradient background */
    main {
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #ff7e5f, #feb47b, #86A8E7, #D16BA5);
        background-size: 200% 200%;
        animation: gradientBG 5s ease infinite;
        padding: 20px;
    }

    /* Animating background colors */
    @keyframes gradientBG {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    /* Styling for the text container */
    .text-container {
        text-align: center;
        font-family: 'Roboto', sans-serif;
        margin-bottom: 20px; /* Added margin to avoid overlap with button */
    }

    /* Animated text styles */
    h1 {
        font-size: 5rem;
        font-weight: bold;
        color: white;
        display: inline-block;
    }

    .spinning {
        animation: spin 3s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .pulse {
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }

    .jump {
        animation: jump 1.5s ease-in-out infinite;
    }

    @keyframes jump {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
    }

    .fade {
        animation: fadeIn 3s ease-in-out infinite;
    }

    @keyframes fadeIn {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
    }

    /* Wild button */
    .wild-button {
        padding: 20px 40px;
        background-color: #FFFFFF;
        color: #A3333D;
        font-size: 2rem;
        border: 2px solid white;
        border-radius: 10px;
        cursor: pointer;
        animation: buttonDance 3s ease-in-out infinite;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        margin-top: 20px; /* Add margin to ensure it's not too close to the text */
    }

    .wild-button:hover {
        transform: scale(1.1) rotate(15deg);
        box-shadow: 0px 0px 20px #fff;
    }

    @keyframes buttonDance {
        0% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-10px) rotate(-5deg); }
        50% { transform: translateY(0) rotate(5deg); }
        75% { transform: translateY(10px) rotate(-10deg); }
        100% { transform: translateY(0) rotate(0deg); }
    }
</style>

<main>
    <div class="text-container">
        <h1 class="spinning">Welcome</h1>
        <h1 class="pulse">To</h1>
        <h1 class="jump">the Countdown</h1>
        <h1 class="fade">Run</h1>
    </div>

    <!-- Wild animated button -->
    <button class="wild-button" on:click={() => window.location.href='user/login'}>
        Go to Login
    </button>
</main>