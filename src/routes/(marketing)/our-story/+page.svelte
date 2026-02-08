<script lang="ts">
	import ShopStatus from "$lib/components/ShopStatus.svelte";
	import { Store, HandHeart, Quote, Bubbles, Sparkles } from "@lucide/svelte";
</script>

<div
	class="bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen pb-20 font-sans"
>
	<header class="border-border bg-card mb-8 border-b">
		<div class="container mx-auto grid gap-6 px-4 py-12 md:grid-cols-2 md:items-end md:px-6">
			<div>
				<div class="mb-4 flex flex-wrap items-center gap-3">
					<ShopStatus />
				</div>
				<h1
					class="text-5xl leading-[0.9] font-black tracking-tighter uppercase md:text-7xl"
				>
					Kopi Murah<span class="text-primary">.</span><br />
					&<span class="text-primary">Sederhana</span>
				</h1>
			</div>

			<div class="flex flex-col items-start gap-4 md:items-end md:text-right">
				<p
					class="text-muted-foreground hidden max-w-md text-sm leading-relaxed md:block md:text-base"
				>
					Sebuah kedai <strong>sederhana.</strong><br />
					Secangkir kopi <strong>murah.</strong><br />
					tapi <strong>sampai ke hati.</strong>
				</p>
			</div>
		</div>
	</header>

	<section class="container mx-auto px-4 md:px-6">
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
			<!-- Rotating Ring -->
			<div
				class="bg-muted/20 border-border flex flex-col items-center justify-center rounded-xl border p-6 text-center lg:col-span-12"
			>
				<div
					class="border-foreground/20 relative flex h-32 w-32 animate-[spin_10s_linear_infinite] items-center justify-center rounded-full border-2 border-dashed p-2"
				>
					<div
						class="bg-background flex h-full w-full items-center justify-center rounded-full text-[10px] font-black tracking-widest uppercase"
					>
						Original
					</div>
				</div>
				<div class="mt-6 space-y-1">
					<p class="text-xs font-bold tracking-widest uppercase">KOPI OTENTIK</p>
					<p class="text-muted-foreground font-mono text-[10px]">Est. 2025</p>
				</div>
			</div>

			<!-- Stories -->
			<div
				class="group bg-card hover:border-primary/50 border-border relative flex flex-col overflow-hidden rounded-xl border p-6 transition-all lg:col-span-4"
			>
				<div
					class="absolute -top-4 -right-2 opacity-[0.03] transition-opacity group-hover:opacity-[0.08]"
				>
					<span class="text-[120px] leading-none font-black">01</span>
				</div>

				<div class="mb-4 flex items-center gap-3">
					<div
						class="bg-secondary text-foreground border-border/50 flex h-8 w-8 items-center justify-center rounded border"
					>
						<Bubbles class="h-4 w-4" />
					</div>
					<span class="text-primary font-mono text-xs font-bold tracking-widest uppercase"
						>Asal Muasal</span
					>
				</div>

				<h3 class="mb-3 text-xl font-black tracking-tight uppercase">Soal Niat.</h3>

				<div
					class="text-muted-foreground flex-1 space-y-4 font-mono text-sm leading-relaxed"
				>
					<p>
						<strong>Begin Again</strong> adalah semangat kami sendiri untuk memulai sesuatu
						dari nol.
					</p>

					<p>
						Kami handak <strong>Begin Again</strong> terasa seperti rumah kedua. Tempat yang
						rasa kopinya sudah nyaman, mana disajiakan dengan senyuman (DON) pulang.
					</p>
				</div>
			</div>
			<div
				class="group bg-card hover:border-primary/50 border-border relative flex flex-col overflow-hidden rounded-xl border p-6 transition-all lg:col-span-4"
			>
				<div
					class="absolute -top-4 -right-2 opacity-[0.03] transition-opacity group-hover:opacity-[0.08]"
				>
					<span class="text-[120px] leading-none font-black">02</span>
				</div>

				<div class="mb-4 flex items-center gap-3">
					<div
						class="bg-secondary text-foreground border-border/50 flex h-8 w-8 items-center justify-center rounded border"
					>
						<Store class="h-4 w-4" />
					</div>
					<span class="text-primary font-mono text-xs font-bold tracking-widest uppercase"
						>Buka Kedai</span
					>
				</div>

				<h3 class="mb-3 text-xl font-black tracking-tight uppercase">Masih Kecil.</h3>

				<div
					class="text-muted-foreground flex-1 space-y-4 font-mono text-sm leading-relaxed"
				>
					<p>
						Kami buka di <strong>Amuntai, 2025.</strong> Di samping rumah. Tempatnya memang
						kada telalu mencolok, kada jua telalu ganal.
					</p>
					<p>
						Lokasinya sederhana dan kada rame. Tapi justru di situlah kekuatan kami:
						nyaman bapandiran lawan bekawanan.
					</p>
				</div>
			</div>

			<div
				class="group bg-card hover:border-primary/50 border-border relative flex flex-col overflow-hidden rounded-xl border p-6 transition-all lg:col-span-4"
			>
				<div
					class="absolute -top-4 -right-2 opacity-[0.03] transition-opacity group-hover:opacity-[0.08]"
				>
					<span class="text-[120px] leading-none font-black">03</span>
				</div>

				<div class="mb-4 flex items-center gap-3">
					<div
						class="bg-secondary text-foreground border-border/50 flex h-8 w-8 items-center justify-center rounded border"
					>
						<HandHeart class="h-4 w-4" />
					</div>
					<span class="text-primary font-mono text-xs font-bold tracking-widest uppercase"
						>Saat ini</span
					>
				</div>

				<h3 class="mb-3 text-xl font-black tracking-tight uppercase">Janji Kami.</h3>

				<div
					class="text-muted-foreground flex-1 space-y-4 font-mono text-sm leading-relaxed"
				>
					<p>Datang apa adanya. Pesan kopi. Duduk santai.</p>
					<ul class="space-y-2">
						<li class="flex items-start gap-2">
							<Sparkles class="text-primary mt-0.5 h-3 w-3 shrink-0" />
							<span
								>Kalo cuma <span class="text-foreground font-bold">setumat</span>,
								kada papa.
							</span>
						</li>
						<li class="flex items-start gap-2">
							<Sparkles class="text-primary mt-0.5 h-3 w-3 shrink-0" />
							<span
								>Kalo handak <span class="text-foreground font-bold">lawas</span>,
								silakan.
							</span>
						</li>
					</ul>
					<p>Santai aja bekawanan.</p>
				</div>
			</div>
			<div
				class="relative flex flex-col justify-between rounded-xl p-8 md:p-10 lg:col-span-12"
			>
				<!-- <div
				class="bg-card border-border relative flex flex-col justify-between rounded-xl border p-8 md:p-10 lg:col-span-12"
			>
				<div
					class="bg-secondary/80 border-foreground/10 absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-2 border"
				></div> -->

				<div class="relative">
					<Quote class="text-primary/50 mb-6 h-8 w-8" />
					<h2 class="font-mono text-base leading-relaxed md:text-xl">
						Kopi itu sederhana. <br />
						Banyu panas, biji kopi pilihan, lawan sabar meulah. <br />
						Sisanya
						<span
							class="bg-primary/20 text-primary inline-block -skew-x-3 px-2 font-bold italic"
							>bekawanan bekisahan.</span
						>
					</h2>
				</div>

				<div class="border-foreground mt-12 border-t border-dashed pt-4">
					<p class="text-sm font-black uppercase">Begin Again Coffee</p>
					<p class="text-muted-foreground mt-1 text-xs uppercase">
						Est. 2025 — Amuntai, Kalsel
					</p>
				</div>
			</div>
		</div>
	</section>
</div>
