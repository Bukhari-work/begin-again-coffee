<script lang="ts">
	import { Button, buttonVariants } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Badge } from "$lib/components/ui/badge";
	import * as Table from "$lib/components/ui/table";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Plus, Trash2, Package, ShoppingCart } from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	let { data } = $props<{ data: PageData }>();
	let open = $state(false);

	const formatMoney = (val: number) =>
		new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);
</script>

<div class="space-y-6">
	<div
		class="border-border flex flex-col items-start justify-between gap-4 border-b pb-6 md:flex-row md:items-center"
	>
		<div>
			<h1 class="text-3xl font-black tracking-tight uppercase">Raw Inventory</h1>
			<p class="text-muted-foreground mt-1 font-mono text-xs">
				Manage ingredients, categories, & stock items.
			</p>
		</div>
		<Button variant="outline" size="sm" href="/dashboard/inventory/purchases">
			<ShoppingCart class="mr-2 h-4 w-4" /> Log Purchase
		</Button>
	</div>

	<div class="flex items-center justify-end">
		<Dialog.Root bind:open>
			<Dialog.Trigger type="button" class={buttonVariants({ variant: "default" })}>
				<Plus class="mr-2 h-4 w-4" /> New Ingredient
			</Dialog.Trigger>
			<Dialog.Content class="bg-card border-2 sm:max-w-md">
				<Dialog.Header>
					<Dialog.Title class="tracking-wide uppercase">Add Material</Dialog.Title>
					<Dialog.Description class="font-mono text-xs"
						>Define a new raw material for your recipes.</Dialog.Description
					>
				</Dialog.Header>
				<form
					action="?/create"
					method="POST"
					use:enhance={() =>
						async ({ result }) => {
							if (result.type === "success") open = false;
						}}
				>
					<div class="grid gap-4 py-4">
						<div class="grid grid-cols-3 gap-4">
							<div class="col-span-2 space-y-2">
								<Label class="text-muted-foreground text-[10px] font-bold uppercase"
									>Ingredient Name</Label
								>
								<Input name="name" placeholder="e.g. Arabica Beans" required />
							</div>
							<div class="space-y-2">
								<Label class="text-muted-foreground text-[10px] font-bold uppercase"
									>Unit</Label
								>
								<select
									name="unit"
									class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
								>
									<option value="grams">Grams (g)</option>
									<option value="ml">Milliliters (ml)</option>
									<option value="pcs">Pieces (pcs)</option>
								</select>
							</div>
						</div>

						<div class="space-y-2">
							<Label class="text-muted-foreground text-[10px] font-bold uppercase"
								>Category</Label
							>
							<Input
								name="category"
								placeholder="e.g. Dairy, Syrups, Beans"
								required
							/>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label class="text-muted-foreground text-[10px] font-bold uppercase"
									>Brand <span class="normal-case opacity-50">(Optional)</span
									></Label
								>
								<Input name="brand" placeholder="e.g. Oatly, Dripp" />
							</div>
							<div class="space-y-2">
								<Label class="text-muted-foreground text-[10px] font-bold uppercase"
									>Type <span class="normal-case opacity-50">(Optional)</span
									></Label
								>
								<Input name="type" placeholder="e.g. Liquid, Powder" />
							</div>
						</div>
					</div>
					<Dialog.Footer>
						<Button type="submit" class="w-full font-bold tracking-wide uppercase"
							>Create Ingredient</Button
						>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<div class="bg-card border-border rounded-sm border">
		<Table.Root>
			<Table.Header>
				<Table.Row class="hover:bg-transparent">
					<Table.Head
						class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
						>Material Name</Table.Head
					>
					<Table.Head
						class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
						>Classification</Table.Head
					>
					<Table.Head
						class="text-muted-foreground text-right text-[10px] font-bold tracking-wider uppercase"
						>Tracking Unit</Table.Head
					>
					<Table.Head
						class="text-muted-foreground text-right text-[10px] font-bold tracking-wider uppercase"
						>Current Cost</Table.Head
					>
					<Table.Head class="w-15"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if data.ingredients.length === 0}
					<Table.Row>
						<Table.Cell
							colspan={5}
							class="text-muted-foreground h-24 text-center font-mono text-xs"
						>
							No inventory items found.
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each data.ingredients as item (item.id)}
						<Table.Row class="group hover:bg-secondary/20 transition-colors">
							<Table.Cell>
								<div class="flex items-center gap-2 font-bold">
									<Package class="text-primary h-4 w-4" />
									{item.name}
								</div>
							</Table.Cell>

							<Table.Cell>
								<div class="flex flex-col items-start gap-1">
									<Badge
										variant="outline"
										class="bg-background font-mono text-[10px] uppercase"
									>
										{item.category}
									</Badge>
									{#if item.brand || item.type}
										<div class="text-muted-foreground font-mono text-[10px]">
											{[item.brand, item.type].filter(Boolean).join(" · ")}
										</div>
									{/if}
								</div>
							</Table.Cell>

							<Table.Cell class="text-right font-mono text-xs uppercase"
								>{item.unit}</Table.Cell
							>
							<Table.Cell class="text-right font-mono text-sm">
								{#if Number(item.current_cost) > 0}
									<span class="font-bold"
										>{formatMoney(Number(item.current_cost))}</span
									>
									<span class="text-muted-foreground text-xs">/ {item.unit}</span>
								{:else}
									<span class="text-muted-foreground text-[10px] italic"
										>No purchases yet</span
									>
								{/if}
							</Table.Cell>
							<Table.Cell>
								<div
									class="flex justify-end opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
								>
									<form action="?/delete" method="POST" use:enhance>
										<input type="hidden" name="id" value={item.id} />
										<Button
											variant="ghost"
											size="icon"
											type="submit"
											class="text-muted-foreground hover:text-destructive h-8 w-8"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</form>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
</div>
