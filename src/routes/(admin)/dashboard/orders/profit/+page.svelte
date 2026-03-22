<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Badge } from "$lib/components/ui/badge";
	import * as Table from "$lib/components/ui/table";
	import {
		ArrowLeft,
		TrendingUp,
		TriangleAlert,
		CircleCheck,
		ChartPie,
		Info,
	} from "@lucide/svelte";
	import type { PageData } from "./$types";

	let { data } = $props<{ data: PageData }>();

	// Formatter
	const formatMoney = (val: number) =>
		new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);

	// Summary Calculations
	let totalItems = $derived(data.analysis.length);
	let avgMargin = $derived(
		totalItems > 0
			? data.analysis.reduce(
					(sum: number, item: any) => sum + Number(item.margin_percent),
					0
				) / totalItems
			: 0
	);
</script>

<div class="space-y-6">
	<div class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
		<div>
			<div class="mb-1 flex items-center gap-2">
				<a
					href="/dashboard/orders"
					class="text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft class="h-4 w-4" />
				</a>
				<h1 class="text-3xl font-black tracking-tight uppercase">Profitability</h1>
			</div>
			<p class="text-muted-foreground pl-6 font-mono text-xs">
				Unit economics and margin analysis based on current ingredient costs.
			</p>
		</div>

		<div class="flex gap-4">
			<div class="border-border bg-card rounded-sm border px-4 py-2 shadow-sm">
				<div
					class="text-muted-foreground flex items-center gap-1 text-[10px] font-bold uppercase"
				>
					<ChartPie class="h-3 w-3" /> Avg Margin
				</div>
				<div
					class="font-mono text-xl font-black {avgMargin < 50
						? 'text-red-600'
						: 'text-green-600'}"
				>
					{avgMargin.toFixed(1)}%
				</div>
			</div>
		</div>
	</div>

	<div class="bg-card border-border overflow-hidden rounded-sm border shadow-sm">
		<Table.Root>
			<Table.Header>
				<Table.Row class="border-border bg-muted/20 border-b hover:bg-transparent">
					<Table.Head
						class="text-foreground w-75 text-[10px] font-bold tracking-wider uppercase"
						>Menu Item</Table.Head
					>
					<Table.Head
						class="text-foreground text-right text-[10px] font-bold tracking-wider uppercase"
						>Selling Price</Table.Head
					>
					<Table.Head
						class="text-foreground text-right text-[10px] font-bold tracking-wider uppercase"
						>Est. Cost (COGS)</Table.Head
					>
					<Table.Head
						class="text-foreground text-right text-[10px] font-bold tracking-wider uppercase"
						>Gross Profit</Table.Head
					>
					<Table.Head
						class="text-foreground text-right text-[10px] font-bold tracking-wider uppercase"
						>Margin %</Table.Head
					>
					<Table.Head class="w-15"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if data.analysis.length === 0}
					<Table.Row>
						<Table.Cell colspan={6} class="h-32 text-center">
							<div
								class="text-muted-foreground flex flex-col items-center justify-center space-y-2"
							>
								<TriangleAlert class="h-6 w-6" />
								<p class="font-mono text-xs">No items with cost data found.</p>
								<Button href="/dashboard/recipes" variant="link" size="sm"
									>Go to Recipes</Button
								>
							</div>
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each data.analysis as item (item.item_id)}
						{@const margin = Number(item.margin_percent)}
						{@const isLoss = margin <= 0}
						{@const isLow = margin > 0 && margin < 50}

						<Table.Row
							class="hover:bg-muted/50 transition-colors {isLoss
								? 'bg-red-50/50 dark:bg-red-950/10'
								: ''}"
						>
							<Table.Cell class="font-bold">
								{item.item_name}
								{#if isLoss}
									<span
										class="ml-2 inline-flex items-center rounded-sm bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700"
									>
										Check Recipe
									</span>
								{/if}
							</Table.Cell>

							<Table.Cell class="text-right font-mono text-sm">
								{formatMoney(item.selling_price)}
							</Table.Cell>

							<Table.Cell class="text-muted-foreground text-right font-mono text-sm">
								{Number(item.base_cogs) > 0
									? `- ${formatMoney(item.base_cogs)}`
									: "-"}
							</Table.Cell>

							<Table.Cell
								class="text-right font-mono text-sm font-bold {isLoss
									? 'text-red-600'
									: 'text-green-600'}"
							>
								{Number(item.gross_profit) > 0 ? "+" : ""}{formatMoney(
									item.gross_profit
								)}
							</Table.Cell>

							<Table.Cell class="text-right">
								<div class="flex justify-end">
									{#if Number(item.base_cogs) === 0}
										<Badge
											variant="outline"
											class="text-muted-foreground border-dashed font-mono text-[10px]"
										>
											No Data
										</Badge>
									{:else}
										<Badge
											variant={isLoss || isLow ? "destructive" : "secondary"}
											class="min-w-12 justify-center font-mono text-[10px] {isLoss ||
											isLow
												? ''
												: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}"
										>
											{margin}%
										</Badge>
									{/if}
								</div>
							</Table.Cell>

							<Table.Cell>
								{#if isLoss || isLow}
									<TriangleAlert class="text-destructive h-4 w-4" />
								{:else}
									<CircleCheck class="h-4 w-4 text-green-600" />
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>

	<div
		class="text-muted-foreground bg-muted/30 border-border grid gap-4 rounded-sm border border-dashed p-4 font-mono text-xs md:grid-cols-2"
	>
		<div class="flex gap-2">
			<Info class="h-4 w-4 shrink-0" />
			<p>
				<strong>COGS (Cost of Goods Sold):</strong> Calculated using the
				<em>most recent purchase price</em> of ingredients in the recipe.
			</p>
		</div>
		<div class="flex gap-2">
			<TrendingUp class="h-4 w-4 shrink-0" />
			<p>
				<strong>Target Margin:</strong> F&B industry standard is <strong>70% - 80%</strong> gross
				margin (Food Cost ~20-30%).
			</p>
		</div>
	</div>
</div>
