<script lang="ts">
	import '../app.css';
	import NavBar from '$lib/components/NavBar.svelte';
	
	let { children } = $props();
</script>

<main class="w-full p-4">
	{@render children()}
</main>
