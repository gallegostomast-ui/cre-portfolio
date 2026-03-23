import * as api from '$lib/api/client';
import type {
	CreateExpensePayload,
	CreatePropertyPayload,
	Expense,
	Meta,
	Property,
	UpdateExpensePayload,
	UpdatePropertyPayload
} from '$lib/types';

function createPropertiesStore() {
	let properties = $state<Property[]>([]);
	let meta = $state<Meta | null>(null);
	let loading = $state(false);
	let syncStatus = $state<'idle' | 'loading' | 'ok' | 'error'>('idle');
	let syncMessage = $state('');

	function setSyncing(msg: string) {
		syncStatus = 'loading';
		syncMessage = msg;
	}

	function setSyncOk(msg: string) {
		syncStatus = 'ok';
		syncMessage = msg;
	}

	function setSyncError(msg: string) {
		syncStatus = 'error';
		syncMessage = msg;
	}

	async function loadAll(token: string) {
		setSyncing('Conectando...');
		loading = true;
		try {
			const [props, m] = await Promise.all([api.getProperties(token), api.getMeta(token)]);
			properties = props;
			meta = m;
			setSyncOk('Sincronizado · ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
		} catch {
			setSyncError('Sin conexión');
		} finally {
			loading = false;
		}
	}

	async function addProperty(token: string, payload: CreatePropertyPayload): Promise<Property> {
		setSyncing('Guardando...');
		const created = await api.createProperty(token, payload);
		properties = [...properties, { ...created, expenses: [] }];
		setSyncOk('Guardado');
		return created;
	}

	async function editProperty(
		token: string,
		id: string,
		payload: UpdatePropertyPayload
	): Promise<Property> {
		setSyncing('Guardando...');
		const updated = await api.updateProperty(token, id, payload);
		properties = properties.map((p) =>
			p.id === id ? { ...p, ...updated } : p
		);
		setSyncOk('Guardado');
		return updated;
	}

	async function removeProperty(token: string, id: string): Promise<void> {
		setSyncing('Eliminando...');
		await api.deleteProperty(token, id);
		properties = properties.filter((p) => p.id !== id);
		setSyncOk('Eliminado');
	}

	async function addExpense(token: string, payload: CreateExpensePayload): Promise<Expense> {
		setSyncing('Guardando...');
		const expense = await api.createExpense(token, payload);
		properties = properties.map((p) =>
			p.id === payload.property_id
				? { ...p, expenses: [...p.expenses, expense] }
				: p
		);
		setSyncOk('Guardado');
		return expense;
	}

	async function editExpense(
		token: string,
		propertyId: string,
		expenseId: string,
		payload: UpdateExpensePayload
	): Promise<Expense> {
		setSyncing('Guardando...');
		const updated = await api.updateExpense(token, expenseId, payload);
		properties = properties.map((p) =>
			p.id === propertyId
				? {
						...p,
						expenses: p.expenses.map((e) => (e.id === expenseId ? { ...e, ...updated } : e))
					}
				: p
		);
		setSyncOk('Guardado');
		return updated;
	}

	async function removeExpense(
		token: string,
		propertyId: string,
		expenseId: string
	): Promise<void> {
		setSyncing('Eliminando...');
		await api.deleteExpense(token, expenseId);
		properties = properties.map((p) =>
			p.id === propertyId
				? { ...p, expenses: p.expenses.filter((e) => e.id !== expenseId) }
				: p
		);
		setSyncOk('Eliminado');
	}

	return {
		get properties() {
			return properties;
		},
		get meta() {
			return meta;
		},
		get loading() {
			return loading;
		},
		get syncStatus() {
			return syncStatus;
		},
		get syncMessage() {
			return syncMessage;
		},
		loadAll,
		addProperty,
		editProperty,
		removeProperty,
		addExpense,
		editExpense,
		removeExpense
	};
}

export const propertiesStore = createPropertiesStore();
