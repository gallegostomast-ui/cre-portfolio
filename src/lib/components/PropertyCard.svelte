<script lang="ts">
	import type { Property, TabId } from '$lib/types';
	import type { ExpenseGroup } from '$lib/types';
	import {
		costoTotal,
		fmtUSD,
		fmtDate,
		fmtARS,
		daysBetween,
		today,
		formatCartera,
		formatPublicado,
		totalBlanco,
		totalNegro,
		totalExpenses,
		totalExpensesByGroup,
		totalExpensesByGroupAndPago,
		expensesByGroup,
		calcMargen,
		calcBlanqueo,
		STATE_LABELS,
		GROUP_LABELS,
		CONCEPT_LABELS
	} from '$lib/utils';
	import { auth } from '$lib/stores/auth.svelte';
	import { propertiesStore } from '$lib/stores/properties.svelte';

	let {
		property,
		onEditProperty,
		onAddExpense,
		onEditExpense
	}: {
		property: Property;
		onEditProperty: (p: Property) => void;
		onAddExpense: (propertyId: string, group?: ExpenseGroup) => void;
		onEditExpense: (propertyId: string, expenseId: string) => void;
	} = $props();

	let expanded = $state(false);
	let activeTab = $state<TabId>('resumen');

	// expand state por grupo de gastos
	let openGroups = $state<Record<string, boolean>>({});

	function toggleGroup(g: string) {
		openGroups[g] = !openGroups[g];
	}

	const p = $derived(property);
	const cTotal = $derived(costoTotal(p));
	const tB = $derived(totalBlanco(p));
	const tN = $derived(totalNegro(p));
	const tGastos = $derived(totalExpenses(p));
	const compra = $derived(p.purchase_total_usd);
	const pctB = $derived(compra > 0 ? Math.round((p.purchase_blanco_usd / compra) * 100) : 0);
	const pctN = $derived(100 - pctB);
	const pctTB = $derived(cTotal > 0 ? Math.round((tB / cTotal) * 100) : 0);
	const pctTN = $derived(100 - pctTB);

	const margen = $derived(calcMargen(p));
	const showMargen = $derived(
		(p.state === 'disponible_venta' && !!p.precio_publicado_usd) ||
		(p.state === 'vendida' && !!p.sale_total_usd)
	);

	const vTotal = $derived((p.sale_blanco_usd ?? 0) + (p.sale_negro_usd ?? 0));

	const diasCartera = $derived(
		p.purchase_date
			? daysBetween(p.purchase_date, p.state === 'vendida' && p.sale_date ? p.sale_date : today())
			: null
	);
	const diasPublicado = $derived(
		p.state === 'disponible_venta' && p.fecha_publicacion
			? daysBetween(p.fecha_publicacion, today())
			: null
	);

	const stateBadgeStyle: Record<string, string> = {
		en_analisis: 'background:var(--color-surface2);color:var(--color-ink2)',
		en_compra: 'background:var(--color-blue-bg);color:var(--color-blue)',
		en_renovacion: 'background:var(--color-amber-bg);color:var(--color-amber)',
		disponible_venta: 'background:var(--color-green-bg);color:var(--color-green)',
		vendida: 'background:var(--color-surface2);color:var(--color-ink2)'
	};

	const groups: ExpenseGroup[] = ['compra', 'obra', 'servicios', 'venta'];

	async function handleDeleteProperty() {
		if (!auth.token) return;
		if (!confirm(`¿Eliminar "${p.name}" y todos sus gastos?`)) return;
		await propertiesStore.removeProperty(auth.token, p.id);
	}

	async function handleDeleteExpense(expenseId: string) {
		if (!auth.token) return;
		if (!confirm('¿Eliminar este gasto?')) return;
		await propertiesStore.removeExpense(auth.token, p.id, expenseId);
	}
</script>

<div
	class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[10px] overflow-hidden transition-colors hover:border-[var(--color-border2)] {expanded
		? 'border-[var(--color-border2)]'
		: ''}"
>
	<!-- Header -->
	<button
		class="w-full text-left bg-none border-none cursor-pointer p-0 block"
		onclick={() => { expanded = !expanded; }}
	>
		<!-- Fila superior: info de la propiedad -->
		<div class="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
			<div class="flex flex-col gap-1.5 min-w-0">
				<!-- Nombre + chevron + estado -->
				<div class="flex items-center gap-2 flex-wrap">
					<span class="text-[15px] font-medium text-[var(--color-ink)] leading-tight">{p.name}</span>
					<span
						class="text-[10px] text-[var(--color-ink3)] transition-transform inline-block flex-shrink-0"
						style="transform: rotate({expanded ? 180 : 0}deg)"
					>▼</span>
					<span
						class="text-[11px] font-medium px-2.5 py-0.5 rounded-full font-mono whitespace-nowrap"
						style={stateBadgeStyle[p.state] ?? 'background:var(--color-surface2);color:var(--color-ink2)'}
					>
						{STATE_LABELS[p.state] ?? p.state}
					</span>
				</div>
				<!-- Dirección + tiempos + fechas -->
				<div class="flex items-center gap-2 flex-wrap">
					<span class="text-[12px] text-[var(--color-ink3)] font-mono">{p.direccion}</span>
					{#if diasCartera !== null}
						<span class="text-[11px] bg-[var(--color-surface2)] text-[var(--color-ink2)] px-2 py-0.5 rounded-full font-mono whitespace-nowrap">
							{formatCartera(diasCartera)}
						</span>
					{/if}
					{#if diasPublicado !== null}
						<span class="text-[11px] bg-[var(--color-green-bg)] text-[var(--color-green)] px-2 py-0.5 rounded-full font-mono whitespace-nowrap">
							{formatPublicado(diasPublicado)}
						</span>
					{/if}
					{#if p.purchase_date}
						<span class="text-[11px] text-[var(--color-ink3)] font-mono whitespace-nowrap">
							Compra: {fmtDate(p.purchase_date)}
						</span>
					{/if}
					{#if p.sale_date}
						<span class="text-[11px] text-[var(--color-ink3)] font-mono whitespace-nowrap">
							Venta: {fmtDate(p.sale_date)}
						</span>
					{/if}
				</div>
			</div>

			{#if p.state === 'disponible_venta' && p.url_posteo}
				<a
					href={p.url_posteo}
					target="_blank"
					rel="noopener"
					onclick={(e) => e.stopPropagation()}
					class="flex-shrink-0 border border-[var(--color-border)] rounded-[6px] px-2.5 py-1 text-[12px] text-[var(--color-blue)] inline-flex items-center gap-1 no-underline hover:border-[var(--color-blue-mid)] hover:bg-[var(--color-blue-bg)] transition-colors whitespace-nowrap mt-0.5"
				>
					Ver publicación ↗
				</a>
			{/if}
		</div>

		<!-- Separador -->
		<div class="mx-5 border-t border-[var(--color-border)]"></div>

		<!-- Fila inferior: KPIs financieros — siempre 4 columnas -->
		<div class="grid grid-cols-4 divide-x divide-[var(--color-border)] bg-[var(--color-surface2)]">
			<div class="px-5 py-2.5">
				<div class="text-[10px] text-[var(--color-ink3)] uppercase tracking-wide font-mono mb-0.5">Costo total</div>
				<div class="font-num text-[13px] font-medium">{fmtUSD(cTotal)}</div>
			</div>
			<div class="px-5 py-2.5">
				<div class="text-[10px] text-[var(--color-ink3)] uppercase tracking-wide font-mono mb-0.5">Blanco / Negro</div>
				<div class="font-num text-[13px] font-medium">
					<span class="text-[var(--color-blue)]">{fmtUSD(tB)}</span>
					<span class="text-[var(--color-ink3)] mx-0.5">/</span>
					<span class="text-[var(--color-amber)]">{fmtUSD(tN)}</span>
				</div>
			</div>
			<div class="px-5 py-2.5">
				{#if showMargen}
					<div class="text-[10px] text-[var(--color-ink3)] uppercase tracking-wide font-mono mb-0.5">Blanqueo</div>
					<div class="font-num text-[13px] font-medium text-[var(--color-blue)]">{fmtUSD(margen.blanqueo)}</div>
				{/if}
			</div>
			<div class="px-5 py-2.5">
				{#if showMargen}
					<div class="text-[10px] text-[var(--color-ink3)] uppercase tracking-wide font-mono mb-0.5">Ganancia real</div>
					<div class="font-num text-[13px] font-medium {margen.ganancia >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}">
						{fmtUSD(margen.ganancia)}
						<span class="text-[11px] font-normal opacity-60">({margen.pct.toFixed(1)}%)</span>
					</div>
				{/if}
			</div>
		</div>
	</button>

	<!-- Detail -->
	{#if expanded}
		<div class="border-t border-[var(--color-border)]">
			<!-- Tabs -->
			<div class="flex px-5 border-b border-[var(--color-border)] gap-1 overflow-x-auto">
				{#each [['resumen', 'Resumen'], ['gastos', `Gastos (${p.expenses.length})`], ['resultado', 'Resultado'], ['config', 'Configuración']] as [id, label]}
					<button
						onclick={() => { activeTab = id as TabId; }}
						class="px-3.5 py-2.5 text-[13px] border-b-2 mb-[-1px] transition-colors whitespace-nowrap cursor-pointer bg-none border-t-0 border-l-0 border-r-0 {activeTab === id
							? 'text-[var(--color-ink)] border-b-[var(--color-ink)] font-medium'
							: 'text-[var(--color-ink2)] border-b-transparent hover:text-[var(--color-ink)]'}"
					>
						{label}
					</button>
				{/each}
			</div>

			<!-- Tab: Resumen -->
			{#if activeTab === 'resumen'}
				<div class="p-5">
					<div class="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1 font-num">
						<!-- Precio de compra -->
						<div class="bg-[var(--color-surface2)] rounded-[10px] p-4">
							<h3 class="text-[10px] font-medium text-[var(--color-ink3)] uppercase tracking-wider mb-3 font-mono">
								Precio de compra
							</h3>
							<div class="flex justify-between items-center py-1.5 border-b border-[var(--color-border)] text-[13px]">
								<span class="text-[var(--color-ink2)]">En blanco</span>
								<span class="font-medium text-[var(--color-blue)]">{fmtUSD(p.purchase_blanco_usd)}</span>
							</div>
							<div class="flex justify-between items-center py-1.5 text-[13px]">
								<span class="text-[var(--color-ink2)]">En negro</span>
								<span class="font-medium text-[var(--color-amber)]">{fmtUSD(p.purchase_negro_usd)}</span>
							</div>
							<div class="flex justify-between pt-2 mt-1.5 font-medium text-[14px] border-t border-[var(--color-border2)]">
								<span>Total compra</span>
								<span>{fmtUSD(compra)}</span>
							</div>
							<div class="flex h-[5px] rounded overflow-hidden my-2">
								<div class="bg-[var(--color-blue-mid)]" style="width:{pctB}%"></div>
								<div class="bg-[var(--color-amber-mid)]" style="width:{pctN}%"></div>
							</div>
							<div class="flex gap-3 text-[11px] text-[var(--color-ink3)]">
								<span><span class="inline-block w-[7px] h-[7px] rounded-full bg-[var(--color-blue-mid)] mr-1 align-middle"></span>Blanco {pctB}%</span>
								<span><span class="inline-block w-[7px] h-[7px] rounded-full bg-[var(--color-amber-mid)] mr-1 align-middle"></span>Negro {pctN}%</span>
							</div>
							{#if p.purchase_date}
								<div class="mt-2.5 text-[12px] text-[var(--color-ink3)]">
									Comprado: {fmtDate(p.purchase_date)}{p.sale_date ? ` · Vendido: ${fmtDate(p.sale_date)}` : ''}
								</div>
							{/if}
						</div>

						<!-- Gastos por tipo -->
						<div class="bg-[var(--color-surface2)] rounded-[10px] p-4">
							<h3 class="text-[10px] font-medium text-[var(--color-ink3)] uppercase tracking-wider mb-3 font-mono">
								Gastos por tipo
							</h3>
							{#each groups as g}
								{@const tot = totalExpensesByGroup(p, g)}
								{@const totB = totalExpensesByGroupAndPago(p, g, 'blanco')}
								{@const totN = totalExpensesByGroupAndPago(p, g, 'negro')}
								{@const pb = tot > 0 ? Math.round((totB / tot) * 100) : 0}
								<div class="py-2.5 border-b border-[var(--color-border)] last:border-b-0">
									<div class="flex justify-between items-center">
										<span class="text-[13px] {tot === 0 ? 'text-[var(--color-ink3)]' : 'text-[var(--color-ink)]'}">
											{GROUP_LABELS[g]}
										</span>
										{#if tot > 0}
											<div class="flex items-center gap-2.5">
												<span class="text-[12px]">
													<span class="text-[var(--color-blue)]">B {fmtUSD(totB)}</span>
													<span class="text-[var(--color-ink3)]"> · </span>
													<span class="text-[var(--color-amber)]">N {fmtUSD(totN)}</span>
												</span>
												<span class="text-[13px] font-medium">{fmtUSD(tot)}</span>
											</div>
										{:else}
											<span class="text-[13px] text-[var(--color-ink3)]">—</span>
										{/if}
									</div>
									{#if tot > 0}
										<div class="flex h-[4px] rounded overflow-hidden mt-1.5">
											<div class="bg-[var(--color-blue-mid)]" style="width:{pb}%"></div>
											<div class="bg-[var(--color-amber-mid)]" style="width:{100 - pb}%"></div>
										</div>
									{/if}
								</div>
							{/each}
							<div class="flex justify-between pt-2 mt-1.5 font-medium text-[14px] border-t border-[var(--color-border2)]">
								<span>Total gastos</span>
								<span>{fmtUSD(tGastos)}</span>
							</div>
						</div>

						<!-- Blanco vs negro total -->
						<div class="col-span-2 max-sm:col-span-1 bg-[var(--color-surface2)] rounded-[10px] p-4">
							<h3 class="text-[10px] font-medium text-[var(--color-ink3)] uppercase tracking-wider mb-3 font-mono">
								Blanco vs negro — total acumulado
							</h3>
							<div class="flex justify-between py-1.5 border-b border-[var(--color-border)] text-[13px]">
								<span class="text-[var(--color-ink2)]">Total en blanco (compra + gastos)</span>
								<span class="font-medium text-[var(--color-blue)]">{fmtUSD(tB)}</span>
							</div>
							<div class="flex justify-between py-1.5 text-[13px]">
								<span class="text-[var(--color-ink2)]">Total en negro (compra + gastos)</span>
								<span class="font-medium text-[var(--color-amber)]">{fmtUSD(tN)}</span>
							</div>
							<div class="flex h-[5px] rounded overflow-hidden my-2">
								<div class="bg-[var(--color-blue-mid)]" style="width:{pctTB}%"></div>
								<div class="bg-[var(--color-amber-mid)]" style="width:{pctTN}%"></div>
							</div>
							<div class="flex gap-3 text-[11px] text-[var(--color-ink3)] mb-3">
								<span><span class="inline-block w-[7px] h-[7px] rounded-full bg-[var(--color-blue-mid)] mr-1 align-middle"></span>Blanco {pctTB}%</span>
								<span><span class="inline-block w-[7px] h-[7px] rounded-full bg-[var(--color-amber-mid)] mr-1 align-middle"></span>Negro {pctTN}%</span>
							</div>
							<div class="flex justify-between pt-2 font-medium text-[14px] border-t border-[var(--color-border2)]">
								<span>Costo total</span>
								<span>{fmtUSD(cTotal)}</span>
							</div>
							<div class="flex justify-between pt-1.5 font-medium text-[14px]">
								<span>{p.state === 'vendida' && vTotal ? 'Precio de venta' : 'Precio publicado'}</span>
								<span>{fmtUSD(p.state === 'vendida' && vTotal ? vTotal : (p.precio_publicado_usd ?? 0))}</span>
							</div>
							{#if showMargen}
								<div class="border-t border-[var(--color-border2)] mt-2 pt-2">
									<div class="flex justify-between py-1 text-[14px] font-medium">
										<span>Blanqueo estimado</span>
										<span class="text-[var(--color-blue)]">
											{fmtUSD(margen.blanqueo)}
											<span class="text-[11px] font-normal">({(tN > 0 ? (margen.blanqueo / tN) * 100 : 0).toFixed(0)}%)</span>
										</span>
									</div>
									<div class="flex justify-between py-1 text-[15px] font-medium">
										<span>Ganancia real estimada</span>
										<span class="{margen.ganancia >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}">
											{fmtUSD(margen.ganancia)}
											<span class="text-[11px] font-normal">({margen.pct.toFixed(1)}%)</span>
										</span>
									</div>
								</div>
							{:else}
								<p class="text-[12px] text-[var(--color-ink3)] mt-3">
									El margen se mostrará cuando esté disponible para la venta.
								</p>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- Tab: Gastos -->
			{#if activeTab === 'gastos'}
				<div class="p-5">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-[14px] font-medium">Gastos</h3>
						{#if auth.canEdit}
							<button
								onclick={() => onAddExpense(p.id)}
								class="bg-[var(--color-ink)] text-[var(--color-bg)] border-none rounded-[6px] px-3 py-1.5 text-[12px] font-medium cursor-pointer hover:opacity-80 transition-opacity"
							>
								+ Agregar gasto
							</button>
						{/if}
					</div>

					{#each groups as g}
						{@const expenses = expensesByGroup(p, g)}
						{@const tot = expenses.reduce((a, e) => a + e.amount_usd, 0)}
						{@const totB = expenses.filter((e) => e.tipo_pago === 'blanco').reduce((a, e) => a + e.amount_usd, 0)}
						{@const totN = expenses.filter((e) => e.tipo_pago === 'negro').reduce((a, e) => a + e.amount_usd, 0)}
						{@const isOpen = openGroups[g]}

						<div class="border border-[var(--color-border)] rounded-[10px] mb-2 overflow-hidden">
							<button
								onclick={() => toggleGroup(g)}
								class="w-full flex items-center justify-between px-4 py-3 bg-none border-none cursor-pointer text-left hover:bg-[var(--color-surface2)] transition-colors"
							>
								<span class="text-[13px] font-medium text-[var(--color-ink)]">{GROUP_LABELS[g]}</span>
								<div class="flex items-center gap-3 font-num">
									{#if tot > 0}
										<span class="text-[12px]">
											<span class="text-[var(--color-blue)]">B {fmtUSD(totB)}</span>
											<span class="text-[var(--color-ink3)]"> · </span>
											<span class="text-[var(--color-amber)]">N {fmtUSD(totN)}</span>
										</span>
										<span class="text-[13px] font-medium">{fmtUSD(tot)}</span>
									{:else}
										<span class="text-[13px] text-[var(--color-ink3)] font-sans">Sin gastos</span>
									{/if}
									<span class="text-[10px] text-[var(--color-ink3)] transition-transform inline-block {isOpen ? 'rotate-180' : ''}">▼</span>
								</div>
							</button>

							{#if isOpen}
								<div class="border-t border-[var(--color-border)]">
									{#if expenses.length === 0}
										<p class="px-4 py-3 text-[13px] text-[var(--color-ink3)]">
											Sin gastos cargados en este tipo.
										</p>
									{:else}
										{#each expenses.sort((a, b) => a.expense_date.localeCompare(b.expense_date)) as e}
											<div class="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)] last:border-b-0 flex-wrap gap-2">
												<div class="flex items-center gap-2.5 flex-wrap">
													<span class="text-[12px] text-[var(--color-ink3)] font-mono">{fmtDate(e.expense_date)}</span>
													<span
														class="text-[11px] font-medium px-1.5 py-0.5 rounded font-mono"
														style={e.tipo_pago === 'blanco'
															? 'background:var(--color-blue-bg);color:var(--color-blue)'
															: 'background:var(--color-amber-bg);color:var(--color-amber)'}
													>
														{e.tipo_pago === 'blanco' ? 'B' : 'N'}
													</span>
													<span class="text-[13px] text-[var(--color-ink)]">{CONCEPT_LABELS[e.concept] ?? e.concept}</span>
													{#if e.description}
														<span class="text-[12px] text-[var(--color-ink3)]">{e.description}</span>
													{/if}
												</div>
												<div class="flex items-center gap-2">
													<div class="font-num text-right">
														{#if e.amount_ars}
															<div class="text-[12px] text-[var(--color-ink3)]">{fmtARS(e.amount_ars)}{e.exchange_rate ? ` · TC ${Number(e.exchange_rate).toLocaleString('es-AR')}` : ''}</div>
														{/if}
														<div class="text-[13px] font-medium">{fmtUSD(e.amount_usd)}</div>
													</div>
													{#if auth.canEdit}
														<button
															onclick={() => onEditExpense(p.id, e.id)}
															class="bg-transparent border border-[var(--color-border2)] text-[var(--color-ink2)] rounded-[6px] px-2 py-1 text-[12px] cursor-pointer hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition-colors"
														>
															Editar
														</button>
														<button
															onclick={() => handleDeleteExpense(e.id)}
															class="bg-transparent border border-[var(--color-border)] text-[var(--color-red)] rounded-[6px] px-2 py-1 text-[12px] cursor-pointer hover:border-[var(--color-red)] transition-colors"
														>
															×
														</button>
													{/if}
												</div>
											</div>
										{/each}
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			<!-- Tab: Resultado -->
			{#if activeTab === 'resultado'}
				<div class="p-5">
					{#if p.state !== 'vendida' || !vTotal}
						<p class="text-[13px] text-[var(--color-ink3)]">
							El estado de resultado estará disponible cuando la propiedad esté marcada como vendida y se cargue el precio de venta.
						</p>
					{:else}
						{@const costoB = tB}
						{@const costoN = tN}
						{@const vB = p.sale_blanco_usd ?? 0}
						{@const vN = p.sale_negro_usd ?? 0}
						{@const blanqueo = calcBlanqueo(costoB, costoN, vB)}
						{@const blanqueoPct = costoN > 0 ? Math.round((blanqueo / costoN) * 100) : 0}
						{@const gananciaReal = vTotal - cTotal}
						{@const mgPct = cTotal > 0 ? ((gananciaReal / cTotal) * 100).toFixed(1) : 0}
						{@const tObra = totalExpensesByGroup(p, 'obra')}
						{@const tServ = totalExpensesByGroup(p, 'servicios')}
						{@const tGC = totalExpensesByGroup(p, 'compra')}
						{@const tGV = totalExpensesByGroup(p, 'venta')}

						<div class="max-w-xl font-num">
							{#if p.purchase_date && p.sale_date}
								<p class="text-[13px] text-[var(--color-ink2)] mb-4 font-sans">
									Tiempo en cartera: <strong>{daysBetween(p.purchase_date, p.sale_date)} días</strong>
									({fmtDate(p.purchase_date)} → {fmtDate(p.sale_date)})
								</p>
							{/if}

							<!-- Ingresos -->
							<div class="mb-4">
								<div class="text-[11px] uppercase tracking-wider text-[var(--color-ink3)] font-mono mb-2">Ingresos por venta</div>
								<div class="flex justify-between py-1.5 border-b border-[var(--color-border)] text-[13px]">
									<span class="text-[var(--color-ink2)]">Vendido en blanco</span>
									<span class="font-medium text-[var(--color-blue)]">{fmtUSD(vB)}</span>
								</div>
								<div class="flex justify-between py-1.5 text-[13px]">
									<span class="text-[var(--color-ink2)]">Vendido en negro</span>
									<span class="font-medium text-[var(--color-amber)]">{fmtUSD(vN)}</span>
								</div>
								<div class="flex justify-between pt-2 mt-1 font-medium text-[14px] border-t border-[var(--color-border2)]">
									<span>Total ingresado</span>
									<span>{fmtUSD(vTotal)}</span>
								</div>
							</div>

							<!-- Egresos -->
							<div class="mb-4">
								<div class="text-[11px] uppercase tracking-wider text-[var(--color-ink3)] font-mono mb-2">Egresos totales</div>
								<div class="flex justify-between py-1.5 border-b border-[var(--color-border)] text-[13px]">
									<span class="text-[var(--color-ink2)]">Compra (B {fmtUSD(p.purchase_blanco_usd)} / N {fmtUSD(p.purchase_negro_usd)})</span>
									<span class="font-medium">{fmtUSD(compra)}</span>
								</div>
								{#if tGC > 0}
									<div class="flex justify-between py-1.5 border-b border-[var(--color-border)] text-[13px]">
										<span class="text-[var(--color-ink2)]">Gastos de compra</span>
										<span class="font-medium">{fmtUSD(tGC)}</span>
									</div>
								{/if}
								{#if tObra > 0}
									<div class="flex justify-between py-1.5 border-b border-[var(--color-border)] text-[13px]">
										<span class="text-[var(--color-ink2)]">Gastos de obra</span>
										<span class="font-medium">{fmtUSD(tObra)}</span>
									</div>
								{/if}
								{#if tServ > 0}
									<div class="flex justify-between py-1.5 border-b border-[var(--color-border)] text-[13px]">
										<span class="text-[var(--color-ink2)]">Gastos de servicios</span>
										<span class="font-medium">{fmtUSD(tServ)}</span>
									</div>
								{/if}
								{#if tGV > 0}
									<div class="flex justify-between py-1.5 border-b border-[var(--color-border)] text-[13px]">
										<span class="text-[var(--color-ink2)]">Gastos de venta</span>
										<span class="font-medium">{fmtUSD(tGV)}</span>
									</div>
								{/if}
								<div class="flex justify-between pt-2 mt-1 font-medium text-[14px] border-t border-[var(--color-border2)]">
									<span>Total egresado</span>
									<span>{fmtUSD(cTotal)}</span>
								</div>
							</div>

							<!-- Resultado -->
							<div class="flex justify-between items-center py-3 border-t-2 border-[var(--color-border2)] text-[15px] font-medium mb-4">
								<span>
									Resultado bruto
									<span class="text-[11px] font-medium px-2 py-0.5 rounded-full ml-1.5 {vTotal >= cTotal ? 'bg-[var(--color-green-bg)] text-[var(--color-green)]' : 'bg-[var(--color-red-bg)] text-[var(--color-red)]'}">
										{vTotal >= cTotal ? 'Ganancia' : 'Pérdida'}
									</span>
								</span>
								<span class="{vTotal >= cTotal ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}">
									{fmtUSD(vTotal - cTotal)} ({mgPct}%)
								</span>
							</div>

							<!-- Análisis B/N -->
							<div class="bg-[var(--color-blue-bg)] border border-[#B5D4F4] rounded-[10px] p-4">
								<h4 class="text-[12px] font-medium text-[var(--color-blue)] mb-3 uppercase tracking-wide font-mono">
									Análisis blanco / negro
								</h4>
								<div class="flex justify-between py-1.5 text-[13px] border-b border-[#B5D4F4]">
									<span class="text-[var(--color-ink2)]">Costo total en blanco</span>
									<span class="font-medium text-[var(--color-blue)]">{fmtUSD(costoB)}</span>
								</div>
								<div class="flex justify-between py-1.5 text-[13px] border-b border-[#B5D4F4]">
									<span class="text-[var(--color-ink2)]">Costo total en negro</span>
									<span class="font-medium text-[var(--color-amber)]">{fmtUSD(costoN)}</span>
								</div>
								<div class="flex justify-between py-1.5 text-[13px] border-b border-[#B5D4F4]">
									<span class="text-[var(--color-ink2)]">Cobrado en blanco</span>
									<span class="font-medium">{fmtUSD(vB)}</span>
								</div>
								<div class="flex justify-between py-1.5 text-[13px] border-b border-[#B5D4F4]">
									<span class="text-[var(--color-ink2)]">Cobrado en negro</span>
									<span class="font-medium">{fmtUSD(vN)}</span>
								</div>
								<div class="flex justify-between py-2 text-[13px] font-medium border-b border-[#B5D4F4]">
									<span>Negro blanqueado ({blanqueoPct}% del negro invertido)</span>
									<span class="text-[var(--color-blue)]">{fmtUSD(blanqueo)}</span>
								</div>
								<div class="flex justify-between py-2 text-[14px] font-medium">
									<span>Ganancia real de la operación</span>
									<span class="{gananciaReal >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}">{fmtUSD(gananciaReal)}</span>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Tab: Config -->
			{#if activeTab === 'config'}
				<div class="p-5">
					{#if auth.canEdit}
						<div class="mb-6">
							<h3 class="text-[13px] font-medium mb-3">Editar propiedad</h3>
							<button
								onclick={() => onEditProperty(p)}
								class="bg-transparent border border-[var(--color-border2)] text-[var(--color-ink2)] rounded-[6px] px-4 py-2 text-[13px] cursor-pointer hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition-colors"
							>
								Editar datos de la propiedad
							</button>
						</div>
					{/if}
					{#if auth.isAdmin}
						<div class="border border-[var(--color-red-bg)] bg-[var(--color-red-bg)] rounded-[10px] p-4">
							<p class="text-[13px] text-[var(--color-red)] mb-3">
								Eliminar esta propiedad borrará también todos sus gastos. Esta acción no se puede deshacer.
							</p>
							<button
								onclick={handleDeleteProperty}
								class="bg-transparent border border-[var(--color-red)] text-[var(--color-red)] rounded-[6px] px-3 py-1.5 text-[12px] cursor-pointer hover:bg-[var(--color-red)] hover:text-white transition-colors"
							>
								Eliminar propiedad
							</button>
						</div>
					{/if}
					{#if !auth.canEdit}
						<p class="text-[13px] text-[var(--color-ink3)]">
							No tenés permisos para editar esta propiedad.
						</p>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
