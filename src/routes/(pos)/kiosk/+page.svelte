<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Badge } from "$lib/components/ui/badge";
	import { Card } from "$lib/components/ui/card";
	import * as Dialog from "$lib/components/ui/dialog";
	import {
		Search,
		ShoppingBag,
		Sun,
		Moon,
		QrCode,
		Banknote,
		Coffee,
		Plus,
		Minus,
		CircleCheck,
		Clock,
		Gift,
	} from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import type { ActionResult } from "@sveltejs/kit";
	import { SvelteMap, SvelteSet } from "svelte/reactivity";
	import type { PageData } from "./$types";

	// --- DATABASE TYPES ---
	interface Variation {
		id: number;
		name: string;
		price: number;
	}

	interface MenuItem {
		id: number;
		name: string;
		category_id: number | null;
		description: string | null;
		category_name: string | null;
		image_url: string | null;
		variations: Variation[];
	}

	interface ModifierGroup {
		id: number;
		name: string;
		min_selections: number;
		max_selections: number;
		item_id: number | null;
		category_id: number | null;
	}

	// 🛡️ UPDATED: Synced to backend types
	interface Modifier {
		id: number;
		group_id: number;
		name: string;
		price_adjustment: string | number;
		ingredient_id: number | null;
		behavior: "STATIC" | "DEPENDENT";
		dependency_source: number | null;
		quantity: number;
	}

	// --- CART STATE ---
	interface CartModifier {
		id: number;
		name: string;
		qty: number;
		price: number;
	}

	interface CartItem {
		cart_item_id: string;
		db_item_id?: number;
		id: number;
		parent_item_id: number;
		name: string;
		category: string;
		base_price: number;
		price: number;
		qty: number;
		is_freebie: boolean;
		modifiers: CartModifier[];
	}

	let { data } = $props<{ data: PageData }>();

	// --- UI STATE ---
	let cart = $state<CartItem[]>([]);
	let searchQuery = $state("");
	let activeCategoryId = $state<number | "all">("all");

	// --- MODIFIER & MODAL STATE ---
	let isModalOpen = $state(false);
	let selectedProduct = $state<MenuItem | null>(null);
	let selectedVariation = $state<Variation | null>(null);
	let activeModifierGroups = $state<ModifierGroup[]>([]);
	let chosenModifiers = $state<Record<number, number>>({});

	// --- CHECKOUT & MODAL STATE ---
	let isSubmitting = $state(false);
	let showSuccessModal = $state(false);
	let showConfirmModal = $state(false);
	let amountTendered = $state<number | "">("");
	let lastCompletedOrderId = $state<number | null>(null);
	let checkoutForm = $state<HTMLFormElement>();

	let customerName = $state("");
	let shift = $state("day");
	let paymentMethod = $state("unpaid");
	let editOrderId = $derived<number | null>(data.editOrderData?.id || null);
	let loadedEditId = $state<number | null>(null);

	// 🚀 RESTORED: $O(1) Map for instant lookups
	let modifierLookup = $derived.by(() => {
		const map = new SvelteMap<number, Modifier>();
		for (const mod of data.modifiers) {
			map.set(mod.id, mod);
		}
		return map;
	});

	$effect(() => {
		const incomingId = data.editOrderData?.id || null;

		if (incomingId !== loadedEditId) {
			loadedEditId = incomingId;

			if (incomingId && data.editOrderData) {
				cart = structuredClone(data.editOrderData.cart);
				customerName = data.editOrderData.customer_name || "";
				shift = data.editOrderData.shift || "day";
				paymentMethod = data.editOrderData.payment_method || "unpaid";
			} else {
				cart = [];
				customerName = "";
				// shift = "day";
				paymentMethod = "unpaid";
			}
		}
	});

	let total = $derived(
		cart.reduce((sum, item) => sum + (item.is_freebie ? 0 : item.price * item.qty), 0)
	);

	let categories = $derived.by(() => {
		const map = new SvelteMap<number, { id: number; name: string }>();
		for (const item of data.items) {
			const catId = item.category_id || 99999;
			const catName = item.category_name || "Uncategorized";
			if (!map.has(catId)) {
				map.set(catId, { id: catId, name: catName });
			}
		}
		return Array.from(map.values()).sort((a, b) => a.id - b.id);
	});

	let filteredItems = $derived(
		data.items.filter((i: MenuItem) => {
			const matchesSearch =
				i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				i.category_name?.toLowerCase().includes(searchQuery.toLowerCase());

			const catId = i.category_id || 99999;
			const matchesCategory = activeCategoryId === "all" || catId === activeCategoryId;

			return matchesSearch && matchesCategory;
		})
	);

	let changeDue = $derived(Number(amountTendered || 0) - total);

	$effect(() => {
		if (showConfirmModal) amountTendered = "";
	});

	$effect(() => {
		if (cart.length > 0 && total === 0 && paymentMethod !== "comped") {
			paymentMethod = "comped";
		} else if (total > 0 && paymentMethod === "comped") {
			paymentMethod = "unpaid";
		}
	});

	const formatMoney = (val: number) =>
		new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);

	// 🛡️ RESTORED: Deduplication to fix SQL JOIN overlaps
	function dedupeModifierGroups(groups: ModifierGroup[]) {
		const seen = new SvelteSet<number>();
		return groups.filter((group) => {
			if (seen.has(group.id)) return false;
			seen.add(group.id);
			return true;
		});
	}

	// --- ACTIONS ---
	function handleProductClick(product: MenuItem) {
		if (!product.variations || product.variations.length === 0) {
			alert("Error: This product has no physical variations configured.");
			return;
		}

		selectedProduct = product;
		selectedVariation = product.variations[0];

		// Applied dedupe wrapper
		const applicableGroups = dedupeModifierGroups(
			data.modifierGroups.filter(
				(mg: ModifierGroup) =>
					mg.item_id === product.id || mg.category_id === product.category_id
			)
		);

		if (product.variations.length > 1 || applicableGroups.length > 0) {
			activeModifierGroups = applicableGroups;
			chosenModifiers = {};

			applicableGroups.forEach((group: ModifierGroup) => {
				if (group.min_selections >= 1 && group.max_selections === 1) {
					const groupOptions = data.modifiers.filter(
						(m: Modifier) => m.group_id === group.id
					);
					if (groupOptions.length > 0) chosenModifiers[groupOptions[0].id] = 1;
				}
			});
			isModalOpen = true;
		} else {
			addItemToCart(product, selectedVariation, []);
		}
	}

	function updateRadioSelection(groupId: number, selectedModId: number) {
		const groupOptions = data.modifiers.filter((m: Modifier) => m.group_id === groupId);
		groupOptions.forEach((m: Modifier) => {
			chosenModifiers[m.id] = 0;
		});
		chosenModifiers[selectedModId] = 1;
	}

	function updateCounterQty(
		groupId: number,
		modId: number,
		delta: number,
		maxSelections: number | null
	) {
		const currentQty = chosenModifiers[modId] || 0;
		const nextQty = currentQty + delta;
		if (nextQty < 0) return;

		if (delta > 0 && maxSelections !== null) {
			const groupOptions = data.modifiers.filter((m: Modifier) => m.group_id === groupId);
			const currentGroupTotal = groupOptions.reduce(
				(sum: number, m: Modifier) => sum + (chosenModifiers[m.id] || 0),
				0
			);
			if (currentGroupTotal >= maxSelections) return;
		}
		chosenModifiers[modId] = nextQty;
	}

	function confirmConfiguration() {
		if (!selectedProduct || !selectedVariation) return;

		const selectedMods: CartModifier[] = Object.entries(chosenModifiers)
			.filter(([, qty]) => qty > 0)
			.map(([idStr, qty]) => {
				const modId = Number(idStr);
				// 🚀 USING MAP INSTEAD OF .find()
				const modDef = modifierLookup.get(modId);
				if (!modDef) return null;
				return {
					id: modDef.id,
					name: modDef.name,
					qty,
					price: Number(modDef.price_adjustment),
				};
			})
			.filter((m): m is CartModifier => m !== null);

		addItemToCart(selectedProduct, selectedVariation, selectedMods);
		isModalOpen = false;
	}

	function addItemToCart(
		product: MenuItem,
		variation: Variation,
		modifiers: CartModifier[],
		dbItemId?: number
	) {
		const modsPrice = modifiers.reduce((sum, m) => sum + m.price * m.qty, 0);
		const finalUnitPrice = Number(variation.price) + modsPrice;

		const modsString = modifiers
			.sort((a, b) => a.id - b.id)
			.map((m) => `${m.id}x${m.qty}`)
			.join("_");

		const cartId = `${variation.id}-${modsString || "nomods"}`;

		const existing = cart.find((i) => i.cart_item_id === cartId);
		if (existing && existing.is_freebie === false) {
			existing.qty += 1;
		} else {
			const displayName =
				product.variations.length > 1
					? `${product.name} (${variation.name})`
					: product.name;

			cart.push({
				cart_item_id: cartId + (existing ? `-${Date.now()}` : ""), // Make cart id unique if we have a freebie split
				db_item_id: dbItemId,
				id: variation.id,
				parent_item_id: product.id,
				name: displayName,
				category: product.category_name || "Others",
				base_price: Number(variation.price),
				price: finalUnitPrice,
				qty: 1,
				is_freebie: false,
				modifiers,
			});
		}
	}

	function updateCartQty(index: number, delta: number) {
		const item = cart[index];
		const newQty = item.qty + delta;
		if (newQty <= 0) cart.splice(index, 1);
		else item.qty = newQty;
	}

	function toggleFreebie(index: number) {
		cart[index].is_freebie = !cart[index].is_freebie;
	}

	function handleCheckout() {
		isSubmitting = true;
		return async ({
			result,
			update,
		}: {
			result: ActionResult;
			update: (options?: { reset?: boolean }) => Promise<void>; // Add typing for options
		}) => {
			isSubmitting = false;
			if (result.type === "success") {
				lastCompletedOrderId = result.data?.orderId as number;
				showSuccessModal = true;
				cart = [];
				customerName = "";
				amountTendered = "";
				// 🛡️ Explicitly enforce the default payment method for the next order
				paymentMethod = "unpaid";

				// 🚀 Tell SvelteKit NOT to reset the native <form>, preserving our `shift` state
				await update({ reset: false });
			} else if (result.type === "failure") {
				alert(result.data?.error || "Transaction failed. Please try again.");
			}
		};
	}
</script>

<Dialog.Root bind:open={isModalOpen}>
	<Dialog.Content class="bg-card max-h-[90vh] overflow-y-auto border-2 border-dashed sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-black tracking-wide uppercase">Configure Item</Dialog.Title>
			<Dialog.Description class="text-muted-foreground font-mono text-xs">
				Customizing <span class="font-bold">{selectedProduct?.name}</span>
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6 py-4">
			{#if selectedProduct && selectedProduct.variations.length > 1}
				<div class="bg-secondary/10 border-border/50 space-y-2 rounded-md border p-4">
					<Label class="text-muted-foreground text-xs font-bold uppercase"
						>Select Size / Type</Label
					>
					<div class="grid grid-cols-2 gap-2">
						{#each selectedProduct.variations as v (v.id)}
							<button
								onclick={() => (selectedVariation = v)}
								class="flex flex-col items-start justify-center rounded-md border p-3 transition-colors {selectedVariation?.id ===
								v.id
									? 'border-primary bg-primary/10 text-primary'
									: 'border-border bg-card hover:bg-muted/50'}"
							>
								<span class="font-bold">{v.name}</span>
								<span class="font-mono text-xs opacity-80"
									>{formatMoney(Number(v.price))}</span
								>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#each activeModifierGroups as group (group.id)}
				{@const groupOptions = data.modifiers.filter(
					(m: Modifier) => m.group_id === group.id
				)}
				{#if groupOptions.length > 0}
					<div class="space-y-2">
						<Label class="text-muted-foreground text-xs font-bold uppercase"
							>{group.name}</Label
						>
						<div class="grid gap-2">
							{#if group.min_selections >= 1 && group.max_selections === 1}
								{#each groupOptions as option (option.id)}
									<button
										onclick={() => updateRadioSelection(group.id, option.id)}
										class="hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between rounded-md border p-3 transition-colors {chosenModifiers[
											option.id
										] === 1
											? 'border-primary bg-primary/5'
											: 'border-border'}"
									>
										<div class="flex items-center gap-3">
											<div
												class="border-primary flex h-4 w-4 items-center justify-center rounded-full border"
											>
												{#if chosenModifiers[option.id] === 1}
													<div
														class="bg-primary h-2 w-2 rounded-full"
													></div>
												{/if}
											</div>
											<span class="text-left text-sm font-bold"
												>{option.name}</span
											>
										</div>
										{#if Number(option.price_adjustment) > 0}
											<span class="text-primary font-mono text-xs font-bold"
												>+{formatMoney(
													Number(option.price_adjustment)
												)}</span
											>
										{/if}
									</button>
								{/each}
							{:else}
								{#each groupOptions as option (option.id)}
									<div
										class="border-border flex items-center justify-between rounded-md border p-3"
									>
										<div>
											<div class="text-sm font-bold">{option.name}</div>
											{#if Number(option.price_adjustment) > 0}
												<div
													class="text-primary font-mono text-xs font-bold"
												>
													+{formatMoney(Number(option.price_adjustment))}
												</div>
											{/if}
										</div>
										<div
											class="bg-secondary/30 flex items-center gap-2 rounded p-1"
										>
											<button
												onclick={() =>
													updateCounterQty(
														group.id,
														option.id,
														-1,
														group.max_selections
													)}
												class="hover:bg-background text-muted-foreground flex h-7 w-7 items-center justify-center rounded transition-colors"
												><Minus class="h-3 w-3" /></button
											>
											<span
												class="w-4 text-center font-mono text-sm font-bold"
												>{chosenModifiers[option.id] || 0}</span
											>
											<button
												onclick={() =>
													updateCounterQty(
														group.id,
														option.id,
														1,
														group.max_selections
													)}
												class="hover:bg-background flex h-7 w-7 items-center justify-center rounded transition-colors"
												><Plus class="h-3 w-3" /></button
											>
										</div>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				{/if}
			{/each}
		</div>
		<Dialog.Footer>
			<Button onclick={confirmConfiguration} class="w-full font-bold tracking-wide uppercase"
				><Plus class="mr-2 h-4 w-4" /> Add to Ticket</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showConfirmModal}>
	<Dialog.Content class="border-border sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-black tracking-wide uppercase">Confirm Order</Dialog.Title>
			<Dialog.Description class="text-muted-foreground"
				>Please review the ticket details before charging.</Dialog.Description
			>
		</Dialog.Header>

		<div class="bg-secondary/20 border-border my-4 space-y-3 rounded-lg border p-4">
			<div class="flex justify-between text-sm">
				<span class="text-muted-foreground font-bold uppercase">Customer</span>
				<span class="font-bold">{customerName || "Walk-in Guest"}</span>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-muted-foreground font-bold uppercase">Items</span>
				<span class="font-bold">{cart.reduce((acc, item) => acc + item.qty, 0)}</span>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-muted-foreground font-bold uppercase">Payment</span>
				<span
					class="font-bold uppercase {paymentMethod === 'unpaid'
						? 'text-destructive'
						: ''}">{paymentMethod}</span
				>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-muted-foreground font-bold uppercase">Shift</span>
				<span class="font-bold capitalize">{shift}</span>
			</div>
			<div class="border-border mt-3 flex items-end justify-between border-t pt-3">
				<span class="text-muted-foreground font-bold uppercase">Total Due</span>
				<span class="text-primary font-mono text-2xl font-black">{formatMoney(total)}</span>
			</div>
		</div>

		{#if paymentMethod === "cash"}
			<div class="bg-background border-border space-y-4 rounded-lg border p-4 shadow-sm">
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
							placeholder={total.toString()}
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
						onclick={() => (amountTendered = total)}>Exact</Button
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
					<span class="text-muted-foreground text-xs font-bold uppercase">Change Due</span
					>
					<span
						class="font-mono text-xl font-black {changeDue < 0
							? 'text-destructive'
							: 'text-primary'}"
						>{changeDue < 0 ? "-" : ""}{formatMoney(Math.abs(changeDue))}</span
					>
				</div>
			</div>
		{/if}

		<Dialog.Footer class="gap-2 sm:justify-end">
			<Button
				type="button"
				variant="outline"
				onclick={() => (showConfirmModal = false)}
				disabled={isSubmitting}>Cancel</Button
			>
			<Button
				type="button"
				onclick={() => {
					showConfirmModal = false;
					checkoutForm?.requestSubmit();
				}}
				disabled={isSubmitting || (paymentMethod === "cash" && changeDue < 0)}
				class="font-bold tracking-wide uppercase {paymentMethod === 'unpaid'
					? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
					: ''}"
			>
				{#if paymentMethod === "unpaid"}
					Save Open Ticket
				{:else}
					Confirm & Pay
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showSuccessModal}>
	<Dialog.Content class="border-border sm:max-w-md">
		<div class="flex flex-col items-center justify-center space-y-4 py-8 text-center">
			<div class="bg-primary/20 text-primary mb-2 rounded-full p-4">
				<CircleCheck class="h-12 w-12" />
			</div>
			<Dialog.Title class="text-2xl font-black tracking-tighter uppercase"
				>Order Confirmed!</Dialog.Title
			>
			<Dialog.Description class="text-muted-foreground text-base"
				>Ticket <span class="text-foreground font-mono font-bold"
					>#{lastCompletedOrderId}</span
				> has been sent to the kitchen.</Dialog.Description
			>
		</div>
		<Dialog.Footer class="sm:justify-center">
			<Button
				type="button"
				size="lg"
				onclick={() => (showSuccessModal = false)}
				class="w-full font-bold tracking-wide uppercase">Start Next Order</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<div class="flex h-full w-full flex-col gap-6 lg:flex-row">
	<div class="flex flex-3 flex-col gap-4">
		<div class="relative">
			<Search class="text-muted-foreground absolute top-3 left-3 h-5 w-5" />
			<Input
				type="search"
				placeholder="Search menu..."
				class="bg-card border-border h-12 pl-10 text-lg"
				bind:value={searchQuery}
			/>
		</div>

		<div class="hide-scrollbar flex gap-2 overflow-x-auto pb-2">
			<button
				onclick={() => (activeCategoryId = "all")}
				class="rounded-full border px-5 py-2 text-sm font-bold whitespace-nowrap transition-all {activeCategoryId ===
				'all'
					? 'border-primary bg-primary text-primary-foreground shadow-md'
					: 'border-border bg-card text-muted-foreground hover:bg-secondary/40 hover:text-foreground'}"
				>All</button
			>
			{#each categories as cat (cat.id)}
				<button
					onclick={() => (activeCategoryId = cat.id)}
					class="rounded-full border px-5 py-2 text-sm font-bold whitespace-nowrap transition-all {activeCategoryId ===
					cat.id
						? 'border-primary bg-primary text-primary-foreground shadow-md'
						: 'border-border bg-card text-muted-foreground hover:bg-secondary/40 hover:text-foreground'}"
					>{cat.name}</button
				>
			{/each}
		</div>

		<div class="flex-1 overflow-y-auto pr-2 pb-8">
			{#if filteredItems.length === 0}
				<div
					class="text-muted-foreground flex h-full flex-col items-center justify-center opacity-50"
				>
					<Coffee class="mb-4 h-12 w-12" />
					<p>No items found in this category.</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
					{#each filteredItems as item (item.id)}
						{@const displayPrice = item.variations?.[0]?.price || 0}
						<button
							onclick={() => handleProductClick(item)}
							class="bg-card hover:border-primary/50 hover:bg-secondary/20 group relative flex flex-col items-start overflow-hidden rounded-lg border text-left transition-all active:scale-95"
						>
							<div
								class="bg-secondary/30 border-border flex h-32 w-full items-center justify-center overflow-hidden border-b"
							>
								<Coffee class="text-muted-foreground h-10 w-10 opacity-30" />
							</div>
							<div class="w-full p-3">
								{#if activeCategoryId === "all"}
									<span
										class="text-muted-foreground mb-1 font-mono text-[10px] uppercase"
										>{item.category_name || "General"}</span
									>
								{/if}
								<div
									class="group-hover:text-primary line-clamp-2 text-base leading-tight font-bold transition-colors"
								>
									{item.name}
								</div>
								<div class="mt-2 font-mono text-sm font-black">
									{formatMoney(Number(displayPrice))}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<div class="h-full w-full flex-1 lg:w-100">
		<Card class="border-border bg-card flex h-full flex-col border-2 py-0 shadow-lg">
			<div class="border-border bg-secondary/10 border-b p-4">
				<div class="flex items-center justify-between">
					<h2 class="flex items-center gap-2 font-black tracking-tight uppercase">
						<ShoppingBag class="h-5 w-5" /> Current Order
					</h2>
					<Badge variant="outline" class="font-mono"
						>{cart.reduce((acc, item) => acc + item.qty, 0)} Items</Badge
					>
				</div>
			</div>

			<div class="flex-1 space-y-3 overflow-y-auto p-4">
				{#if cart.length === 0}
					<div
						class="text-muted-foreground flex h-full flex-col items-center justify-center space-y-4 opacity-40"
					>
						<div
							class="border-muted-foreground rounded-full border-2 border-dashed p-8"
						>
							<ShoppingBag class="h-8 w-8" />
						</div>
						<p class="font-mono text-xs uppercase">Ticket Empty</p>
					</div>
				{:else}
					{#each cart as item, i (item.cart_item_id)}
						<div
							class="bg-background border-border relative flex items-start gap-3 border p-3 shadow-sm {item.is_freebie
								? 'border-amber-500/50 bg-amber-500/5'
								: ''}"
						>
							<button
								onclick={() => toggleFreebie(i)}
								class="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded transition-colors {item.is_freebie
									? 'bg-amber-500 text-white'
									: 'text-muted-foreground hover:bg-secondary'}"
								title={item.is_freebie ? "Remove Comp" : "Comp Item (Freebie)"}
							>
								<Gift class="h-3 w-3" />
							</button>

							<div
								class="bg-secondary/30 mt-1 flex flex-col items-center gap-1 rounded px-1 py-1"
							>
								<button
									onclick={() => updateCartQty(i, 1)}
									class="hover:bg-primary hover:text-primary-foreground flex h-6 w-6 items-center justify-center rounded text-xs transition-colors"
									>+</button
								>
								<span class="font-mono text-sm font-bold">{item.qty}</span>
								<button
									onclick={() => updateCartQty(i, -1)}
									class="hover:bg-destructive hover:text-destructive-foreground flex h-6 w-6 items-center justify-center rounded text-xs transition-colors"
									>-</button
								>
							</div>

							<div class="min-w-0 flex-1 pr-8">
								<div class="truncate leading-tight font-bold">{item.name}</div>

								{#if item.is_freebie}
									<Badge
										variant="outline"
										class="mt-1 border-amber-200 bg-amber-50 text-[9px] font-bold text-amber-600 uppercase"
										>100% Comped</Badge
									>
								{/if}

								{#if item.modifiers && item.modifiers.length > 0}
									<div class="mt-1 space-y-0.5">
										{#each item.modifiers as mod (mod.id)}
											<div
												class="text-muted-foreground border-primary/50 ml-0.5 border-l-2 pl-1.5 font-mono text-[10px] uppercase"
											>
												+ {mod.qty > 1 ? `${mod.qty}x ` : ""}{mod.name}
												{#if mod.price > 0}
													<span
														class="opacity-60 {item.is_freebie
															? 'line-through'
															: ''}"
													>
														({formatMoney(mod.price * mod.qty)})
													</span>
												{/if}
											</div>
										{/each}
									</div>
								{/if}

								<div
									class="text-muted-foreground mt-1 font-mono text-[10px] {item.is_freebie
										? 'line-through'
										: ''}"
								>
									{formatMoney(item.price)} / unit
								</div>
							</div>

							<div
								class="mt-1 text-right font-mono font-bold {item.is_freebie
									? 'text-amber-600'
									: ''}"
							>
								{#if item.is_freebie}
									Rp 0
								{:else}
									{formatMoney(item.price * item.qty)}
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<div class="bg-secondary/10 border-border border-t p-6">
				<form
					bind:this={checkoutForm}
					method="POST"
					use:enhance={handleCheckout}
					class="space-y-5"
				>
					<input type="hidden" name="edit_order_id" value={editOrderId || ""} />
					<input
						type="hidden"
						name="cart"
						value={JSON.stringify(
							cart.map((i) => ({
								id: i.id,
								db_item_id: i.db_item_id,
								qty: i.qty,
								is_freebie: i.is_freebie,
								modifiers:
									i.modifiers?.map((m) => ({ id: m.id, qty: m.qty })) || [],
							}))
						)}
					/>

					<div
						class="border-border flex items-end justify-between border-b border-dashed pb-4"
					>
						<span class="text-muted-foreground text-sm font-bold uppercase"
							>Total Due</span
						>
						<span class="text-primary font-mono text-4xl font-black tracking-tighter"
							>{formatMoney(total)}</span
						>
					</div>

					<div class="space-y-1">
						<Label class="text-muted-foreground text-xs font-bold uppercase"
							>Customer Name</Label
						>
						<Input
							name="customer_name"
							bind:value={customerName}
							placeholder="Walk-in Guest"
							class="bg-background border-border"
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-1">
							<Label class="text-muted-foreground text-xs font-bold uppercase"
								>Shift</Label
							>
							<div class="bg-background border-border flex border p-1">
								<label class="flex-1 cursor-pointer">
									<input
										type="radio"
										name="shift"
										bind:group={shift}
										value="day"
										class="peer sr-only"
									/>
									<div
										class="hover:bg-secondary text-muted-foreground flex h-9 items-center justify-center gap-2 rounded-sm text-xs font-bold uppercase transition-all peer-checked:bg-orange-100 peer-checked:text-orange-700"
									>
										<Sun class="h-3 w-3" />
									</div>
								</label>
								<label class="flex-1 cursor-pointer">
									<input
										type="radio"
										name="shift"
										bind:group={shift}
										value="night"
										class="peer sr-only"
									/>
									<div
										class="hover:bg-secondary text-muted-foreground flex h-9 items-center justify-center gap-2 rounded-sm text-xs font-bold uppercase transition-all peer-checked:bg-orange-100 peer-checked:text-orange-700"
									>
										<Moon class="h-3 w-3" />
									</div>
								</label>
							</div>
						</div>

						<div class="space-y-1">
							<Label class="text-muted-foreground text-xs font-bold uppercase"
								>Payment</Label
							>
							{#if cart.length > 0 && total === 0}
								<input type="hidden" name="payment_method" value="comped" />

								<div
									class="flex flex-col items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-center"
								>
									<span
										class="font-bold tracking-widest text-amber-600 uppercase"
									>
										<Gift class="mb-1 inline-block h-5 w-5" /> Fully Comped Ticket
									</span>
									<p class="mt-1 font-mono text-[10px] text-amber-600/70">
										No payment required. Ticket will auto-clear from queue when
										served.
									</p>
								</div>
							{:else}
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
											class="hover:bg-secondary text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground flex h-9 items-center justify-center gap-1 rounded-sm p-2 text-xs font-bold uppercase transition-all"
										>
											<Banknote class="h-4 w-4" />
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
											<QrCode class="h-4 w-4" />
										</div>
									</label>
									<label class="flex-1 cursor-pointer">
										<input
											type="radio"
											name="payment_method"
											bind:group={paymentMethod}
											value="unpaid"
											class="peer sr-only"
										/>
										<div
											class="hover:bg-secondary text-muted-foreground peer-checked:bg-destructive peer-checked:text-destructive-foreground flex h-9 items-center justify-center gap-1 rounded-sm text-xs font-bold uppercase transition-all"
										>
											<Clock class="h-4 w-4" />
										</div>
									</label>
								</div>
							{/if}
						</div>
					</div>

					<Button
						type="button"
						size="lg"
						onclick={() => (showConfirmModal = true)}
						class="h-14 w-full text-lg font-black tracking-wide uppercase {editOrderId
							? 'bg-amber-500 hover:bg-amber-600'
							: ''} {total === 0 && cart.length > 0
							? 'bg-amber-500 text-white hover:bg-amber-600'
							: ''}"
						disabled={cart.length === 0 || isSubmitting}
					>
						{#if editOrderId}
							Update Ticket #{editOrderId}
						{:else if total === 0 && cart.length > 0}
							Send Comped Ticket
						{:else}
							Review Order
						{/if}
					</Button>
				</form>
			</div>
		</Card>
	</div>
</div>
