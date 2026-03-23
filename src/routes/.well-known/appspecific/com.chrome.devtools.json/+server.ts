import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = () => {
	return new Response(JSON.stringify({ workspace: { root: '', uuid: '' } }), {
		headers: { 'Content-Type': 'application/json' }
	});
};
