<script lang="ts">
	import type { PageData } from "./$types";
	import ShopStatus from "$lib/components/ShopStatus.svelte";
	import ItemRow from "$lib/components/ItemRow.svelte";
	import ItemCard from "$lib/components/ItemCard.svelte";
	import { Coffee, Utensils, Sparkles, Wifi, CupSoda, Funnel } from "@lucide/svelte";

	let { data } = $props<{ data: PageData }>();

	interface MenuItem {
		id: number;
		name: string;
		price: number;
		description: string | null;
		category_name: string | null;
		featured_rank: number;
	}

	// Logic: Filter by rank, availability & Sort
	let featuredMenu = $derived.by(() => {
		const items = data.menuItems as MenuItem[];
		const featured = items.filter((item) => item.featured_rank > 5);
		return featured.sort((a, b) => (a.featured_rank ?? 0) - (b.featured_rank ?? 0));
	});

	let groupedMenu = $derived.by(() => {
		const groups: Record<string, MenuItem[]> = {};
		for (const item of data.menuItems as MenuItem[]) {
			const cat = item.category_name || "Others";
			if (!groups[cat]) groups[cat] = [];
			groups[cat].push(item);
		}
		return groups;
	});

	const getCategoryIcon = (cat: string) => {
		const c = cat.toLowerCase();
		if (c.includes("makanan")) return Utensils;
		if (c.includes("selain kopi")) return CupSoda;
		if (c.includes("filter")) return Funnel;
		return Coffee;
	};
</script>

<div class="bg-background text-foreground min-h-screen pb-24 font-sans">
	<!-- HEADER -->
	<header class="border-border bg-card mb-8 border-b">
		<div class="container mx-auto grid gap-6 px-4 py-12 md:grid-cols-2 md:items-end md:px-6">
			<div>
				<div class="mb-4 flex flex-wrap items-center gap-3">
					<ShopStatus />
				</div>
				<h1
					class="text-5xl leading-[0.9] font-black tracking-tighter uppercase md:text-7xl"
				>
					Menu<span class="text-primary">.</span><br />
					&<span class="text-primary">Deskripsi</span>
				</h1>
			</div>

			<div class="flex flex-col items-start gap-4 md:items-end md:text-right">
				<p
					class="text-muted-foreground hidden max-w-md text-sm leading-relaxed md:block md:text-base"
				>
					Diseduh dengan <strong>sepenuh hati.</strong><br />
					Disajikan gasan <strong>pian nikmati.</strong><br />
					Tinggal <strong>pesan aja lagi.</strong>
				</p>
			</div>
		</div>
	</header>

	<!-- CONTENT -->
	<section class="container mx-auto mt-12 px-4 md:px-6">
		{#if data.menuItems.length === 0}
			<div
				class="border-border bg-card flex min-h-72 flex-col items-center justify-center rounded-xl border p-12 text-center"
			>
				<Coffee class="text-muted-foreground mb-4 h-12 w-12 opacity-20" />
				<p class="font-mono text-sm tracking-widest uppercase">[ Menu Loading... ]</p>
			</div>
		{:else}
			<!-- FEATURED -->
			{#if featuredMenu.length > 0}
				<section class="mb-20">
					<div class="mb-6 flex items-center gap-3">
						<Sparkles class="text-primary h-5 w-5" />
						<h2
							class="text-primary font-mono text-sm font-bold tracking-widest uppercase"
						>
							Signature Selection
						</h2>
					</div>

					<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each featuredMenu as item (item.id)}
							<ItemCard {item} />
						{/each}
					</div>
				</section>
			{/if}

			<!-- MAIN GRID -->
			<div class="grid gap-12 lg:grid-cols-[1fr_320px]">
				<!-- MENU LIST -->
				<div class="mx-auto w-full max-w-2xl space-y-16">
					{#each Object.entries(groupedMenu) as [category, items] (category)}
						{@const Icon = getCategoryIcon(category)}
						<section>
							<header class="mb-6 flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div
										class="bg-secondary border-border flex h-10 w-10 items-center justify-center rounded border"
									>
										<Icon class="h-5 w-5" />
									</div>
									<h3
										class="text-primary font-mono text-lg font-bold tracking-widest uppercase"
									>
										{category}
									</h3>
								</div>

								<span
									class="bg-secondary text-muted-foreground rounded px-2 py-1 font-mono text-[10px] font-bold"
								>
									{items.length} ITEMS
								</span>
							</header>

							<div
								class="border-border flex flex-col gap-6 border-l border-dashed pl-6 font-mono text-sm"
							>
								{#each items as item (item.id)}
									<ItemRow {item} />
								{/each}
							</div>
						</section>
					{/each}
				</div>

				<!-- SIDE RAIL -->
				<aside class="lg:sticky lg:top-24">
					<div class="bg-secondary/30 border-border rounded-xl border p-6">
						<div class="mb-4 flex items-center gap-3">
							<div class="bg-background rounded-full p-2">
								<Wifi class="text-primary h-5 w-5" />
							</div>
							<div>
								<p class="text-xs font-bold uppercase">Free Wifi Access</p>
								<p class="text-muted-foreground text-[10px]">
									High Speed Connection
								</p>
							</div>
						</div>

						<div class="border-border border-t pt-4 font-mono text-xs">
							<div class="flex justify-between">
								<span class="text-muted-foreground">SSID</span>
								<span class="font-bold">Poco M3</span>
							</div>
							<div class="mt-2 flex justify-between">
								<span class="text-muted-foreground">PASS</span>
								<span class="font-bold">Ace2413</span>
							</div>
						</div>
					</div>
				</aside>
			</div>
		{/if}
	</section>
</div>
