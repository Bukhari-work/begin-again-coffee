<script lang="ts">
	import { Button, buttonVariants } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import * as Table from "$lib/components/ui/table";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Badge } from "$lib/components/ui/badge";
	import {
		Plus,
		Trash2,
		CircleAlert,
		Coffee,
		Search,
		TrendingUp,
		ScanBarcode,
	} from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	// Import the new refresh button
	import ButtonRefreshCogs from "$lib/components/dashboard/ButtonRefreshCogs.svelte";

	let { data } = $props<{ data: PageData }>();
	let open = $state(false);
	let searchQuery = $state("");

	// Client-side search for menu items
	let filteredItems = $derived(
		data.items.filter(
			(i: PageData["items"][number]) =>
				i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(i.category_name || "").toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

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
			<h1 class="text-3xl font-black tracking-tight uppercase">Menu Recipes</h1>
			<p class="text-muted-foreground mt-1 font-mono text-xs">
				Define product compositions & pricing.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<ButtonRefreshCogs />

			<Button variant="outline" size="sm" href="/dashboard/orders/profit">
				<TrendingUp class="mr-2 h-4 w-4" /> Profit Analysis
			</Button>
		</div>
	</div>

	<div class="flex items-center justify-between gap-4">
		<div class="relative w-full max-w-sm">
			<Search class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
			<Input
				type="search"
				placeholder="Search menu..."
				class="bg-card pl-8 font-mono text-sm"
				bind:value={searchQuery}
			/>
		</div>

		<Dialog.Root bind:open>
			<Dialog.Trigger type="button" class={buttonVariants({ variant: "default" })}>
				<Plus class="mr-2 h-4 w-4" /> New Item
			</Dialog.Trigger>
			<Dialog.Content class="dark:bg-card border-2 border-dashed bg-[#fffdf5] sm:max-w-md">
				<Dialog.Header>
					<Dialog.Title class="font-black tracking-wide uppercase"
						>New Product</Dialog.Title
					>
					<Dialog.Description class="font-mono text-xs">
						Create a new item entry. A 'Regular' variation will be generated
						automatically.
					</Dialog.Description>
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
						<div class="space-y-2">
							<Label class="text-muted-foreground text-[10px] font-bold uppercase"
								>Menu Name</Label
							>
							<Input
								name="name"
								placeholder="e.g. Kopi Susu Gula Aren"
								class="font-bold"
								required
							/>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label class="text-muted-foreground text-[10px] font-bold uppercase"
									>Base Selling Price</Label
								>
								<div class="relative">
									<span
										class="text-muted-foreground absolute top-2.5 left-3 text-xs font-bold"
										>Rp</span
									>
									<Input
										name="price"
										type="number"
										step="100"
										placeholder="18000"
										class="pl-8 font-mono"
										required
									/>
								</div>
							</div>
							<div class="space-y-2">
								<Label class="text-muted-foreground text-[10px] font-bold uppercase"
									>Category</Label
								>
								<select
									name="category_id"
									class="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
								>
									{#each data.categories as cat (cat.id)}
										<option value={cat.id}>{cat.name}</option>
									{/each}
								</select>
							</div>
						</div>
					</div>
					<Dialog.Footer>
						<Button type="submit" class="w-full font-bold tracking-wide uppercase"
							>Save to Menu</Button
						>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<div class="bg-card border-border rounded-none border">
		<Table.Root>
			<Table.Header>
				<Table.Row class="hover:bg-transparent">
					<Table.Head
						class="text-muted-foreground w-15 text-[10px] font-bold tracking-wider uppercase"
						>ID</Table.Head
					>
					<Table.Head
						class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
						>Product</Table.Head
					>
					<Table.Head
						class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
						>Category</Table.Head
					>
					<Table.Head
						class="text-muted-foreground text-right text-[10px] font-bold tracking-wider uppercase"
						>Price</Table.Head
					>
					<Table.Head
						class="text-muted-foreground text-right text-[10px] font-bold tracking-wider uppercase"
						>Cost (Est)</Table.Head
					>
					<Table.Head
						class="text-muted-foreground text-center text-[10px] font-bold tracking-wider uppercase"
						>Margin</Table.Head
					>
					<Table.Head class="w-25"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if filteredItems.length === 0}
					<Table.Row>
						<Table.Cell
							colspan={7}
							class="text-muted-foreground h-24 text-center font-mono text-xs"
						>
							No items found.
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each filteredItems as item (item.id)}
						<Table.Row class="group hover:bg-secondary/20 transition-colors">
							<Table.Cell
								class="text-muted-foreground pt-4 align-top font-mono text-xs"
							>
								#{item.id}
							</Table.Cell>

							<Table.Cell class="pt-4 align-top">
								<div class="flex items-center gap-2 font-bold">
									<Coffee class="text-primary h-4 w-4" />
									{item.name}
								</div>
							</Table.Cell>

							<Table.Cell class="pt-4 align-top">
								<Badge
									variant="outline"
									class="bg-background font-mono text-[10px] uppercase"
								>
									{item.category_name || "General"}
								</Badge>
							</Table.Cell>

							<Table.Cell class="pt-4 text-right align-top">
								<div class="flex flex-col gap-3">
									{#each item.variations as v (v.id)}
										<div class="font-mono text-sm whitespace-nowrap">
											<span class="text-muted-foreground mr-2 text-xs">
												{v.name}:
											</span>
											<span class="font-bold"
												>{formatMoney(Number(v.price))}
											</span>
										</div>
									{/each}
								</div>
							</Table.Cell>

							<Table.Cell
								class="text-muted-foreground pt-4 text-right align-top font-mono text-xs"
							>
								<div class="flex flex-col gap-3">
									{#each item.variations as v (v.id)}
										<div
											class="flex h-5 items-center justify-end whitespace-nowrap"
										>
											{#if Number(v.cost) > 0}
												{formatMoney(Number(v.cost))}
											{:else}
												<span class="text-orange-400">-</span>
											{/if}
										</div>
									{/each}
								</div>
							</Table.Cell>

							<Table.Cell class="pt-4 text-center align-top">
								<div class="flex flex-col items-center gap-3">
									{#each item.variations as v (v.id)}
										<div class="flex h-5 items-center">
											{#if Number(v.cost) === 0}
												<Badge
													variant="secondary"
													class="gap-1 border border-orange-200 bg-orange-50 font-mono text-[10px] text-orange-600"
												>
													<CircleAlert class="h-3 w-3" /> No Recipe
												</Badge>
											{:else}
												{@const margin = Number(v.margin)}
												<Badge
													variant={margin < 50
														? "destructive"
														: "outline"}
													class="font-mono text-[10px] {margin >= 50
														? 'border-green-200 bg-green-50 text-green-700'
														: ''}"
												>
													{margin}%
												</Badge>
											{/if}
										</div>
									{/each}
								</div>
							</Table.Cell>

							<Table.Cell class="pt-4 align-top">
								<div
									class="flex items-center justify-end gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
								>
									<a href="/dashboard/menu/{item.id}">
										<Button
											variant="ghost"
											size="icon"
											title="Edit Recipe"
											aria-label="Edit Recipe"
											class="text-muted-foreground hover:text-primary h-8 w-8"
										>
											<ScanBarcode class="h-4 w-4" />
										</Button>
									</a>
									<form action="?/delete" method="POST" use:enhance>
										<input type="hidden" name="id" value={item.id} />
										<Button
											variant="ghost"
											size="icon"
											type="submit"
											aria-label="Delete Item"
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
