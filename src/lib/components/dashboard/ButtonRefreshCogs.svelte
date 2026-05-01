<script lang="ts">
	// 1. Import the invalidation function from SvelteKit's navigation module
	import { invalidateAll } from "$app/navigation";

	let isSyncing = false;
	let notification = { message: "", isError: false };

	async function handleSync() {
		isSyncing = true;
		notification = { message: "", isError: false };

		try {
			const response = await fetch("/api/refresh-cogs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to synchronize margins.");
			}

			// Success! The database is now updated.
			notification = { message: result.message, isError: false };

			// This forces the current page's load() function to run again.
			await invalidateAll();
		} catch (err: unknown) {
			// Provide a default fallback message
			let errorMessage = "An unexpected error occurred.";

			// Safely check if the caught error is a standard JavaScript Error object
			if (err instanceof Error) {
				errorMessage = err.message;
			}

			notification = { message: errorMessage, isError: true };
		} finally {
			isSyncing = false;
			setTimeout(() => {
				notification.message = "";
			}, 5000);
		}
	}
</script>

<div class="flex flex-col items-start gap-3">
	<button
		on:click={handleSync}
		disabled={isSyncing}
		class="flex items-center gap-2 rounded-md bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400"
	>
		{#if isSyncing}
			<svg
				class="h-4 w-4 animate-spin text-white"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
			<span>Synchronizing...</span>
		{:else}
			<svg
				class="h-4 w-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				></path>
			</svg>
			<span>Refresh Margins</span>
		{/if}
	</button>

	{#if notification.message}
		<div
			class={`rounded p-3 text-sm font-medium ${notification.isError ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}
		>
			{notification.message}
		</div>
	{/if}
</div>
