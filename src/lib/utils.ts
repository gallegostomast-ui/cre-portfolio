import type { Expense, ExpenseGroup, Property, TipoPago } from './types';

// ─── Formatters ──────────────────────────────────────────────────────────────

export function fmtUSD(v: number): string {
	return '$' + v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtARS(v: number): string {
	return 'ARS ' + v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDate(s: string | null | undefined): string {
	if (!s) return '—';
	try {
		// Acepta tanto "YYYY-MM-DD" como "YYYY-MM-DDTHH:mm:ss.sssZ"
		const date = new Date(s);
		if (isNaN(date.getTime())) return s;
		const d = String(date.getUTCDate()).padStart(2, '0');
		const m = String(date.getUTCMonth() + 1).padStart(2, '0');
		const y = date.getUTCFullYear();
		return `${d}/${m}/${y}`;
	} catch {
		return s;
	}
}

export function today(): string {
	return new Date().toISOString().slice(0, 10);
}

/** Normaliza cualquier formato de fecha de la API a YYYY-MM-DD para usar en <input type="date"> */
export function toDateInput(s: string | null | undefined): string {
	if (!s) return '';
	try {
		const date = new Date(s);
		if (isNaN(date.getTime())) return s.slice(0, 10);
		return date.toISOString().slice(0, 10);
	} catch {
		return s.slice(0, 10);
	}
}

// ─── Date helpers ────────────────────────────────────────────────────────────

export function daysBetween(d1: string, d2: string): number | null {
	if (!d1 || !d2) return null;
	return Math.round((new Date(d2).getTime() - new Date(d1).getTime()) / 864e5);
}

export function formatDays(n: number | null): string {
	if (n === null) return '';
	if (n < 30) return `${n}d`;
	if (n < 365) return `${Math.round(n / 30)}m`;
	const y = Math.floor(n / 365);
	const d = n % 365;
	return d > 0 ? `${y}a ${d}d` : `${y}a`;
}

export function formatCartera(n: number | null): string {
	if (n === null) return '';
	if (n < 30) return `${n}d en cartera`;
	if (n < 365) return `${Math.round(n / 30)}m en cartera`;
	const y = Math.floor(n / 365);
	const d = n % 365;
	return d > 0 ? `${y}a ${d}d en cartera` : `${y}a en cartera`;
}

export function formatPublicado(n: number | null): string {
	if (n === null) return '';
	if (n < 30) return `${n}d publicado`;
	if (n < 365) return `${Math.round(n / 30)}m publicado`;
	const y = Math.floor(n / 365);
	const d = n % 365;
	return d > 0 ? `${y}a ${d}d publicado` : `${y}a publicado`;
}

// ─── Financial calculations ──────────────────────────────────────────────────

export function expensesByGroup(p: Property, group: ExpenseGroup): Expense[] {
	return p.expenses.filter((e) => e.expense_group === group);
}

export function expensesByPago(p: Property, tipo: TipoPago): Expense[] {
	return p.expenses.filter((e) => e.tipo_pago === tipo);
}

export function totalExpenses(p: Property): number {
	return p.expenses.reduce((a, e) => a + e.amount_usd, 0);
}

export function totalExpensesByGroup(p: Property, group: ExpenseGroup): number {
	return expensesByGroup(p, group).reduce((a, e) => a + e.amount_usd, 0);
}

export function totalExpensesByGroupAndPago(
	p: Property,
	group: ExpenseGroup,
	tipo: TipoPago
): number {
	return expensesByGroup(p, group)
		.filter((e) => e.tipo_pago === tipo)
		.reduce((a, e) => a + e.amount_usd, 0);
}

export function totalByPago(p: Property, tipo: TipoPago): number {
	return expensesByPago(p, tipo).reduce((a, e) => a + e.amount_usd, 0);
}

/** Costo total: compra + todos los gastos */
export function costoTotal(p: Property): number {
	return p.purchase_total_usd + totalExpenses(p);
}

/** Total blanco acumulado: compra blanco + gastos blanco */
export function totalBlanco(p: Property): number {
	return p.purchase_blanco_usd + totalByPago(p, 'blanco');
}

/** Total negro acumulado: compra negro + gastos negro */
export function totalNegro(p: Property): number {
	return p.purchase_negro_usd + totalByPago(p, 'negro');
}

/**
 * Blanqueo estimado: cuánto negro se recupera via venta en blanco.
 * blanqueo = min(negro_total, max(0, cobrado_blanco - costo_blanco))
 */
export function calcBlanqueo(
	costoB: number,
	costoN: number,
	cobradoB: number
): number {
	return Math.min(costoN, Math.max(0, cobradoB - costoB));
}

export function calcMargen(p: Property): { ganancia: number; blanqueo: number; pct: number } {
	const cTotal = costoTotal(p);
	const costoB = totalBlanco(p);
	const costoN = totalNegro(p);

	if (p.state === 'vendida' && p.sale_total_usd) {
		const vB = p.sale_blanco_usd ?? 0;
		const vN = p.sale_negro_usd ?? 0;
		const vTotal = vB + vN;
		const blanqueo = calcBlanqueo(costoB, costoN, vB);
		const ganancia = vTotal - cTotal;
		const pct = cTotal > 0 ? (ganancia / cTotal) * 100 : 0;
		return { ganancia, blanqueo, pct };
	}

	if (p.state === 'disponible_venta' && p.precio_publicado_usd) {
		const pub = p.precio_publicado_usd;
		const blanqueo = calcBlanqueo(costoB, costoN, pub);
		const ganancia = pub - cTotal;
		const pct = cTotal > 0 ? (ganancia / cTotal) * 100 : 0;
		return { ganancia, blanqueo, pct };
	}

	return { ganancia: 0, blanqueo: 0, pct: 0 };
}

// ─── Labels ──────────────────────────────────────────────────────────────────

export const STATE_LABELS: Record<string, string> = {
	en_analisis: 'En análisis',
	en_compra: 'En compra',
	en_renovacion: 'En renovación',
	disponible_venta: 'Disponible para venta',
	vendida: 'Vendida'
};

export const GROUP_LABELS: Record<string, string> = {
	compra: 'Gastos de compra',
	obra: 'Gastos de obra',
	servicios: 'Servicios',
	venta: 'Gastos de venta'
};

export const CONCEPT_LABELS: Record<string, string> = {
	comision_inmobiliaria: 'Comisión inmobiliaria',
	honorarios_escribania: 'Honorarios escribanía',
	impuestos: 'Impuestos',
	materiales: 'Materiales',
	mano_de_obra: 'Mano de obra',
	honorarios_arquitecto: 'Honorarios arquitecto/diseño',
	expensas: 'Expensas',
	servicios: 'Servicios (luz, gas, agua)',
	seguro: 'Seguro',
	publicidad: 'Publicación en portales'
};

export const GROUPS_BY_STATE: Record<string, string[]> = {
	compra: ['comision_inmobiliaria', 'honorarios_escribania', 'impuestos'],
	obra: ['materiales', 'mano_de_obra', 'honorarios_arquitecto'],
	servicios: ['expensas', 'servicios', 'seguro'],
	venta: ['publicidad', 'comision_inmobiliaria', 'honorarios_escribania', 'impuestos']
};
