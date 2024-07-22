import type { CompletedTaskInTeams } from "./completed-task-in-teams";
import type { TaskMarker } from "./task";

export interface Team {
    username: string,
    email: string,
    lastCompletedTask? : TaskMarker
    completedTasks?: {[taskId:string]:CompletedTaskInTeams}
}
export interface TeamCreationData extends Team {
    password: string,
}