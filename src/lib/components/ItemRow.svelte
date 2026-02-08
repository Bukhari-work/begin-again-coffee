<script lang="ts">
	import { slide } from "svelte/transition";
	import { ChevronDown } from "@lucide/svelte";

	// Define props
	let { item } = $props<{
		item: {
			id: number;
			name: string;
			price: number;
			description: string | null;
		};
	}>();

	// Local state - only affects this specific row
	let isOpen = $state(false);
	const hasDesc = $derived(!!item.description);

	// Optimization: Pre-calculate price string once
	const formattedPrice = $derived(Number(item.price) / 1000 + "K");

	function toggle() {
		if (hasDesc) isOpen = !isOpen;
	}
</script>

<button
	class="group flex w-full flex-col gap-1 rounded-xl text-left focus:outline-none"
	onclick={toggle}
	disabled={!hasDesc}
>
	<div
		class={`flex w-full items-end-safe justify-between ${
			hasDesc ? "cursor-pointer" : "cursor-default"
		}`}
	>
		<div class="flex items-center gap-1.5">
			<span
				class={`text-base font-bold tracking-tight transition-colors ${
					isOpen ? "text-primary" : "group-hover:text-primary"
				}`}
			>
				{item.name}
			</span>

			{#if hasDesc}
				<ChevronDown
					class={`text-muted-foreground/50 h-3.5 w-3.5 transition-all duration-200 ${
						isOpen ? "text-primary -rotate-180" : "group-hover:text-foreground"
					}`}
				/>
			{/if}
		</div>

		<span
			class={`bg-secondary/80 min-w-12 shrink-0 rounded px-2 py-1 text-center text-sm font-bold transition-colors ${
				isOpen ? "text-primary" : "group-hover:text-primary"
			}`}
		>
			{formattedPrice}
		</span>
	</div>

	{#if isOpen && hasDesc}
		<div transition:slide={{ duration: 200, axis: "y" }}>
			<p class="text-muted-foreground px-2 pt-2 text-xs leading-relaxed opacity-80">
				{item.description}
			</p>
		</div>
	{/if}

	<div class="border-border/40 mt-2 w-full border-b border-dashed last:hidden"></div>
</button>
