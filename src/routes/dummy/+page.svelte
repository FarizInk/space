<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { makeClient } from '$lib/make-client.js';
	import Button from '@/components/ui/button/button.svelte';
	import { CheckIcon, UndoIcon, Trash2Icon, PlusIcon } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	export let data;
	const client = makeClient(fetch);

	let isLoading = false;
	let taskName = '';

	async function handleActionClick(id: string, action: `${keyof (typeof client.tasks)[':id']}`) {
		try {
			isLoading = true;
			await client.tasks[':id'][action].$post({
				param: { id }
			});
			await invalidateAll();
		} catch (error) {
			console.error(error);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center">
	<Card.Root class="w-full max-w-[500px]">
		<Card.Header>
			<Card.Title>My Tasks</Card.Title>
			<Card.Description>Card Description</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance class="flex items-center gap-2">
				<Input type="text" name="name" required bind:value={taskName} disabled={isLoading} />
				<Button type="submit" class="hover:cursor-pointer" size="icon" disabled={isLoading}>
					<PlusIcon aria-hidden="true" />
				</Button>
			</form>

			<div class="mt-4 space-y-3">
				{#if data.tasks.length === 0}
					<p>You don't have any tasks! Be free little bird</p>
				{:else}
					{#each data.tasks as task (task.id)}
						<div class="flex items-center justify-between gap-2">
							<span class={task.done ? 'text-gray-500 line-through' : ''}>{task.name}</span>
							{#if !task.done}
								<Button
									type="button"
									class="size-5 h-auto text-xs hover:cursor-pointer"
									onclick={() => handleActionClick(task.id, 'finish')}
								>
									<CheckIcon class="size-4" aria-hidden="true" />
								</Button>
							{:else}
								<div class="flex items-center gap-2">
									<Button
										type="button"
										variant="secondary"
										class="size-5 h-auto text-xs hover:cursor-pointer"
										onclick={() => handleActionClick(task.id, 'undo')}
									>
										<UndoIcon class="size-4" aria-hidden="true" />
									</Button>
									<Button
										type="button"
										variant="destructive"
										class="size-5 h-auto text-xs hover:cursor-pointer"
										onclick={() => handleActionClick(task.id, 'delete')}
									>
										<Trash2Icon class="size-4" aria-hidden="true" />
									</Button>
								</div>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		</Card.Content>
		<!-- <Card.Footer>
			<p>Card Footer</p>
		</Card.Footer> -->
	</Card.Root>
</div>
