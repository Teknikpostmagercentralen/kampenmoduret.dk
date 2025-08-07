// src/lib/stores/teamDataForAdmin.ts
import { writable } from 'svelte/store';
import type { Team } from '$lib/models/team';

export const teamDataForAdmin = writable<Record<string, Team>>({});