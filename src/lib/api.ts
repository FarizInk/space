import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import {
	createTask,
	deleteTask,
	finishTask,
	getTask,
	TaskCreateInput,
	TaskParam,
	undoTask
} from './controllers/taskController';
import { uploadFile } from './controllers/uploadController';
import { publicConfig } from './config';

export const router = new Hono()
	.get('/tasks', getTask)
	.post('/tasks', zValidator('json', TaskCreateInput), createTask)
	.post('/tasks/:id/finish', zValidator('param', TaskParam), finishTask)
	.post('/tasks/:id/undo', zValidator('param', TaskParam), undoTask)
	.post('/tasks/:id/delete', zValidator('param', TaskParam), deleteTask)
	.post('/upload', uploadFile)
	.get('/config', publicConfig)

export const api = new Hono().route('/api', router);

export type Router = typeof router;
