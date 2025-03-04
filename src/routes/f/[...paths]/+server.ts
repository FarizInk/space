import { f } from '$lib/file';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ request }) => f.fetch(request);
export const POST: RequestHandler = ({ request }) => f.fetch(request);
