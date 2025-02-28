<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate, invalidateAll } from '$app/navigation';
	import { makeClient } from '$lib/make-client.js';
	import Button from '@/components/ui/button/button.svelte';
	import { CircleCheck, Circle } from 'lucide-svelte';
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
			// await invalidate(client.tasks.$url());
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
				<Button type="submit" class="hover:cursor-pointer" disabled={isLoading}>Add</Button>
			</form>

			<div class="mt-4 space-y-3">
				{#if data.tasks.length === 0}
					<p>You don't have any tasks! Be free little bird</p>
				{:else}
					{#each data.tasks as task (task.id)}
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-1">
								<div>
									{#if task.done}
										<CircleCheck class="mr-2 size-4" />
									{:else}
										<Circle class="mr-2 size-4" />
									{/if}
								</div>
                                {task.name}
							</div>
							{#if !task.done}
								<Button
									type="button"
									class="hover:cursor-pointer px-3 py-2 h-auto"
									onclick={() => handleActionClick(task.id, 'finish')}
								>
									Finish
								</Button>
							{:else}
								<div class="flex items-center gap-2">
									<Button
										type="button"
										variant="secondary"
										class="hover:cursor-pointer px-3 py-2 h-auto"
										onclick={() => handleActionClick(task.id, 'undo')}
									>
										Undo
									</Button>
									<Button
										type="button"
										variant="destructive"
										class="hover:cursor-pointer px-3 py-2 h-auto"
										onclick={() => handleActionClick(task.id, 'delete')}
									>
										Delete
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
