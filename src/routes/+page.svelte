<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import axios from 'axios';
	import { Trash2Icon, UploadIcon } from 'lucide-svelte';
	import Dropzone from 'svelte-file-dropzone';

	let files = $state<{
		accepted: File[];
		rejected: File[];
	}>({
		accepted: [],
		rejected: []
	});

	let statuses = $state<('processing' | 'done' | 'waiting' | 'draft')[]>([]);
	// let uploadeds = $state([]);

	function handleFilesSelect(e: CustomEvent<{ acceptedFiles: File[]; fileRejections: File[] }>) {
		const { acceptedFiles, fileRejections } = e.detail;
		files.accepted = [...files.accepted, ...acceptedFiles];
		files.rejected = [...files.rejected, ...fileRejections];

		acceptedFiles.forEach(() => statuses?.push('draft'));
	}

	function formatBytes(bytes: number, decimals: number = 2): string {
		if (bytes === 0) return '0 Bytes';

		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
	}

	function removeFile(index: number) {
		files.accepted.splice(index, 1);
		statuses?.splice(index, 1);
	}

	// function checkWaiting() {}

	async function upload() {
		const index = statuses?.findIndex((status) => status === 'draft');
		if (index !== undefined && index >= 0) {
			const file = files.accepted[index];
			const { data } = await axios.post(
				'/api/upload',
				{ file },
				{
					headers: {
						'Content-Type': 'multipart/form-data',
						'Content-Disposition': `form-data; name="file"; filename="${file.name}"`
					}
				}
			);

			console.log(data);
		}
	}
</script>

<div class="flex h-screen w-screen flex-col items-center justify-center gap-2 px-3">
	<Dropzone
		maxSize={2 * 1024 * 1024 * 1024}
		on:drop={handleFilesSelect}
		class="flex aspect-video w-full max-w-[400px] items-center justify-center rounded-xl border border-dashed bg-transparent p-3 hover:cursor-pointer"
		on:dragenter={() => console.log('enter')}
		on:dragleave={() => console.log('leave')}
		on:dragover={() => console.log('over')}
	>
		<div class="text-center">
			Drag and Drop here <br /> or <br />
			<span
				class="text-primary decoration-dashed underline-offset-2 hover:cursor-pointer hover:underline"
			>
				Browse File
			</span>
		</div>
	</Dropzone>

	<div class="w-full max-w-[400px]">
		<div class="space-y-2">
			{#each files.accepted as item, index (index)}
				<div class="flex items-center justify-between gap-2">
					<div>
						<div>{item.name}</div>
						<div class="text-xs text-gray-500">{formatBytes(item.size)}</div>
					</div>
					<div>
						<Button
							type="button"
							variant="destructive"
							size="icon"
							class="hover:cursor-pointer"
							onclick={() => removeFile(index)}
						>
							<Trash2Icon aria-hidden="true" />
						</Button>
					</div>
				</div>
			{/each}
		</div>
		{#if files.accepted.length >= 1}
			<Button type="button" class="mt-3 w-full hover:cursor-pointer" onclick={upload}>
				<UploadIcon aria-hidden="true" />
				Upload
			</Button>
		{/if}
	</div>
</div>
