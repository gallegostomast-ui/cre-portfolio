<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	let { children } = $props();

	const PUBLIC_ROUTES = ['/login'];

	$effect(() => {
		const path = $page.url.pathname;
		const isPublic = PUBLIC_ROUTES.some((r) => path.startsWith(r));
		if (!isPublic && !auth.isAuthenticated) {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>Portfolio CRE</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600&family=DM+Mono:wght@400;500&family=JetBrains+Mono:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{@render children()}
