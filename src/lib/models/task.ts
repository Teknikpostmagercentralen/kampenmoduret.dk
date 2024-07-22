export interface Task {
    baseTime: number,
    taskMarker : TaskMarker
}

export type TaskMarker = {
    letter: string,
    number:number
}