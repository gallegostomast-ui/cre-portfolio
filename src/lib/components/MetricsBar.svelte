<script lang="ts">
	import type { FilterState, Property } from '$lib/types';
	import {
		costoTotal,
		fmtUSD,
		formatDays,
		daysBetween,
		today,
		totalBlanco,
		totalNegro,
		calcMargen
	} from '$lib/utils';

	interface Metric {
		label: string;
		value: string;
		sub: string;
		blue?: boolean;
		positive?: boolean;
		hasSign?: boolean;
	}

	let { properties, filter }: { properties: Property[]; filter: FilterState } = $props();

	const vis = $derived(
		properties.filter((p) => filter === 'todos' || p.state === filter)
	);

	const metrics = $derived((): Metric[] => {
		if (filter === 'todos') {
			const inv = vis.reduce((a, p) => a + costoTotal(p), 0);
			const vendidas = vis.filter((p) => p.state === 'vendida').length;
			return [
				{ label: 'Propiedades', value: String(vis.length), sub: '' },
				{ label: 'Ciclo cerrado', value: String(vendidas), sub: 'compradas, refacc. y vendidas' },
				{ label: 'Inversión total', value: fmtUSD(inv), sub: 'compra + gastos' }
			];
		}

		if (filter === 'en_renovacion') {
			const inv = vis.reduce((a, p) => a + costoTotal(p), 0);
			const dias = vis
				.map((p) => (p.purchase_date ? daysBetween(p.purchase_date, today()) : null))
				.filter((d): d is number => d !== null);
			const prom = dias.length ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : null;
			return [
				{ label: 'En renovación', value: String(vis.length), sub: '' },
				{ label: 'Inversión total', value: fmtUSD(inv), sub: 'hasta ahora' },
				{ label: 'Tiempo promedio', value: prom !== null ? formatDays(prom) : '—', sub: 'en cartera' }
			];
		}

		if (filter === 'disponible_venta') {
			const inv = vis.reduce((a, p) => a + costoTotal(p), 0);
			const pub = vis.reduce((a, p) => a + (p.precio_publicado_usd ?? 0), 0);
			const mg = vis.reduce((a, p) => a + calcMargen(p).ganancia, 0);
			const pct = inv > 0 ? ((mg / inv) * 100).toFixed(1) : 0;
			return [
				{ label: 'Disponibles', value: String(vis.length), sub: '' },
				{ label: 'Inversión total', value: fmtUSD(inv), sub: 'compra + gastos' },
				{ label: 'Precio publicado', value: fmtUSD(pub), sub: '' },
				{ label: 'Margen estimado', value: fmtUSD(mg), sub: `${pct}% sobre inversión`, positive: mg >= 0, hasSign: true }
			];
		}

		if (filter === 'vendida') {
			const ingresos = vis.reduce((a, p) => a + (p.sale_total_usd ?? 0), 0);
			const blanqueoTotal = vis.reduce((a, p) => a + calcMargen(p).blanqueo, 0);
			const gananciaTotal = vis.reduce((a, p) => a + calcMargen(p).ganancia, 0);
			return [
				{ label: 'Vendidas', value: String(vis.length), sub: '' },
				{ label: 'Ingresos por venta', value: fmtUSD(ingresos), sub: '' },
				{ label: 'Blanqueado', value: fmtUSD(blanqueoTotal), sub: 'negro → blanco', blue: true },
				{ label: 'Ganancia real', value: fmtUSD(gananciaTotal), sub: '', positive: gananciaTotal >= 0, hasSign: true }
			];
		}

		// en_analisis / en_compra
		const inv = vis.reduce((a, p) => a + costoTotal(p), 0);
		return [
			{ label: 'Propiedades', value: String(vis.length), sub: '' },
			{ label: 'Inversión total', value: fmtUSD(inv), sub: 'compra + gastos' }
		];
	});
</script>

<div class="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5 mb-6">
	{#each metrics() as m}
		<div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[10px] px-4 py-3.5">
			<div class="text-[11px] text-[var(--color-ink3)] uppercase tracking-wide mb-1.5 font-mono">
				{m.label}
			</div>
			<div
				class="font-num text-[20px] font-medium {m.blue
					? 'text-[var(--color-blue)]'
					: m.hasSign !== undefined
						? m.positive
							? 'text-[var(--color-green)]'
							: 'text-[var(--color-red)]'
						: 'text-[var(--color-ink)]'}"
			>
				{m.value}
			</div>
			{#if m.sub}
				<div class="text-[11px] text-[var(--color-ink3)] mt-0.5">{m.sub}</div>
			{/if}
		</div>
	{/each}
</div>
