<script lang="ts">
	import { onMount } from 'svelte';
	import type { Expense, ExpenseGroup, FilterState, Property } from '$lib/types';
	import { auth } from '$lib/stores/auth.svelte';
	import { propertiesStore } from '$lib/stores/properties.svelte';
	import SyncBar from '$lib/components/SyncBar.svelte';
	import MetricsBar from '$lib/components/MetricsBar.svelte';
	import PropertyCard from '$lib/components/PropertyCard.svelte';
	import PropertyModal from '$lib/components/PropertyModal.svelte';
	import ExpenseModal from '$lib/components/ExpenseModal.svelte';
	import UserModal from '$lib/components/UserModal.svelte';
	import UsersListModal from '$lib/components/UsersListModal.svelte';
	import { STATE_LABELS } from '$lib/utils';

	let filter = $state<FilterState>('todos');

	// Modal state
	let showPropertyModal = $state(false);
	let editingProperty = $state<Property | null>(null);

	let showUsersListModal = $state(false);
	let showUserModal = $state(false);

	let showExpenseModal = $state(false);
	let expensePropertyId = $state('');
	let expenseDefaultGroup = $state<ExpenseGroup>('obra');
	let editingExpense = $state<Expense | null>(null);

	const FILTER_LABELS: Record<FilterState, string> = {
		todos: 'Todas',
		en_analisis: 'En análisis',
		en_compra: 'En compra',
		en_renovacion: 'En renovación',
		disponible_venta: 'Disponible',
		vendida: 'Vendidas'
	};

	const FILTERS: FilterState[] = [
		'todos',
		'en_renovacion',
		'disponible_venta',
		'vendida'
	];

	const filteredProperties = $derived(
		propertiesStore.properties.filter((p) => filter === 'todos' || p.state === filter)
	);

	onMount(() => {
		if (auth.token) {
			propertiesStore.loadAll(auth.token);
		}
	});

	function openAddProperty() {
		editingProperty = null;
		showPropertyModal = true;
	}

	function openEditProperty(p: Property) {
		editingProperty = p;
		showPropertyModal = true;
	}

	function closePropertyModal() {
		showPropertyModal = false;
		editingProperty = null;
	}

	function openAddExpense(propertyId: string, group: ExpenseGroup = 'obra') {
		expensePropertyId = propertyId;
		expenseDefaultGroup = group;
		editingExpense = null;
		showExpenseModal = true;
	}

	function openEditExpense(propertyId: string, expenseId: string) {
		expensePropertyId = propertyId;
		const prop = propertiesStore.properties.find((p) => p.id === propertyId);
		editingExpense = prop?.expenses.find((e) => e.id === expenseId) ?? null;
		showExpenseModal = true;
	}

	function closeExpenseModal() {
		showExpenseModal = false;
		editingExpense = null;
		expensePropertyId = '';
	}
</script>

<div class="max-w-[960px] mx-auto px-5 py-8 pb-20">
	<!-- Top bar -->
	<div class="flex items-start justify-between mb-7 flex-wrap gap-3">
		<div>
			<h1 class="text-[22px] font-medium tracking-tight">Portfolio CRE</h1>
			<p class="text-[13px] text-[var(--color-ink3)] mt-0.5 font-mono">cosua real estate</p>
		</div>
	{#if auth.isAdmin}
		<div class="flex gap-2">
			<button
				onclick={() => { showUsersListModal = true; }}
				class="bg-transparent border border-[var(--color-border2)] text-[var(--color-ink2)] rounded-[6px] px-4 py-2 text-[13px] font-medium cursor-pointer hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition-colors"
			>
				Usuarios
			</button>
			<button
				onclick={openAddProperty}
				class="bg-[var(--color-ink)] text-[var(--color-bg)] border-none rounded-[6px] px-4 py-2 text-[13px] font-medium cursor-pointer hover:opacity-80 transition-opacity"
			>
				+ Propiedad
			</button>
		</div>
	{/if}
	</div>

	<!-- Sync bar -->
	<SyncBar />

	<!-- Metrics -->
	<MetricsBar properties={propertiesStore.properties} {filter} />

	<!-- Filter buttons -->
	<div class="flex gap-1.5 mb-5 flex-wrap">
		{#each FILTERS as f}
			<button
				onclick={() => { filter = f; }}
				class="border rounded-full px-3.5 py-1.5 text-[13px] cursor-pointer transition-all font-medium"
				style={filter === f
					? 'background:var(--color-ink);color:var(--color-bg);border-color:var(--color-ink)'
					: 'background:transparent;color:var(--color-ink2);border-color:var(--color-border)'}
			>
				{FILTER_LABELS[f]}
			</button>
		{/each}
	</div>

	<!-- Property list -->
	{#if propertiesStore.loading}
		<div class="flex flex-col gap-2.5">
			{#each [1, 2, 3] as _}
				<div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[10px] h-[72px] animate-pulse"></div>
			{/each}
		</div>
	{:else if filteredProperties.length === 0}
		<div class="text-center py-16 text-[var(--color-ink3)] text-[14px]">
			<p>No hay propiedades en esta categoría.</p>
			{#if auth.isAdmin && filter === 'todos'}
				<p class="mt-1">Agregá una con el botón de arriba.</p>
			{/if}
		</div>
	{:else}
		<div class="flex flex-col gap-2.5">
			{#each filteredProperties as property (property.id)}
				<PropertyCard
					{property}
					onEditProperty={openEditProperty}
					onAddExpense={openAddExpense}
					onEditExpense={openEditExpense}
				/>
			{/each}
		</div>
	{/if}
</div>

<!-- Modals -->
{#if showUsersListModal}
	<UsersListModal
		onClose={() => { showUsersListModal = false; }}
		onCreateUser={() => { showUsersListModal = false; showUserModal = true; }}
	/>
{/if}

{#if showUserModal}
	<UserModal onClose={() => { showUserModal = false; showUsersListModal = true; }} />
{/if}

{#if showPropertyModal}
	<PropertyModal
		property={editingProperty}
		onClose={closePropertyModal}
	/>
{/if}

{#if showExpenseModal && expensePropertyId}
	<ExpenseModal
		propertyId={expensePropertyId}
		expense={editingExpense}
		defaultGroup={expenseDefaultGroup}
		onClose={closeExpenseModal}
	/>
{/if}
