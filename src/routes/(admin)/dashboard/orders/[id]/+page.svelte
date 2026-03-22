<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { ArrowLeft, Printer, Coffee } from "@lucide/svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	let total = $derived(
		data.items.reduce(
			(sum: number, item: any) => sum + Number(item.price_base) * item.quantity,
			0
		)
	);
</script>

<div class="mx-auto max-w-2xl py-6">
	<div class="mb-6 flex items-center justify-between">
		<a
			href="/dashboard/orders"
			class="text-muted-foreground hover:text-primary flex items-center text-sm"
		>
			<ArrowLeft class="mr-2 h-4 w-4" /> Back to Orders
		</a>
		<Button variant="outline" size="sm" onclick={() => window.print()}>
			<Printer class="mr-2 h-4 w-4" /> Print Receipt
		</Button>
	</div>

	<Card class="dark:bg-card mx-auto max-w-md border-2 border-dashed bg-[#fffdf5] shadow-sm">
		<CardHeader class="border-b-2 border-dashed pb-6 text-center">
			<div class="mb-4 flex justify-center">
				<div class="bg-primary/10 rounded-full p-3">
					<Coffee class="text-primary h-6 w-6" />
				</div>
			</div>
			<CardTitle class="text-xl tracking-widest uppercase">Begin Again</CardTitle>
			<p class="text-muted-foreground mt-2 font-mono text-xs">
				Order #{data.order.id}<br />
				{new Date(data.order.order_date).toLocaleString()}
			</p>
		</CardHeader>

		<CardContent class="space-y-6 pt-6">
			<div class="grid grid-cols-2 text-sm">
				<span class="text-muted-foreground">Customer:</span>
				<span class="text-right font-medium">{data.order.customer_name || "Walk-in"}</span>

				<span class="text-muted-foreground">Payment:</span>
				<span class="text-right font-medium uppercase">{data.order.payment_method}</span>
			</div>

			<div class="space-y-3 border-y border-dashed py-4">
				{#each data.items as item (item.id)}
					<div class="flex justify-between text-sm">
						<div>
							<span class="font-bold">{item.quantity}x</span>
							<span class="ml-2">{item.name}</span>
							<div class="text-muted-foreground ml-6 text-xs">
								@ {Number(item.price_base) / 1000}k
							</div>
						</div>
						<span class="font-mono font-medium">
							{(Number(item.price_base) * item.quantity) / 1000}k
						</span>
					</div>
				{/each}
			</div>

			<div class="flex items-end justify-between pt-2">
				<span class="text-lg font-bold">Total</span>
				<span class="font-mono text-2xl font-bold">{total / 1000}k</span>
			</div>

			<div class="pt-8 pb-4 text-center">
				<p class="text-muted-foreground font-mono text-xs uppercase">
					Thank you for visiting
				</p>
				<p class="text-muted-foreground/50 mt-1 font-mono text-[10px]">
					{data.order.id} • {new Date().toLocaleDateString("id")}
				</p>
			</div>
		</CardContent>
	</Card>
</div>
