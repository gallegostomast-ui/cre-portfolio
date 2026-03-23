import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import type { AuthUser } from '$lib/types';

const SESSION_KEY = 'cre_session';

function loadFromStorage(): AuthUser | null {
	if (!browser) return null;
	try {
		const raw = sessionStorage.getItem(SESSION_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

function createAuthStore() {
	let user = $state<AuthUser | null>(loadFromStorage());

	return {
		get user() {
			return user;
		},
		get isAuthenticated() {
			return user !== null;
		},
		/** Solo admin puede crear/eliminar usuarios y propiedades */
		get isAdmin() {
			return user?.role === 'admin';
		},
		/** Admin u operator pueden editar propiedades y gestionar gastos */
		get canEdit() {
			return user?.role === 'admin' || user?.role === 'operator';
		},
		get token() {
			return user?.token ?? null;
		},
		setUser(u: AuthUser) {
			user = u;
			if (browser) sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
		},
		logout() {
			user = null;
			if (browser) sessionStorage.removeItem(SESSION_KEY);
			goto('/login');
		}
	};
}

export const auth = createAuthStore();
