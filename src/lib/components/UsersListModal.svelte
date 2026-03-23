<script lang="ts">
	import { onMount } from 'svelte';
	import { getUsers, updateUserRole, deleteUser, type UserListItem } from '$lib/api/client';
	import { auth } from '$lib/stores/auth.svelte';

	let { onClose, onCreateUser }: {
		onClose: () => void;
		onCreateUser: () => void;
	} = $props();

	type RoleOption = 'admin' | 'operator' | 'viewer';

	let users = $state<UserListItem[]>([]);
	let loading = $state(true);
	let error = $state('');
	let savingId = $state<string | null>(null);
	let deletingId = $state<string | null>(null);
	let confirmDeleteId = $state<string | null>(null);

	const ROLE_COLORS: Record<RoleOption, string> = {
		admin: 'var(--color-blue)',
		operator: 'var(--color-amber)',
		viewer: 'var(--color-ink3)'
	};

	async function load() {
		if (!auth.token) return;
		loading = true;
		error = '';
		try {
			users = await getUsers(auth.token);
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Error al cargar usuarios';
		} finally {
			loading = false;
		}
	}

	async function handleRoleChange(user: UserListItem, newRole: RoleOption) {
		if (!auth.token || newRole === user.role) return;
		savingId = user.id;
		try {
			const updated = await updateUserRole(auth.token, user.id, newRole);
			users = users.map((u) => (u.id === updated.id ? updated : u));
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Error al actualizar rol';
		} finally {
			savingId = null;
		}
	}

	async function handleDelete(id: string) {
		if (!auth.token) return;
		deletingId = id;
		try {
			await deleteUser(auth.token, id);
			users = users.filter((u) => u.id !== id);
			confirmDeleteId = null;
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Error al eliminar usuario';
		} finally {
			deletingId = null;
		}
	}

	function fmtDate(s: string): string {
		try {
			const d = new Date(s);
			return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
		} catch {
			return s;
		}
	}

	onMount(() => { load(); });
</script>

<div
	class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
	role="dialog"
	aria-modal="true"
>
	<div
		onclick={(e) => e.stopPropagation()}
		class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[10px] w-full max-w-2xl shadow-xl flex flex-col"
		style="max-height: 85vh"
	>
		<!-- Header -->
		<div class="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between flex-shrink-0">
			<h2 class="text-[16px] font-medium">Gestión de usuarios</h2>
			<div class="flex items-center gap-2">
				<button
					onclick={onCreateUser}
					class="bg-[var(--color-ink)] text-[var(--color-bg)] border-none rounded-[6px] px-3 py-1.5 text-[12px] font-medium cursor-pointer hover:opacity-80 transition-opacity"
				>
					+ Nuevo usuario
				</button>
				<button
					onclick={onClose}
					class="text-[var(--color-ink3)] hover:text-[var(--color-ink)] bg-none border-none cursor-pointer text-xl leading-none ml-1"
				>×</button>
			</div>
		</div>

		<!-- Body -->
		<div class="overflow-y-auto flex-1 p-6">
			{#if loading}
				<p class="text-[13px] text-[var(--color-ink3)] text-center py-8">Cargando usuarios...</p>

			{:else if error}
				<div class="border border-[var(--color-red)] rounded-[8px] px-4 py-3 mb-4">
					<p class="text-[13px] text-[var(--color-red)]">{error}</p>
				</div>
				<div class="flex justify-center">
					<button
						onclick={load}
						class="border border-[var(--color-border2)] text-[var(--color-ink2)] rounded-[6px] px-4 py-2 text-[13px] cursor-pointer hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition-colors"
					>
						Reintentar
					</button>
				</div>

			{:else if users.length === 0}
				<p class="text-[13px] text-[var(--color-ink3)] text-center py-8">No hay usuarios registrados.</p>

			{:else}
				<div class="flex flex-col gap-2">
					{#each users as user (user.id)}
						{@const isCurrentUser = auth.user?.id === user.id}
						{@const isSaving = savingId === user.id}
						{@const confirmingDelete = confirmDeleteId === user.id}

						<div
							class="flex items-center gap-3 px-4 py-3 rounded-[8px] border"
							style="background: var(--color-surface2); border-color: var(--color-border)"
						>
							<!-- Avatar -->
							<div
								class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-medium text-[13px]"
								style="background: var(--color-border2); color: var(--color-ink2)"
							>
								{user.username.charAt(0).toUpperCase()}
							</div>

							<!-- Info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-[14px] font-medium truncate">{user.username}</span>
									{#if isCurrentUser}
										<span class="text-[10px] text-[var(--color-ink3)] font-mono">(vos)</span>
									{/if}
								</div>
								<div class="text-[11px] text-[var(--color-ink3)] font-mono mt-0.5">
									Desde {fmtDate(user.created_at)}
								</div>
							</div>

							<!-- Role selector -->
							<div class="flex items-center gap-2 flex-shrink-0">
								<div class="relative">
									<select
										value={user.role}
										onchange={(e) => handleRoleChange(user, (e.currentTarget as HTMLSelectElement).value as RoleOption)}
										disabled={isSaving || isCurrentUser}
										class="appearance-none border rounded-[6px] px-3 py-1.5 text-[12px] font-mono cursor-pointer pr-6 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										style="background: var(--color-surface); border-color: var(--color-border2); color: {ROLE_COLORS[user.role as RoleOption]}; font-weight: 500"
									>
										<option value="viewer">Viewer</option>
										<option value="operator">Operator</option>
										<option value="admin">Admin</option>
									</select>
									<span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-ink3)]">▾</span>
								</div>
								{#if isSaving}
									<span class="text-[11px] text-[var(--color-ink3)] font-mono">guardando...</span>
								{/if}
							</div>

							<!-- Delete -->
							{#if !isCurrentUser}
								{#if confirmingDelete}
									<div class="flex items-center gap-1.5 flex-shrink-0">
										<span class="text-[11px] text-[var(--color-ink3)]">¿Confirmar?</span>
										<button
											onclick={() => handleDelete(user.id)}
											disabled={deletingId === user.id}
											class="border border-[var(--color-red)] text-[var(--color-red)] rounded-[6px] px-2 py-1 text-[11px] cursor-pointer hover:bg-[var(--color-red)] hover:text-white transition-colors disabled:opacity-50"
										>
											{deletingId === user.id ? '...' : 'Sí'}
										</button>
										<button
											onclick={() => { confirmDeleteId = null; }}
											class="border border-[var(--color-border2)] text-[var(--color-ink3)] rounded-[6px] px-2 py-1 text-[11px] cursor-pointer hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition-colors"
										>
											No
										</button>
									</div>
								{:else}
									<button
										onclick={() => { confirmDeleteId = user.id; }}
										class="flex-shrink-0 w-7 h-7 flex items-center justify-center border border-[var(--color-border2)] text-[var(--color-ink3)] rounded-[6px] cursor-pointer hover:border-[var(--color-red)] hover:text-[var(--color-red)] transition-colors text-[13px]"
										title="Eliminar usuario"
									>
										✕
									</button>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
