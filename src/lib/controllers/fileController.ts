import { createWriteStream } from 'fs';
import { Readable, PassThrough } from 'stream';
import type { ReadableStream } from 'stream/web';
import type { Context } from 'hono';
import busboy from 'busboy';
import sanitize from 'sanitize-filename'; // Optional but recommended
import Config, { pbClient } from '$lib/config';
import { getMimes, gigaToBytes, next24 } from '@/utils';

const MAX_FILE_SIZE = gigaToBytes(Config.FILE_SIZE); // 2GB in bytes

export const uploadFile = async (c: Context): Promise<Response> => {
	const req = c.req.raw;
	const contentType = req.headers.get('content-type');

	if (!contentType?.startsWith('multipart/form-data')) {
		return c.json({ message: 'Content-Type must be multipart/form-data' }, 400);
	}

	const contentLength = c.req.header('Content-Length');
	if (!contentLength) {
		return c.json({ message: 'Missing Content-Length header' }, 400);
	}

	const fileSize = parseInt(contentLength, 10);
	if (fileSize > MAX_FILE_SIZE) {
		return c.json({ message: 'File size exceeds 2GB limit' }, 413);
	}

	const headers = new Headers(req.headers);
	headers.set('Content-Type', contentType);

	const pb = await pbClient();

	let record = await pb.collection('files').create({
		original_name: null,
		name: null,
		info: {
			is_cached: false,
			encryption_key: null,
			extension: null,
			mime: null,
			message_id: null,
		},
		size: fileSize,
		loading_log: null
	});
	const logs: Array<string> = [];

	return new Promise<Response>((resolve) => {
		let resolved = false;
		const resolveOnce = (response: Response) => {
			if (!resolved) {
				resolved = true;
				resolve(response);
			}
		};

		const bb = busboy({ headers: Object.fromEntries(headers.entries()) });
		let writeStream: ReturnType<typeof createWriteStream> | null = null;

		const nodeStream = Readable.fromWeb(req.body as ReadableStream<Uint8Array>);
		const tracker = new PassThrough();

		// Handle stream errors
		nodeStream.on('error', (err) => {
			if (Config.DEBUG) console.error('Request stream error:', err);
			cleanupResources();
			resolveOnce(c.json({ message: 'Upload aborted by client' }, 400));
		});

		tracker.on('error', (err) => {
			if (Config.DEBUG) console.error('Progress tracker error:', err);
			cleanupResources();
			resolveOnce(c.json({ message: 'Upload processing error' }, 500));
		});

		// Track upload progress
		let totalBytesRead = 0;
		let lastLoggedProgress = 0;
		tracker.on('data', (chunk) => {
			totalBytesRead += chunk.length;
			const progress = Math.round((totalBytesRead / fileSize) * 100);
			if (progress > lastLoggedProgress) {
				const msg = `Upload progress: ${progress}%`;
				if (Config.DEBUG) console.info(msg);
				logs.push(msg);
				lastLoggedProgress = progress;
			}
		});

		// Handle file upload
		bb.on('file', async (fieldname, file, info) => {
			const { filename } = info;
			if (!filename) {
				cleanupResources();
				await pb.collection('files').delete(record.id);
				return resolveOnce(c.json({ message: 'No filename provided' }, 400));
			}

			const originalName = sanitize(filename);
			const extension = originalName.split('.').pop() ?? null;
			const savePath = `./uploads/${record.id + (extension ? '.' + extension : '')}`;
			const mimes = getMimes(originalName);
			record = await pb.collection('files').update(record.id, {
				...record,
				name: originalName,
				info: {
					...record.info,
					extension,
					mime: mimes.length >= 1 ? mimes[0] : null
				},
				destroy_at: next24()
			});

			try {
				writeStream = createWriteStream(savePath);
			} catch (err) {
				if (Config.DEBUG) console.error('File creation error:', err);
				await pb.collection('files').delete(record.id);
				return resolveOnce(c.json({ message: 'File creation failed' }, 500));
			}

			writeStream.on('finish', () => {
				const msg = `File saved to: ${savePath}`;
				if (Config.DEBUG) console.info(msg);
				logs.push(msg);
			});

			writeStream.on('error', async (err) => {
				if (Config.DEBUG) console.error('File write error:', err);
				cleanupResources();
				await pb.collection('files').delete(record.id);
				resolveOnce(c.json({ message: 'File write failed' }, 500));
			});

			file.pipe(writeStream).on('finish', async () => {
				cleanupResources();
				const message = 'File uploaded successfully';
				record = await pb.collection('files').update(record.id, {
					...record,
					info: {
						...record.info,
						is_cached: true
					},
					logs
				});
				resolveOnce(c.json({ message, payload: record }));
			});

			file.on('error', async (err) => {
				if (Config.DEBUG) console.error('File stream error:', err);
				cleanupResources();
				await pb.collection('files').delete(record.id);
				resolveOnce(c.json({ message: 'File stream error' }, 500));
			});
		});

		bb.on('error', async (err) => {
			if (Config.DEBUG) console.error('Busboy parsing error:', err);
			cleanupResources();
			await pb.collection('files').delete(record.id);
			resolveOnce(c.json({ message: 'Upload processing failed' }, 500));
		});

		bb.on('close', () => {
			if (Config.DEBUG) console.info('Upload processing completed');
		});

		// Cleanup function for resources
		const cleanupResources = () => {
			if (writeStream && !writeStream.destroyed) {
				writeStream.destroy();
			}
			if (!nodeStream.destroyed) nodeStream.destroy();
			if (!tracker.destroyed) tracker.destroy();
			if (!bb.destroyed) bb.destroy();
		};

		// Start processing
		nodeStream.pipe(tracker).pipe(bb);
	});
};

export async function generateLodingTicket(c: Context) {
	const pb = await pbClient();
	return c.json({
		payload: await pb.collection('logs').create({ status: 'draft', type: 'uploading' })
	});
}

// NOTE: delete API is only for authenticated user
export async function deleteFile(c: Context) {
	return c.json({
		foo: 'bar'
	})
}
