<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { LayoutDashboard, Coffee, ShoppingBag, Settings, LogOut, Menu } from "@lucide/svelte";

	let { children } = $props();

	const navItems = [
		{ href: "/dashboard", label: "Overview", icon: LayoutDashboard },
		{ href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
		{ href: "/dashboard/inventory", label: "Inventory", icon: Coffee },
		{ href: "/dashboard/settings", label: "Settings", icon: Settings },
	];

	// Active state helper (supports subroutes)
	const isActive = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(href + "/");

	let sidebarOpen = $derived(false);
</script>

<div class="bg-background flex min-h-screen w-full">
	<!-- Mobile Overlay -->
	{#if sidebarOpen}
		<button
			class="fixed inset-0 z-40 bg-black/50 lg:hidden"
			onclick={() => (sidebarOpen = false)}
			aria-label="Open Menu"
		></button>
	{/if}

	<!-- Sidebar -->
	<aside
		class="
			bg-muted fixed inset-y-0 left-0 z-50
			w-64 -translate-x-full
			border-r transition-transform
			lg:static lg:translate-x-0
			{sidebarOpen ? 'translate-x-0' : ''}
		"
	>
		<div class="flex h-full flex-col">
			<!-- Brand -->
			<div class="flex h-14 items-center border-b px-6">
				<a href="/" class="text-sm font-semibold tracking-tight"> Begin Again Coffee </a>
			</div>

			<!-- Navigation -->
			<nav class="flex-1 overflow-y-auto px-3 py-4">
				<ul class="grid gap-1">
					{#each navItems as item (item.href)}
						<li>
							<a
								href={item.href}
								class="
									hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3
									py-2
									text-sm transition-colors
									{isActive(item.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}
								"
							>
								<item.icon class="h-4 w-4 shrink-0" />
								<span>{item.label}</span>
							</a>
						</li>
					{/each}
				</ul>
			</nav>

			<!-- Sidebar Footer -->
			<form action="/login?/logout" method="POST">
				<Button variant="ghost" size="icon" type="submit">
					<LogOut class="h-5 w-5" />
					<span class="sr-only">Logout</span>
				</Button>
			</form>
		</div>
	</aside>

	<!-- Main Content Area -->
	<div class="flex flex-1 flex-col">
		<!-- Header -->
		<header
			class="
				bg-background/80 sticky top-0
				z-30 flex h-14 items-center
				gap-4 border-b px-6
				backdrop-blur
			"
		>
			<!-- Mobile Menu Button -->
			<Button
				variant="ghost"
				size="icon"
				class="lg:hidden"
				onclick={() => (sidebarOpen = true)}
			>
				<Menu class="h-5 w-5" />
				<span class="sr-only">Open menu</span>
			</Button>

			<!-- Page Title -->
			<div class="flex-1">
				<h1 class="text-lg leading-none font-semibold">Dashboard</h1>
			</div>
		</header>

		<!-- Page Content -->
		<main class="flex flex-1 flex-col gap-6 p-6">
			{@render children()}
		</main>
	</div>
</div>
