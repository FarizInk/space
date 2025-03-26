<script lang="ts">
	import LoadingIcon from '$lib/components/icons/LoadingIcon.svelte';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { getMimes, gigaToBytes, readableBytes } from '$root/utils';
	import { changeTheme } from '$lib/utils';
	import axios from 'axios';
	import {
		FolderSearch,
		MoonStarIcon,
		SquareDashedMousePointerIcon,
		Sun,
		SunMoonIcon,
		Trash2Icon,
		UploadIcon,
		TrashIcon,
		DownloadIcon,
		Share2Icon
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import Dropzone from 'svelte-file-dropzone';
	import { toast } from 'svelte-sonner';
	import PocketBase, { ClientResponseError, type RecordModel } from 'pocketbase';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';

	let theme = $state<null | 'light' | 'dark'>(null);
	let autoUpload = $state<boolean>(false);
	let files = $state<{
		accepted: File[];
		rejected: File[];
	}>({
		accepted: [],
		rejected: []
	});

	let statuses = $state<('draft' | 'waiting' | 'processing' | 'done' | 'failed')[]>([]);
	// let uploadeds = $state([]);
	let onDropzoneDrop = $state<boolean>(false);
	let maxFileSize = $state<number>(gigaToBytes(2));
	let pb: null | PocketBase = null;
	let uploadedFiles = $state<RecordModel[]>([]);

	onMount(async () => {
		theme = localStorage.theme ?? null;
		autoUpload = localStorage.autoUpload === 'false' ? false : true;
		try {
			const { data } = await axios.get('/api/config');
			pb = new PocketBase(data.POCKETBASE_URL);
			maxFileSize = gigaToBytes(data.FILE_SIZE);
		} catch (error) {
			console.error(error);
		}
		fetchFileFromPB();
	});

	function handleFilesSelect(e: CustomEvent<{ acceptedFiles: File[]; fileRejections: File[] }>) {
		onDropzoneDrop = false;
		const { acceptedFiles, fileRejections } = e.detail;
		files.accepted = [...files.accepted, ...acceptedFiles];
		files.rejected = [...files.rejected, ...fileRejections];

		acceptedFiles.forEach(() => statuses?.push('draft'));

		if (autoUpload) {
			upload();
		}
	}

	function removeFile(index: number) {
		files.accepted.splice(index, 1);
		statuses?.splice(index, 1);
	}

	async function fetchFileFromPB() {
		const ids = localStorage.getItem('files')?.split(',') ?? [];
		for (let i = 0; i < ids.length; i++) {
			try {
				const record = await pb?.collection('files').getOne(ids[i]);
				if (record) uploadedFiles.push(record);
			} catch (error) {
				const err = error as ClientResponseError; // Type assertion
				if (err?.response?.status === 404) {
					localStorage.files = ids.filter((id) => id !== ids[i]);
				}
			}
		}
	}

	// function checkWaiting() {}

	async function upload(queueAll: boolean = true) {
		if (queueAll) {
			statuses
				.filter((status) => status === 'draft')
				.forEach((status, index) => (statuses[index] = 'waiting'));
		}

		const index = statuses?.findIndex((status) => status === 'waiting');
		if (index !== undefined && index >= 0) {
			const file = files.accepted[index];
			statuses[index] = 'processing';
			try {
				const { data } = await axios.post(
					'/api/upload',
					{ file },
					{
						headers: {
							'Content-Type': 'multipart/form-data'
						}
					}
				);

				files.accepted.splice(0, 1);
				statuses.splice(0, 1);

				uploadedFiles.push(data.payload);

				const fileIds = localStorage.getItem('files')?.split(',') ?? [];
				fileIds.push(data.payload.id);
				localStorage.files = fileIds;
				toast.success(data.message);
			} catch {
				statuses[index] = 'failed';
			}
			upload(false);
		}
	}

	function switchTheme() {
		if (theme === null) {
			theme = 'light';
		} else if (theme === 'light') {
			theme = 'dark';
		} else if (theme === 'dark') {
			theme = null;
		}

		changeTheme(theme);
	}

	function saveAutoUpload(value: boolean) {
		localStorage.autoUpload = value;
		if (value) upload();
	}

	function cancelQueue(index: number) {
		console.log(index);
	}

	function openFileInNewTab(index: number) {
		const file = uploadedFiles[index];
		const fileName = file.id + (file?.info?.extension ? `.${file.info.extension}` : '');
		window.open(`/f/${fileName}`, '_blank')?.focus();
	}

	async function deleteFile(id: string) {
		try {
			const { data } = await axios.post('/api/delete', { id });
			console.log(data)
		} catch (error) {
			console.error(error);
		}
	}
</script>

<div class="flex h-screen w-screen flex-col items-center justify-between gap-2 px-3">
	<div class="flex w-full items-center justify-center gap-2 py-2">
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger
					class={buttonVariants({
						variant: 'outline',
						size: 'icon',
						class: 'rounded-full hover:cursor-pointer'
					})}
					onclick={switchTheme}
				>
					{#if theme === 'light'}
						<Sun aria-hidden="true" />
					{:else if theme === 'dark'}
						<MoonStarIcon aria-hidden="true" />
					{:else}
						<SunMoonIcon aria-hidden="true" />
					{/if}
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>
						{theme === 'light'
							? 'Light Mode'
							: theme === 'dark'
								? 'Dark Mode'
								: 'Depends on your system'}
					</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
		<div class="flex items-center gap-2">
			<Switch id="auto-upload" bind:checked={autoUpload} onCheckedChange={saveAutoUpload} />
			<Label for="auto-upload">Auto Upload</Label>
		</div>
	</div>
	<div class="flex w-full flex-1 flex-col items-center justify-center gap-2">
		<Dropzone
			maxSize={maxFileSize}
			on:drop={handleFilesSelect}
			class="hover:border-primary flex aspect-video w-full max-w-[400px] flex-col items-center justify-center gap-2 rounded-xl border bg-gray-50 p-3 hover:cursor-pointer dark:bg-transparent {onDropzoneDrop
				? 'border-primary shadow-primary/40 shadow-[0px_0px_50px_13px_rgba(0,0,0,1)]'
				: 'border-dashed'}"
			on:dragenter={() => (onDropzoneDrop = true)}
			on:dragleave={() => (onDropzoneDrop = false)}
			onclick={() => (onDropzoneDrop = true)}
			on:filedialogcancel={() => (onDropzoneDrop = false)}
			on:droprejected={() => toast.error('File Rejected')}
		>
			<div class="flex flex-wrap items-center gap-2 text-center">
				<span class="flex items-center gap-1 text-gray-800 dark:text-gray-400">
					<SquareDashedMousePointerIcon class="size-4" aria-hidden="true" />
					Drop file here
				</span>
				or
				<span
					class="text-primary flex items-center gap-1 decoration-dashed underline-offset-2 hover:cursor-pointer hover:underline"
				>
					<FolderSearch class="size-4" aria-hidden="true" />
					Browse File
				</span>
			</div>
			<span class="text-xs text-gray-700 dark:text-gray-500">You can upload file up to 2Gb</span>
		</Dropzone>

		<div class="w-full max-w-[400px]">
			<div class="space-y-2">
				{#each files.accepted as item, index (index)}
					<div class="flex items-center justify-between gap-2">
						<div class="flex-1 overflow-hidden">
							<Tooltip.Provider>
								<Tooltip.Root>
									<Tooltip.Trigger><p class="truncate">{item.name}</p></Tooltip.Trigger>
									<Tooltip.Content>
										<p>{item.name}</p>
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
							<div class="flex items-center justify-between gap-4 text-xs text-gray-500">
								<div class="flex items-center gap-4">
									<p class="whitespace-nowrap">{readableBytes(item.size)}</p>
									<p class="truncate">{getMimes(item.name) ?? ''}</p>
								</div>
								{#if statuses[index] === 'processing'}
									<div class="text-primary font-bold">100%</div>
								{/if}
							</div>
						</div>
						<div>
							{#if statuses[index] === 'draft' || statuses[index] === 'failed'}
								<Button
									type="button"
									variant="destructive"
									size="icon"
									class="hover:cursor-pointer"
									onclick={() => removeFile(index)}
								>
									<Trash2Icon aria-hidden="true" />
								</Button>
							{:else if statuses[index] === 'waiting'}
								<Button
									type="button"
									variant="secondary"
									size="icon"
									class="hover:cursor-pointer"
									onclick={() => cancelQueue(index)}
								>
									<LoadingIcon />
								</Button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			{#if statuses.filter((status) => status === 'draft').length >= 1}
				<Button
					type="button"
					class="mt-3 w-full hover:cursor-pointer"
					onclick={() => upload()}
					disabled={statuses.filter((s) => s === 'draft').length === 0}
				>
					<UploadIcon aria-hidden="true" />
					Upload
				</Button>
			{/if}

			{#if uploadedFiles.length >= 1}
				<div class="mt-2 border-t pt-2">
					<p class="mb-1 text-lg font-bold">Your Files</p>
					<div class="space-y-2">
						{#each uploadedFiles as file, index (file.id)}
							<ContextMenu.Root>
								<ContextMenu.Trigger>
									<button
										type="button"
										class="hover:border-primary hover:bg-primary/20 group w-full rounded-md border p-2 text-left hover:cursor-pointer"
										onclick={() => openFileInNewTab(index)}
									>
										<div class="group-hover:text-primary truncate font-bold">{file.name}</div>
										<div
											class="flex items-center justify-between gap-4 text-xs text-black/50 group-hover:text-black dark:text-white/50 group-hover:dark:text-white"
										>
											<p class="truncate">{getMimes(file.name)[0] ?? '-'}</p>
											<p class="whitespace-nowrap">{readableBytes(file.size, 0)}</p>
										</div>
									</button>
								</ContextMenu.Trigger>
								<ContextMenu.Content>
									<ContextMenu.Item class="cursor-pointer gap-1">
										<DownloadIcon class="size-4" aria-hidden="true" />
										Download
									</ContextMenu.Item>
									<ContextMenu.Item class="cursor-pointer gap-1">
										<Share2Icon class="size-4" aria-hidden="true" />
										Share
									</ContextMenu.Item>
									<ContextMenu.Item
										class="cursor-pointer gap-1 text-red-500 data-[highlighted]:bg-red-500/20 data-[highlighted]:text-red-500"
										onclick={() => deleteFile(file.id)}
									>
										<TrashIcon class="size-4" aria-hidden="true" />
										Delete
									</ContextMenu.Item>
								</ContextMenu.Content>
							</ContextMenu.Root>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
