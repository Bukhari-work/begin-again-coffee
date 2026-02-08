<script lang="ts">
	import { Sparkles, Utensils, Coffee } from "@lucide/svelte";

	interface FeaturedItem {
		name: string;
		price: string | number;
		description: string | null;
		category_name: string | null;
	}

	let { item } = $props<{ item: FeaturedItem }>();

	const getCategoryIcon = (cat: string | null) => {
		const c = (cat || "").toLowerCase();
		if (c.includes("food") || c.includes("snack") || c.includes("makanan")) return Utensils;
		if (c.includes("signature")) return Sparkles;
		return Coffee;
	};

	let Icon = $derived(getCategoryIcon(item.category_name));
</script>

<div
	class="group bg-card relative flex flex-col justify-between overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
>
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.03]"
		style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 8px 8px;"
	></div>

	<div class="relative flex flex-1 flex-col p-6">
		<div class=" mb-5 flex items-center gap-3">
			<div
				class="bg-secondary text-foreground border-border/50 flex h-8 w-8 items-center justify-center rounded border"
			>
				<Icon class="h-4 w-4" />
			</div>
			<span class="text-primary font-mono text-sm font-bold tracking-widest uppercase">
				{item.category_name || "Menu"}
			</span>
		</div>

		<h3
			class="group-hover:text-primary mb-3 text-2xl leading-none font-black tracking-tight uppercase transition-colors"
		>
			{item.name}
		</h3>

		<p class="text-muted-foreground line-clamp-3 font-mono text-sm leading-relaxed">
			{item.description}
		</p>
	</div>

	<div class="relative z-10 px-6">
		<div class="border-border/60 border-t-2 border-dashed"></div>
		<div
			class="bg-background border-border absolute -top-1 -left-1.5 h-3 w-3 rounded-full border"
		></div>
		<div
			class="bg-background border-border absolute -top-1 -right-1.5 h-3 w-3 rounded-full border"
		></div>
	</div>

	<div class="bg-secondary/20 relative p-6">
		<div class="flex items-center justify-end">
			<span
				class="bg-secondary/80 text-foreground min-w-12 shrink-0 rounded px-2 py-1 text-center text-lg font-bold"
			>
				{Number(item.price) / 1000}K
			</span>
		</div>
	</div>
</div>
