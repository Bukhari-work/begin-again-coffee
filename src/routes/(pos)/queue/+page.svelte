<script lang="ts">
	import { enhance } from "$app/forms";
	import { Button } from "$lib/components/ui/button";
	import { Card } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Coffee, CircleCheck, CreditCard, Banknote, CircleX, Clock } from "@lucide/svelte";
	import type { PageData } from "./$types";

	// --- TYPESCRIPT INTERFACES ---
	interface OrderModifier {
		name: string;
		qty: number;
	}

	interface OrderItem {
		id: number;
		name: string;
		qty: number;
		modifiers: OrderModifier[];
	}

	interface ActiveOrder {
		id: number;
		customer_name: string | null;
		payment_method: string | null;
		status: "preparing" | "served" | "cancelled";
		created_at: string;
		price_total: number;
		items: OrderItem[];
	}

	let { data } = $props<{ data: PageData }>();

	// --- PAYMENT MODAL STATE ---
	let showPaymentModal = $state(false);
	let isSubmitting = $state(false);

	// FIX: Apply the ActiveOrder type instead of 'any'
	let selectedOrder = $state<ActiveOrder | null>(null);
	let paymentMethod = $state("cash");
	let amountTendered = $state<number | "">("");

	let changeDue = $derived(Number(amountTendered || 0) - (selectedOrder?.price_total || 0));

	$effect(() => {
		if (showPaymentModal) {
			amountTendered = "";
			paymentMethod = "cash";
		}
	});

	const formatMoney = (val: number) =>
		new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);

	// Helper to format timestamps nicely (e.g., "10:15 AM")
	const formatTime = (dateStr: string) => {
		return new Date(dateStr).toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
		});
	};

	// FIX: Apply the ActiveOrder type to the function parameter
	function handlePaymentClick(order: ActiveOrder) {
		selectedOrder = order;
		showPaymentModal = true;
	}
</script>

<div class="flex h-full flex-col gap-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-black tracking-tight uppercase">Active Tabs & Queue</h1>
		<Badge variant="outline" class="font-mono text-base">
			{data.activeOrders.length} Tickets
		</Badge>
	</div>

	{#if data.activeOrders.length === 0}
		<div
			class="text-muted-foreground flex flex-1 flex-col items-center justify-center space-y-4 opacity-50"
		>
			<Coffee class="h-16 w-16" />
			<p class="font-mono text-lg font-bold uppercase">Queue is empty</p>
		</div>
	{:else}
		<div
			class="grid grid-cols-1 content-start items-start gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
		>
			{#each data.activeOrders as order (order.id)}
				<Card
					class="border-border bg-card flex flex-col overflow-hidden border-2 py-0 shadow-sm"
				>
					<div
						class="bg-secondary/20 border-border flex items-center justify-between border-b p-4"
					>
						<div class="flex items-center gap-2">
							<span class="text-primary font-mono text-xl font-black"
								>#{order.id}</span
							>
							<span class="font-bold">{order.customer_name || "Walk-in"}</span>
						</div>
						<span class="text-muted-foreground font-mono text-xs font-bold">
							{formatTime(order.created_at)}
						</span>
					</div>

					<div class="bg-secondary/5 border-border flex gap-2 border-b border-dashed p-3">
						{#if order.status === "preparing"}
							<Badge
								class="bg-orange-100 text-[10px] font-bold text-orange-700 uppercase hover:bg-orange-100"
							>
								<Coffee class="mr-1 h-3 w-3" /> Preparing
							</Badge>
						{:else}
							<Badge
								class="bg-green-100 text-[10px] font-bold text-green-700 uppercase hover:bg-green-100"
							>
								<CircleCheck class="mr-1 h-3 w-3" /> Served
							</Badge>
						{/if}

						{#if order.payment_method === null}
							<Badge variant="destructive" class="text-[10px] font-bold uppercase">
								<Clock class="mr-1 h-3 w-3" /> Unpaid
							</Badge>
						{/if}
					</div>

					<div class="flex-1 space-y-3 p-4">
						{#each order.items as item (item.id)}
							<div class="flex items-start gap-2">
								<span class="font-mono font-bold">{item.qty}x</span>
								<div>
									<div class="leading-tight font-bold">{item.name}</div>
									{#if item.modifiers.length > 0}
										<div class="mt-0.5 space-y-0.5">
											{#each item.modifiers as mod (mod.id)}
												<div
													class="text-muted-foreground border-primary/50 border-l-2 pl-1.5 font-mono text-[10px] uppercase"
												>
													+ {mod.qty > 1 ? `${mod.qty}x ` : ""}{mod.name}
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>

					<div class="border-border bg-secondary/10 flex flex-col gap-3 border-t p-4">
						<div class="flex items-end justify-between">
							<span class="text-muted-foreground text-xs font-bold uppercase"
								>Total</span
							>
							<span class="font-mono text-lg font-black"
								>{formatMoney(order.price_total)}</span
							>
						</div>

						<div class="flex gap-2">
							<form
								method="POST"
								action="?/cancelTicket"
								use:enhance
								class="shrink-0"
							>
								<input type="hidden" name="order_id" value={order.id} />
								<Button
									type="submit"
									variant="outline"
									size="icon"
									class="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
								>
									<CircleX class="h-4 w-4" />
								</Button>
							</form>

							<div
								class="grid flex-1 gap-2 {order.status === 'preparing' &&
								order.payment_method === null
									? 'grid-cols-2'
									: 'grid-cols-1'}"
							>
								{#if order.status === "preparing"}
									<form
										method="POST"
										action="?/markServed"
										use:enhance
										class="w-full"
									>
										<input type="hidden" name="order_id" value={order.id} />
										<Button
											type="submit"
											class="w-full bg-orange-500 font-bold tracking-wide uppercase hover:bg-orange-600"
										>
											Mark Served
										</Button>
									</form>
								{/if}

								{#if order.payment_method === null}
									<Button
										variant={order.status === "preparing"
											? "outline"
											: "default"}
										onclick={() => handlePaymentClick(order)}
										class="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full font-bold tracking-wide uppercase {order.status ===
										'served'
											? 'bg-primary text-primary-foreground'
											: ''}"
									>
										Collect Pay
									</Button>
									<Button
										variant="outline"
										href="/register?edit={order.id}"
										class="font-bold uppercase"
									>
										Edit
									</Button>
								{/if}
							</div>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<Dialog.Root bind:open={showPaymentModal}>
	<Dialog.Content class="border-border sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-black tracking-wide uppercase">Collect Payment</Dialog.Title>
			<Dialog.Description class="text-muted-foreground">
				Closing tab for Ticket <span class="text-foreground font-mono font-bold"
					>#{selectedOrder?.id}</span
				>
			</Dialog.Description>
		</Dialog.Header>

		<div class="bg-secondary/20 border-border my-4 space-y-3 rounded-lg border p-4">
			<div class="flex justify-between text-sm">
				<span class="text-muted-foreground font-bold uppercase">Customer</span>
				<span class="font-bold">{selectedOrder?.customer_name || "Walk-in Guest"}</span>
			</div>
			<div class="border-border mt-3 flex items-end justify-between border-t pt-3">
				<span class="text-muted-foreground font-bold uppercase">Total Due</span>
				<span class="text-primary font-mono text-2xl font-black"
					>{formatMoney(selectedOrder?.price_total || 0)}</span
				>
			</div>
		</div>

		<form
			method="POST"
			action="?/payTicket"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					isSubmitting = false;
					showPaymentModal = false;
					await update();
				};
			}}
		>
			<input type="hidden" name="order_id" value={selectedOrder?.id} />

			<div class="space-y-4">
				<div class="space-y-1">
					<Label class="text-muted-foreground text-xs font-bold uppercase"
						>Payment Method</Label
					>
					<div class="bg-background border-border flex border p-1">
						<label class="flex-1 cursor-pointer">
							<input
								type="radio"
								name="payment_method"
								bind:group={paymentMethod}
								value="cash"
								class="peer sr-only"
							/>
							<div
								class="hover:bg-secondary text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground flex h-9 items-center justify-center gap-1 rounded-sm text-xs font-bold uppercase transition-all"
							>
								<Banknote class="h-3 w-3" /> Cash
							</div>
						</label>
						<label class="flex-1 cursor-pointer">
							<input
								type="radio"
								name="payment_method"
								bind:group={paymentMethod}
								value="qris"
								class="peer sr-only"
							/>
							<div
								class="hover:bg-secondary text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground flex h-9 items-center justify-center gap-1 rounded-sm text-xs font-bold uppercase transition-all"
							>
								<CreditCard class="h-3 w-3" /> QRIS
							</div>
						</label>
					</div>
				</div>

				{#if paymentMethod === "cash"}
					<div
						class="bg-background border-border space-y-4 rounded-lg border p-4 shadow-sm"
					>
						<div class="space-y-2">
							<Label class="text-muted-foreground text-xs font-bold uppercase"
								>Amount Tendered</Label
							>
							<div class="relative">
								<span
									class="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 font-mono font-bold"
									>Rp</span
								>
								<Input
									type="number"
									bind:value={amountTendered}
									placeholder={(selectedOrder?.price_total || 0).toString()}
									class="border-border bg-card pl-10 font-mono text-lg font-bold"
								/>
							</div>
						</div>

						<div class="scrollbar-hide flex gap-2 overflow-x-auto">
							<Button
								type="button"
								variant="outline"
								size="sm"
								class="border-border font-mono text-xs font-bold"
								onclick={() => (amountTendered = selectedOrder?.price_total || 0)}
								>Exact</Button
							>
							<Button
								type="button"
								variant="outline"
								size="sm"
								class="border-border font-mono text-xs font-bold"
								onclick={() => (amountTendered = 20000)}>20k</Button
							>
							<Button
								type="button"
								variant="outline"
								size="sm"
								class="border-border font-mono text-xs font-bold"
								onclick={() => (amountTendered = 50000)}>50k</Button
							>
							<Button
								type="button"
								variant="outline"
								size="sm"
								class="border-border font-mono text-xs font-bold"
								onclick={() => (amountTendered = 100000)}>100k</Button
							>
						</div>

						<div
							class="border-border mt-2 flex items-end justify-between border-t border-dashed pt-3"
						>
							<span class="text-muted-foreground text-xs font-bold uppercase"
								>Change Due</span
							>
							<span
								class="font-mono text-xl font-black {changeDue < 0
									? 'text-destructive'
									: 'text-primary'}"
							>
								{changeDue < 0 ? "-" : ""}{formatMoney(Math.abs(changeDue))}
							</span>
						</div>
					</div>
				{/if}

				<div class="flex justify-end gap-2 pt-4">
					<Button
						type="button"
						variant="outline"
						onclick={() => (showPaymentModal = false)}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting || (paymentMethod === "cash" && changeDue < 0)}
						class="font-bold tracking-wide uppercase"
					>
						Confirm Payment
					</Button>
				</div>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
