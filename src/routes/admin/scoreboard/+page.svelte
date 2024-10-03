<script lang="ts">
    import type {TeamWithTime} from "$lib/models/team";
    import {FirebaseConnection} from "../../../lib/firebase/firebaseconnection";
    import { browser } from '$app/environment';


    let teams: TeamWithTime[]

    // if(browser) {
    //     teams = await FirebaseConnection.getInstance().then(async (instance) => {
    //         return await instance.getAllTeams()
    //     })
    // }
    //
    teams = [
        { username: 'Team Alpha', bonusTime: 100, email: "hallo@hellohej.dk", completedTasks: {}, lastCompletedTask: {}, participants: 3, secondsLeft: 1000},
        { username: 'Team Beta', bonusTime: 100, email: "hallo@hellohej.dk", completedTasks: {}, lastCompletedTask: {}, participants: 3, secondsLeft: 1000},
        { username: 'Team Gamma', bonusTime: 100, email: "hallo@hellohej.dk", completedTasks: {}, lastCompletedTask: {}, participants: 3, secondsLeft: 1000},
        { username: 'Team Zeta', bonusTime: 100, email: "hallo@hellohej.dk", completedTasks: {}, lastCompletedTask: {}, participants: 3, secondsLeft: 1000},
    ];

</script>

<table class="table is-striped is-hoverable is-fullwidth">
    <thead>
    <tr>
        <th>Name</th>
        <th>Time Left</th>
        <th>Nr Participants</th>
        <th>Last Task</th>
    </tr>
    </thead>
    <tbody>
    {#each teams as team}
        <tr>
            <td>{team.username}</td>
            <td>{team.timeline}</td>
            <td>{team.participants}</td>
            <td>{team.lastCompletedTask.letter} {team.lastCompletedTask.number}</td>
        </tr>
    {/each}
    </tbody>
</table>