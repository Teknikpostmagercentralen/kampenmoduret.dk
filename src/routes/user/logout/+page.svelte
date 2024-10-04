<script>
	import { FirebaseConnection } from '$lib/firebase/firebaseconnection';
	import { browser } from '$app/environment';
	import { resetUserState, userState } from '../../../stores/userstate';
	import { goto } from '$app/navigation';

	if (browser) {
		logout();
	}

	async function logout() {
		await FirebaseConnection.getInstance().then(async (instance) => {
			await instance.logout();
			await resetUserState();
			await goto('/');
            //Just for good measure
            localStorage.clear();
            sessionStorage.clear();
		});
	}
</script>
