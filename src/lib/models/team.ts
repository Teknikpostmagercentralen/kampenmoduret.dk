import type { CompletedTaskInTeams } from "./completed-task-in-teams";
import type { TaskMarker } from "./task";

export interface Team {
    username: string,
    email: string,
    bonusTime: number,
    participants: number,
    lastCompletedTask? : TaskMarker,
    completedTasks?: {[taskId:string]:CompletedTaskInTeams}
}
export interface TeamCreationData extends Team {
    password: string,
}