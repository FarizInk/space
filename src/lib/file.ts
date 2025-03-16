import { Hono, type Context } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
// import { getMimeType } from 'hono/utils/mime';
import { pbClient } from './config';
import { next24 } from './utils';
import config from './config';

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
				await pb.collection('s_files').update(filename, { destroy_at: next24() });
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
	.get('/f/:filename', (c: Context) => {
		const { filename } = c.req.param();
		return c.json({
			filename
		});
	});

export type Router = typeof f;
