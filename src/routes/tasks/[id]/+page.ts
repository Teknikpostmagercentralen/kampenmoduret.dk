import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */

export function load(request: {params: {id: string} }) {
    return{
        taskID: request.params.id
    }
}