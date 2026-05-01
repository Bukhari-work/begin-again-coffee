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

{#snippet headerContent()}
	<div class="flex min-w-0 flex-1 items-center gap-2">
		<span
			class="truncate text-base font-bold tracking-tight transition-colors {isOpen
				? 'text-primary'
				: 'group-hover:text-primary'}"
			title={item.name}
		>
			{item.name}
		</span>

		{#if hasDesc}
			<ChevronDown
				class="h-4 w-4 shrink-0 transition-transform duration-200 {isOpen
					? 'text-primary -rotate-180'
					: 'text-muted-foreground/50 group-hover:text-foreground'}"
			/>
		{/if}
	</div>

	<span
		class="bg-secondary min-w-12 shrink-0 rounded px-2 py-1 text-center text-sm font-bold transition-colors {isOpen
			? 'text-primary'
			: 'group-hover:text-primary'}"
	>
		{formattedPrice}
	</span>
{/snippet}

<div class="group flex w-full flex-col text-left">
	{#if hasDesc}
		<button
			type="button"
			onclick={toggle}
			aria-expanded={isOpen}
			class="flex w-full cursor-pointer items-center justify-between gap-4 focus:outline-none"
		>
			{@render headerContent()}
		</button>
	{:else}
		<div class="flex w-full cursor-default items-center justify-between gap-4">
			{@render headerContent()}
		</div>
	{/if}

	{#if isOpen && hasDesc}
		<p
			transition:slide={{ duration: 200, axis: "y" }}
			class="text-muted-foreground w-full px-2 pt-2 text-xs leading-relaxed opacity-80"
		>
			{item.description}
		</p>
	{/if}

	<div class="border-border/40 mt-2 w-full border-b border-dashed last:hidden"></div>
</div>
