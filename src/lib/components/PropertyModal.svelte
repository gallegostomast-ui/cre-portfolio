<script lang="ts">
	import type { Property, PropertyState, UpdatePropertyPayload, CreatePropertyPayload } from '$lib/types';
	import { auth } from '$lib/stores/auth.svelte';
	import { propertiesStore } from '$lib/stores/properties.svelte';
	import { today, STATE_LABELS, toDateInput } from '$lib/utils';

	let {
		property = null,
		onClose,
		onSaved
	}: {
		property?: Property | null;
		onClose: () => void;
		onSaved?: (p: Property) => void;
	} = $props();

	const isEdit = $derived(property !== null);

	let name = $state(property?.name ?? '');
	let direccion = $state(property?.direccion ?? '');
	let propState = $state<PropertyState>(property?.state ?? 'en_compra');
	let purchaseBlanco = $state(String(property?.purchase_blanco_usd ?? ''));
	let purchaseNegro = $state(String(property?.purchase_negro_usd ?? ''));
	let purchaseDate = $state(toDateInput(property?.purchase_date) || today());
	let precioPublicado = $state(String(property?.precio_publicado_usd ?? ''));
	let urlPosteo = $state(property?.url_posteo ?? '');
	let fechaPublicacion = $state(toDateInput(property?.fecha_publicacion));
	let saleBlanco = $state(String(property?.sale_blanco_usd ?? ''));
	let saleNegro = $state(String(property?.sale_negro_usd ?? ''));
	let saleDate = $state(toDateInput(property?.sale_date));

	let error = $state('');
	let loading = $state(false);

	const showPublicacion = $derived(propState === 'disponible_venta' || propState === 'vendida');
	const showVenta = $derived(propState === 'vendida');

	const STATES: PropertyState[] = [
		'en_analisis',
		'en_compra',
		'en_renovacion',
		'disponible_venta',
		'vendida'
	];

	async function handleSubmit() {
		if (!auth.token) return;
		error = '';
		loading = true;
		try {
			const payload: CreatePropertyPayload | UpdatePropertyPayload = {
				name: name || 'Sin nombre',
				direccion: direccion || '',
				state: propState,
				purchase_blanco_usd: parseFloat(purchaseBlanco) || 0,
				purchase_negro_usd: parseFloat(purchaseNegro) || 0,
				purchase_date: purchaseDate || undefined,
				...(showPublicacion && {
					precio_publicado_usd: parseFloat(precioPublicado) || undefined,
					url_posteo: urlPosteo || undefined,
					fecha_publicacion: fechaPublicacion || undefined
				}),
				...(showVenta && {
					sale_blanco_usd: parseFloat(saleBlanco) || 0,
					sale_negro_usd: parseFloat(saleNegro) || 0,
					sale_date: saleDate || today()
				})
			};

			let saved: Property;
			if (isEdit && property) {
				saved = await propertiesStore.editProperty(auth.token, property.id, payload);
			} else {
				saved = await propertiesStore.addProperty(auth.token, payload as CreatePropertyPayload);
			}
			onSaved?.(saved);
			onClose();
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Error al guardar';
		} finally {
			loading = false;
		}
	}
</script>

<!-- Backdrop -->
<div
	class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
	role="dialog"
	aria-modal="true"
>
	<div
		onclick={(e) => e.stopPropagation()}
		class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[10px] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
	>
		<div class="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between">
			<h2 class="text-[16px] font-medium">{isEdit ? 'Editar propiedad' : 'Agregar propiedad'}</h2>
			<button onclick={onClose} class="text-[var(--color-ink3)] hover:text-[var(--color-ink)] bg-none border-none cursor-pointer text-xl leading-none">×</button>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="p-6">
			<div class="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
				<!-- Nombre -->
				<div class="col-span-2 flex flex-col gap-1">
					<label class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">Nombre</label>
					<input bind:value={name} placeholder="Ej: Olleros 2345" class="input-field" />
				</div>

				<!-- Dirección -->
				<div class="col-span-2 flex flex-col gap-1">
					<label class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">Dirección</label>
					<input bind:value={direccion} placeholder="Ej: Olleros 2345, CABA" class="input-field" />
				</div>

				<!-- Estado -->
				<div class="col-span-2 flex flex-col gap-1">
					<label class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">Estado</label>
					<select bind:value={propState} class="input-field">
						{#each STATES as s}
							<option value={s}>{STATE_LABELS[s]}</option>
						{/each}
					</select>
				</div>

				<!-- Compra -->
				<div class="col-span-2 mt-1">
					<div class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono mb-2">Precio de compra</div>
				</div>
				<div class="flex flex-col gap-1">
					<label class="text-[11px] text-[var(--color-ink3)] font-mono">En blanco (USD)</label>
					<input type="number" step="0.01" min="0" bind:value={purchaseBlanco} placeholder="0.00" class="input-field" />
				</div>
				<div class="flex flex-col gap-1">
					<label class="text-[11px] text-[var(--color-ink3)] font-mono">En negro (USD)</label>
					<input type="number" step="0.01" min="0" bind:value={purchaseNegro} placeholder="0.00" class="input-field" />
				</div>
				<div class="flex flex-col gap-1">
					<label class="text-[11px] text-[var(--color-ink3)] font-mono">Fecha de compra</label>
					<input type="date" bind:value={purchaseDate} class="input-field" />
				</div>

				{#if showPublicacion}
					<div class="col-span-2 mt-2">
						<div class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono mb-2">Publicación</div>
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-[11px] text-[var(--color-ink3)] font-mono">Precio publicado (USD)</label>
						<input type="number" step="0.01" min="0" bind:value={precioPublicado} placeholder="0.00" class="input-field" />
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-[11px] text-[var(--color-ink3)] font-mono">Fecha de publicación</label>
						<input type="date" bind:value={fechaPublicacion} class="input-field" />
					</div>
					<div class="col-span-2 flex flex-col gap-1">
						<label class="text-[11px] text-[var(--color-ink3)] font-mono">URL del posteo</label>
						<input type="url" bind:value={urlPosteo} placeholder="https://www.zonaprop.com.ar/..." class="input-field" />
					</div>
				{/if}

				{#if showVenta}
					<div class="col-span-2 mt-2">
						<div class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono mb-2">Datos de venta</div>
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-[11px] text-[var(--color-ink3)] font-mono">Vendido en blanco (USD)</label>
						<input type="number" step="0.01" min="0" bind:value={saleBlanco} placeholder="0.00" class="input-field" />
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-[11px] text-[var(--color-ink3)] font-mono">Vendido en negro (USD)</label>
						<input type="number" step="0.01" min="0" bind:value={saleNegro} placeholder="0.00" class="input-field" />
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-[11px] text-[var(--color-ink3)] font-mono">Fecha de venta</label>
						<input type="date" bind:value={saleDate} class="input-field" />
					</div>
				{/if}
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
					{loading ? 'Guardando...' : 'Guardar'}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	:global(.input-field) {
		width: 100%;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 8px 10px;
		font-size: 13px;
		color: var(--color-ink);
		background: var(--color-surface);
		font-family: var(--font-sans);
		outline: none;
		transition: border-color 0.15s;
	}
	:global(.input-field:focus) {
		border-color: var(--color-border2);
	}
</style>
