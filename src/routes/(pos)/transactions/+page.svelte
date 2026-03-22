<script lang="ts">
	import { Card } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import { Input } from "$lib/components/ui/input";
	import { Button } from "$lib/components/ui/button";
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
		CreditCard,
		Search,
		Ban,
		Coffee,
		Clock,
		Undo2,
		CircleAlert,
	} from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	type FilterType = "all" | "paid" | "unpaid" | "cancelled" | "refund";

	interface TransactionItem {
		name: string;
		qty: number;
	}

	interface TransactionOrder {
		id: number;
		customer_name: string | null;
		payment_method: "cash" | "qris" | null;
		status: "preparing" | "served" | "cancelled";
		created_at: string;
		price_total: number | string;
		shift: string;
		kind: "sale" | "refund";
		items: TransactionItem[];
	}

	let { data }: { data: PageData } = $props();

	// --- UI STATE ---
	let searchQuery = $state("");
	let statusFilter = $state<FilterType>("all");

	// --- REFUND MODAL STATE ---
	let showRefundModal = $state(false);
	let selectedOrder = $state<TransactionOrder | null>(null);
	let isSubmitting = $state(false);

	// Formatter
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
	// Include both paid sales and refunds to get accurate net math
	let validPaidOrders = $derived(
		data.todayOrders.filter((o) => o.status !== "cancelled" && o.payment_method !== null)
	);

	// If it's a refund, we subtract it from the revenue.
	// (Assuming the backend stores the refund total as a positive number. If backend stores as negative, change to `+`)
	let totalRevenue = $derived(
		validPaidOrders.reduce(
			(sum, o) =>
				o.kind === "refund" ? sum - Number(o.price_total) : sum + Number(o.price_total),
			0
		)
	);

	let cashTotal = $derived(
		validPaidOrders
			.filter((o) => o.payment_method === "cash")
			.reduce(
				(sum, o) =>
					o.kind === "refund" ? sum - Number(o.price_total) : sum + Number(o.price_total),
				0
			)
	);

	let qrisTotal = $derived(
		validPaidOrders
			.filter((o) => o.payment_method === "qris")
			.reduce(
				(sum, o) =>
					o.kind === "refund" ? sum - Number(o.price_total) : sum + Number(o.price_total),
				0
			)
	);

	// --- FILTERED TABLE DATA ---
	let filteredOrders = $derived(
		data.todayOrders.filter((o) => {
			const searchLower = searchQuery.toLowerCase();
			const matchesSearch =
				o.id.toString().includes(searchLower) ||
				(o.customer_name && o.customer_name.toLowerCase().includes(searchLower));

			let matchesStatus = true;
			if (statusFilter === "paid")
				matchesStatus =
					o.payment_method !== null && o.status !== "cancelled" && o.kind === "sale";
			if (statusFilter === "unpaid")
				matchesStatus = o.payment_method === null && o.status !== "cancelled";
			if (statusFilter === "cancelled") matchesStatus = o.status === "cancelled";
			if (statusFilter === "refund") matchesStatus = o.kind === "refund";

			return matchesSearch && matchesStatus;
		})
	);

	function openRefundModal(order: TransactionOrder) {
		selectedOrder = order;
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
	<Dialog.Content class="border-border sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title
				class="text-destructive flex items-center gap-2 font-black tracking-wide uppercase"
			>
				<CircleAlert class="h-5 w-5" /> Confirm Refund
			</Dialog.Title>
			<Dialog.Description class="text-muted-foreground">
				This will permanently reverse Ticket <span
					class="text-foreground font-mono font-bold">#{selectedOrder?.id}</span
				> and remove the funds from your daily totals.
			</Dialog.Description>
		</Dialog.Header>

		<div class="bg-destructive/10 border-destructive/20 my-4 space-y-3 rounded-lg border p-4">
			<div class="flex justify-between text-sm">
				<span class="text-muted-foreground font-bold uppercase">Customer</span>
				<span class="font-bold">{selectedOrder?.customer_name || "Walk-in Guest"}</span>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-muted-foreground font-bold uppercase">Original Payment</span>
				<span class="font-bold uppercase">{selectedOrder?.payment_method}</span>
			</div>
			<div class="border-destructive/20 mt-3 flex items-end justify-between border-t pt-3">
				<span class="text-muted-foreground font-bold uppercase">Refund Amount</span>
				<span class="text-destructive font-mono text-2xl font-black"
					>-{formatMoney(Number(selectedOrder?.price_total || 0))}</span
				>
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
				action="?/refundOrder"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						isSubmitting = false;
						showRefundModal = false;
						await update();
					};
				}}
			>
				<input type="hidden" name="order_id" value={selectedOrder?.id} />
				<Button
					type="submit"
					variant="destructive"
					disabled={isSubmitting}
					class="font-bold tracking-wide uppercase"
				>
					Issue Refund
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
				{data.todayOrders.filter((o) => o.status !== "cancelled" && o.kind === "sale")
					.length}
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
				<CreditCard class="h-4 w-4" /> Net QRIS
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
							<TableRow
								class="{order.status === 'cancelled'
									? 'opacity-50'
									: ''} {order.kind === 'refund' ? 'bg-destructive/5' : ''}"
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
										{order.items
											.map((i: TransactionItem) => `${i.qty}x ${i.name}`)
											.join(", ")}
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
									{:else if order.status === "preparing"}
										<Badge
											variant="outline"
											class="border-orange-200 bg-orange-50 text-[10px] font-bold text-orange-600 uppercase"
										>
											<Coffee class="mr-1 h-3 w-3" /> Preparing
										</Badge>
									{:else if order.status === "served"}
										<Badge
											variant="outline"
											class="border-green-200 bg-green-50 text-[10px] font-bold text-green-600 uppercase"
										>
											Served
										</Badge>
									{:else if order.status === "cancelled"}
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
											><CreditCard class="mr-1 h-3 w-3" /> QRIS</Badge
										>
									{:else if order.payment_method === null && order.status !== "cancelled"}
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
									class="text-right font-mono font-bold {order.status ===
									'cancelled'
										? 'line-through'
										: ''} {order.kind === 'refund' ? 'text-destructive' : ''}"
								>
									{order.kind === "refund" ? "-" : ""}{formatMoney(
										Number(order.price_total)
									)}
								</TableCell>

								<TableCell class="text-center">
									{#if order.kind === "sale" && order.payment_method !== null && order.status !== "cancelled"}
										<Button
											variant="outline"
											size="icon"
											class="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30 h-8 w-8"
											onclick={() => openRefundModal(order)}
											title="Refund Ticket"
										>
											<Undo2 class="h-4 w-4" />
										</Button>
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
