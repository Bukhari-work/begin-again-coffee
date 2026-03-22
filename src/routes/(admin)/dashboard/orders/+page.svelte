<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Table from "$lib/components/ui/table";
	import { Badge } from "$lib/components/ui/badge";
	import { Input } from "$lib/components/ui/input";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Search, Sun, Moon, Loader, Receipt, Coffee, TrendingUp } from "@lucide/svelte";

	let { data } = $props();

	// --- UPDATED SHAPE ---
	interface OrderModifier {
		name: string;
		quantity: number;
		price_base: number;
	}

	interface OrderItem {
		name: string;
		quantity: number;
		price_base: number;
		modifiers: OrderModifier[];
	}

	interface OrderDetails {
		order: {
			id: number;
			customer_name: string | null;
			payment_method: string;
			shift: string;
			created_at: string;
		};
		items: OrderItem[];
	}

	// 2. STATE
	let isReceiptOpen = $state(false);
	let selectedOrder = $state<OrderDetails | null>(null);
	let isLoading = $state(false);

	async function openReceipt(orderId: number) {
		isReceiptOpen = true;
		isLoading = true;
		selectedOrder = null;

		try {
			// Note: You must update this API endpoint to fetch modifiers too!
			const res = await fetch(`/api/orders/${orderId}`);
			if (res.ok) {
				const json = await res.json();
				selectedOrder = json as OrderDetails;
			}
		} catch (err) {
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	// --- FORMATTERS ---
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "short",
		});
	};

	const formatMoney = (val: number) =>
		new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);

	// Calculate Grand Total for the receipt modal
	let receiptGrandTotal = $derived.by(() => {
		if (!selectedOrder) return 0;
		let total = 0;
		for (const item of selectedOrder.items) {
			// Base Item Total
			total += Number(item.price_base) * item.quantity;
			// Modifiers Total (per item quantity)
			if (item.modifiers) {
				for (const mod of item.modifiers) {
					total += Number(mod.price_base) * mod.quantity * item.quantity;
				}
			}
		}
		return total;
	});
</script>

<Dialog.Root bind:open={isReceiptOpen}>
	<Dialog.Content class="dark:bg-card border-2  bg-[#fffdf5] sm:max-w-100">
		{#if isLoading}
			<div class="flex flex-col items-center justify-center space-y-4 py-12">
				<Loader class="text-primary h-8 w-8 animate-spin" />
				<p class="text-muted-foreground font-mono text-xs uppercase">Printing Ticket...</p>
			</div>
		{:else if selectedOrder}
			<Dialog.Header class="border-border border-b border-dashed pb-4 text-center">
				<div class="mb-2 flex justify-center">
					<div class="bg-primary/10 text-primary rounded-full p-2">
						<Coffee class="h-5 w-5" />
					</div>
				</div>
				<Dialog.Title class="text-lg font-black tracking-widest uppercase"
					>Begin Again</Dialog.Title
				>
				<Dialog.Description class="font-mono text-xs">
					Order #{selectedOrder.order.id} • {selectedOrder.order.shift.toUpperCase()} Shift
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-4 py-4">
				<div class="space-y-4">
					{#each selectedOrder.items as item, i (i)}
						<div class="font-mono text-sm">
							<div class="flex justify-between">
								<div class="flex gap-2">
									<span class="font-bold">{item.quantity}x</span>
									<span>{item.name}</span>
								</div>
								<span>{formatMoney(Number(item.price_base) * item.quantity)}</span>
							</div>

							{#if item.modifiers && item.modifiers.length > 0}
								<div
									class="text-muted-foreground mt-1 space-y-0.5 pl-6 text-[10px]"
								>
									{#each item.modifiers as mod, j (j)}
										<div class="flex justify-between">
											<span
												>+ {mod.quantity > 1
													? `${mod.quantity}x `
													: ""}{mod.name}</span
											>
											{#if Number(mod.price_base) > 0}
												<span
													>{formatMoney(
														Number(mod.price_base) *
															mod.quantity *
															item.quantity
													)}</span
												>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<div
					class="border-border flex items-end justify-between border-t border-dashed pt-4"
				>
					<span class="text-muted-foreground text-sm font-bold uppercase">Total</span>
					<span class="font-mono text-2xl font-black"
						>{formatMoney(receiptGrandTotal)}</span
					>
				</div>

				<div class="bg-muted/30 space-y-1 rounded-sm p-3 text-center">
					<p class="text-muted-foreground font-mono text-[10px] uppercase">
						Customer: <span class="text-foreground font-bold"
							>{selectedOrder.order.customer_name || "Walk-in"}</span
						>
					</p>
					<p class="text-muted-foreground font-mono text-[10px] uppercase">
						Payment: <span class="text-foreground font-bold"
							>{selectedOrder.order.payment_method}</span
						>
					</p>
				</div>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<div class="space-y-6">
	<div
		class="border-border flex flex-col items-start justify-between gap-4 border-b pb-6 md:flex-row md:items-center"
	>
		<div>
			<h1 class="text-3xl font-black tracking-tight uppercase">Orders Log</h1>
			<p class="text-muted-foreground mt-1 font-mono text-xs">
				Track daily transactions & shift history.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" href="/dashboard/orders/profit">
				<TrendingUp class="mr-2 h-4 w-4" /> Profit Analysis
			</Button>
		</div>
	</div>

	<div class="flex items-center justify-between">
		<div class="relative w-full max-w-sm">
			<Search class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
			<Input type="search" placeholder="Filter orders..." class="pl-8 font-mono text-sm" />
		</div>

		<Button href="/cashier">
			<Coffee class="mr-2 h-4 w-4" /> Open POS
		</Button>
	</div>

	<div class="bg-card border-border rounded-sm border">
		<Table.Root>
			<Table.Header>
				<Table.Row class="hover:bg-transparent">
					<Table.Head
						class="text-muted-foreground w-25 text-[10px] font-bold tracking-wider uppercase"
						>Order ID</Table.Head
					>
					<Table.Head
						class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
						>Customer</Table.Head
					>
					<Table.Head
						class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
						>Date / Shift</Table.Head
					>
					<Table.Head
						class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
						>Payment</Table.Head
					>
					<Table.Head
						class="text-muted-foreground text-right text-[10px] font-bold tracking-wider uppercase"
						>Total</Table.Head
					>
					<Table.Head class="w-15"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if data.orders.length === 0}
					<Table.Row>
						<Table.Cell
							colspan={6}
							class="text-muted-foreground h-24 text-center font-mono text-sm"
							>No orders found.</Table.Cell
						>
					</Table.Row>
				{:else}
					{#each data.orders as order (order.id)}
						<Table.Row
							class="group hover:bg-secondary/20 cursor-pointer transition-colors"
							onclick={() => openReceipt(order.id)}
						>
							<Table.Cell class="font-mono font-medium">#{order.id}</Table.Cell>
							<Table.Cell class="font-bold"
								>{order.customer_name || "Walk-in"}</Table.Cell
							>

							<Table.Cell>
								<div class="flex items-center gap-2">
									<span class="text-muted-foreground font-mono text-xs uppercase"
										>{formatDate(order.created_at)}</span
									>
									<div class="bg-border h-4 w-px"></div>
									<Badge
										variant="outline"
										class="bg-background h-5 gap-1 px-1.5 font-mono text-[10px] uppercase"
									>
										{#if order.shift === "day"}
											<Sun class="h-3 w-3 text-orange-500" /> Day
										{:else}
											<Moon class="h-3 w-3 text-blue-500" /> Night
										{/if}
									</Badge>
								</div>
							</Table.Cell>

							<Table.Cell>
								<Badge
									variant="secondary"
									class="rounded-sm text-[10px] font-bold tracking-wide uppercase"
									>{order.payment_method}</Badge
								>
							</Table.Cell>

							<Table.Cell class="text-foreground text-right font-mono font-bold">
								{formatMoney(Number(order.total_amount))}
							</Table.Cell>

							<Table.Cell class="text-right">
								<Button
									variant="ghost"
									size="icon"
									class="text-muted-foreground group-hover:text-primary h-8 w-8"
								>
									<Receipt class="h-4 w-4" />
								</Button>
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
</div>
