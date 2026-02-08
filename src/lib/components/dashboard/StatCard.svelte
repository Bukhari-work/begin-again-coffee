<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { ArrowUpRight, ArrowDownRight } from "@lucide/svelte";

	let {
		title,
		value,
		prevValue = null,
		isMoney = false,
		description = "", // New: For subtext like "Based on current trend"
		trendLabel = "vs Yest", // New: Customizable label
		class: className = "",
	} = $props<{
		title: string;
		value: number;
		prevValue?: number | null;
		isMoney?: boolean;
		description?: string;
		trendLabel?: string;
		class?: string;
	}>();

	const formatMoney = (val: number) =>
		new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val || 0);

	const getPct = $derived.by(() => {
		if (prevValue === null || prevValue === 0) return null;
		const pct = ((value - prevValue) / prevValue) * 100;
		return {
			label: (pct > 0 ? "+" : "") + pct.toFixed(1) + "%",
			isPositive: pct >= 0,
		};
	});
</script>

<Card class={className}>
	<CardHeader class="pb-2">
		<CardTitle class="text-muted-foreground text-[10px] tracking-widest uppercase">
			{title}
		</CardTitle>
	</CardHeader>
	<CardContent>
		<div class="font-mono text-2xl font-black">
			{isMoney ? formatMoney(value) : value}
		</div>

		{#if getPct}
			<div class="mt-1 flex items-center gap-1 font-mono text-xs">
				{#if getPct.isPositive}
					<ArrowUpRight class="h-3 w-3 text-green-600" />
					<span class="text-green-600">{getPct.label}</span>
				{:else}
					<ArrowDownRight class="h-3 w-3 text-red-600" />
					<span class="text-red-600">{getPct.label}</span>
				{/if}
				<span class="text-muted-foreground">{trendLabel}</span>
			</div>
		{/if}

		{#if description}
			<p class="text-muted-foreground mt-1 font-mono text-[10px] leading-tight">
				{description}
			</p>
		{/if}
	</CardContent>
</Card>
