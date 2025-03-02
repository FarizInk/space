<script lang="ts">
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner/index.js';

	let { children } = $props();
</script>

<Toaster richColors position="bottom-center" closeButton />
{@render children()}
