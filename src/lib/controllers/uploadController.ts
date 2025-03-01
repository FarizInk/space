import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { parse } from 'content-disposition';
import { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';
import type { Context } from 'hono';

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB in bytes

const generateResponse = (msg = '', start = performance.now()) => {
	const time = `Execution time: ${performance.now() - start} ms`;
	return {
		msg,
		time
	};
};

export const uploadFile = async (c: Context) => {
	const start = performance.now();
	const body = c.req.raw.body as ReadableStream<Uint8Array>;

	if (!body) {
		return c.json(generateResponse('No file to upload', start), 400);
	}

	// Check the Content-Length header to validate file size
	const contentLength = c.req.header('Content-Length');
	if (!contentLength) {
		return c.json(generateResponse('Missing Content-Length header', start), 400);
	}

	const fileSize = parseInt(contentLength, 10);
	if (fileSize > MAX_FILE_SIZE) {
		return c.json(generateResponse('File size exceeds the 2GB limit', start), 413); // 413 Payload Too Large
	}

	// Get the filename from the Content-Disposition header
	const contentDisposition = c.req.header('Content-Disposition');
	if (!contentDisposition) {
		return c.json(generateResponse('Missing Content-Disposition header', start), 400);
	}

	const parsed = parse(contentDisposition);
	const filename = parsed.parameters.filename;
	if (!filename) {
		return c.json(generateResponse('Filename not found in Content-Disposition', start), 400);
	}

	// Extract the file extension
	// const fileExtension = filename.split('.').pop(); // Get the part after the last "."
	// const uniqueFileName = `${Date.now()}.${fileExtension}`;
	const uniqueFileName = `${Date.now()}_${filename}`;

	// Create a writable stream to save the file
	const fileStream = createWriteStream(`./uploads/${uniqueFileName}`);

	try {
		const nodeReadableStream = Readable.fromWeb(body);

		// Pipe the incoming stream to the file stream
		await pipeline(nodeReadableStream, fileStream);
		return c.json(generateResponse('File uploaded successfully!', start), 200);
	} catch (error) {
		console.error('Upload failed:', error);
		return c.json(generateResponse('File upload failed', start), 500);
	}
};
