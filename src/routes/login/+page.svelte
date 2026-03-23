<script lang="ts">
	import { goto } from '$app/navigation';
	import * as api from '$lib/api/client';
	import { auth } from '$lib/stores/auth.svelte';

	type Step = 'credentials' | 'totp';

	let step = $state<Step>('credentials');
	let username = $state('');
	let password = $state('');
	let totpCode = $state('');
	let partialToken = $state('');
	let error = $state('');
	let loading = $state(false);

	$effect(() => {
		if (auth.isAuthenticated) goto('/');
	});

	async function handleLogin() {
		error = '';
		loading = true;
		try {
			const res = await api.login(username.trim(), password);
			partialToken = res.partial_token;
			step = 'totp';
			totpCode = '';
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Error al iniciar sesión';
		} finally {
			loading = false;
		}
	}

	async function handleTotp() {
		error = '';
		loading = true;
		try {
			const res = await api.verifyTotp(partialToken, totpCode.trim());
			auth.setUser({ ...res.user, token: res.token });
			goto('/');
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Código incorrecto';
		} finally {
			loading = false;
		}
	}

	function backToCredentials() {
		step = 'credentials';
		password = '';
		totpCode = '';
		partialToken = '';
		error = '';
	}
</script>

<div class="min-h-screen flex items-center justify-center p-5 bg-[var(--color-bg)]">
	<div class="w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[10px] p-9">
		<div class="mb-7">
			<div class="text-xl font-medium tracking-tight text-[var(--color-ink)]">Portfolio CRE</div>
			<div class="text-[13px] text-[var(--color-ink3)] font-mono mt-1">cosua real estate</div>
		</div>

		{#if step === 'credentials'}
			<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }}>
				<div class="flex flex-col gap-1 mb-3.5">
					<label for="l-user" class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">
						Usuario
					</label>
					<input
						id="l-user"
						bind:value={username}
						autocomplete="username"
						class="w-full border border-[var(--color-border)] rounded-[6px] px-2.5 py-2 text-[13px] text-[var(--color-ink)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-border2)] transition-colors"
					/>
				</div>
				<div class="flex flex-col gap-1 mb-5">
					<label for="l-pass" class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">
						Contraseña
					</label>
					<input
						id="l-pass"
						type="password"
						bind:value={password}
						autocomplete="current-password"
						class="w-full border border-[var(--color-border)] rounded-[6px] px-2.5 py-2 text-[13px] text-[var(--color-ink)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-border2)] transition-colors"
					/>
				</div>
				{#if error}
					<p class="text-[13px] text-[var(--color-red)] mb-3">{error}</p>
				{/if}
				<button
					type="submit"
					disabled={loading}
					class="w-full bg-[var(--color-ink)] text-[var(--color-bg)] border-none rounded-[6px] py-2.5 text-[14px] font-medium cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
				>
					{loading ? 'Verificando...' : 'Ingresar'}
				</button>
			</form>
		{:else}
			<form onsubmit={(e) => { e.preventDefault(); handleTotp(); }}>
				<p class="text-[12px] text-[var(--color-ink2)] leading-relaxed mb-4">
					Ingresá el código de 6 dígitos de tu app de autenticación (Google Authenticator, Authy, etc.)
				</p>
				<div class="flex flex-col gap-1 mb-5">
					<label for="l-totp" class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">
						Código TOTP
					</label>
					<input
						id="l-totp"
						bind:value={totpCode}
						maxlength={6}
						inputmode="numeric"
						autocomplete="one-time-code"
						placeholder="000000"
						class="w-full border border-[var(--color-border)] rounded-[6px] px-2.5 py-2 text-[13px] text-[var(--color-ink)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-border2)] transition-colors font-mono tracking-widest text-center text-lg"
					/>
				</div>
				{#if error}
					<p class="text-[13px] text-[var(--color-red)] mb-3">{error}</p>
				{/if}
				<button
					type="submit"
					disabled={loading}
					class="w-full bg-[var(--color-ink)] text-[var(--color-bg)] border-none rounded-[6px] py-2.5 text-[14px] font-medium cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 mb-3"
				>
					{loading ? 'Verificando...' : 'Confirmar'}
				</button>
				<button
					type="button"
					onclick={backToCredentials}
					class="bg-none border-none text-[13px] text-[var(--color-ink3)] cursor-pointer underline underline-offset-2 hover:text-[var(--color-ink)] transition-colors"
				>
					Volver al inicio
				</button>
			</form>
		{/if}
	</div>
</div>
