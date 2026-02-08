<script lang="ts">
	import { onMount, onDestroy } from "svelte";

	let hours = 0;
	let minutes = 0;
	let seconds = 0;
	let interval: ReturnType<typeof setInterval>;

	function updateTime() {
		const now = new Date();
		const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
		const utc8 = new Date(utc + 8 * 60 * 60_000);

		hours = utc8.getHours();
		minutes = utc8.getMinutes();
		seconds = utc8.getSeconds();
	}

	onMount(() => {
		updateTime();
		interval = setInterval(updateTime, 1000);
	});

	onDestroy(() => clearInterval(interval));
</script>

<div class="flex flex-col items-center justify-center">
	<svg viewBox="0 0 100 100" class="h-40 w-40">
		<!-- Clock face -->
		<circle cx="50" cy="50" r="48" class="fill-background stroke-border" />

		<!-- Hour hand -->
		<line
			x1="50"
			y1="50"
			x2="50"
			y2="28"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
			transform="rotate({(hours % 12) * 30 + minutes * 0.5} 50 50)"
		/>

		<!-- Minute hand -->
		<line
			x1="50"
			y1="50"
			x2="50"
			y2="20"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			transform="rotate({minutes * 6} 50 50)"
		/>

		<!-- Second hand -->
		<line
			x1="50"
			y1="50"
			x2="50"
			y2="16"
			stroke="red"
			stroke-width="1"
			transform="rotate({seconds * 6} 50 50)"
		/>

		<circle cx="50" cy="50" r="2" fill="currentColor" />
	</svg>

	<div class="text-muted-foreground mt-2 text-center text-sm">UTC +8</div>
</div>
