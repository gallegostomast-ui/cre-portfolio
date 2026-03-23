import { env } from '$env/dynamic/private';
import type { Handle, HandleServerError } from '@sveltejs/kit';

const PROXY_PREFIX = '/proxy-api';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith(PROXY_PREFIX)) {
		const apiBase = env.INTERNAL_API_URL ?? 'http://localhost:3000';
		const path = event.url.pathname.slice(PROXY_PREFIX.length);
		const target = apiBase + path + event.url.search;

		const body = ['GET', 'HEAD'].includes(event.request.method)
			? undefined
			: await event.request.arrayBuffer();

		const upstream = await fetch(target, {
			method: event.request.method,
			headers: event.request.headers,
			body
		});

		return new Response(upstream.body, {
			status: upstream.status,
			statusText: upstream.statusText,
			headers: upstream.headers
		});
	}

	return resolve(event);
};

export const handleError: HandleServerError = ({ error, event }) => {
	if (event.url.pathname !== '/favicon.ico') {
		console.error('[SSR]', event.url.pathname, error);
	}
	return { message: 'Internal error' };
};
