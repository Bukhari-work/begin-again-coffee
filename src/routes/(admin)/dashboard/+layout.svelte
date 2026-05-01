<script lang="ts">
	import { page } from "$app/state";
	import type { Snippet } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import * as Sidebar from "$lib/components/ui/sidebar";
	import type { LayoutData } from "./$types";
	import {
		LayoutDashboard,
		Coffee,
		ShoppingBag,
		Settings,
		LogOut,
		ChefHat,
		Calculator,
		User,
	} from "@lucide/svelte";

	// Assuming your +layout.server.ts passes down the session user.
	let {
		data,
		children,
	}: {
		data: LayoutData;
		children: Snippet;
	} = $props();

	// --- LIVE CLOCK & DATE (Mirrored from POS) ---
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

	const navItems = [
		{ href: "/dashboard", label: "Overview", icon: LayoutDashboard },
		{ href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
		{ href: "/dashboard/menu", label: "Menu", icon: ChefHat },
		{ href: "/dashboard/inventory", label: "Inventory", icon: Coffee },
		{ href: "/dashboard/settings", label: "Settings", icon: Settings },
	];

	// Active state helper
	const isActive = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(href + "/");
</script>

<Sidebar.Provider>
	<Sidebar.Root class="border-r">
		<Sidebar.Header class="flex h-14 items-center justify-center border-b px-4">
			<div class="flex w-full items-center gap-3">
				<div class="flex items-center justify-center">
					<!-- <Coffee class="h-5 w-5" /> -->
					<img src="/donn-robot.svg" class="h-8 w-8" alt="Begin Again Alt Logo" />
				</div>
				<h1 class="truncate text-lg font-black tracking-widest uppercase">Begin Again</h1>
			</div>
		</Sidebar.Header>

		<Sidebar.Content>
			<Sidebar.Group>
				<Sidebar.GroupContent>
					<Sidebar.Menu class="space-y-1.5 p-2">
						{#each navItems as item (item.href)}
							{@const active = isActive(item.href)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton
									isActive={active}
									class="h-11 font-bold tracking-wide uppercase"
								>
									{#snippet child({ props })}
										<a
											href={item.href}
											{...props}
											class="flex items-center gap-3"
										>
											<item.icon
												class="h-5 w-5 {active
													? 'text-primary'
													: 'text-muted-foreground'}"
											/>
											<span>{item.label}</span>
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
						{data.user?.username || "Admin User"}
					</span>
					<span
						class="text-muted-foreground mt-1 truncate text-[10px] font-bold tracking-wider uppercase"
					>
						{data.user?.role || "Manager"}
					</span>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<Button
					variant="outline"
					class="w-full text-xs font-bold tracking-wider uppercase"
					href="/kiosk"
				>
					<Calculator class="mr-2 h-4 w-4" /> POS Terminal
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

	<Sidebar.Inset class="bg-muted/10 flex h-screen flex-col overflow-hidden">
		<header
			class="bg-card border-border sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b px-4 lg:px-6"
		>
			<div class="flex items-center gap-3">
				<Sidebar.Trigger class="lg:hidden" />

				<div class="bg-border hidden h-4 w-px lg:block"></div>
				<span
					class="text-muted-foreground hidden font-mono text-sm font-bold uppercase lg:block"
				>
					Back Office
				</span>

				<div class="ml-1 flex items-center gap-2 lg:hidden">
					<div
						class="bg-primary text-primary-foreground flex items-center justify-center rounded-md p-1.5 shadow-sm"
					>
						<Coffee class="h-4 w-4" />
					</div>
					<h1 class="text-sm font-black tracking-widest uppercase">Begin Again</h1>
				</div>
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
							{(data.user?.username || "A").charAt(0)}
						</span>
					</div>
				</div>
			</div>
		</header>

		<main class="flex-1 overflow-auto p-4 lg:p-6">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
