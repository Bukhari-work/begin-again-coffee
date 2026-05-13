<script lang="ts">
	import { Card } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import { Input } from "$lib/components/ui/input";
	import { Button } from "$lib/components/ui/button";
	import { Checkbox } from "$lib/components/ui/checkbox";

	import * as Dialog from "$lib/components/ui/dialog";
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from "$lib/components/ui/table";
	import {
		Receipt,
		TrendingUp,
		Banknote,
		QrCode,
		Search,
		Ban,
		Coffee,
		Clock,
		Undo2,
		CircleAlert,
		CircleCheck,
		Gift,
		TriangleAlert,
	} from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	type FilterType = "all" | "paid" | "unpaid" | "cancelled" | "refund";

	interface TransactionItem {
		id: number;
		name: string;
		qty: number;
		price_total: string | number;
		ledger_status: "active" | "refunded" | "voided";
		fulfillment_status: "preparing" | "served" | "cancelled";
		original_order_item_id: number | null;
		is_already_refunded?: boolean;
	}

	interface TransactionOrder {
		id: number;
		customer_name: string | null;
		payment_method: "cash" | "qris" | "comped" | null;
		created_at: string;
		price_total: number | string;
		shift: string;
		kind: "sale" | "refund";
		parent_order_id: number | null;
		items: TransactionItem[];
		_uiStatus: "preparing" | "served" | "cancelled" | "empty";
	}

	let { data }: { data: PageData } = $props();

	function getOrderUIStatus(
		items: TransactionItem[],
		kind: string
	): "preparing" | "served" | "cancelled" | "refund" | "empty" {
		if (kind === "refund") return "refund";
		if (!items || items.length === 0) return "empty";
		if (items.every((i) => i.fulfillment_status === "cancelled")) return "cancelled";
		const activeItems = items.filter((i) => i.fulfillment_status !== "cancelled");
		if (activeItems.length > 0 && activeItems.every((i) => i.fulfillment_status === "served"))
			return "served";
		return "preparing";
	}

	// The Smart Mapping Engine
	let todayOrders = $derived(
		data.todayOrders.map((row) => {
			const childRefunds = data.todayOrders.filter(
				(o) => o.kind === "refund" && Number(o.parent_order_id) === Number(row.id)
			);

			// 🚀 THE FIX: Extract exact line-item IDs from the refund tickets
			const refundedItemIds = childRefunds.flatMap(
				(o) =>
					(o.items as TransactionItem[])
						.map((i) => i.original_order_item_id)
						.filter((id) => id !== null) // Filter out nulls
			);

			const mappedItems: TransactionItem[] = ((row.items as TransactionItem[]) || []).map(
				(item) => {
					// Check against exact ID! No more fuzzy name matching.
					const isRefunded = refundedItemIds.includes(item.id);

					return {
						id: item.id,
						name: item.name,
						qty: item.qty,
						price_total: item.price_total,
						ledger_status: item.ledger_status,
						fulfillment_status: item.fulfillment_status,
						original_order_item_id: item.original_order_item_id,
						is_already_refunded: isRefunded, // Inject the derived flag!
					};
				}
			);

			return {
				id: row.id,
				customer_name: row.customer_name,
				payment_method: row.payment_method as "cash" | "qris" | "comped" | null,
				created_at: row.created_at,
				price_total: Number(row.price_total),
				shift: row.shift,
				kind: row.kind as "sale" | "refund",
				parent_order_id: row.parent_order_id,
				items: mappedItems,
				_uiStatus: getOrderUIStatus(mappedItems, row.kind),
			} as TransactionOrder;
		})
	);

	// --- UI STATE ---
	let searchQuery = $state("");
	let statusFilter = $state<FilterType>("all");

	// --- SURGICAL REFUND MODAL STATE ---
	let showRefundModal = $state(false);
	let selectedOrder = $state<TransactionOrder | null>(null);
	let isSubmitting = $state(false);
	let selectedItemIdsToRefund = $state<number[]>([]);

	let safeIdsToRefund = $derived(
		selectedItemIdsToRefund.filter((id) => {
			const item = selectedOrder?.items.find((i) => i.id === id);
			return item && !item.is_already_refunded && item.ledger_status !== "voided";
		})
	);

	let dynamicRefundTotal = $derived(
		selectedOrder?.items
			.filter((item) => selectedItemIdsToRefund.includes(item.id))
			.reduce((sum, item) => sum + Number(item.price_total), 0) || 0
	);

	const formatMoney = (val: number) =>
		new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);

	const formatTime = (dateStr: string) => {
		return new Date(dateStr).toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
		});
	};

	// --- DERIVED STATS ---
	let validLedgerOrders = $derived(todayOrders.filter((o) => o.payment_method !== null));

	let totalRevenue = $derived(
		validLedgerOrders.reduce((sum, o) => sum + Number(o.price_total), 0)
	);

	let cashTotal = $derived(
		validLedgerOrders
			.filter((o) => o.payment_method === "cash")
			.reduce((sum, o) => sum + Number(o.price_total), 0)
	);

	let qrisTotal = $derived(
		validLedgerOrders
			.filter((o) => o.payment_method === "qris")
			.reduce((sum, o) => sum + Number(o.price_total), 0)
	);

	let validTicketCount = $derived(
		todayOrders.filter((o) => {
			if (o.kind !== "sale") return false;
			if (o._uiStatus === "cancelled" || o._uiStatus === "empty") return false;
			return o.items.some(
				(i) => !i.is_already_refunded && i.fulfillment_status !== "cancelled"
			);
		}).length
	);

	let filteredOrders = $derived(
		todayOrders.filter((o) => {
			const searchLower = searchQuery.toLowerCase();
			const matchesSearch =
				o.id.toString().includes(searchLower) ||
				(o.customer_name && o.customer_name.toLowerCase().includes(searchLower));

			let matchesStatus = true;
			if (statusFilter === "paid")
				matchesStatus = o.payment_method !== null && o.kind === "sale";
			if (statusFilter === "unpaid")
				matchesStatus = o.payment_method === null && o._uiStatus !== "cancelled";
			if (statusFilter === "cancelled") matchesStatus = o._uiStatus === "cancelled";
			if (statusFilter === "refund") matchesStatus = o.kind === "refund";

			return matchesSearch && matchesStatus;
		})
	);

	function openRefundModal(order: TransactionOrder) {
		selectedOrder = order;
		selectedItemIdsToRefund = order.items
			.filter(
				(i) =>
					i.ledger_status === "active" &&
					i.fulfillment_status === "cancelled" &&
					!i.is_already_refunded
			)
			.map((i) => i.id);
		showRefundModal = true;
	}

	const filterButtons: Array<{ id: FilterType; label: string; activeClass: string }> = [
		{ id: "all", label: "All", activeClass: "bg-background shadow-sm" },
		{ id: "paid", label: "Paid", activeClass: "bg-background text-primary shadow-sm" },
		{ id: "unpaid", label: "Unpaid", activeClass: "bg-background text-destructive shadow-sm" },
		{ id: "cancelled", label: "Cancelled", activeClass: "bg-background shadow-sm" },
		{ id: "refund", label: "Refunds", activeClass: "bg-background text-destructive shadow-sm" },
	];
</script>

<Dialog.Root bind:open={showRefundModal}>
	<Dialog.Content class="border-border sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title
				class="text-destructive flex items-center gap-2 font-black tracking-wide uppercase"
			>
				<CircleAlert class="h-5 w-5" /> Itemized Refund Reconciliation
			</Dialog.Title>
			<Dialog.Description class="text-muted-foreground">
				Select the specific line items to refund for Ticket <span
					class="text-foreground font-mono font-bold">#{selectedOrder?.id}</span
				>.
			</Dialog.Description>
		</Dialog.Header>

		<div class="bg-secondary/10 border-border my-4 overflow-hidden rounded-lg border">
			<div
				class="bg-secondary/30 text-muted-foreground flex justify-between border-b p-3 text-xs font-bold uppercase"
			>
				<span>Item Ledger</span>
				<span>Price</span>
			</div>

			<div class="max-h-[40vh] space-y-1 overflow-y-auto p-2">
				{#if selectedOrder}
					{#each selectedOrder.items as item (item.id)}
						{@const isLiability =
							item.ledger_status === "active" &&
							item.fulfillment_status === "cancelled"}
						{@const isFreebie = item.ledger_status === "voided"}
						{@const isRefunded = item.is_already_refunded}

						<label
							class="hover:bg-secondary/40 flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors {isRefunded ||
							isFreebie
								? 'cursor-not-allowed opacity-50'
								: ''} {isLiability
								? 'bg-destructive/5 border-destructive/20 border'
								: ''}"
						>
							<div class="flex items-center gap-3">
								<Checkbox
									checked={selectedItemIdsToRefund.includes(item.id)}
									onCheckedChange={(isChecked) => {
										if (isChecked) {
											selectedItemIdsToRefund = [
												...selectedItemIdsToRefund,
												item.id,
											];
										} else {
											selectedItemIdsToRefund =
												selectedItemIdsToRefund.filter(
													(id) => id !== item.id
												);
										}
									}}
									disabled={isRefunded || isFreebie}
									class={isLiability
										? "border-destructive data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground"
										: ""}
								/>
								<div>
									<div class="leading-none font-bold">
										{item.qty}x {item.name}
									</div>
									<div class="mt-1 flex items-center gap-1">
										{#if isRefunded}
											<Badge
												variant="outline"
												class="text-muted-foreground text-[9px] tracking-widest uppercase"
												>Already Refunded</Badge
											>
										{:else if isFreebie}
											<Badge
												variant="outline"
												class="text-[9px] tracking-widest text-amber-600 uppercase"
												>Freebie (No Value)</Badge
											>
										{:else if isLiability}
											<Badge
												variant="destructive"
												class="flex items-center gap-1 text-[9px] tracking-widest uppercase"
											>
												<TriangleAlert class="h-2 w-2" /> Liability
											</Badge>
										{:else}
											<Badge
												variant="outline"
												class="text-[9px] tracking-widest text-green-600 uppercase"
												>Delivered</Badge
											>
										{/if}
									</div>
								</div>
							</div>
							<div
								class="font-mono font-bold {isLiability ? 'text-destructive' : ''}"
							>
								{formatMoney(Number(item.price_total))}
							</div>
						</label>
					{/each}
				{/if}
			</div>

			<div class="bg-secondary/30 flex items-end justify-between border-t p-4">
				<span class="text-muted-foreground text-xs font-bold uppercase"
					>Total Authorized Refund</span
				>
				<span class="text-destructive font-mono text-2xl font-black">
					-{formatMoney(dynamicRefundTotal)}
				</span>
			</div>
		</div>

		<Dialog.Footer class="gap-2 sm:justify-end">
			<Button
				type="button"
				variant="outline"
				onclick={() => (showRefundModal = false)}
				disabled={isSubmitting}
			>
				Cancel
			</Button>

			<form
				method="POST"
				action="?/partialRefund"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update, result }) => {
						isSubmitting = false;
						if (result.type === "success") {
							showRefundModal = false;
							selectedItemIdsToRefund = [];
						} else {
							console.error("Refund failed:", result);
							alert("Failed to process refund. Check the console for details.");
						}
						await update();
					};
				}}
			>
				<input type="hidden" name="order_id" value={selectedOrder?.id} />
				<input type="hidden" name="item_ids" value={JSON.stringify(safeIdsToRefund)} />

				<Button
					type="submit"
					variant="destructive"
					disabled={isSubmitting || safeIdsToRefund.length === 0}
					class="font-bold tracking-wide uppercase"
				>
					Execute Partial Refund
				</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<div class="flex h-full flex-col gap-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-black tracking-tight uppercase">Today's Transactions</h1>
			<p class="text-muted-foreground font-mono text-sm">
				{new Date().toLocaleDateString("en-US", {
					weekday: "long",
					year: "numeric",
					month: "long",
					day: "numeric",
				})}
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
		<Card class="border-border bg-card flex flex-col justify-center border p-5 shadow-sm">
			<div
				class="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-bold uppercase"
			>
				<TrendingUp class="h-4 w-4" /> Net Revenue
			</div>
			<div class="text-primary font-mono text-3xl font-black tracking-tighter">
				{formatMoney(totalRevenue)}
			</div>
		</Card>

		<Card class="border-border bg-card flex flex-col justify-center border p-5 shadow-sm">
			<div
				class="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-bold uppercase"
			>
				<Receipt class="h-4 w-4" /> Valid Tickets
			</div>
			<div class="font-mono text-3xl font-black tracking-tighter">
				{validTicketCount}
			</div>
		</Card>

		<Card class="border-border bg-card flex flex-col justify-center border p-5 shadow-sm">
			<div
				class="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-bold uppercase"
			>
				<Banknote class="h-4 w-4" /> Net Cash
			</div>
			<div class="font-mono text-3xl font-black tracking-tighter text-orange-600">
				{formatMoney(cashTotal)}
			</div>
		</Card>

		<Card class="border-border bg-card flex flex-col justify-center border p-5 shadow-sm">
			<div
				class="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-bold uppercase"
			>
				<QrCode class="h-4 w-4" /> Net QRIS
			</div>
			<div class="font-mono text-3xl font-black tracking-tighter text-blue-600">
				{formatMoney(qrisTotal)}
			</div>
		</Card>
	</div>

	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="relative w-full sm:w-96">
			<Search
				class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
			/>
			<Input
				type="search"
				placeholder="Search ticket # or customer..."
				class="bg-card border-border h-10 pl-9 font-mono"
				bind:value={searchQuery}
			/>
		</div>

		<div class="bg-secondary/30 scrollbar-hide flex overflow-x-auto rounded-lg p-1">
			{#each filterButtons as filter (filter.id)}
				<button
					onclick={() => (statusFilter = filter.id)}
					class="rounded-md px-4 py-1.5 text-xs font-bold whitespace-nowrap uppercase transition-all {statusFilter ===
					filter.id
						? filter.activeClass
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{filter.label}
				</button>
			{/each}
		</div>
	</div>

	<Card class="border-border flex-1 overflow-hidden border pt-0 shadow-sm">
		<div class="h-full overflow-auto">
			<Table>
				<TableHeader class="bg-secondary/50 sticky top-0 z-10 backdrop-blur-md">
					<TableRow>
						<TableHead class="w-24 font-bold uppercase">Ticket</TableHead>
						<TableHead class="font-bold uppercase">Time</TableHead>
						<TableHead class="font-bold uppercase">Customer</TableHead>
						<TableHead class="font-bold uppercase">Summary</TableHead>
						<TableHead class="text-center font-bold uppercase">Status</TableHead>
						<TableHead class="text-center font-bold uppercase">Payment</TableHead>
						<TableHead class="text-right font-bold uppercase">Total</TableHead>
						<TableHead class="w-20 text-center font-bold uppercase">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if filteredOrders.length === 0}
						<TableRow>
							<TableCell colspan={8} class="text-muted-foreground h-32 text-center">
								No transactions found matching your filters.
							</TableCell>
						</TableRow>
					{:else}
						{#each filteredOrders as order (order.id)}
							<!-- 🚀 1. Define order-level liability -->
							{@const hasLiability = order.items.some(
								(i) =>
									i.ledger_status === "active" &&
									i.fulfillment_status === "cancelled" &&
									!i.is_already_refunded
							)}

							<!-- 🚀 2. Remove opacity fade and add red background if it's a liability -->
							<TableRow
								class="{order._uiStatus === 'cancelled' && !hasLiability
									? 'opacity-50'
									: ''} {order.kind === 'refund' || hasLiability
									? 'bg-destructive/5'
									: ''}"
							>
								<TableCell class="font-mono font-black">
									#{order.id}
									{#if order.kind === "refund"}
										<div
											class="text-destructive mt-0.5 text-[9px] tracking-widest uppercase"
										>
											Refund
										</div>
									{/if}
								</TableCell>
								<TableCell class="text-muted-foreground font-mono text-xs"
									>{formatTime(order.created_at)}</TableCell
								>
								<TableCell class="font-bold"
									>{order.customer_name || "Walk-in"}</TableCell
								>

								<TableCell>
									<div class="text-muted-foreground max-w-40 truncate text-xs">
										{#if order._uiStatus === "empty"}
											<span class="italic">No items</span>
										{:else}
											{@const displayItems = order.items.filter(
												(i) =>
													!(
														i.ledger_status === "voided" &&
														i.fulfillment_status === "cancelled"
													)
											)}

											{#if displayItems.length > 0}
												<div class="flex flex-wrap gap-1">
													{#each displayItems as i, index (i.id)}
														<!-- 🚀 3. Highlight specific liability items in the summary -->
														{@const isItemLiability =
															i.ledger_status === "active" &&
															i.fulfillment_status === "cancelled" &&
															!i.is_already_refunded}
														<span
															class="{i.is_already_refunded
																? 'text-muted-foreground line-through'
																: ''}
                                                   {isItemLiability
																? 'text-destructive font-bold'
																: ''}"
														>
															{#if isItemLiability}
																<TriangleAlert
																	class="mb-0.5 inline-block h-3 w-3"
																/>
															{/if}
															{i.qty}x {i.name}{index <
															displayItems.length - 1
																? ", "
																: ""}
														</span>
													{/each}
												</div>
											{:else}
												<div class="flex flex-wrap gap-1">
													{#each order.items as i, index (i.id)}
														{@const isItemLiability =
															i.ledger_status === "active" &&
															i.fulfillment_status === "cancelled" &&
															!i.is_already_refunded}
														<span
															class="{i.is_already_refunded
																? 'text-muted-foreground line-through'
																: ''}
                                                   {isItemLiability
																? 'text-destructive font-bold'
																: ''}"
														>
															{#if isItemLiability}
																<TriangleAlert
																	class="mb-0.5 inline-block h-3 w-3"
																/>
															{/if}
															{i.qty}x {i.name}{index <
															order.items.length - 1
																? ", "
																: ""}
														</span>
													{/each}
												</div>
											{/if}
										{/if}
									</div>
								</TableCell>

								<TableCell class="text-center">
									{#if order.kind === "refund"}
										<Badge
											variant="outline"
											class="border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-bold uppercase"
										>
											<Undo2 class="mr-1 h-3 w-3" /> Refunded
										</Badge>
										<!-- 🚀 4. Override Status Badge for Liabilities -->
									{:else if hasLiability}
										<Badge
											variant="destructive"
											class="animate-pulse text-[10px] font-bold uppercase shadow-sm"
										>
											<TriangleAlert class="mr-1 h-3 w-3" /> Liability
										</Badge>
									{:else if order._uiStatus === "preparing"}
										<Badge
											variant="outline"
											class="border-orange-200 bg-orange-50 text-[10px] font-bold text-orange-600 uppercase"
										>
											<Coffee class="mr-1 h-3 w-3" /> Preparing
										</Badge>
									{:else if order._uiStatus === "served"}
										<Badge
											variant="outline"
											class="border-green-200 bg-green-50 text-[10px] font-bold text-green-600 uppercase"
										>
											<CircleCheck class="mr-1 h-3 w-3" /> Served
										</Badge>
									{:else if order._uiStatus === "cancelled"}
										<Badge
											variant="outline"
											class="text-muted-foreground text-[10px] font-bold uppercase"
										>
											<Ban class="mr-1 h-3 w-3" /> Cancelled
										</Badge>
									{/if}
								</TableCell>

								<TableCell class="text-center">
									{#if order.payment_method === "cash"}
										<Badge
											variant="secondary"
											class="text-[10px] font-bold uppercase"
											><Banknote class="mr-1 h-3 w-3" /> Cash</Badge
										>
									{:else if order.payment_method === "qris"}
										<Badge
											variant="secondary"
											class="text-[10px] font-bold uppercase"
											><QrCode class="mr-1 h-3 w-3" /> QRIS</Badge
										>
									{:else if order.payment_method === "comped"}
										<Badge
											variant="outline"
											class="border-amber-200 bg-amber-50 text-[10px] font-bold text-amber-700 uppercase"
											><Gift class="mr-1 h-3 w-3" /> Comped</Badge
										>
									{:else if order.payment_method === null && order._uiStatus !== "cancelled"}
										<Badge
											variant="destructive"
											class="text-[10px] font-bold uppercase"
											><Clock class="mr-1 h-3 w-3" /> Unpaid</Badge
										>
									{:else}
										<span class="text-muted-foreground font-mono text-xs"
											>-</span
										>
									{/if}
								</TableCell>

								<TableCell
									class="text-right font-mono font-bold {order._uiStatus ===
										'cancelled' && !hasLiability
										? 'line-through'
										: ''} {order.kind === 'refund' ? 'text-destructive' : ''}"
								>
									{formatMoney(Number(order.price_total))}
								</TableCell>

								<TableCell class="text-center">
									{#if order.kind === "sale" && order.payment_method !== null}
										{@const hasRefundableItems = order.items.some(
											(i) =>
												i.ledger_status === "active" &&
												!i.is_already_refunded
										)}

										{#if hasRefundableItems}
											<Button
												variant="outline"
												size="icon"
												class="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30 h-8 w-8"
												onclick={() => openRefundModal(order)}
												title="Issue Partial Refund"
											>
												<Undo2 class="h-4 w-4" />
											</Button>
										{:else}
											<Badge
												variant="outline"
												class="text-muted-foreground border-dashed text-[10px] font-bold uppercase"
											>
												Fully Refunded
											</Badge>
										{/if}
									{/if}
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</div>
	</Card>
</div>
