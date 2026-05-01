<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Badge } from "$lib/components/ui/badge";
	import { ArrowLeft, Trash2, Plus, Scale, ChefHat, Layers } from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	let { data } = $props<{ data: PageData }>();

	// 1. COMPREHENSIVE TYPE DEFINITIONS
	interface RecipeItem {
		ingredient_id: number;
		amount: string | number;
		total_cost: string | number;
		name: string;
		unit: string;
		cost_per_unit?: string | number;
	}

	interface Modifier {
		modifier_id: number;
		name: string;
		price_adjustment: number;
		quantity: number;
		behavior: string;
		cogs: number | string;
		profit: number | string;
	}

	interface ModifierGroup {
		group_id: number;
		group_name: string;
		min_selections: number;
		max_selections: number | null;
		modifiers: Modifier[];
	}

	interface IngredientOption {
		id: number;
		name: string;
		unit: string;
		current_cost: string | number;
	}

	const formatMoney = (val: number) =>
		new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);

	// --- REACTIVE UNIT SELECTOR PER VARIATION ---
	let selectedIngredients = $state<Record<number, string>>({});

	function getActiveUnit(variationId: number) {
		const selectedId = selectedIngredients[variationId];
		if (!selectedId) return "—";

		return (
			(data.allIngredients as IngredientOption[]).find((i) => String(i.id) === selectedId)
				?.unit || "—"
		);
	}
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
				{data.item.name}
			</div>
		</div>

		{#each data.variations as variation (variation.id)}
			{@const sellingPrice = Number(variation.price)}
			{@const totalCost = Number(variation.total_cogs || 0)}
			{@const modifierCost = Number(variation.modifier_cogs || 0)}
			{@const baseCost = Number(variation.base_cogs || 0)}
			{@const marginPercent = Number(variation.margin_percent || 0)}
			{@const recipe = variation.recipe as RecipeItem[]}
			{@const modifierGroups = variation.modifier_groups as ModifierGroup[]}

			<div class="space-y-4">
				<!-- COGS -->
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

							<h1
								class="mb-1 text-2xl leading-none font-black tracking-tighter uppercase"
							>
								{data.item.name}
							</h1>
							<h2 class="text-primary text-xl font-bold tracking-widest uppercase">
								{variation.variation_name}
							</h2>

							<div class="text-muted-foreground mt-4 font-mono text-xs uppercase">
								Harga Jual: <span class="text-foreground font-bold"
									>{formatMoney(sellingPrice)}</span
								>
							</div>
						</div>

						<div class="min-h-32 space-y-3 p-6">
							<div
								class="text-muted-foreground border-border/40 mb-2 flex justify-between border-b pb-2 font-mono text-[10px] uppercase"
							>
								<span>Qty / Item</span>
								<span>Cost</span>
							</div>

							{#if recipe.length === 0}
								<div
									class="text-muted-foreground/40 py-8 text-center font-mono text-xs italic"
								>
									[ TICKET EMPTY ]
								</div>
							{:else}
								{#each recipe as ing (ing.ingredient_id)}
									<div
										class="group flex items-baseline justify-between font-mono text-sm"
									>
										<div class="flex flex-1 items-baseline gap-2">
											<span class="font-bold whitespace-nowrap"
												>{ing.amount}{ing.unit}</span
											>
											<span
												class="text-muted-foreground truncate text-xs uppercase"
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
													name="variation_id"
													value={variation.id}
												/>
												<input
													type="hidden"
													name="ingredient_id"
													value={ing.ingredient_id}
												/>
												<button
													class="text-destructive transition-transform hover:scale-125"
													title="Remove Ingredient"
												>
													<Trash2 class="h-3 w-3" />
												</button>
											</form>
										</div>
									</div>
								{/each}
							{/if}

							<div
								class="text-muted-foreground border-border/40 mt-4 flex justify-between border-t pt-3 font-mono text-[10px] font-bold uppercase"
							>
								<span>Base COGS</span>
								<span>{formatMoney(baseCost)}</span>
							</div>
						</div>

						{#if modifierGroups?.length}
							<div class="border-border/40 space-y-4 border-t border-dashed p-6">
								<div
									class="text-muted-foreground flex items-center gap-2 font-mono text-[10px] font-bold uppercase"
								>
									<Layers class="h-3 w-3" /> Modifiers
								</div>

								{#each variation.modifier_groups as group (group.group_id)}
									<div class="space-y-2 font-mono text-sm">
										<div class="flex justify-between uppercase">
											<span class="font-bold">{group.group_name}</span>
											<span class="text-muted-foreground text-xs">
												{group.min_selections} to {group.max_selections ||
													"∞"}
											</span>
										</div>

										<div class="flex flex-col gap-1 text-xs">
											<div
												class="text-muted-foreground border-border/40 mb-2 flex justify-between border-b pb-2 font-mono text-[10px] uppercase"
											>
												<span>Option</span>
												<!-- <div class="flex w-32 justify-end gap-4 text-right"> -->
												<span>COGS</span>
												<!-- <span>Profit</span>
												</div> -->
											</div>

											{#each group.modifiers as m (m.modifier_id)}
												<div class="flex items-center justify-between py-1">
													<span
														class="border-border/60 bg-muted/20 border px-2 py-0.5 uppercase"
													>
														{m.name}
													</span>

													<!-- <div
														class="flex w-32 justify-end gap-4 text-right tabular-nums"
													> -->
													<span class="text-muted-foreground">
														{formatMoney(Number(m.cogs))}
													</span>

													<!-- <span
															class={Number(m.profit) < 0
																? "text-destructive font-bold"
																: ""}
														>
															{formatMoney(Number(m.profit))}
														</span>
													</div> -->
												</div>
											{/each}
										</div>
									</div>
								{/each}

								<div
									class="text-muted-foreground border-border/40 mt-2 flex justify-between border-t pt-3 font-mono text-[10px] font-bold uppercase"
								>
									<span>Modifier COGS</span>
									<span>{formatMoney(modifierCost)}</span>
								</div>
							</div>
						{/if}

						<div
							class="border-border/40 bg-secondary/20 space-y-4 border-t-2 border-dashed p-6"
						>
							<div
								class="text-muted-foreground flex justify-between font-mono text-sm"
							>
								<span class="uppercase">Total Cost</span>
								<span>{formatMoney(totalCost)}</span>
							</div>

							<div class="relative border-t border-black/10 pt-4">
								<div class="flex items-end justify-between">
									<div>
										<div
											class="text-muted-foreground text-[10px] font-bold uppercase"
										>
											Total Keuntungan
										</div>
										<div class="font-mono text-2xl font-black tracking-tighter">
											{formatMoney(sellingPrice - totalCost)}
										</div>
									</div>
									<div class="text-right">
										<Badge
											variant={marginPercent < 50
												? "destructive"
												: "secondary"}
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

				<!-- Add ingredietns -->
				<div class="bg-card border-border/60 mb-12 border-2 border-dashed p-4 shadow-sm">
					<div class="bg-card border-border/40 border-2 border-dashed p-4">
						<div class="mb-4 flex items-center gap-2">
							<div class="bg-primary/20 text-primary-foreground rounded-sm p-1">
								<Scale class="h-3 w-3" />
							</div>
							<span
								class="text-muted-foreground text-xs font-bold tracking-wider uppercase"
							>
								Tambah Bahan ({variation.variation_name})
							</span>
						</div>

						<form action="?/addIngredient" method="POST" use:enhance class="space-y-4">
							<input type="hidden" name="variation_id" value={variation.id} />

							<div class="space-y-1.5">
								<label
									for="ing-{variation.id}"
									class="text-muted-foreground text-[10px] font-bold uppercase"
								>
									Pilih Bahan
								</label>
								<select
									id="ing-{variation.id}"
									name="ingredient_id"
									bind:value={selectedIngredients[variation.id]}
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
									for="amt-{variation.id}"
									class="text-muted-foreground text-[10px] font-bold uppercase"
								>
									Quantity Needed
								</label>
								<div class="relative flex items-center">
									<Input
										id="amt-{variation.id}"
										name="amount"
										type="number"
										step="0.1"
										placeholder="0.00"
										class="z-10 h-10 rounded-r-none border-r-0 font-mono text-sm focus:z-20"
										required
									/>
									<div
										class="bg-muted border-input flex h-10 min-w-12 items-center justify-center rounded-r-sm border border-l-0 px-3"
									>
										<span
											class="text-muted-foreground font-mono text-xs font-bold uppercase"
										>
											{getActiveUnit(variation.id)}
										</span>
									</div>
								</div>
							</div>

							<Button
								type="submit"
								size="sm"
								class="mt-2 h-10 w-full rounded-sm font-bold tracking-wide uppercase"
							>
								<Plus class="mr-2 h-3 w-3" /> Simpan ke {variation.variation_name}
							</Button>
						</form>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
