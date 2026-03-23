<script lang="ts">
	import type { Expense, ExpenseGroup, TipoPago, CreateExpensePayload, UpdateExpensePayload } from '$lib/types';
	import { auth } from '$lib/stores/auth.svelte';
	import { propertiesStore } from '$lib/stores/properties.svelte';
	import { today, GROUP_LABELS, CONCEPT_LABELS, GROUPS_BY_STATE, toDateInput } from '$lib/utils';

	let {
		propertyId,
		expense = null,
		defaultGroup = 'obra',
		onClose
	}: {
		propertyId: string;
		expense?: Expense | null;
		defaultGroup?: ExpenseGroup;
		onClose: () => void;
	} = $props();

	const isEdit = $derived(expense !== null);

	let group = $state<ExpenseGroup>(expense?.expense_group ?? defaultGroup);
	let concept = $state(expense?.concept ?? '');
	let description = $state(expense?.description ?? '');
	let tipoPago = $state<TipoPago>(expense?.tipo_pago ?? 'blanco');
	let moneda = $state<'ARS' | 'USD'>(expense?.amount_ars != null ? 'ARS' : 'USD');
	let monto = $state(expense?.amount_ars != null ? String(expense.amount_ars) : String(expense?.amount_usd ?? ''));
	let tc = $state(expense?.exchange_rate != null ? String(expense.exchange_rate) : '');
	let fecha = $state(toDateInput(expense?.expense_date ?? '') || today());

	let error = $state('');
	let loading = $state(false);

	const concepts = $derived(
		(GROUPS_BY_STATE[group] ?? []).map((c) => ({ value: c, label: CONCEPT_LABELS[c] ?? c }))
	);

	$effect(() => {
		if (!isEdit && concepts.length > 0) {
			concept = concepts[0].value;
		}
	});

	const GROUPS: ExpenseGroup[] = ['compra', 'obra', 'servicios', 'venta'];

	async function handleSubmit() {
		if (!auth.token) return;
		error = '';
		loading = true;
		try {
			const montoNum = parseFloat(monto) || 0;
			const tcNum = parseFloat(tc) || undefined;

			if (isEdit && expense) {
				const payload: UpdateExpensePayload = {
					concept,
					description: description || undefined,
					expense_date: fecha,
					tipo_pago: tipoPago,
					...(moneda === 'USD' ? { amount_usd: montoNum } : { amount_ars: montoNum, exchange_rate: tcNum })
				};
				await propertiesStore.editExpense(auth.token, propertyId, expense.id, payload);
			} else {
				const payload: CreateExpensePayload = {
					property_id: propertyId,
					expense_group: group,
					concept,
					description: description || undefined,
					expense_date: fecha,
					tipo_pago: tipoPago,
					...(moneda === 'USD' ? { amount_usd: montoNum } : { amount_ars: montoNum, exchange_rate: tcNum })
				};
				await propertiesStore.addExpense(auth.token, payload);
			}
			onClose();
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Error al guardar';
		} finally {
			loading = false;
		}
	}
</script>

<div
	class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
	role="dialog"
	aria-modal="true"
>
	<div
		onclick={(e) => e.stopPropagation()}
		class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[10px] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
	>
		<div class="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between">
			<h2 class="text-[16px] font-medium">{isEdit ? 'Editar gasto' : 'Agregar gasto'}</h2>
			<button onclick={onClose} class="text-[var(--color-ink3)] hover:text-[var(--color-ink)] bg-none border-none cursor-pointer text-xl leading-none">×</button>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="p-6">
			<div class="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
				<!-- Fecha -->
				<div class="flex flex-col gap-1">
					<label class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">Fecha</label>
					<input type="date" bind:value={fecha} class="input-field" />
				</div>

				<!-- Tipo de gasto -->
				<div class="flex flex-col gap-1">
					<label class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">Tipo de gasto</label>
					<select bind:value={group} class="input-field" disabled={isEdit}>
						{#each GROUPS as g}
							<option value={g}>{GROUP_LABELS[g]}</option>
						{/each}
					</select>
				</div>

				<!-- Concepto -->
				<div class="col-span-2 flex flex-col gap-1">
					<label class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">Concepto</label>
					<select bind:value={concept} class="input-field">
						{#each concepts as c}
							<option value={c.value}>{c.label}</option>
						{/each}
					</select>
				</div>

				<!-- Blanco / Negro -->
				<div class="col-span-2 flex flex-col gap-1">
					<label class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">Blanco / Negro</label>
					<div class="flex gap-2">
						<button
							type="button"
							onclick={() => { tipoPago = 'blanco'; }}
							class="flex-1 py-2 text-[13px] rounded-[6px] border cursor-pointer transition-all font-medium"
							style={tipoPago === 'blanco'
								? 'background:var(--color-blue-bg);border-color:var(--color-blue);color:var(--color-blue)'
								: 'background:transparent;border-color:var(--color-border);color:var(--color-ink2)'}
						>
							Blanco
						</button>
						<button
							type="button"
							onclick={() => { tipoPago = 'negro'; }}
							class="flex-1 py-2 text-[13px] rounded-[6px] border cursor-pointer transition-all font-medium"
							style={tipoPago === 'negro'
								? 'background:var(--color-amber-bg);border-color:var(--color-amber);color:var(--color-amber)'
								: 'background:transparent;border-color:var(--color-border);color:var(--color-ink2)'}
						>
							Negro
						</button>
					</div>
				</div>

				<!-- Moneda -->
				<div class="flex flex-col gap-1">
					<label class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">Moneda</label>
					<select bind:value={moneda} class="input-field">
						<option value="ARS">ARS</option>
						<option value="USD">USD</option>
					</select>
				</div>

				<!-- Monto -->
				<div class="flex flex-col gap-1">
					<label class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">Monto</label>
					<input type="number" step="0.01" min="0" bind:value={monto} placeholder="0.00" class="input-field" />
				</div>

				{#if moneda === 'ARS'}
					<div class="col-span-2 flex flex-col gap-1">
						<label class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">TC del día (ARS/USD)</label>
						<input type="number" step="0.01" min="0" bind:value={tc} placeholder="Ej: 1250.00" class="input-field" />
					</div>
				{/if}

				<!-- Descripción -->
				<div class="col-span-2 flex flex-col gap-1">
					<label class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide font-mono">Descripción (opcional)</label>
					<input bind:value={description} placeholder="" class="input-field" />
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
					{loading ? 'Guardando...' : 'Guardar'}
				</button>
			</div>
		</form>
	</div>
</div>
