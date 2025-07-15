import type { CompletedTaskInTeams } from "./completed-task-in-teams";
import type { TaskMarker } from "./task";

export interface Team {
    id: string,
    username: string,
    email: string,
    bonusTime: number,
    participants: number,
    gameId: string,
    lastCompletedTask? : TaskMarker,
    completedTasks?: TaskDictionary,
    deathTimestamp? : number
}

export interface TaskDictionary {
    [taskId:string]:CompletedTaskInTeams
}

export interface TeamWithTime extends Team {
    secondsLeft: number,
    allSecondsEarned: number
}


export interface TeamCreationData extends Team {
    password: string,
}