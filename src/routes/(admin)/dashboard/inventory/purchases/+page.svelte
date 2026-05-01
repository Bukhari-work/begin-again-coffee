<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import * as Table from "$lib/components/ui/table";
	import { Plus, Trash2 } from "@lucide/svelte";
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
				<Label class="text-muted-foreground text-[10px] font-bold uppercase"
					>Ingredient</Label
				>
				<select
					name="ingredient_id"
					class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-sm border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
					required
				>
					<option value="" disabled selected>-- Select Item --</option>
					{#each data.ingredients as ing (ing.id)}
						<option value={ing.id}>[{ing.category}] {ing.name} ({ing.unit})</option>
					{/each}
				</select>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label class="text-muted-foreground text-[10px] font-bold uppercase"
						>Quantity</Label
					>
					<Input
						type="number"
						step="0.01"
						name="quantity"
						placeholder="e.g. 1000"
						class="font-mono text-sm"
						required
					/>
				</div>
				<div class="space-y-2">
					<Label class="text-muted-foreground text-[10px] font-bold uppercase"
						>Total Cost (Rp)</Label
					>
					<Input
						type="number"
						step="100"
						name="cost_total"
						placeholder="e.g. 150000"
						class="font-mono text-sm"
						required
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label class="text-muted-foreground text-[10px] font-bold uppercase"
					>Supplier <span class="normal-case opacity-50">(Optional)</span></Label
				>
				<Input name="supplier" placeholder="e.g. Shopee, Local Market" />
			</div>

			<div class="space-y-2">
				<Label class="text-muted-foreground text-[10px] font-bold uppercase">Date</Label>
				<Input type="date" name="purchase_date" class="font-mono text-sm" />
			</div>

			<Button type="submit" class="w-full font-bold tracking-wide uppercase">
				<Plus class="mr-2 h-4 w-4" /> Save Purchase
			</Button>
		</form>
	</div>

	<div class="space-y-6 md:col-span-2">
		<div>
			<h2 class="text-2xl font-black tracking-tight uppercase">Recent History</h2>
			<p class="text-muted-foreground font-mono text-sm">Latest 50 transactions.</p>
		</div>

		<div class="bg-card border-border rounded-sm border">
			<Table.Root>
				<Table.Header>
					<Table.Row class="hover:bg-transparent">
						<Table.Head
							class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
							>Date</Table.Head
						>
						<Table.Head
							class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
							>Item</Table.Head
						>
						<Table.Head
							class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
							>Supplier</Table.Head
						>
						<Table.Head
							class="text-muted-foreground text-right text-[10px] font-bold tracking-wider uppercase"
							>Qty</Table.Head
						>
						<Table.Head
							class="text-muted-foreground text-right text-[10px] font-bold tracking-wider uppercase"
							>Cost/Unit</Table.Head
						>
						<Table.Head
							class="text-muted-foreground text-right text-[10px] font-bold tracking-wider uppercase"
							>Total</Table.Head
						>
						<Table.Head class="w-12"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if data.history.length === 0}
						<Table.Row>
							<Table.Cell
								colspan={7}
								class="text-muted-foreground h-24 text-center font-mono text-xs"
							>
								No purchase history found.
							</Table.Cell>
						</Table.Row>
					{:else}
						{#each data.history as p (p.id)}
							<Table.Row class="group hover:bg-secondary/20 transition-colors">
								<Table.Cell class="text-muted-foreground font-mono text-xs">
									{new Date(p.purchase_date).toLocaleDateString("id-ID")}
								</Table.Cell>
								<Table.Cell class="font-bold whitespace-nowrap"
									>{p.ingredient_name}</Table.Cell
								>
								<Table.Cell class="text-muted-foreground text-xs uppercase">
									{p.supplier || "-"}
								</Table.Cell>
								<Table.Cell class="text-right font-mono text-sm">
									<span class="font-bold">{Number(p.quantity)}</span>
									<span class="text-muted-foreground text-xs">{p.unit}</span>
								</Table.Cell>
								<Table.Cell
									class="text-muted-foreground text-right font-mono text-xs"
								>
									{formatMoney(Number(p.cost_per_unit))}/{p.unit}
								</Table.Cell>
								<Table.Cell class="text-primary text-right font-mono font-bold">
									{formatMoney(Number(p.cost_total))}
								</Table.Cell>
								<Table.Cell>
									<div
										class="flex justify-end opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
									>
										<form action="?/delete" method="POST" use:enhance>
											<input type="hidden" name="id" value={p.id} />
											<Button
												variant="ghost"
												size="icon"
												type="submit"
												title="Delete this record"
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
</div>
