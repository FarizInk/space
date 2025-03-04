import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static'

export const f = new Hono()
	.use('/f/*', serveStatic({
		root: './',
		rewriteRequestPath: (path) =>
			path.replace(/^\/f/, '/uploads'),
	}))

export type Router = typeof f;
