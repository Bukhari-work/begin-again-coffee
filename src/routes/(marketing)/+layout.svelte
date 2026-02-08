<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { Menu, X, LogIn } from "@lucide/svelte";

	import { onNavigate } from "$app/navigation";

	let { children } = $props();
	let isMenuOpen = $state(false);

	const links = [
		{ href: "/", label: "Home" },
		{ href: "/menu", label: "Menu" },
		{ href: "/visit", label: "Visit" },
		{ href: "/our-story", label: "Story" },
	];

	onNavigate((navigation) => {
		// Check if browser supports it (Chrome/Edge/Arc support it natively)
		// if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<div class="selection:bg-primary flex min-h-screen flex-col font-sans selection:text-white">
	<header
		class="border-border bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur"
	>
		<div class="container flex h-16 items-center justify-between">
			<a
				href="/"
				class="flex items-center gap-2 text-lg font-black tracking-tighter uppercase transition-opacity hover:opacity-80"
			>
				<!-- <div class="bg-primary text-primary-foreground p-1 shadow-sm">
					<Coffee class="h-4 w-4" />
				</div> -->
				<img src="/favicon.webp" class="h-8 w-8" alt="Begin Again Logo" />
				<span class="hidden min-[350px]:inline">Begin Again</span>
			</a>

			<div class="hidden items-center gap-8 md:flex">
				<nav class="flex gap-6">
					{#each links as link (link.href)}
						<a
							href={link.href}
							class="hover:text-primary text-sm font-bold tracking-wide uppercase transition-colors
                           {page.url.pathname === link.href
								? 'text-foreground decoration-primary underline decoration-2 underline-offset-4'
								: 'text-muted-foreground'}"
						>
							{link.label}
						</a>
					{/each}
				</nav>

				<div class="bg-border h-4 w-px"></div>

				<Button
					href="/login"
					variant="ghost"
					size="sm"
					class="text-muted-foreground hover:text-foreground gap-2 font-mono text-xs uppercase"
				>
					<LogIn class="h-3 w-3" />
					Staff
				</Button>
			</div>

			<div class="flex items-center gap-2 md:hidden">
				<button
					class="border-border bg-card border p-2 shadow-sm"
					onclick={() => (isMenuOpen = !isMenuOpen)}
				>
					{#if isMenuOpen}
						<X class="h-5 w-5" />
					{:else}
						<Menu class="h-5 w-5" />
					{/if}
				</button>
			</div>
		</div>

		{#if isMenuOpen}
			<div
				class="border-border bg-background absolute left-0 z-50 w-full border-t shadow-xl md:hidden"
			>
				<nav class="flex flex-col space-y-2 p-4">
					{#each links as link (link.href)}
						<a
							href={link.href}
							onclick={() => (isMenuOpen = false)}
							class="hover:bg-secondary/50 hover:border-primary border-l-4 border-transparent p-3 text-lg font-black uppercase transition-all"
						>
							{link.label}
						</a>
					{/each}

					<div class="border-border my-2 border-t border-dashed"></div>

					<a
						href="/login"
						class="text-muted-foreground hover:text-foreground flex items-center gap-3 p-3 font-mono text-sm"
					>
						<LogIn class="h-4 w-4" />
						Staff Login Area
					</a>
				</nav>
			</div>
		{/if}
	</header>

	<main class="flex flex-1 flex-col">
		{@render children()}
	</main>

	<footer class="border-border bg-card border-t py-12">
		<div
			class="container flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left"
		>
			<div>
				<h3 class="text-lg font-black tracking-tight uppercase">Begin Again.</h3>
				<p class="text-muted-foreground mt-2 font-mono text-xs leading-relaxed">
					Jl. KH. Ahmad Dahlan, Murung Sari,<br />
					Kec. Amuntai Tengah, <br />
					Kabupaten Hulu Sungai Utara.
				</p>
			</div>

			<div class="flex flex-col items-center gap-2 md:items-end">
				<p class="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
					Est. 2025 • Asli Amuntai
				</p>
				<p class="text-muted-foreground/50 text-[10px]">© Begin Again Coffee.</p>
			</div>
		</div>
	</footer>
</div>
