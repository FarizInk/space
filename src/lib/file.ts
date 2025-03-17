import { Hono, type Context } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
// import { getMimeType } from 'hono/utils/mime';
import { pbClient } from './config';
import { next24 } from './utils';
import config from './config';
import { getTelegramClient } from "$lib/server/telegramClient";

export const f = new Hono()
	.use(async (_, next) => {
		try {
			const pathes = _.req.path.replace('/f', '').split('/');
			if (pathes.length >= 2) {
				const fullFileName = pathes[1];
				const filename = fullFileName.split('.')[0];
				// const mime = getMimeType(fullFileName)
				// const extension = mime ? fullFileName.split('.').pop() : null
				// console.log({ filename, extension })
				const pb = await pbClient();
				await pb.collection('files').update(filename, { destroy_at: next24() });
			}
		} catch (error) {
			if (config.DEBUG) console.log(error);
		}
		await next();
	})
	.use(
		'/f/*',
		serveStatic({
			root: './',
			rewriteRequestPath: (path) => path.replace(/^\/f/, '/uploads')
		})
	)
	.get('/f/:filename', async (c: Context) => {
		// NOTE: Add check while telegram client is using by another client
		const { filename } = c.req.param();
		const id = filename.split('.')[0];
		const pb = await pbClient()
		const payload = await pb.collection('files').getOne(id);
		const msgId = payload?.info?.message_id ?? null
		const ext = payload.info.extension ? `.${payload.info.extension}` : ''
		const filePath = `./uploads/${payload.id}${ext}`

		const client = getTelegramClient()
		if (!config.TELEGRAM_CHAT_ID || client === null) return c.json({ message: "Something Wrong! please contact admin." }, 500)
		const messages = await client.getMessages(config.TELEGRAM_CHAT_ID, { ids: msgId });
		if (messages.length >= 1) {
			const message = messages[0]
			if (!message.media) return c.json({ message: "Something Wrong! please contact admin." }, 500)
			await client.downloadMedia(message.media, {
				outputFile: filePath
			});
		}

		return c.redirect(`/f/${filename}`)
	});

export type Router = typeof f;
