<script lang="ts">
	import { createUser, type CreateUserResponse } from '$lib/api/client';
	import { auth } from '$lib/stores/auth.svelte';
	import type { UserRole } from '$lib/types';

	let { onClose }: { onClose: () => void } = $props();

	type Step = 'form' | 'qr';

	let step = $state<Step>('form');
	let username = $state('');
	let password = $state('');
	let role = $state<UserRole>('viewer');
	let error = $state('');
	let loading = $state(false);
	let created = $state<CreateUserResponse | null>(null);

	let showPassword = $state(false);
	let copied = $state(false);

	function qrUrl(otpauthUrl: string): string {
		return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauthUrl)}`;
	}

	async function handleSubmit() {
		if (!auth.token) return;
		if (!username.trim() || !password.trim()) {
			error = 'Usuario y contraseña son obligatorios.';
			return;
		}
		error = '';
		loading = true;
		try {
			const res = await createUser(auth.token, {
				username: username.trim(),
				password,
				role
			});
			created = res;
			step = 'qr';
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Error al crear usuario';
		} finally {
			loading = false;
		}
	}

	async function copySecret() {
		if (!created) return;
		await navigator.clipboard.writeText(created.totp_secret_base32);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}
</script>

<div
	class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
	role="dialog"
	aria-modal="true"
>
	<div
		onclick={(e) => e.stopPropagation()}
		class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[10px] w-full max-w-md shadow-xl"
	>
		<div class="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between">
			<h2 class="text-[16px] font-medium">
				{step === 'form' ? 'Crear usuario' : 'Configurar autenticador'}
			</h2>
			<button
				onclick={onClose}
				class="text-[var(--color-ink3)] hover:text-[var(--color-ink)] bg-none border-none cursor-pointer text-xl leading-none"
			>×</button>
		</div>

		{#if step === 'form'}
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="p-6">
				<div class="flex flex-col gap-3.5">
					<div class="flex flex-col gap-1">
						<label for="u-username" class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">
							Usuario
						</label>
						<input
							id="u-username"
							bind:value={username}
							autocomplete="off"
							placeholder="nombre_usuario"
							class="input-field"
						/>
					</div>

					<div class="flex flex-col gap-1">
						<label for="u-password" class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">
							Contraseña
						</label>
						<div class="relative">
							<input
								id="u-password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								autocomplete="new-password"
								placeholder="Mínimo 8 caracteres"
								class="input-field pr-10"
							/>
							<button
								type="button"
								onclick={() => { showPassword = !showPassword; }}
								class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink3)] hover:text-[var(--color-ink)] bg-none border-none cursor-pointer text-[12px] font-mono"
							>
								{showPassword ? 'ocultar' : 'ver'}
							</button>
						</div>
					</div>

					<div class="flex flex-col gap-1">
						<label for="u-role" class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">
							Rol
						</label>
						<select id="u-role" bind:value={role} class="input-field">
							<option value="viewer">Viewer — solo lectura</option>
							<option value="operator">Operator — editar propiedades y gastos</option>
							<option value="admin">Admin — acceso completo</option>
						</select>
					</div>
				</div>

				{#if error}
					<p class="text-[13px] text-[var(--color-red)] mt-3">{error}</p>
				{/if}

				<div class="flex gap-2 justify-end mt-5">
					<button
						type="button"
						onclick={onClose}
						class="bg-transparent border border-[var(--color-border2)] text-[var(--color-ink2)] rounded-[6px] px-4 py-2 text-[13px] cursor-pointer hover:text-[var(--color-ink)] hover:border-[var(--color-ink)] transition-colors"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={loading}
						class="bg-[var(--color-ink)] text-[var(--color-bg)] border-none rounded-[6px] px-4 py-2 text-[13px] font-medium cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
					>
						{loading ? 'Creando...' : 'Crear usuario'}
					</button>
				</div>
			</form>

		{:else if step === 'qr' && created}
			<div class="p-6">
				<p class="text-[13px] text-[var(--color-ink2)] mb-5 leading-relaxed">
					El usuario <strong>{created.username}</strong> fue creado con rol <strong>{created.role}</strong>.
					Escaneá el QR con Google Authenticator o Authy para activar el segundo factor.
				</p>

				<!-- QR -->
				<div class="flex flex-col items-center gap-3 mb-5">
					<div class="p-3 border border-[var(--color-border)] rounded-[10px] bg-white inline-block">
						<img
							src={qrUrl(created.otpauth_url)}
							alt="QR TOTP"
							width="220"
							height="220"
							class="block"
						/>
					</div>
					<p class="text-[12px] text-[var(--color-ink3)] text-center">
						Escaneá con Google Authenticator / Authy
					</p>
				</div>

				<!-- Secret manual -->
				<div class="mb-5">
					<div class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono mb-1.5">
						Clave manual (si no podés escanear el QR)
					</div>
					<div class="flex items-center gap-2">
						<code class="flex-1 font-mono text-[13px] bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-[6px] px-3 py-2 tracking-widest text-[var(--color-ink)] select-all">
							{created.totp_secret_base32}
						</code>
						<button
							onclick={copySecret}
							class="flex-shrink-0 border border-[var(--color-border2)] text-[var(--color-ink2)] rounded-[6px] px-3 py-2 text-[12px] cursor-pointer hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition-colors font-mono"
						>
							{copied ? '✓ Copiado' : 'Copiar'}
						</button>
					</div>
				</div>

				<div class="bg-[var(--color-amber-bg)] border border-[var(--color-amber-mid)] rounded-[8px] px-4 py-3 mb-5">
					<p class="text-[12px] text-[var(--color-amber)] leading-relaxed">
						⚠ Esta clave <strong>no se vuelve a mostrar</strong>. Guardala antes de cerrar esta ventana.
					</p>
				</div>

				<div class="flex justify-end">
					<button
						onclick={onClose}
						class="bg-[var(--color-ink)] text-[var(--color-bg)] border-none rounded-[6px] px-4 py-2 text-[13px] font-medium cursor-pointer hover:opacity-80 transition-opacity"
					>
						Listo, cerrar
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
