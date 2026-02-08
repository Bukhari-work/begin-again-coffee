<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Badge } from "$lib/components/ui/badge";
	import { Card } from "$lib/components/ui/card";
	import { Search, ShoppingBag, Sun, Moon, CreditCard, Banknote, Coffee } from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	let { data } = $props<{ data: PageData }>();

	// --- CART STATE ---
	interface CartItem {
		id: number;
		name: string;
		category: string;
		price: number;
		qty: number;
	}

	let cart = $state<CartItem[]>([]);
	let searchQuery = $state("");

	// Filter items based on search
	let filteredItems = $derived(
		data.items.filter(
			(i: any) =>
				i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				i.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	let total = $derived(cart.reduce((sum, item) => sum + item.price * item.qty, 0));

	// Formatter
	const formatMoney = (val: number) =>
		new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);

	// --- ACTIONS ---
	function addToCart(product: any) {
		const existing = cart.find((i) => i.id === product.id);
		if (existing) {
			existing.qty += 1;
		} else {
			cart.push({
				id: product.id,
				name: product.name,
				category: product.category_name,
				price: parseFloat(product.price),
				qty: 1,
			});
		}
	}

	function updateQty(index: number, delta: number) {
		const item = cart[index];
		const newQty = item.qty + delta;
		if (newQty <= 0) {
			cart.splice(index, 1);
		} else {
			item.qty = newQty;
		}
	}
</script>

<div class="flex h-[calc(100vh-2rem)] flex-col gap-6 lg:flex-row">
	<div class="flex h-full flex-1 flex-col gap-4">
		<div class="relative">
			<Search class="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
			<Input
				type="search"
				placeholder="Search menu..."
				class="bg-card border-border h-12 pl-10 text-lg"
				bind:value={searchQuery}
			/>
		</div>

		<div class="flex-1 overflow-y-auto pr-2">
			{#if filteredItems.length === 0}
				<div
					class="text-muted-foreground flex h-full flex-col items-center justify-center opacity-50"
				>
					<Coffee class="mb-4 h-12 w-12" />
					<p>No items found.</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-4 pb-20 md:grid-cols-3 xl:grid-cols-4">
					{#each filteredItems as item (item.id)}
						<button
							onclick={() => addToCart(item)}
							class="bg-card hover:border-primary/50 hover:bg-secondary/20 group relative flex flex-col items-start border p-4 text-left transition-all active:scale-95"
						>
							<span
								class="text-muted-foreground mb-1 font-mono text-[10px] uppercase"
							>
								{item.category_name || "General"}
							</span>
							<div
								class="group-hover:text-primary text-lg leading-tight font-bold transition-colors"
							>
								{item.name}
							</div>
							<div class="mt-4 font-mono text-sm font-black">
								{formatMoney(item.price)}
							</div>
							<div
								class="bg-primary text-primary-foreground absolute right-4 bottom-4 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<span class="sr-only">Add</span>
								<div
									class="flex h-4 w-4 items-center justify-center text-xs font-bold"
								>
									+
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<div class="h-full w-full lg:w-100">
		<Card class="border-border bg-card flex h-full flex-col border-2 shadow-lg">
			<div class="border-border bg-secondary/10 border-b border-dashed p-6">
				<div class="flex items-center justify-between">
					<h2 class="flex items-center gap-2 font-black tracking-tight uppercase">
						<ShoppingBag class="h-5 w-5" /> Current Order
					</h2>
					<Badge variant="outline" class="font-mono">{cart.length} Items</Badge>
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
					{#each cart as item, i (item.id)}
						<div
							class="bg-background border-border flex items-center gap-3 border p-3 shadow-sm"
						>
							<div
								class="bg-secondary/30 flex flex-col items-center gap-1 rounded px-1 py-1"
							>
								<button
									onclick={() => updateQty(i, 1)}
									class="hover:bg-primary hover:text-primary-foreground flex h-6 w-6 items-center justify-center rounded text-xs transition-colors"
									>+</button
								>
								<span class="font-mono text-sm font-bold">{item.qty}</span>
								<button
									onclick={() => updateQty(i, -1)}
									class="hover:bg-destructive hover:text-destructive-foreground flex h-6 w-6 items-center justify-center rounded text-xs transition-colors"
									>-</button
								>
							</div>

							<div class="min-w-0 flex-1">
								<div class="truncate font-bold">{item.name}</div>
								<div class="text-muted-foreground font-mono text-[10px]">
									{formatMoney(item.price)} / unit
								</div>
							</div>

							<div class="text-right font-mono font-bold">
								{formatMoney(item.price * item.qty)}
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<div class="bg-secondary/10 border-border border-t p-6">
				<form method="POST" use:enhance class="space-y-5">
					<input type="hidden" name="cart" value={JSON.stringify(cart)} />

					<div
						class="border-border flex items-end justify-between border-b border-dashed pb-4"
					>
						<span class="text-muted-foreground text-sm font-bold uppercase"
							>Total Due</span
						>
						<span class="text-primary font-mono text-4xl font-black tracking-tighter">
							{formatMoney(total)}
						</span>
					</div>

					<div class="space-y-1">
						<Label class="text-muted-foreground text-xs font-bold uppercase"
							>Customer Name</Label
						>
						<Input
							name="customer_name"
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
										value="day"
										class="peer sr-only"
										checked
									/>
									<div
										class="hover:bg-secondary text-muted-foreground flex h-9 items-center justify-center gap-2 rounded-sm text-xs font-bold uppercase transition-all peer-checked:bg-orange-100 peer-checked:text-orange-700"
									>
										<Sun class="h-3 w-3" /> Day
									</div>
								</label>
								<label class="flex-1 cursor-pointer">
									<input
										type="radio"
										name="shift"
										value="night"
										class="peer sr-only"
									/>
									<div
										class="hover:bg-secondary text-muted-foreground flex h-9 items-center justify-center gap-2 rounded-sm text-xs font-bold uppercase transition-all peer-checked:bg-blue-100 peer-checked:text-blue-700"
									>
										<Moon class="h-3 w-3" /> Night
									</div>
								</label>
							</div>
						</div>

						<div class="space-y-1">
							<Label class="text-muted-foreground text-xs font-bold uppercase"
								>Payment</Label
							>
							<div class="bg-background border-border flex border p-1">
								<label class="flex-1 cursor-pointer">
									<input
										type="radio"
										name="payment_type"
										value="cash"
										class="peer sr-only"
										checked
									/>
									<div
										class="hover:bg-secondary text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground flex h-9 items-center justify-center gap-2 rounded-sm text-xs font-bold uppercase transition-all"
									>
										<Banknote class="h-3 w-3" /> Cash
									</div>
								</label>
								<label class="flex-1 cursor-pointer">
									<input
										type="radio"
										name="payment_type"
										value="qris"
										class="peer sr-only"
									/>
									<div
										class="hover:bg-secondary text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground flex h-9 items-center justify-center gap-2 rounded-sm text-xs font-bold uppercase transition-all"
									>
										<CreditCard class="h-3 w-3" /> QRIS
									</div>
								</label>
							</div>
						</div>
					</div>

					<Button
						type="submit"
						size="lg"
						class="h-14 w-full text-lg font-black tracking-wide uppercase"
						disabled={cart.length === 0}
					>
						Charge Order
					</Button>
				</form>
			</div>
		</Card>
	</div>
</div>
