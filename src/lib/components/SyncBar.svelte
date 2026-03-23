<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { healthCheck, BASE_URL } from '$lib/api/client';
	import { auth } from '$lib/stores/auth.svelte';
	import { propertiesStore } from '$lib/stores/properties.svelte';

	type HealthStatus = 'checking' | 'online' | 'offline';

	let health = $state<HealthStatus>('checking');
	let lastChecked = $state<string>('');
	let interval: ReturnType<typeof setInterval>;

	async function check() {
		health = 'checking';
		const ok = await healthCheck();
		health = ok ? 'online' : 'offline';
		lastChecked = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}

	onMount(() => {
		check();
		interval = setInterval(check, 30_000);
	});

	onDestroy(() => {
		clearInterval(interval);
	});

	const healthLabel: Record<HealthStatus, string> = {
		checking: 'Verificando...',
		online: 'API online',
		offline: 'API sin conexión'
	};

	const dotClass: Record<HealthStatus, string> = {
		checking: 'bg-[var(--color-amber-mid)] animate-pulse',
		online: 'bg-[#639922]',
		offline: 'bg-[var(--color-red)]'
	};

	const syncDotClass: Record<string, string> = {
		idle: 'bg-[var(--color-ink3)]',
		loading: 'bg-[var(--color-amber-mid)] animate-pulse',
		ok: 'bg-[#639922]',
		error: 'bg-[var(--color-red)]'
	};
</script>

<div class="flex items-center justify-between mb-5 flex-wrap gap-2">
	<div class="flex items-center gap-4 flex-wrap">
		<!-- Semáforo API -->
		<div class="flex items-center gap-2 text-[12px] text-[var(--color-ink3)] font-mono">
			<span class="w-[8px] h-[8px] rounded-full flex-shrink-0 transition-colors {dotClass[health]}"></span>
			<span class="{health === 'offline' ? 'text-[var(--color-red)]' : ''}">{healthLabel[health]}</span>
			{#if lastChecked}
				<span class="text-[var(--color-border2)]">·</span>
				<span class="text-[10px]">última vez {lastChecked}</span>
			{/if}
			<button
				onclick={check}
				title="Verificar ahora"
				class="text-[var(--color-ink3)] hover:text-[var(--color-ink)] transition-colors bg-none border-none cursor-pointer p-0 leading-none text-[11px]"
			>
				↺
			</button>
		</div>

		<!-- Sync datos — solo mostrar si hay error o está cargando -->
		{#if propertiesStore.syncStatus === 'loading' || propertiesStore.syncStatus === 'error'}
			<div class="flex items-center gap-1.5 text-[12px] text-[var(--color-ink3)] font-mono">
				<span class="w-[6px] h-[6px] rounded-full flex-shrink-0 {syncDotClass[propertiesStore.syncStatus]}"></span>
				<span>{propertiesStore.syncMessage}</span>
			</div>
		{/if}
	</div>

	<!-- Usuario + base URL + logout -->
	<div class="flex items-center gap-2.5 text-[12px] text-[var(--color-ink3)] font-mono flex-wrap">
		<span>{auth.user?.username}</span>
		<span class="text-[var(--color-border2)]">·</span>
		<button
			onclick={() => auth.logout()}
			class="bg-none border-none text-[12px] text-[var(--color-ink3)] cursor-pointer font-mono underline underline-offset-2 hover:text-[var(--color-red)] transition-colors"
		>
			Salir
		</button>
	</div>
</div>
