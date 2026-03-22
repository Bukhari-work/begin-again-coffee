<script lang="ts">
	import { page } from "$app/state";
	import type { Snippet } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import * as Sidebar from "$lib/components/ui/sidebar";
	import {
		Coffee,
		ArrowLeft,
		Calculator,
		ListOrdered,
		Receipt,
		User,
		LogOut,
	} from "@lucide/svelte";
	import type { LayoutData } from "./$types"; // if this file is +layout.svelte

	// Assuming your +layout.server.ts passes down the session user.
	let {
		data,
		children,
	}: {
		data: LayoutData;
		children: Snippet;
	} = $props();

	// --- LIVE CLOCK & DATE ---
	let time = $state(new Date());
	$effect(() => {
		const interval = setInterval(() => {
			time = new Date();
		}, 1000);
		return () => clearInterval(interval);
	});

	let formattedTime = $derived(
		time.toLocaleTimeString("id-ID", {
			hour: "2-digit",
			minute: "2-digit",
		})
	);

	let formattedDate = $derived(
		time.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
			year: "numeric",
		})
	);

	// POS Navigation Routes
	const navItems = [
		{ title: "Register", href: "/register", icon: Calculator },
		{ title: "Active Queue", href: "/queue", icon: ListOrdered },
		{ title: "Transactions", href: "/transactions", icon: Receipt },
	];
</script>

<Sidebar.Provider>
	<Sidebar.Root class="hidden border-r lg:flex">
		<Sidebar.Header class="flex h-14 items-center justify-center border-b px-4">
			<div class="flex w-full items-center gap-3">
				<div
					class="bg-primary text-primary-foreground flex items-center justify-center rounded-md p-1.5 shadow-sm"
				>
					<Coffee class="h-5 w-5" />
				</div>
				<h1 class="truncate text-lg font-black tracking-widest uppercase">Begin Again</h1>
			</div>
		</Sidebar.Header>

		<Sidebar.Content>
			<Sidebar.Group>
				<Sidebar.GroupContent>
					<Sidebar.Menu class="space-y-2 p-2">
						{#each navItems as item (item.href)}
							{@const isActive = page.url.pathname.startsWith(item.href)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton
									{isActive}
									class="h-12 font-bold tracking-wide uppercase"
								>
									{#snippet child({ props })}
										<a
											href={item.href}
											{...props}
											class="flex items-center gap-3"
										>
											<item.icon
												class="h-5 w-5 {isActive
													? 'text-primary'
													: 'text-muted-foreground'}"
											/>
											<span>{item.title}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		</Sidebar.Content>

		<Sidebar.Footer class="space-y-4 border-t p-4">
			<div
				class="border-border bg-secondary/10 flex items-center gap-3 rounded-lg border p-3 shadow-sm"
			>
				<div
					class="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
				>
					<User class="text-primary h-5 w-5" />
				</div>
				<div class="flex flex-col overflow-hidden">
					<span class="truncate text-sm leading-none font-bold">
						{data.user?.username || "Walk-in Cashier"}
					</span>
					<span
						class="text-muted-foreground mt-1 truncate text-[10px] font-bold tracking-wider uppercase"
					>
						{data.user?.role || "Staff"}
					</span>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<Button
					variant="outline"
					href="/dashboard/orders"
					class="w-full text-xs font-bold tracking-wider uppercase"
				>
					<ArrowLeft class="mr-2 h-4 w-4" /> Back Office
				</Button>
				<form action="/login?/logout" method="POST">
					<Button
						variant="ghost"
						class="text-muted-foreground hover:text-foreground w-full text-xs font-bold tracking-wider uppercase"
						type="submit"
					>
						<LogOut class="mr-2 h-4 w-4" /> Logout
					</Button>
				</form>
			</div>
		</Sidebar.Footer>
	</Sidebar.Root>

	<Sidebar.Inset class="bg-muted/10 flex flex-col overflow-hidden lg:h-screen">
		<header
			class="bg-card border-border sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b px-4 lg:px-6"
		>
			<div class="flex items-center gap-2 lg:hidden">
				<div
					class="bg-primary text-primary-foreground flex items-center justify-center rounded-md p-1.5 shadow-sm"
				>
					<Coffee class="h-4 w-4" />
				</div>
				<h1 class="text-sm font-black tracking-widest uppercase">Begin Again</h1>
			</div>

			<div class="hidden items-center gap-3 lg:flex">
				<div class="bg-border hidden h-4 w-px lg:block"></div>
				<span class="text-muted-foreground font-mono text-sm font-bold uppercase"
					>POS Terminal</span
				>
			</div>

			<div class="flex items-center gap-3 sm:gap-4">
				<div class="flex flex-col text-right">
					<span class="font-mono text-sm leading-tight font-black sm:text-base">
						{formattedTime}
					</span>
					<span
						class="text-muted-foreground font-mono text-[9px] font-bold tracking-widest uppercase sm:text-[10px]"
					>
						{formattedDate}
					</span>
				</div>

				<div class="bg-border h-8 w-px"></div>

				<div class="flex items-center gap-2 lg:hidden">
					<div
						class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full"
					>
						<span class="text-primary font-mono text-xs font-bold uppercase">
							{(data.user?.username || "C").charAt(0)}
						</span>
					</div>
					<Button
						variant="outline"
						size="icon"
						href="/dashboard/orders"
						class="h-8 w-8 shrink-0"
					>
						<ArrowLeft class="h-4 w-4" />
					</Button>
				</div>
			</div>
		</header>

		<main class="flex-1 overflow-auto p-4 pb-24 lg:p-6 lg:pb-6">
			{@render children()}
		</main>

		<nav
			class="bg-card border-border pb-safe fixed right-0 bottom-0 left-0 z-40 flex h-16 justify-around border-t md:hidden"
		>
			{#each navItems as item (item.href)}
				{@const isActive = page.url.pathname.startsWith(item.href)}
				<a
					href={item.href}
					class="flex flex-1 flex-col items-center justify-center gap-1 transition-colors {isActive
						? 'text-primary'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					<item.icon class="h-5 w-5 {isActive ? 'fill-primary/20' : ''}" />
					<span class="text-[10px] font-bold tracking-wider uppercase">{item.title}</span>
				</a>
			{/each}
		</nav>
	</Sidebar.Inset>
</Sidebar.Provider>

<style>
	/* Ensures the bottom nav avoids the iOS home indicator */
	.pb-safe {
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
