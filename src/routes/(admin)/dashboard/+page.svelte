<script lang="ts">
	import StatCard from "$lib/components/dashboard/StatCard.svelte";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
	import * as Tabs from "$lib/components/ui/tabs";
	import { Sun, Moon, Calendar, CircleAlert } from "@lucide/svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	// --- UTILS ---
	const formatMoney = (val: number) =>
		new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val || 0);

	const getAOV = (rev: number, orders: number) => (orders > 0 ? rev / orders : 0);

	// --- DATA PREP ---
	// Daily
	let dStats = $derived(data.daily.stats);
	let dYesterday = $derived(data.daily.yesterday);
	let dShiftDay = $derived(
		data.daily.shifts.find(
			(s: { shift: string; orders: string; revenue: string; items: string }) =>
				s.shift === "day"
		) || {
			revenue: 0,
			orders: 0,
			items: 0,
		}
	);
	let dShiftNight = $derived(
		data.daily.shifts.find(
			(s: { shift: string; orders: string; revenue: string; items: string }) =>
				s.shift === "night"
		) || {
			revenue: 0,
			orders: 0,
			items: 0,
		}
	);

	// Monthly
	let mStats = $derived(data.monthly.stats);
	let mTrend = $derived(data.monthly.trend);
	let mChartMax = $derived(
		Math.max(
			...mTrend.map((d: { date: string; revenue: string; orders: string }) =>
				Number(d.revenue)
			),
			1
		)
	);

	// NEW: Calculate max for the Heatmap once
	let heatMax = $derived(
		Math.max(
			...(data.monthly.heatmap || []).map(
				(h: { day_name: string; day_index: string; avg_revenue: string }) =>
					Number(h.avg_revenue)
			),
			1
		)
	);
</script>

<div class="space-y-6 pb-20">
	<div
		class="border-border flex flex-col items-start justify-between gap-4 border-b pb-6 md:flex-row md:items-center"
	>
		<div>
			<h1 class="text-3xl font-black tracking-tight uppercase">Dashboard</h1>
			<p class="text-muted-foreground mt-1 font-mono text-xs">
				Store Performance • <span class="text-primary font-bold">Amuntai HQ</span>
			</p>
		</div>
		<div
			class="border-border bg-card inline-flex items-center gap-2 border px-3 py-1 font-mono text-xs uppercase shadow-sm"
		>
			<Calendar class="text-primary h-3 w-3" />
			<span>{new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}</span>
		</div>
	</div>

	<Tabs.Root value="daily" class="space-y-6">
		<Tabs.List class="grid w-full grid-cols-2 lg:w-100">
			<Tabs.Trigger value="daily">Daily Ops</Tabs.Trigger>
			<Tabs.Trigger value="monthly">Monthly Strategy</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="daily" class="space-y-6">
			<div class="grid gap-3 md:grid-cols-4">
				<StatCard
					title="Today Revenue"
					value={dStats.revenue}
					prevValue={dYesterday.revenue}
					isMoney={true}
					class="border-l-primary bg-primary/5 border-l-4"
				/>

				<StatCard title="Orders" value={dStats.orders} />

				<StatCard title="Cups Sold" value={dStats.items_sold} />

				<StatCard
					title="Avg Ticket"
					value={getAOV(dStats.revenue, dStats.orders)}
					isMoney={true}
				/>
			</div>

			<div class="grid gap-6 md:grid-cols-7">
				<Card class="md:col-span-4">
					<CardHeader>
						<CardTitle class="text-sm font-bold uppercase">Shift Performance</CardTitle>
					</CardHeader>
					<CardContent class="grid gap-4">
						<div
							class="border-border flex items-center justify-between border bg-orange-50/50 p-3 dark:bg-orange-950/10"
						>
							<div class="flex items-center gap-3">
								<div
									class="rounded-sm bg-orange-100 p-2 text-orange-600 dark:bg-orange-900"
								>
									<Sun class="h-4 w-4" />
								</div>
								<div>
									<div class="text-sm font-bold uppercase">Day Shift</div>
									<div class="text-muted-foreground font-mono text-[10px]">
										{dShiftDay.orders} orders
									</div>
								</div>
							</div>
							<div class="text-right">
								<div class="font-mono font-black">
									{formatMoney(dShiftDay.revenue)}
								</div>
								<div class="text-muted-foreground font-mono text-[10px]">
									AOV: {formatMoney(getAOV(dShiftDay.revenue, dShiftDay.orders))}
								</div>
							</div>
						</div>

						<div
							class="border-border flex items-center justify-between border bg-blue-50/50 p-3 dark:bg-blue-950/10"
						>
							<div class="flex items-center gap-3">
								<div
									class="rounded-sm bg-blue-100 p-2 text-blue-600 dark:bg-blue-900"
								>
									<Moon class="h-4 w-4" />
								</div>
								<div>
									<div class="text-sm font-bold uppercase">Night Shift</div>
									<div class="text-muted-foreground font-mono text-[10px]">
										{dShiftNight.orders} orders
									</div>
								</div>
							</div>
							<div class="text-right">
								<div class="font-mono font-black">
									{formatMoney(dShiftNight.revenue)}
								</div>
								<div class="text-muted-foreground font-mono text-[10px]">
									AOV: {formatMoney(
										getAOV(dShiftNight.revenue, dShiftNight.orders)
									)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card class="md:col-span-3">
					<CardHeader>
						<CardTitle class="text-sm font-bold uppercase">Category Mix</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="space-y-4">
							{#each data.daily.categories as cat (cat.item_category)}
								{@const share = (cat.revenue / dStats.revenue) * 100}
								<div class="space-y-1">
									<div class="flex justify-between font-mono text-xs">
										<span class="font-bold uppercase"
											>{cat.category || "Uncategorized"}</span
										>
										<span>{share.toFixed(1)}%</span>
									</div>
									<div
										class="bg-secondary h-2 w-full overflow-hidden rounded-full"
									>
										<div
											class="bg-primary h-full"
											style="width: {share}%"
										></div>
									</div>
									<div
										class="text-muted-foreground flex justify-between font-mono text-[10px]"
									>
										<span>{cat.units} units</span>
										<span>{formatMoney(cat.revenue)}</span>
									</div>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card
				class="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/10"
			>
				<CardHeader class="flex flex-row items-center gap-2 pb-2">
					<CircleAlert class="h-4 w-4 text-yellow-600" />
					<CardTitle class="text-xs font-bold text-yellow-700 uppercase"
						>Daily Log / Notes</CardTitle
					>
				</CardHeader>
				<CardContent>
					<textarea
						class="placeholder:text-muted-foreground/50 w-full resize-none border-none bg-transparent font-mono text-sm focus:ring-0"
						placeholder="Type notes here (e.g. 'Coffee machine serviced', 'Rainy afternoon')..."
						rows="2"
					></textarea>
				</CardContent>
			</Card>
		</Tabs.Content>

		<Tabs.Content value="monthly" class="space-y-6">
			<div class="grid gap-3 md:grid-cols-4">
				<StatCard
					title="MTD Revenue"
					value={mStats.revenue}
					isMoney={true}
					class="border-l-primary bg-primary/5 border-l-4"
				/>

				<StatCard title="Total Orders" value={mStats.orders} />

				<StatCard
					title="Daily Avg"
					value={mTrend.length ? mStats.revenue / mTrend.length : 0}
					isMoney={true}
				/>

				<StatCard
					title="Est. Run Rate"
					value={(mTrend.length ? mStats.revenue / mTrend.length : 0) * 30}
					isMoney={true}
					class="opacity-80"
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle class="tracking-tight uppercase">Revenue Trend (MTD)</CardTitle>
				</CardHeader>
				<CardContent>
					<div
						class="border-border flex h-50 w-full items-end justify-between gap-1 border-b px-2 pt-4"
					>
						{#each mTrend as day (day.date)}
							{@const height = (Number(day.revenue) / mChartMax) * 100}
							<div
								class="group relative flex h-full w-full flex-col items-center justify-end gap-1"
							>
								<div
									class="bg-foreground text-background absolute bottom-full z-10 mb-1 hidden flex-col items-center rounded-sm px-2 py-1 font-mono text-[10px] whitespace-nowrap group-hover:flex"
								>
									<span class="font-bold">{new Date(day.date).getDate()}th</span>
									<span>{formatMoney(Number(day.revenue))}</span>
								</div>
								<div
									class="bg-primary/80 hover:bg-primary w-full min-w-1 rounded-t-sm transition-all"
									style="height: {Math.max(4, height)}%; opacity: {Math.max(
										0.3,
										height / 100
									)}"
								></div>
							</div>
						{/each}
					</div>
					<div
						class="text-muted-foreground mt-2 flex justify-between font-mono text-[10px] uppercase"
					>
						<span>Start of Month</span>
						<span>Today</span>
					</div>
				</CardContent>
			</Card>

			<div class="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle class="text-sm font-bold uppercase">Weekday Pattern</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-7 gap-2">
							{#each data.monthly.heatmap as day (day.day_name)}
								{@const heatHeight = (day.avg_revenue / heatMax) * 100}

								<div class="flex flex-col items-center gap-2">
									<div
										class="bg-secondary relative flex h-32 w-full items-end overflow-hidden rounded-sm"
									>
										<div
											class="bg-primary w-full"
											style="height: {heatHeight}%"
										></div>
									</div>
									<span class="font-mono text-[10px] font-bold uppercase">
										{day.day_name.substring(0, 3)}
									</span>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader
						><CardTitle class="text-sm font-bold uppercase">Item Portfolio</CardTitle
						></CardHeader
					>
					<CardContent class="p-0">
						<table class="w-full text-sm">
							<thead
								class="bg-muted/50 text-muted-foreground font-mono text-[10px] uppercase"
							>
								<tr>
									<th class="p-3 text-left font-medium">Item Name</th>
									<th class="p-3 text-right font-medium">Vol</th>
									<th class="p-3 text-right font-medium">Rev</th>
								</tr>
							</thead>
							<tbody class="divide-border divide-y">
								{#each data.monthly.items as item (item.parent_item_name)}
									<tr>
										<td class="p-3 font-bold">{item.name}</td>
										<td class="text-muted-foreground p-3 text-right font-mono"
											>{item.units_sold}</td
										>
										<td class="p-3 text-right font-mono font-bold"
											>{formatMoney(item.revenue)}</td
										>
									</tr>
								{/each}
							</tbody>
						</table>
					</CardContent>
				</Card>
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>
