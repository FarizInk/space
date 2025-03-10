import { createWriteStream } from 'fs';
import { Readable, PassThrough } from 'stream';
import type { ReadableStream } from 'stream/web';
import type { Context } from 'hono';
import busboy from 'busboy';
import sanitize from 'sanitize-filename'; // Optional but recommended
import Config, { pbClient } from '$lib/config';
import { getMimes, gigaToBytes } from '@/utils';

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

	const record = await pb.collection('s_files').create({
		"original_name": null,
		"name": null,
		"info": {
			is_cached: false,
			is_uploaded: false,
			extension: null,
			mime: null,
		},
		"size": fileSize,
		"loading_log": null,
	});

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
			console.error('Request stream error:', err);
			cleanupResources();
			resolveOnce(c.json({ message: 'Upload aborted by client' }, 400));
		});

		tracker.on('error', (err) => {
			console.error('Progress tracker error:', err);
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
				console.info(`Upload progress: ${progress}%`);
				lastLoggedProgress = progress;
			}
		});

		// Handle file upload
		bb.on('file', async (fieldname, file, info) => {
			const { filename } = info;
			if (!filename) {
				cleanupResources();
				return resolveOnce(c.json({ message: 'No filename provided' }, 400));
			}

			const originalFileName = sanitize(filename);
			const safeFilename = `${Date.now()}_${originalFileName}`;
			const savePath = `./uploads/${safeFilename}`;
			const mimes = getMimes(originalFileName);
			await pb.collection('s_files').update(record.id, {
				...record,
				"original_name": originalFileName,
				"name": safeFilename,
				"info": {
					...record.info,
					extension: originalFileName.split('.').pop() ?? null,
					mime: mimes.length >= 1 ? mimes[0] : null
				}
			});

			try {
				writeStream = createWriteStream(savePath);
			} catch (err) {
				console.error('File creation error:', err);
				return resolveOnce(c.json({ message: 'File creation failed' }, 500));
			}

			writeStream.on('finish', () => {
				console.info(`File saved to: ${savePath}`);
			});

			writeStream.on('error', (err) => {
				console.error('File write error:', err);
				cleanupResources();
				resolveOnce(c.json({ message: 'File write failed' }, 500));
			});

			file.pipe(writeStream).on('finish', () => {
				cleanupResources();
				resolveOnce(c.json({ message: 'File uploaded successfully' }));
			});

			file.on('error', (err) => {
				console.error('File stream error:', err);
				cleanupResources();
				resolveOnce(c.json({ message: 'File stream error' }, 500));
			});
		});

		bb.on('error', (err) => {
			console.error('Busboy parsing error:', err);
			cleanupResources();
			resolveOnce(c.json({ message: 'Upload processing failed' }, 500));
		});

		bb.on('close', () => {
			console.info('Upload processing completed');
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
		payload: await pb
			.collection('s_loading_log')
			.create({ status: 'draft' }),
	})
}
