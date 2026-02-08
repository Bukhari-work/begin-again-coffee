<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { MapPin, Sun, Sparkles } from "@lucide/svelte";
	import type { PageData } from "./$types";
	import ShopStatus from "$lib/components/ShopStatus.svelte";
	import ItemCard from "$lib/components/ItemCard.svelte";

	let { data } = $props<{ data: PageData }>();
</script>

<section class="border-border bg-card relative flex min-h-[85vh] flex-col justify-center border-b">
	<div
		class="absolute inset-0"
		style="background-image: radial-gradient(#e5e7eb 1px, transparent 1px); background-size: 24px 24px; opacity: 0.4;"
	></div>

	<div class="relative z-10 container mx-auto max-w-4xl px-4 text-center">
		<ShopStatus />

		<h1 class="my-6 text-6xl leading-[0.95] font-black tracking-tighter uppercase md:text-8xl">
			Kedai Halus.<br />
			<span class="text-primary">Kopinya Nyaman.</span>
		</h1>

		<div class="flex flex-row items-center gap-4">
			<p class="text-muted-foreground mx-auto mb-10 max-w-xl font-mono text-lg md:text-xl">
				Kedai kopi kecil di Amuntai.<br />
				Seduhan ada, espresso ada.<br />
				Datang, duduk, ngopi.
			</p>
		</div>

		<div class="flex flex-col items-center gap-4">
			<div class="inline-flex w-full flex-col items-center justify-center gap-4 md:flex-row">
				<Button
					size="lg"
					href="/menu"
					class="
					bg-primary hover:bg-primary/90 active:bg-primary/90 text-background
					h-14 w-full max-w-xs touch-manipulation
					rounded-xl text-lg font-black tracking-wide uppercase
					shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
					transition-all
					hover:translate-x-1 hover:translate-y-1 hover:shadow-none
					active:translate-x-1 active:translate-y-1 active:shadow-none
				"
				>
					Lihat Menu
				</Button>
				<Button
					size="lg"
					href="/menu"
					class="
					bg-primary hover:bg-primary/90 active:bg-primary/90 text-background
					h-14 w-full max-w-xs touch-manipulation
					rounded-xl text-lg font-black tracking-wide uppercase
					shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
					transition-all
					hover:translate-x-1 hover:translate-y-1 hover:shadow-none
					active:translate-x-1 active:translate-y-1 active:shadow-none
				"
				>
					Alamat
				</Button>
			</div>
			<div class="text-muted-foreground flex items-center gap-2 font-mono text-sm">
				<MapPin class="h-4 w-4" />
				<span>Amuntai, Kalimantan Selatan</span>
			</div>
		</div>
	</div>

	<div class="absolute bottom-0 w-full overflow-hidden border-t border-black bg-yellow-400 py-3">
		<div class="flex">
			<div
				class="animate-marquee flex min-w-full shrink-0 items-center justify-around gap-8 px-4 font-mono text-sm font-bold whitespace-nowrap text-black uppercase"
			>
				<span>☕ Manual Brew</span>
				<span>•</span>
				<span>⚡ WiFi Gratis</span>
				<span>•</span>
				<span>☕ Espresso Base</span>
				<span>•</span>
				<span>🌴 Teras Depan</span>
				<span>•</span>
			</div>

			<div
				aria-hidden="true"
				class="animate-marquee flex min-w-full shrink-0 items-center justify-around gap-8 px-4 font-mono text-sm font-bold whitespace-nowrap text-black uppercase"
			>
				<span>☕ Manual Brew</span>
				<span>•</span>
				<span>⚡ WiFi Gratis</span>
				<span>•</span>
				<span>☕ Espresso Base</span>
				<span>•</span>
				<span>🌴 Teras Depan</span>
				<span>•</span>
			</div>
		</div>
	</div>
</section>

<section class="bg-secondary/20 py-24">
	<div class="container px-4">
		<div class="mb-12 flex flex-col items-center text-center">
			<div
				class="bg-primary/10 text-primary mb-4 flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase"
			>
				<Sparkles class="h-3 w-3" />
				<span>Rekomendasi Kami</span>
			</div>
			<h2 class="text-4xl font-black tracking-tighter uppercase md:text-5xl">Menu Andalan</h2>
			<p class="text-muted-foreground mt-4 max-w-md font-mono text-sm">
				Pilihan favorit pelanggan minggu ini. Wajib dicoba misal pertama kali mampir.
			</p>
		</div>

		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.featuredItems as item (item.name)}
				<ItemCard {item} />
			{/each}
		</div>

		<div class="mt-12 text-center">
			<Button
				variant="outline"
				href="/menu"
				class="font-mono font-bold tracking-widest uppercase"
			>
				Lihat Semua Menu
			</Button>
		</div>
	</div>
</section>

<section class="border-t border-black bg-stone-900 py-20 text-stone-50">
	<div class="container grid items-center gap-12 px-4 md:grid-cols-2">
		<div class="space-y-6">
			<div
				class="inline-flex items-center gap-2 border border-white/20 px-3 py-1 font-mono text-xs text-stone-400"
			>
				<Sun class="h-3 w-3" />
				<span>TERAS DEPAN</span>
			</div>

			<h2 class="text-5xl font-black tracking-tighter uppercase">Teras Depan</h2>

			<p class="font-mono text-lg text-stone-400">
				Outdoor, sederhana.<br />
				Enak buat duduk pagi-pagi.<br />
				Nongkrong setumat, tapi mun lawas dikit gin kada papa.
			</p>

			<ul class="space-y-4 font-mono text-sm text-stone-300">
				<li class="flex items-center gap-3">
					<span class="bg-primary h-1.5 w-1.5 rounded-full"></span>
					Tempat duduk terbatas
				</li>
				<li class="flex items-center gap-3">
					<span class="bg-primary h-1.5 w-1.5 rounded-full"></span>
					Ramah hewan
				</li>
				<li class="flex items-center gap-3">
					<span class="bg-primary h-1.5 w-1.5 rounded-full"></span>
					Ada colokan
				</li>
			</ul>
		</div>

		<div class="relative aspect-4/5 border-2 border-white/20 p-2">
			<div class="relative flex h-full w-full items-center justify-center bg-stone-800">
				<p class="text-center font-mono text-xs tracking-widest text-stone-500 uppercase">
					[Foto Teras & Bangku Beton]
				</p>
			</div>
		</div>
	</div>
</section>
