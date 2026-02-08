<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { ArrowLeft, ChefHat, Trash2 } from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	let { data } = $props<{ data: PageData }>();
</script>

<div class="mx-auto max-w-3xl py-6">
	<a
		href="/dashboard/inventory"
		class="text-muted-foreground hover:text-primary mb-6 flex items-center text-sm"
	>
		<ArrowLeft class="mr-2 h-4 w-4" />
		Back to Inventory
	</a>

	<div class="mb-8 flex items-center gap-4">
		<div
			class="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full"
		>
			<ChefHat class="h-6 w-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Recipe Editor</h1>
			<p class="text-muted-foreground">
				Manage ingredients for
				<span class="text-foreground font-bold">{data.item.name}</span>
			</p>
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-[2fr_1fr]">
		<!-- Current Ingredients -->
		<Card>
			<CardHeader>
				<CardTitle class="text-lg">Current Ingredients</CardTitle>
			</CardHeader>

			<CardContent>
				{#if data.recipe.length === 0}
					<div
						class="text-muted-foreground rounded-lg border-2 border-dashed py-8 text-center"
					>
						No ingredients added yet.
					</div>
				{:else}
					<div class="divide-y">
						{#each data.recipe as ing (ing.ingredient_id)}
							<div class="flex items-center justify-between py-3">
								<div>
									<p class="font-medium">{ing.name}</p>
								</div>

								<div class="flex items-center gap-4">
									<span class="bg-secondary rounded px-2 py-1 font-mono text-sm">
										{ing.amount}{ing.unit}
									</span>

									<form action="?/removeIngredient" method="POST" use:enhance>
										<input
											type="hidden"
											name="ingredient_id"
											value={ing.ingredient_id}
										/>

										<Button
											type="submit"
											variant="ghost"
											size="icon"
											class="text-destructive hover:bg-destructive/10 h-8 w-8"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</form>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Add Ingredient -->
		<Card class="h-fit">
			<CardHeader>
				<CardTitle class="text-lg">Add Ingredient</CardTitle>
			</CardHeader>

			<CardContent>
				<form action="?/addIngredient" method="POST" use:enhance class="space-y-4">
					<div class="space-y-2">
						<label for="ingredient_id" class="text-sm font-medium"> Ingredient </label>

						<select
							id="ingredient_id"
							name="ingredient_id"
							required
							class="bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
						>
							<option value="" disabled selected> Select ingredient… </option>

							{#each data.allIngredients as option (option.id)}
								<option value={option.id}>
									{option.name} ({option.unit})
								</option>
							{/each}
						</select>
					</div>

					<div class="space-y-2">
						<label for="amount" class="text-sm font-medium"> Amount </label>
						<Input
							id="amount"
							name="amount"
							type="number"
							step="0.1"
							min="0"
							placeholder="e.g. 18.5"
							required
						/>
					</div>

					<Button type="submit" class="w-full">Add to Recipe</Button>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
