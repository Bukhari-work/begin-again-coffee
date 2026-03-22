<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { MapPin, Hash, Heart, Sparkles, Moon } from "@lucide/svelte";
	import type { PageData } from "./$types";
	import ShopStatus from "$lib/components/ShopStatus.svelte";
	import ItemCard from "$lib/components/ItemCard.svelte";
	import ReviewCard from "$lib/components/ReviewCard.svelte";

	let { data } = $props<{ data: PageData }>();
</script>

<section
	class="border-border bg-background relative flex min-h-[85vh] flex-col justify-center border-b"
>
	<div
		class="absolute inset-0"
		style="background-image: radial-gradient(var(--primary) 1px, transparent 1px); background-size: 24px 24px; opacity: 0.4;"
	></div>

	<div class="relative z-10 container mx-auto max-w-4xl px-4 text-center">
		<div class="mb-4 flex justify-center">
			<ShopStatus />
		</div>

		<div
			class="bg-primary/10 text-primary mx-auto mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase"
		>
			<Moon class="h-3 w-3" />
			<span>Edisi Ramadan</span>
		</div>

		<h1 class="mt-3 mb-6 leading-[0.95] font-black tracking-tighter uppercase">
			<span class="text-3xl md:text-8xl">Siangnya Puasa.</span><br />
			<span class="text-primary text-4xl md:text-8xl">Bukanya Nyaman.</span>
		</h1>

		<div class="flex flex-row items-center gap-4">
			<p class="text-muted-foreground text-md mx-auto mb-10 max-w-xl font-mono md:text-xl">
				Buka lapak jam 16.00 WITA gasan bekal takjil.<br />
				Istirahat pas Maghrib & Tarawih.<br />
				<span class="text-primary font-bold">Gas lagi imbah Tarawih!</span>
			</p>
		</div>

		<div class="flex flex-col items-center gap-4">
			<div class="inline-flex w-full flex-col items-center justify-center gap-4 md:flex-row">
				<Button
					size="lg"
					href="/menu"
					class="
					bg-primary hover:bg-primary/90 active:bg-primary/90 text-background
					h-12 w-full max-w-xs touch-manipulation rounded-xl
					text-lg font-black tracking-wide uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
					transition-all
					hover:translate-x-1
					hover:translate-y-1 hover:shadow-none active:translate-x-1
					active:translate-y-1 active:shadow-none md:h-16
				"
				>
					Lihat Menu
				</Button>
				<Button
					size="lg"
					href="/visit"
					class="
					bg-primary hover:bg-primary/90 active:bg-primary/90 text-background
					h-12 w-full max-w-xs touch-manipulation rounded-xl
					text-lg font-black tracking-wide uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
					transition-all
					hover:translate-x-1
					hover:translate-y-1 hover:shadow-none active:translate-x-1
					active:translate-y-1 active:shadow-none md:h-16
				"
				>
					Lokasi Kami
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
				<span>🥤 Kopsus Botolan</span>
				<span>•</span>
				<span>🕌 Break Tarawih</span>
				<span>•</span>
				<span>🌙 Ramadan Vibes</span>
				<span>•</span>
				<span>☕ Kopian Malam</span>
				<span>•</span>
			</div>

			<div
				aria-hidden="true"
				class="animate-marquee flex min-w-full shrink-0 items-center justify-around gap-8 px-4 font-mono text-sm font-bold whitespace-nowrap text-black uppercase"
			>
				<span>🥤 Kopsus Botolan</span>
				<span>•</span>
				<span>🕌 Break Tarawih</span>
				<span>•</span>
				<span>🌙 Ramadan Vibes</span>
				<span>•</span>
				<span>⚡ WiFi Gratis</span>
				<span>•</span>
				<span>☕ Kopian Malam</span>
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
				<span>Seger Gasan Buka</span>
			</div>
			<h2 class="text-4xl font-black tracking-tighter uppercase md:text-5xl">Menu Takjil</h2>
			<p class="text-muted-foreground mt-4 max-w-md font-mono text-sm">
				Pilihan favorit gasan pambukaan. Bungkus botolannya, nyaman diminum pas adzan
				Maghrib.
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

<section class="relative overflow-hidden border-t border-black bg-stone-950 py-24 text-stone-50">
	<div
		class="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-yellow-500/5 blur-3xl"
	></div>
	<div
		class="absolute bottom-0 left-0 -mb-20 -ml-20 h-96 w-96 rounded-full bg-stone-800/20 blur-3xl"
	></div>

	<div class="relative z-10 container px-4">
		<div
			class="mb-16 flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between"
		>
			<div class="space-y-4">
				<div
					class="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 font-mono text-xs font-bold tracking-widest text-yellow-500 uppercase"
				>
					<Heart class="h-3 w-3 fill-current" />
					<span>Cerita Ramadan</span>
				</div>
				<h2
					class="text-5xl leading-[0.9] font-black tracking-tighter uppercase md:text-7xl"
				>
					Apa Jar <br class="hidden md:block" />
					<span class="text-stone-600">Buhannya?</span>
				</h2>
			</div>

			<div class="max-w-xs md:text-right">
				<p class="font-mono text-sm text-stone-400">
					Kisah buhannya nang suah mampir pas ngabuburit atau nongkrong imbah tarawih.
				</p>
			</div>
		</div>

		<div class="grid gap-6 md:grid-cols-3">
			<ReviewCard
				topic="Bukber"
				quote="Mampir sini jam 5 sore nukar kopi botolan gasan di rumah. Pas berbuka rasanya seger banar, kada tawar."
				name="Bukhari"
				role="Pelanggan Setia"
			/>

			<ReviewCard
				featured={true}
				topic="Malam"
				quote="Rami banar imbah tarawih nongkrong di sini. Udaranya dingin, kopinya panas. Pas gasan melek tadarusan."
				name="Amad (Igun)"
				role="Owner"
			/>

			<ReviewCard
				topic="Suasana"
				quote="Suka vibes-nya mun sore. Banyak nang singgah cari takjil, tapi tetap tertib. Pelayanannya laju."
				name="Donn"
				role="Donn"
			/>
		</div>

		<div class="mt-20 flex flex-col items-center justify-center text-center">
			<div class="mb-4 rounded-full bg-stone-900 px-4 py-2">
				<Hash class="mx-auto mb-1 h-4 w-4 text-stone-500" />
			</div>
			<p class="max-w-md font-mono text-sm text-stone-400">
				Pernah mampir? Tag kami di Instagram
				<a href="https://instagram.com/begin.againcoffee" class="font-bold text-yellow-500">
					@begin.againcoffee
				</a>
				biar kami repost fotomu!
			</p>
		</div>
	</div>
</section>
