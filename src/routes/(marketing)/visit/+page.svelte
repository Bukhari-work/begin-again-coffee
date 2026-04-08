<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Clock, Wifi, Coffee, Sun, Phone, Copy, Check, Focus } from "@lucide/svelte";
	import ClockDigital from "$lib/components/ClockDigital.svelte";
	import ShopStatus from "$lib/components/ShopStatus.svelte";

	let mapHover = false;

	let copied = false;
	const fullAddress =
		"Jl. KH. Ahmad Dahlan, Murung Sari, Kec. Amuntai Tengah, Kabupaten Hulu Sungai Utara, Kalimantan Selatan 71417";

	function handleCopy() {
		navigator.clipboard.writeText(fullAddress);
		copied = true;
		setTimeout(() => (copied = false), 2000); // Reset after 2 seconds
	}
</script>

<div
	class="bg-background text-foreground selection:bg-primary selection:text-primary-foreground pb-20 font-sans"
>
	<header class="border-border bg-card border-b">
		<div class="container mx-auto grid gap-6 px-4 py-12 md:grid-cols-2 md:items-end md:px-6">
			<div>
				<div class="mb-4 flex flex-wrap items-center gap-3">
					<ShopStatus />
				</div>
				<h1
					class="text-5xl leading-[0.9] font-black tracking-tighter uppercase md:text-7xl"
				>
					Lokasi<span class="text-primary">.</span><br />
					&<span class="text-primary">Operasi</span>
				</h1>
			</div>

			<div class="flex flex-col items-start gap-4 md:items-end md:text-right">
				<p
					class="text-muted-foreground hidden max-w-md text-sm leading-relaxed md:block md:text-base"
				>
					Gasan pian nang handak <strong>singgah satumat.</strong><br />
					Gasan pian nang handak <strong>duduk lawas.</strong><br />
					<strong>Gasan kita sabarataan.</strong>
				</p>
			</div>
		</div>
	</header>

	<section class="container mx-auto px-4 py-8 md:px-6">
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
			<article
				class="border-border bg-card flex flex-col overflow-hidden rounded-xl border lg:col-span-8"
			>
				<figure
					class="bg-muted/20 relative min-h-90 w-full md:min-h-115 lg:flex-1"
					onmouseenter={() => (mapHover = true)}
					onmouseleave={() => (mapHover = false)}
				>
					<div
						class="absolute inset-0 transition-all duration-500 {mapHover
							? 'md:grayscale-0'
							: 'md:grayscale'}"
					>
						<iframe
							title="Map Location"
							src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3986.2570497631937!2d115.25271591249818!3d-2.421005997547892!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2de539d2fb8ed961%3A0x284dd0a74a6b3117!2sBegin%20Again%20Coffee!5e0!3m2!1sen!2sid!4v1768727851992!5m2!1sen!2sid"
							width="100%"
							height="100%"
							style="border:0;"
							allowfullscreen
							loading="lazy"
							referrerpolicy="no-referrer-when-downgrade"
						></iframe>
					</div>
					<figcaption class="sr-only">
						Lokasi Begin Again Coffee di Google Maps
					</figcaption>
				</figure>

				<footer
					class="border-border bg-card flex flex-col gap-4 border-t p-4 md:flex-row md:items-center md:justify-between md:p-6"
				>
					<div class="flex items-start gap-4">
						<div>
							<h3 class="text-lg leading-tight font-bold tracking-tight uppercase">
								Begin Again Coffee
							</h3>
							<address class="text-muted-foreground mt-1 font-mono text-xs">
								Jl. KH. Ahmad Dahlan, Murung Sari,<br />
								Kec. Amuntai Tengah, <br />
								Kabupaten Hulu Sungai Utara.
							</address>
						</div>
					</div>

					<div class="flex shrink-0 gap-2">
						<Button
							variant="outline"
							size="sm"
							class="min-w-20 font-mono text-xs tracking-wider uppercase"
							onclick={handleCopy}
						>
							{#if copied}
								<Check class="animate-in zoom-in mr-2 h-3 w-3" />
								Copied
							{:else}
								<Copy class="mr-2 h-3 w-3" />
								Copy
							{/if}
						</Button>
						<Button
							variant="default"
							size="sm"
							class="font-mono text-xs tracking-wider uppercase"
							href="https://maps.app.goo.gl/ox7suZN3uSLGxwYB7"
							target="_blank"
						>
							Open Map
						</Button>
					</div>
				</footer>
			</article>

			<div class="flex h-full flex-col gap-4 lg:col-span-4">
				<div
					class="bg-card text-card-foreground border-border flex flex-col justify-between rounded-xl border p-6 shadow-sm"
				>
					<div class="border-border mb-6 flex items-center justify-between border-b pb-4">
						<div class="text-primary flex items-center gap-2">
							<Clock class="h-5 w-5" />
							<span class="font-mono text-xs font-bold tracking-widest uppercase"
								>Jam Buka</span
							>
						</div>
						<div class="bg-secondary rounded px-2 py-1 font-mono text-xs">
							<ClockDigital />
						</div>
					</div>

					<div class="flex flex-col justify-center space-y-6 font-mono text-sm">
						<div class="flex flex-col gap-3">
							<span
								class="text-muted-foreground border-b border-dashed pb-1 text-sm font-bold tracking-wider uppercase"
								>Senin - Kamis</span
							>
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<span
										class="bg-primary/10 text-primary min-w-12 rounded px-2 py-0.5 text-center text-[10px] font-bold uppercase"
										>Pagi</span
									>
									<span>
										<time datetime="08:00">08:00</time> -
										<time datetime="16:00">16:00</time>
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span
										class="bg-secondary text-foreground min-w-12 rounded px-2 py-0.5 text-center text-[10px] font-bold uppercase"
										>Malam</span
									>
									<span>
										<time datetime="20:00">20:00</time> -
										<time datetime="22:00">22:00</time>
									</span>
								</div>
							</div>
						</div>

						<div class="flex flex-col gap-3">
							<span
								class="text-primary border-b border-dashed pb-1 text-base font-bold tracking-wider uppercase"
								>Jumat</span
							>
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<span
										class="bg-primary/10 text-primary min-w-12 rounded px-2 py-0.5 text-center text-[10px] font-bold uppercase"
										>Siang</span
									>
									<span>
										<time datetime="13:30">13:30</time> -
										<time datetime="16:30">16:30</time>
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span
										class="bg-secondary text-foreground min-w-12 rounded px-2 py-0.5 text-center text-[10px] font-bold uppercase"
										>Malam</span
									>
									<span>
										<time datetime="20:00">20:00</time> -
										<time datetime="22:00">22:00</time>
									</span>
								</div>
							</div>
						</div>

						<div class="flex flex-col gap-3">
							<span
								class="text-muted-foreground border-b border-dashed pb-1 text-sm font-bold tracking-wider uppercase"
								>Sabtu - Minggu</span
							>
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<span
										class="bg-primary/10 text-primary min-w-12 rounded px-2 py-0.5 text-center text-[10px] font-bold uppercase"
										>Pagi</span
									>
									<span>
										<time datetime="10:00">10:00</time> -
										<time datetime="16:00">16:00</time>
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span
										class="bg-secondary text-foreground min-w-12 rounded px-2 py-0.5 text-center text-[10px] font-bold uppercase"
										>Malam</span
									>
									<span>
										<time datetime="20:00">20:00</time> -
										<time datetime="22:00">22:00</time>
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<ul class="grid flex-1 grid-cols-2 grid-rows-2 gap-4">
					<li
						class="bg-secondary/30 border-border hover:bg-secondary/50 flex flex-col justify-center gap-3 rounded-xl border p-4 transition-colors"
					>
						<Sun class="text-primary h-5 w-5" />
						<div>
							<p class="text-xs font-bold uppercase">Outdoor</p>
							<p class="text-muted-foreground mt-1 text-[10px] leading-tight">
								Smoking Area Available
							</p>
						</div>
					</li>

					<li
						class="bg-secondary/30 border-border hover:bg-secondary/50 flex flex-col justify-center gap-3 rounded-xl border p-4 transition-colors"
					>
						<Wifi class="text-primary h-5 w-5" />
						<div>
							<p class="text-xs font-bold uppercase">Free Wifi</p>
							<p class="text-muted-foreground mt-1 text-[10px] leading-tight">
								High Speed 50Mbps
							</p>
						</div>
					</li>
					<li
						class="bg-secondary/30 border-border hover:bg-secondary/50 flex flex-col justify-center gap-3 rounded-xl border p-4 transition-colors"
					>
						<Coffee class="text-primary h-5 w-5" />
						<div>
							<p class="text-xs font-bold uppercase">Manual Brew</p>
							<p class="text-muted-foreground mt-1 text-[10px] leading-tight">
								V60 & Kalita Wave
							</p>
						</div>
					</li>
					<li
						class="bg-secondary/30 border-border hover:bg-secondary/50 flex flex-col justify-center gap-3 rounded-xl border p-4 transition-colors"
					>
						<Phone class="text-primary h-5 w-5" />
						<div>
							<p class="text-xs font-bold uppercase">Contact</p>
							<p class="text-muted-foreground mt-1 text-[10px] leading-tight">
								+62 812-3456
							</p>
						</div>
					</li>
				</ul>
				<a
					href="https://instagram.com"
					target="_blank"
					class="bg-foreground text-background flex items-center justify-between rounded-xl p-4 transition-opacity hover:opacity-90"
				>
					<div class="flex items-center gap-2">
						<Focus class="h-5 w-5" />
						<span class="text-sm font-bold uppercase">Follow Weekly Updates</span>
					</div>
					<span class="font-mono text-xs">@begin.againcoffee</span>
				</a>
			</div>
		</div>
	</section>
</div>
