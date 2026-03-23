import { PUBLIC_API_URL } from '$env/static/public';
import type {
	AuthUser,
	CreateExpensePayload,
	CreatePropertyPayload,
	LoginResponse,
	Meta,
	Property,
	PropertyState,
	TotpResponse,
	UpdateExpensePayload,
	UpdatePropertyPayload
} from '$lib/types';

export const BASE_URL = PUBLIC_API_URL;

class ApiError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
		this.name = 'ApiError';
	}
}

async function request<T>(
	path: string,
	options: RequestInit = {},
	token?: string
): Promise<T> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options.headers as Record<string, string>)
	};
	if (token) headers['Authorization'] = `Bearer ${token}`;

	const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

	if (!res.ok) {
		let message = `HTTP ${res.status}`;
		try {
			const body = await res.json();
			message = body.message || body.error || message;
		} catch {}
		throw new ApiError(res.status, message);
	}

	if (res.status === 204) return undefined as T;
	return res.json();
}

// ─── Health ──────────────────────────────────────────────────────────────────

export async function healthCheck(): Promise<boolean> {
	try {
		const res = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(5000) });
		return res.ok;
	} catch {
		return false;
	}
}

// ─── Normalization ───────────────────────────────────────────────────────────
// La API puede devolver campos numéricos como strings. Los coercemos a number.

function n(v: unknown): number {
	const num = Number(v);
	return isNaN(num) ? 0 : num;
}

function normalizeExpense(e: import('$lib/types').Expense): import('$lib/types').Expense {
	return {
		...e,
		amount_usd: n(e.amount_usd),
		amount_ars: e.amount_ars != null ? n(e.amount_ars) : null,
		exchange_rate: e.exchange_rate != null ? n(e.exchange_rate) : null
	};
}

function normalizeProperty(p: import('$lib/types').Property): import('$lib/types').Property {
	return {
		...p,
		purchase_blanco_usd: n(p.purchase_blanco_usd),
		purchase_negro_usd: n(p.purchase_negro_usd),
		purchase_total_usd: n(p.purchase_total_usd),
		precio_publicado_usd: p.precio_publicado_usd != null ? n(p.precio_publicado_usd) : null,
		sale_blanco_usd: p.sale_blanco_usd != null ? n(p.sale_blanco_usd) : null,
		sale_negro_usd: p.sale_negro_usd != null ? n(p.sale_negro_usd) : null,
		sale_total_usd: p.sale_total_usd != null ? n(p.sale_total_usd) : null,
		expenses: (p.expenses ?? []).map(normalizeExpense)
	};
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(username: string, password: string): Promise<LoginResponse> {
	return request<LoginResponse>('/auth/login', {
		method: 'POST',
		body: JSON.stringify({ username, password })
	});
}

export async function verifyTotp(
	partial_token: string,
	totp_code: string
): Promise<TotpResponse> {
	return request<TotpResponse>('/auth/totp', {
		method: 'POST',
		body: JSON.stringify({ partial_token, totp_code })
	});
}

// ─── Meta ────────────────────────────────────────────────────────────────────

export async function getMeta(token: string): Promise<Meta> {
	return request<Meta>('/meta', {}, token);
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface CreateUserPayload {
	username: string;
	password: string;
	role: 'admin' | 'operator' | 'viewer';
}

export interface CreateUserResponse {
	id: string;
	username: string;
	role: 'admin' | 'operator' | 'viewer';
	totp_secret_base32: string;
	otpauth_url: string;
}

export async function createUser(
	token: string,
	payload: CreateUserPayload
): Promise<CreateUserResponse> {
	return request<CreateUserResponse>('/users', { method: 'POST', body: JSON.stringify(payload) }, token);
}

export interface UserListItem {
	id: string;
	username: string;
	role: 'admin' | 'operator' | 'viewer';
	created_at: string;
}

export async function getUsers(token: string): Promise<UserListItem[]> {
	return request<UserListItem[]>('/users', {}, token);
}

export async function updateUserRole(
	token: string,
	id: string,
	role: 'admin' | 'operator' | 'viewer'
): Promise<UserListItem> {
	return request<UserListItem>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) }, token);
}

export async function deleteUser(token: string, id: string): Promise<void> {
	return request<void>(`/users/${id}`, { method: 'DELETE' }, token);
}

// ─── Properties ──────────────────────────────────────────────────────────────

export async function getProperties(token: string, state?: PropertyState): Promise<Property[]> {
	const qs = state ? `?state=${state}` : '';
	const data = await request<Property[]>(`/properties${qs}`, {}, token);
	return data.map(normalizeProperty);
}

export async function createProperty(
	token: string,
	payload: CreatePropertyPayload
): Promise<Property> {
	const data = await request<Property>('/properties', { method: 'POST', body: JSON.stringify(payload) }, token);
	return normalizeProperty(data);
}

export async function updateProperty(
	token: string,
	id: string,
	payload: UpdatePropertyPayload
): Promise<Property> {
	const data = await request<Property>(
		`/properties/${id}`,
		{ method: 'PATCH', body: JSON.stringify(payload) },
		token
	);
	return normalizeProperty(data);
}

export async function deleteProperty(token: string, id: string): Promise<void> {
	return request<void>(`/properties/${id}`, { method: 'DELETE' }, token);
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export async function createExpense(
	token: string,
	payload: CreateExpensePayload
): Promise<import('$lib/types').Expense> {
	const data = await request<import('$lib/types').Expense>(`/expenses`, { method: 'POST', body: JSON.stringify(payload) }, token);
	return normalizeExpense(data);
}

export async function updateExpense(
	token: string,
	id: string,
	payload: UpdateExpensePayload
): Promise<import('$lib/types').Expense> {
	const data = await request<import('$lib/types').Expense>(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
	return normalizeExpense(data);
}

export async function deleteExpense(token: string, id: string): Promise<void> {
	return request<void>(`/expenses/${id}`, { method: 'DELETE' }, token);
}

export { ApiError };
export type { AuthUser };
