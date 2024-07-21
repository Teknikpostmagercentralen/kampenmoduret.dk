<script lang="ts">
    import {userState} from "../../stores/userstate";
    import {goto} from "$app/navigation";
    import {browser} from "$app/environment";
    import {FirebaseConnection} from "../../lib/firebase/firebaseconnection";


    if (browser) {
        if (!$userState.loggedIn) {
            goto("/user/login")
        }
    }

</script>

<main>
    <h1>THis is the {$userState.loggedIn}</h1>
</main>