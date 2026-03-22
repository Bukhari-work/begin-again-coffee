<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
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
				Manage ingredients & stock items.
			</p>
		</div>
		<Button variant="outline" size="sm" href="/dashboard/inventory/purchases">
			<ShoppingCart class="mr-2 h-4 w-4" /> Log Purchase
		</Button>
	</div>

	<div class="flex items-center justify-end">
		<Dialog.Root bind:open>
			<Dialog.Trigger>
				<Button>
					<Plus class="mr-2 h-4 w-4" /> New Ingredient
				</Button>
			</Dialog.Trigger>
			<Dialog.Content class="bg-card border-2 sm:max-w-100">
				<Dialog.Header>
					<Dialog.Title class="tracking-wide uppercase">Add Material</Dialog.Title>
					<Dialog.Description class="font-mono text-xs"
						>Define a new raw material (e.g. Oat Milk).</Dialog.Description
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
						<div class="space-y-2">
							<Label>Ingredient Name</Label>
							<Input name="name" placeholder="e.g. Arabica Beans" required />
						</div>
						<div class="space-y-2">
							<Label>Unit of Measurement</Label>
							<select
								name="unit"
								class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
							>
								<option value="grams">Grams (g)</option>
								<option value="ml">Milliliters (ml)</option>
								<option value="pcs">Pieces (pcs)</option>
							</select>
						</div>
					</div>
					<Dialog.Footer>
						<Button type="submit" class="w-full">Create Ingredient</Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<div class="bg-card border-border rounded-sm border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="text-[10px] font-bold uppercase">Material Name</Table.Head>
					<Table.Head class="text-right text-[10px] font-bold uppercase"
						>Tracking Unit</Table.Head
					>
					<Table.Head class="text-right text-[10px] font-bold uppercase"
						>Current Cost</Table.Head
					>
					<Table.Head class="w-15"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.ingredients as item (item.id)}
					<Table.Row>
						<Table.Cell class="flex items-center gap-2 font-bold">
							<Package class="text-muted-foreground h-4 w-4" />
							{item.name}
						</Table.Cell>
						<Table.Cell class="text-right font-mono text-xs uppercase"
							>{item.unit}</Table.Cell
						>
						<Table.Cell class="text-right font-mono text-sm">
							{#if Number(item.current_cost) > 0}
								{formatMoney(Number(item.current_cost))} / {item.unit}
							{:else}
								<span class="text-muted-foreground text-[10px] italic"
									>No purchases yet</span
								>
							{/if}
						</Table.Cell>
						<Table.Cell>
							<form action="?/delete" method="POST" use:enhance>
								<input type="hidden" name="id" value={item.id} />
								<Button
									variant="ghost"
									size="icon"
									type="submit"
									class="text-muted-foreground hover:text-destructive"
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</form>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
