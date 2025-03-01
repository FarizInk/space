import type { Context } from 'hono';
import { z } from 'zod';

export const Task = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
	done: z.boolean()
});

export type Task = z.infer<typeof Task>;

export const TaskCreateInput = Task.pick({ name: true });

export type TaskCreateInput = z.infer<typeof TaskCreateInput>;

export const TaskParam = Task.pick({ id: true });
export type TaskParam = z.infer<typeof TaskParam>;

/**
 * This will be our in-memory data store
 */
let tasks: Task[] = [];

export const getTask = (c: Context) => {
	return c.json<Task[]>(tasks);
};

export const createTask = async (c: Context) => {
	const body = await c.req.json<TaskCreateInput>();
	const task = {
		id: crypto.randomUUID(),
		name: body.name,
		done: false
	};
	tasks = [...tasks, task];
	return c.json(task);
};

export const finishTask = (c: Context) => {
	const { id } = c.req.param();
	const task = tasks.find((task) => task.id === id);
	if (task) {
		task.done = true;
		return c.json(task);
	}

	throw c.json({ message: 'Task not found' }, 404);
};

export const undoTask = (c: Context) => {
	const { id } = c.req.param();
	const task = tasks.find((task) => task.id === id);
	if (task) {
		task.done = false;
		return c.json(task);
	}

	throw c.json({ message: 'Task not found' }, 404);
};

export const deleteTask = (c: Context) => {
	const { id } = c.req.param();
	tasks = tasks.filter((task) => task.id !== id);
	return c.json({ message: 'Task deleted' });
};
