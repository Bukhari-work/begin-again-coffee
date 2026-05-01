<script lang="ts">
	import { enhance } from "$app/forms";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import { Card } from "$lib/components/ui/card";
	import {
		Clock,
		CircleCheck,
		CircleX,
		Banknote,
		User,
		Pencil,
		Gift,
		Lock,
		Receipt,
	} from "@lucide/svelte";
	import type { QueueOrder, OrderItem } from "$lib/types";

	let { order, openPaymentModal } = $props<{
		order: QueueOrder;
		openPaymentModal: (order: QueueOrder) => void;
	}>();

	// Helpers moved from the main page
	function getMinutesElapsed(dateString: string) {
		const diff = Date.now() - new Date(dateString).getTime();
		return Math.floor(diff / 60000);
	}

	const formatMoney = (val: number) =>
		new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);

	// Derived state scoped entirely to this specific card
	let minutesOld = $derived(getMinutesElapsed(order.created_at));
	let isUnpaid = $derived(order.payment_method === null);
	let isPreparing = $derived(order.derived_status === "preparing");
	let isLocked = $derived(order.items.some((i: OrderItem) => i.fulfillment_status === "served"));

	// Centralized Edit Button State
	let editBtn = $derived.by(() => {
		if (!isUnpaid) {
			return {
				disabled: true,
				icon: Receipt,
				title: "Cannot edit: Order is already paid",
				href: undefined,
			};
		}
		if (isLocked) {
			return {
				disabled: true,
				icon: Lock,
				title: "Cannot edit: Kitchen has already served items",
				href: undefined,
			};
		}
		return {
			disabled: false,
			icon: Pencil,
			title: "Edit Order",
			href: `/kiosk?edit=${order.id}`,
		};
	});
</script>

<Card
	class="flex flex-col overflow-hidden border-2 transition-all {minutesOld > 15 && isPreparing
		? 'border-destructive shadow-destructive/20 shadow-lg'
		: 'border-border shadow-sm'}"
>
	<div
		class="flex items-center justify-between border-b p-4 {minutesOld > 15 && isPreparing
			? 'bg-destructive text-destructive-foreground'
			: 'bg-secondary/20'}"
	>
		<div class="flex items-center gap-3">
			<div class="flex flex-col">
				<span class="text-xs font-bold tracking-widest uppercase opacity-80"
					>Ticket #{order.id}</span
				>
				<span class="flex items-center gap-1 font-bold">
					<User class="h-3 w-3" />
					{order.customer_name || "Walk-in"}
				</span>
			</div>
		</div>

		<div class="flex flex-col items-end gap-1">
			<div class="flex items-center gap-1 font-mono text-xs font-bold">
				<Clock class="h-3 w-3" />
				{minutesOld}m ago
			</div>

			{#if isUnpaid}
				<Badge variant="destructive" class="font-mono text-[10px] uppercase">Unpaid</Badge>
			{:else if order.payment_method === "comped"}
				<Badge
					variant="outline"
					class="border-amber-200 bg-amber-50 font-mono text-[10px] text-amber-700 uppercase"
				>
					<Gift class="mr-1 h-3 w-3" /> Comped
				</Badge>
			{:else}
				<Badge
					variant="outline"
					class="border-green-200 bg-green-50 font-mono text-[10px] text-green-700 uppercase"
				>
					Paid ({order.payment_method})
				</Badge>
			{/if}
		</div>
	</div>

	<div class="flex-1 space-y-3 p-4">
		{#each order.items as item (item.id)}
			<div
				class="flex items-start justify-between gap-2 rounded-md p-1 transition-colors {item.fulfillment_status ===
				'cancelled'
					? 'line-through opacity-40'
					: ''} {item.fulfillment_status === 'served' ? 'bg-secondary/20' : ''}"
			>
				<div class="flex items-start gap-2">
					<span
						class="bg-secondary text-secondary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-xs font-bold {item.fulfillment_status ===
						'served'
							? 'bg-green-500/20 text-green-700'
							: ''}"
					>
						{item.qty}
					</span>
					<div>
						<div class="leading-tight font-bold">{item.name}</div>
						{#if item.modifiers && item.modifiers.length > 0}
							<div class="mt-0.5 space-y-0.5">
								{#each item.modifiers as mod (mod.name)}
									<div
										class="text-muted-foreground font-mono text-[10px] uppercase"
									>
										+ {mod.qty > 1 ? `${mod.qty}x ` : ""}{mod.name}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-1">
					{#if item.fulfillment_status === "preparing"}
						<form action="?/markItemServed" method="POST" use:enhance>
							<input type="hidden" name="item_id" value={item.id} />
							<Button
								type="submit"
								variant="ghost"
								size="icon"
								class="h-6 w-6 text-green-600 hover:bg-green-100 hover:text-green-700"
								title="Serve Drink"
							>
								<CircleCheck class="h-4 w-4" />
							</Button>
						</form>
						<form action="?/cancelItem" method="POST" use:enhance>
							<input type="hidden" name="order_id" value={order.id} />
							<input type="hidden" name="item_id" value={item.id} />
							<Button
								type="submit"
								variant="ghost"
								size="icon"
								class="text-destructive hover:bg-destructive/20 h-6 w-6"
								title="Cancel Drink"
							>
								<CircleX class="h-4 w-4" />
							</Button>
						</form>
					{:else if item.fulfillment_status === "served"}
						<Badge
							variant="outline"
							class="border-green-200 bg-green-50 text-[9px] tracking-wider text-green-700 uppercase"
							>Served</Badge
						>
					{:else if item.fulfillment_status === "cancelled"}
						<Badge
							variant="outline"
							class="border-destructive/30 bg-destructive/10 text-destructive text-[9px] tracking-wider uppercase"
							>Void</Badge
						>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<div class="bg-secondary/10 border-border flex items-center justify-between gap-2 border-t p-4">
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="icon"
				disabled={editBtn.disabled}
				href={editBtn.href}
				title={editBtn.title}
				aria-label={editBtn.title}
			>
				{@const Icon = editBtn.icon}
				<Icon class="h-4 w-4" aria-hidden="true" />
			</Button>

			<form action="?/cancelTicket" method="POST" use:enhance>
				<input type="hidden" name="order_id" value={order.id} />
				<Button
					variant="outline"
					size="icon"
					class="text-destructive hover:bg-destructive hover:text-destructive-foreground"
					type="submit"
					title="Cancel Ticket"
				>
					<CircleX class="h-4 w-4" />
				</Button>
			</form>
		</div>

		<div class="flex gap-2">
			{#if isPreparing}
				<form action="?/markServed" method="POST" use:enhance>
					<input type="hidden" name="order_id" value={order.id} />
					<Button type="submit" class="font-bold tracking-wide uppercase">
						<CircleCheck class="mr-2 h-4 w-4" /> Serve
					</Button>
				</form>
			{:else if isUnpaid}
				<Button
					onclick={() => openPaymentModal(order)}
					class="bg-amber-500 font-bold tracking-wide uppercase hover:bg-amber-600"
				>
					<Banknote class="mr-2 h-4 w-4" /> Pay {formatMoney(Number(order.price_total))}
				</Button>
			{/if}
		</div>
	</div>
</Card>
