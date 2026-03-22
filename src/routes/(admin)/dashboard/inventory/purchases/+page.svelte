<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import * as Table from "$lib/components/ui/table";
	import { Plus } from "@lucide/svelte";
	import { enhance } from "$app/forms";

	let { data } = $props();

	const formatMoney = (val: number) =>
		new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);
</script>

<div class="grid gap-8 md:grid-cols-3">
	<div class="space-y-6 md:col-span-1">
		<div>
			<h2 class="text-2xl font-black tracking-tight uppercase">Log Purchase</h2>
			<p class="text-muted-foreground font-mono text-sm">Record new stock arrival.</p>
		</div>

		<form
			method="POST"
			action="?/add"
			use:enhance
			class="bg-card border-border space-y-4 border-2 p-6"
		>
			<div class="space-y-2">
				<Label>Ingredient</Label>
				<select
					name="ingredient_id"
					class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-none border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#each data.ingredients as ing (ing.id)}
						<option value={ing.id}>{ing.name} ({ing.unit})</option>
					{/each}
				</select>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label>Quantity</Label>
					<Input
						type="number"
						step="0.01"
						name="quantity"
						placeholder="e.g. 1000"
						required
					/>
				</div>
				<div class="space-y-2">
					<Label>Total Cost (Rp)</Label>
					<Input
						type="number"
						step="100"
						name="total_cost"
						placeholder="e.g. 150000"
						required
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label>Supplier (Optional)</Label>
				<Input name="supplier" placeholder="e.g. Shopee" />
			</div>

			<div class="space-y-2">
				<Label>Date</Label>
				<Input type="date" name="purchase_date" />
			</div>

			<Button type="submit" class="w-full font-bold uppercase">
				<Plus class="mr-2 h-4 w-4" /> Save Purchase
			</Button>
		</form>
	</div>

	<div class="space-y-6 md:col-span-2">
		<div>
			<h2 class="text-2xl font-black tracking-tight uppercase">Recent History</h2>
			<p class="text-muted-foreground font-mono text-sm">Latest 20 transactions.</p>
		</div>

		<div class="bg-card border-border rounded-sm border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Date</Table.Head>
						<Table.Head>Item</Table.Head>
						<Table.Head>Supplier</Table.Head>
						<Table.Head class="text-right">Qty</Table.Head>
						<Table.Head class="text-right">Cost/Unit</Table.Head>
						<Table.Head class="text-right">Total</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.history as p (p.id)}
						<Table.Row>
							<Table.Cell class="font-mono text-xs">
								{new Date(p.purchase_date).toLocaleDateString("id-ID")}
							</Table.Cell>
							<Table.Cell class="font-bold">{p.ingredient_name}</Table.Cell>
							<Table.Cell class="text-muted-foreground text-xs"
								>{p.supplier || "-"}</Table.Cell
							>
							<Table.Cell class="text-right font-mono">
								{Number(p.quantity)}
								{p.unit}
							</Table.Cell>
							<Table.Cell class="text-muted-foreground text-right font-mono text-xs">
								{formatMoney(p.total_cost / p.quantity)}/{p.unit}
							</Table.Cell>
							<Table.Cell class="text-primary text-right font-mono font-bold">
								{formatMoney(p.total_cost)}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</div>
</div>
