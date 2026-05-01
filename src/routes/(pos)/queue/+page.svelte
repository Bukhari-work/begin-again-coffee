<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Label } from "$lib/components/ui/label";
	import { Input } from "$lib/components/ui/input";
	import { enhance } from "$app/forms";
	import { Coffee, Banknote, QrCode } from "@lucide/svelte";

	// Import your new component and types
	import QueueCard from "$lib/components/pos/QueueCard.svelte";
	import type { QueueOrder } from "$lib/types";

	let { data } = $props();

	// The Fix: We cast the generic database rows into our strict QueueOrder type
	let typedOrders = $derived(data.activeOrders as unknown as QueueOrder[]);

	// State for the Payment Modal
	let showPaymentModal = $state(false);
	let selectedOrderForPayment = $state<QueueOrder | null>(null);
	let paymentMethod = $state("cash");
	let amountTendered = $state<number | "">("");

	let changeDue = $derived(
		Number(amountTendered || 0) - Number(selectedOrderForPayment?.price_total || 0)
	);

	$effect(() => {
		if (showPaymentModal) amountTendered = "";
	});

	const formatMoney = (val: number) =>
		new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);

	function openPaymentModal(order: QueueOrder) {
		selectedOrderForPayment = order;
		paymentMethod = "cash";
		showPaymentModal = true;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-black tracking-tight uppercase">Active Queue</h1>
			<p class="text-muted-foreground mt-1 font-mono text-xs">
				{data.activeOrders.length} tickets require attention.
			</p>
		</div>
	</div>

	{#if data.activeOrders.length === 0}
		<div
			class="text-muted-foreground mt-20 flex flex-col items-center justify-center opacity-50"
		>
			<Coffee class="mb-4 h-16 w-16" />
			<p class="font-mono tracking-widest uppercase">Queue is Empty</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
			{#each typedOrders as order (order.id)}
				<QueueCard {order} {openPaymentModal} />
			{/each}
		</div>
	{/if}
</div>

<Dialog.Root bind:open={showPaymentModal}>
	<Dialog.Content class="border-border sm:max-w-md">
		{#if selectedOrderForPayment}
			<Dialog.Header>
				<Dialog.Title class="font-black tracking-wide uppercase"
					>Process Payment</Dialog.Title
				>
				<Dialog.Description class="text-muted-foreground">
					Ticket #{selectedOrderForPayment.id} for {selectedOrderForPayment.customer_name ||
						"Walk-in Guest"}.
				</Dialog.Description>
			</Dialog.Header>

			<div class="bg-secondary/20 border-border my-4 rounded-lg border p-4 text-center">
				<span class="text-muted-foreground text-xs font-bold uppercase">Total Due</span>
				<div class="text-primary mt-1 font-mono text-3xl font-black tracking-tighter">
					{formatMoney(Number(selectedOrderForPayment.price_total))}
				</div>
			</div>

			<form
				action="?/payTicket"
				method="POST"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === "success") {
							showPaymentModal = false;
							await update();
						} else {
							alert("Payment failed.");
						}
					};
				}}
			>
				<input type="hidden" name="order_id" value={selectedOrderForPayment.id} />

				<div class="space-y-6">
					<div class="space-y-2">
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
									class="hover:bg-secondary text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground flex h-10 items-center justify-center gap-2 rounded-sm font-bold uppercase transition-all"
								>
									<Banknote class="h-4 w-4" /> Cash
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
									class="hover:bg-secondary text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground flex h-10 items-center justify-center gap-2 rounded-sm font-bold uppercase transition-all"
								>
									<QrCode class="h-4 w-4" /> QRIS
								</div>
							</label>
						</div>
					</div>

					{#if paymentMethod === "cash"}
						<div class="space-y-4">
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
										placeholder={selectedOrderForPayment.price_total.toString()}
										class="border-border bg-card pl-10 font-mono text-lg font-bold"
									/>
								</div>
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
				</div>

				<Dialog.Footer class="mt-6 gap-2 sm:justify-end">
					<Button
						type="button"
						variant="outline"
						onclick={() => (showPaymentModal = false)}>Cancel</Button
					>
					<Button
						type="submit"
						disabled={paymentMethod === "cash" && changeDue < 0}
						class="font-bold tracking-wide uppercase"
					>
						Confirm Payment
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
