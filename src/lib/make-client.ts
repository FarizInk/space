import type { Router } from '$lib/api';
import { hc } from 'hono/client';

let browserClient: ReturnType<typeof hc<Router>> | undefined;

export const makeClient = (fetch: Window['fetch']): ReturnType<typeof hc<Router>> => {
	const isBrowser = typeof window !== 'undefined';
	const origin = isBrowser ? window.location.origin : '';

	if (isBrowser && browserClient) {
		return browserClient;
	}

	const client = hc<Router>(origin + '/api', { fetch });

	if (isBrowser) {
		browserClient = client;
	}

	return client;
};
