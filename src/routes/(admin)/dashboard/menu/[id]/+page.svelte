<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Badge } from "$lib/components/ui/badge";
	import { ArrowLeft, Trash2, Plus, Scale, ChefHat } from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	let { data } = $props<{ data: PageData }>();

	// 1. DEFINE TYPES
	interface RecipeItem {
		ingredient_id: number;
		amount: string;
		total_cost: string;
		name: string;
		unit: string;
	}

	interface IngredientOption {
		id: number;
		name: string;
		unit: string;
	}

	// --- CALCULATIONS ---
	// Cast 'ing' to RecipeItem so TS knows it has .total_cost
	let totalCost = $derived(
		(data.recipe as RecipeItem[]).reduce(
			(sum: number, ing: RecipeItem) => sum + Number(ing.total_cost),
			0
		)
	);

	let sellingPrice = $derived(Number(data.item.price));

	let marginPercent = $derived(
		sellingPrice > 0 ? ((sellingPrice - totalCost) / sellingPrice) * 100 : 0
	);

	const formatMoney = (val: number) =>
		new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);

	// --- REACTIVE UNIT SELECTOR ---
	// Make sure this is bound to a string, as select values are strings
	let selectedIngredientId = $state("");

	// Cast 'i' to IngredientOption so TS knows it has .id and .unit
	let activeUnit = $derived(
		(data.allIngredients as IngredientOption[]).find(
			(i: IngredientOption) => String(i.id) === selectedIngredientId
		)?.unit || "—"
	);
</script>

<div class="bg-muted/10 flex min-h-screen flex-col items-center px-4 py-12">
	<div class="w-full max-w-md space-y-8">
		<div class="flex items-center justify-between">
			<a
				href="/dashboard/menu"
				class="text-muted-foreground hover:text-primary inline-flex items-center font-mono text-xs transition-colors"
			>
				<ArrowLeft class="mr-2 h-3 w-3" /> MENU
			</a>
			<div class="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
				Kertas Resep
			</div>
		</div>

		<div class="relative drop-shadow-xl">
			<div class="border-border/60 bg-card border-2">
				<div
					class="bg-muted/10 border-border/20 absolute top-4 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border"
				></div>

				<div class="border-border/40 border-b-2 border-dashed p-8 pb-4 text-center">
					<div
						class="text-muted-foreground/50 mb-2 flex items-center justify-center gap-2"
					>
						<ChefHat class="h-8 w-8" />
					</div>

					<h1 class="mb-1 text-3xl leading-none font-black tracking-tighter uppercase">
						{data.item.name}
					</h1>
					<div class="bg-muted inline-flex items-center gap-2 rounded-sm px-2 py-1">
						<span class="font-mono text-[10px] font-bold">ITEM #{data.item.id}</span>
					</div>

					<div class="text-muted-foreground mt-4 font-mono text-xs uppercase">
						Harga Jual: <span class="text-foreground font-bold"
							>{formatMoney(sellingPrice)}</span
						>
					</div>
				</div>

				<div class="min-h-50 space-y-3 p-6">
					<div
						class="text-muted-foreground border-border/40 mb-2 flex justify-between border-b pb-2 font-mono text-[10px] uppercase"
					>
						<span>Qty / Item</span>
						<span>Cost</span>
					</div>

					{#if data.recipe.length === 0}
						<div
							class="text-muted-foreground/40 py-8 text-center font-mono text-xs italic"
						>
							[ TICKET EMPTY ]
						</div>
					{:else}
						{#each data.recipe as ing (ing.id)}
							<div
								class="group flex items-baseline justify-between font-mono text-sm"
							>
								<div class="flex flex-1 items-baseline gap-2">
									<span class="font-bold whitespace-nowrap"
										>{ing.amount}{ing.unit}</span
									>
									<span class="text-muted-foreground truncate text-xs uppercase"
										>{ing.name}</span
									>
								</div>

								<div class="flex items-center gap-3">
									<span class="tabular-nums"
										>{formatMoney(Number(ing.total_cost))}</span
									>
									<form
										action="?/removeIngredient"
										method="POST"
										use:enhance
										class="opacity-0 transition-opacity group-hover:opacity-100"
									>
										<input
											type="hidden"
											name="ingredient_id"
											value={ing.ingredient_id}
										/>
										<button
											class="text-destructive transition-transform hover:scale-125"
										>
											<Trash2 class="h-3 w-3" />
										</button>
									</form>
								</div>
							</div>
						{/each}
					{/if}
				</div>

				<div
					class="border-border/40 bg-secondary/20 space-y-4 border-t-2 border-dashed p-6"
				>
					<div class="text-muted-foreground flex justify-between font-mono text-sm">
						<span class="uppercase">Total Cost</span>
						<span>{formatMoney(totalCost)}</span>
					</div>

					<div class="relative border-t border-black/10 pt-4">
						<div class="flex items-end justify-between">
							<div>
								<div class="text-muted-foreground text-[10px] font-bold uppercase">
									Total Keuntungan
								</div>
								<div class="font-mono text-2xl font-black tracking-tighter">
									{formatMoney(sellingPrice - totalCost)}
								</div>
							</div>
							<div class="text-right">
								<Badge
									variant={marginPercent < 50 ? "destructive" : "secondary"}
									class="rounded-none px-2 py-1 font-mono"
								>
									{marginPercent.toFixed(1)}% MARGIN
								</Badge>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="bg-card border-border/60 border-2 border-dashed p-4 shadow-sm">
			<div class="bg-card border-border/40 border-2 border-dashed p-4">
				<div class="mb-4 flex items-center gap-2">
					<div class="bg-primary/20 text-primary-foreground rounded-sm p-1">
						<Scale class="h-3 w-3" />
					</div>
					<span class="text-muted-foreground text-xs font-bold tracking-wider uppercase"
						>Resep</span
					>
				</div>

				<form action="?/addIngredient" method="POST" use:enhance class="space-y-4">
					<div class="space-y-1.5">
						<label
							for="ing"
							class="text-muted-foreground text-[10px] font-bold uppercase"
							>Pilih Bahan</label
						>
						<select
							id="ing"
							name="ingredient_id"
							bind:value={selectedIngredientId}
							class="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-sm border px-3 py-1 font-mono text-xs uppercase focus-visible:ring-1 focus-visible:outline-none"
						>
							<option value="" disabled selected>-- Bahan --</option>
							{#each data.allIngredients as option (option.id)}
								<option value={String(option.id)}>{option.name}</option>
							{/each}
						</select>
					</div>

					<div class="space-y-1.5">
						<label
							for="amt"
							class="text-muted-foreground text-[10px] font-bold uppercase"
							>Quantity Needed</label
						>
						<div class="relative flex items-center">
							<Input
								id="amt"
								name="amount"
								type="number"
								step="0.1"
								placeholder="0.00"
								class="z-10 h-10 rounded-r-none border-r-0 font-mono text-sm focus:z-20"
							/>
							<div
								class="bg-muted border-input flex h-10 min-w-12 items-center justify-center rounded-r-sm border border-l-0 px-3"
							>
								<span
									class="text-muted-foreground font-mono text-xs font-bold uppercase"
								>
									{activeUnit}
								</span>
							</div>
						</div>
					</div>

					<Button
						type="submit"
						size="sm"
						class="mt-2 h-10 w-full rounded-sm font-bold tracking-wide uppercase"
					>
						<Plus class="mr-2 h-3 w-3" /> Tambah ke Resep
					</Button>
				</form>
			</div>
		</div>
	</div>
</div>
