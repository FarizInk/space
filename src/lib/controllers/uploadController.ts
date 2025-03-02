import { createWriteStream } from 'fs';
import { Readable, PassThrough } from 'stream';
import type { ReadableStream } from 'stream/web';
import type { Context } from 'hono';
import busboy from 'busboy';
import sanitize from 'sanitize-filename'; // Optional but recommended

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB in bytes

export const uploadFile = async (c: Context): Promise<Response> => {
	const req = c.req.raw;
	const contentType = req.headers.get('content-type');

	if (!contentType?.startsWith('multipart/form-data')) {
		return c.json({ error: 'Content-Type must be multipart/form-data' }, 400);
	}

	const contentLength = c.req.header('Content-Length');
	if (!contentLength) {
		return c.json({ error: 'Missing Content-Length header' }, 400);
	}

	const fileSize = parseInt(contentLength, 10);
	if (fileSize > MAX_FILE_SIZE) {
		return c.json({ error: 'File size exceeds 2GB limit' }, 413);
	}

	const headers = new Headers(req.headers);
	headers.set('Content-Type', contentType);

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
			resolveOnce(c.json({ error: 'Upload aborted by client' }, 400));
		});

		tracker.on('error', (err) => {
			console.error('Progress tracker error:', err);
			cleanupResources();
			resolveOnce(c.json({ error: 'Upload processing error' }, 500));
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
		bb.on('file', (fieldname, file, info) => {
			const { filename } = info;
			if (!filename) {
				cleanupResources();
				return resolveOnce(c.json({ error: 'No filename provided' }, 400));
			}

			const safeFilename = sanitize(filename);
			const savePath = `./uploads/${Date.now()}_${safeFilename}`;

			try {
				writeStream = createWriteStream(savePath);
			} catch (err) {
				console.error('File creation error:', err);
				return resolveOnce(c.json({ error: 'File creation failed' }, 500));
			}

			writeStream.on('finish', () => {
				console.info(`File saved to: ${savePath}`);
			});

			writeStream.on('error', (err) => {
				console.error('File write error:', err);
				cleanupResources();
				resolveOnce(c.json({ error: 'File write failed' }, 500));
			});

			file.pipe(writeStream).on('finish', () => {
				cleanupResources();
				resolveOnce(c.json({ message: 'File uploaded successfully' }));
			});

			file.on('error', (err) => {
				console.error('File stream error:', err);
				cleanupResources();
				resolveOnce(c.json({ error: 'File stream error' }, 500));
			});
		});

		bb.on('error', (err) => {
			console.error('Busboy parsing error:', err);
			cleanupResources();
			resolveOnce(c.json({ error: 'Upload processing failed' }, 500));
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
