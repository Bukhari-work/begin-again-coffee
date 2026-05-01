<script lang="ts">
	import { Sparkles, Utensils, Coffee } from "@lucide/svelte";

	interface FeaturedItem {
		name: string;
		price: string | number;
		description: string | null;
		category_name: string | null;
		image_url?: string | null;
	}

	let { item } = $props<{ item: FeaturedItem }>();

	const getCategoryIcon = (cat: string | null) => {
		const c = (cat || "").toLowerCase();
		if (c.includes("food") || c.includes("snack") || c.includes("makanan")) return Utensils;
		if (c.includes("signature")) return Sparkles;
		return Coffee;
	};

	let Icon = $derived(getCategoryIcon(item.category_name));

	let formattedPrice = $derived(
		item.price && !isNaN(Number(item.price))
			? `${Number(item.price) / 1000}K`
			: item.price || "N/A"
	);
</script>

<article
	class="group bg-card hover:border-primary relative flex aspect-5/7 flex-col overflow-hidden rounded-xl border-2 transition-colors duration-300"
>
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.03]"
		style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 8px 8px;"
		aria-hidden="true"
	></div>

	<figure
		class="bg-secondary/30 relative z-10 m-6 mb-4 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl"
	>
		{#if item.image_url}
			<img
				src={item.image_url}
				alt={item.name}
				loading="lazy"
				class="h-full w-full object-cover"
			/>
		{:else}
			<Icon class="text-muted-foreground/30 h-16 w-16" strokeWidth={1} aria-hidden="true" />
		{/if}
	</figure>

	<div class="relative z-10 shrink-0 px-6" aria-hidden="true">
		<div
			class="border-border/60 group-hover:border-primary border-t-2 border-dashed transition-colors"
		></div>
		<div
			class="bg-background border-border group-hover:border-primary absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full border transition-colors"
		></div>
		<div
			class="bg-background border-border group-hover:border-primary absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full border transition-colors"
		></div>
	</div>

	<div class="bg-secondary/20 relative z-10 flex shrink-0 flex-col p-6 pt-4">
		<header class="mb-4 grid grid-cols-[1fr_auto] items-center gap-x-4">
			<span
				class="text-primary col-span-2 font-mono text-sm font-bold tracking-widest uppercase"
			>
				{item.category_name || "Menu"}
			</span>

			<h3
				class="group-hover:text-primary min-w-0 truncate text-2xl leading-none font-black tracking-tight uppercase transition-colors"
				title={item.name}
			>
				{item.name}
			</h3>

			<data
				value={String(item.price)}
				class="bg-secondary text-foreground group-hover:text-primary min-w-12 rounded px-2 py-1 text-center font-bold transition-colors"
			>
				{formattedPrice}
			</data>
		</header>

		{#if item.description}
			<p
				class="text-muted-foreground line-clamp-3 min-h-16 font-mono text-xs leading-relaxed"
			>
				{item.description}
			</p>
		{:else}
			<div class="min-h-16" aria-hidden="true"></div>
		{/if}
	</div>
</article>
