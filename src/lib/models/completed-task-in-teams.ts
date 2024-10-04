import type { TaskMarker } from "./task"

export interface CompletedTaskInTeams {
    baseTime: number,
    multiplier: number
    timeEarned: number,
    taskMarker: TaskMarker
}