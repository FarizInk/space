import {
	DEBUG,
	POCKETBASE_URL,
	POCKETBASE_USERNAME,
	POCKETBASE_PASSWORD,
	FILE_SIZE,
	UPLOAD_PATH,
	TELEGRAM_BOT_TOKEN,
	TELEGRAM_API_ID,
	TELEGRAM_API_HASH,
	TELEGRAM_CHAT_ID,
} from '$env/static/private';
import type { Context } from 'hono';
import PocketBase from 'pocketbase';

interface Config {
	DEBUG: boolean;
	POCKETBASE_URL: string;
	POCKETBASE_USERNAME: string;
	POCKETBASE_PASSWORD: string;
	FILE_SIZE: number;
	UPLOAD_PATH: string;
	TELEGRAM_BOT_TOKEN: string;
	TELEGRAM_API_ID: number;
	TELEGRAM_API_HASH: string;
	TELEGRAM_CHAT_ID: number;
}

const config: Config = {
	DEBUG: DEBUG && DEBUG === 'true' ? true : false,
	POCKETBASE_URL: POCKETBASE_URL ?? '',
	POCKETBASE_USERNAME: POCKETBASE_USERNAME ?? '',
	POCKETBASE_PASSWORD: POCKETBASE_PASSWORD ?? '',
	FILE_SIZE: FILE_SIZE ? parseFloat(FILE_SIZE) : 2,
	UPLOAD_PATH: UPLOAD_PATH ?? '',
	TELEGRAM_BOT_TOKEN: TELEGRAM_BOT_TOKEN ?? '',
	TELEGRAM_API_ID: TELEGRAM_API_ID ? parseInt(TELEGRAM_API_ID) : 0,
	TELEGRAM_API_HASH: TELEGRAM_API_HASH ?? '',
	TELEGRAM_CHAT_ID: TELEGRAM_CHAT_ID ? parseInt(TELEGRAM_CHAT_ID) : 0,
};

export default config;

export const publicConfig = (c: Context) => {
	return c.json({
		DEBUG: config.DEBUG,
		FILE_SIZE: config.FILE_SIZE,
		POCKETBASE_URL: config.POCKETBASE_URL
	});
};

export async function pbClient() {
	const pb = new PocketBase(config.POCKETBASE_URL);

	// disable autocancellation so that we can handle async requests from multiple users
	pb.autoCancellation(false);

	// option 1: authenticate as superuser using email/password (could be filled with ENV params)
	await pb
		.collection('_superusers')
		.authWithPassword(config.POCKETBASE_USERNAME, config.POCKETBASE_PASSWORD, {
			// This will trigger auto refresh or auto reauthentication in case
			// the token has expired or is going to expire in the next 30 minutes.
			autoRefreshThreshold: 30 * 60
		});

	return pb;
}
