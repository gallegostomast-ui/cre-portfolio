// ─── Auth ───────────────────────────────────────────────────────────────────

export interface LoginResponse {
	partial_token: string;
}

export interface TotpResponse {
	token: string;
	user: {
		id: string;
		username: string;
		role: 'admin' | 'viewer';
	};
}

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface AuthUser {
	id: string;
	username: string;
	role: UserRole;
	token: string;
}

// ─── Properties ─────────────────────────────────────────────────────────────

export type PropertyState =
	| 'en_analisis'
	| 'en_compra'
	| 'en_renovacion'
	| 'disponible_venta'
	| 'vendida';

export interface Property {
	id: string;
	name: string;
	direccion: string;
	state: PropertyState;
	purchase_blanco_usd: number;
	purchase_negro_usd: number;
	purchase_total_usd: number;
	purchase_date: string | null;
	precio_publicado_usd: number | null;
	url_posteo: string | null;
	fecha_publicacion: string | null;
	sale_blanco_usd: number | null;
	sale_negro_usd: number | null;
	sale_total_usd: number | null;
	sale_date: string | null;
	expenses: Expense[];
}

export interface CreatePropertyPayload {
	name: string;
	state: PropertyState;
	direccion: string;
	purchase_blanco_usd: number;
	purchase_negro_usd: number;
	purchase_date?: string;
}

export interface UpdatePropertyPayload {
	name?: string;
	state?: PropertyState;
	direccion?: string;
	purchase_blanco_usd?: number;
	purchase_negro_usd?: number;
	purchase_date?: string;
	precio_publicado_usd?: number;
	url_posteo?: string;
	fecha_publicacion?: string;
	sale_blanco_usd?: number;
	sale_negro_usd?: number;
	sale_date?: string;
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export type ExpenseGroup = 'compra' | 'obra' | 'servicios' | 'venta';
export type TipoPago = 'blanco' | 'negro';

export type ExpenseConcept =
	| 'comision_inmobiliaria'
	| 'honorarios_escribania'
	| 'impuestos'
	| 'materiales'
	| 'mano_de_obra'
	| 'honorarios_arquitecto'
	| 'expensas'
	| 'servicios'
	| 'seguro'
	| 'publicidad';

export interface Expense {
	id: string;
	property_id: string;
	expense_group: ExpenseGroup;
	concept: ExpenseConcept | string;
	description: string | null;
	amount_usd: number;
	amount_ars: number | null;
	exchange_rate: number | null;
	expense_date: string;
	tipo_pago: TipoPago;
}

export interface CreateExpensePayload {
	property_id: string;
	expense_group: ExpenseGroup;
	concept: string;
	description?: string;
	amount_usd?: number;
	amount_ars?: number;
	exchange_rate?: number;
	expense_date: string;
	tipo_pago: TipoPago;
}

export interface UpdateExpensePayload {
	concept?: string;
	description?: string;
	amount_usd?: number;
	amount_ars?: number;
	exchange_rate?: number;
	expense_date?: string;
	tipo_pago?: TipoPago;
}

// ─── Meta ────────────────────────────────────────────────────────────────────

export interface MetaItem {
	value: string;
	label: string;
}

export interface Meta {
	states: MetaItem[];
	expense_groups: MetaItem[];
	concepts: MetaItem[];
	tipo_pago: MetaItem[];
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export type FilterState = 'todos' | PropertyState;
export type TabId = 'resumen' | 'gastos' | 'resultado' | 'config';
