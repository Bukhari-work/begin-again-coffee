<script lang="ts">
	import { onMount, onDestroy } from "svelte";

	let time = "";
	let interval: ReturnType<typeof setInterval>;
	function updateTime() {
		const now = new Date();

		// UTC time in ms
		const utc = now.getTime() + now.getTimezoneOffset() * 60_000;

		// UTC +8
		const utc8 = new Date(utc + 8 * 60 * 60_000);

		time = utc8.toLocaleTimeString("en-GB", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		});
	}

	onMount(() => {
		updateTime();
		interval = setInterval(updateTime, 1000);
	});

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<div class="font-mono text-lg">
	{time}
</div>
