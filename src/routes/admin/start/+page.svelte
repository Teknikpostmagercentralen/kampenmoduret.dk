<script lang="ts">
    import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
</script>

<main>
    <button
            on:click={async () => {
                  await FirebaseConnection.getInstance().then(async (instance)=>{
                    await instance.startGame()
        });
		}}>START game
    </button>
    <button
            on:click={async () => {
                      await FirebaseConnection.getInstance().then(async (instance)=>{
                    await instance.stopGame()
        });
		}}>STOP game
    </button>
    <button
            on:click={async () => {
                      await FirebaseConnection.getInstance().then(async (instance)=>{
                      //await instance.stopGame()
                      await instance.resetAllTeams()
        });
		}}>RESET game
    </button>
</main>