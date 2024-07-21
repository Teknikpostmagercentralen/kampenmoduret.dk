<script>
  import {FirebaseConnection} from "$lib/firebase/firebaseconnection";
  import {goto} from "$app/navigation";

  /** @type {import('./$types').PageData} */
  export let data;

  FirebaseConnection.writeTaskCompleted(data.taskID).then(() => {
    goto("/game")
  })

</script>

<h1>{data.taskID}</h1>