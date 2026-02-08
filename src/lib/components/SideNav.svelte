<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	// Import the specific sidebar parts
	import {
		Sidebar,
		SidebarContent,
		SidebarFooter,
		SidebarGroup,
		SidebarGroupContent,
		SidebarHeader,
		SidebarMenu,
		SidebarMenuButton,
		SidebarMenuItem,
		SidebarRail
	} from '$lib/components/ui/sidebar/index.js';

	// Import icons
	import { House, LogOut, Command } from '@lucide/svelte';

	// Define your navigation data here
	const navItems = [
		{ title: 'Home', url: '/', icon: House }
		// { title: 'Orders', url: '/orders', icon: ShoppingCart },
		// { title: 'Products', url: '/products', icon: Package },
		// { title: 'Customers', url: '/customers', icon: Users },
		// { title: 'Analytics', url: '/analytics', icon: ChartLine }
	] as const;
</script>

<Sidebar collapsible="icon">
	<SidebarHeader>
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton size="lg">
					{#snippet child({ props })}
						<a href={resolve('/')} {...props}>
							<div
								class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
							>
								<Command class="size-4" />
							</div>
							<div class="grid flex-1 text-left text-sm leading-tight">
								<span class="truncate font-semibold">BEGIN AGAIN</span>
								<span class="truncate text-xs">Coffee & Eatery</span>
							</div>
						</a>
					{/snippet}
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	</SidebarHeader>

	<SidebarContent>
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each navItems as item (item.url)}
						<SidebarMenuItem>
							<SidebarMenuButton isActive={page.url.pathname === resolve(item.url)}>
								{#snippet child({ props })}
									<a href={resolve(item.url)} {...props}>
										<item.icon />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</SidebarMenuButton>
						</SidebarMenuItem>
					{/each}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	</SidebarContent>

	<SidebarFooter>
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton>
					{#snippet child({ props })}
						<a href={resolve('/logout')} {...props}>
							<LogOut />
							<span>Logout</span>
						</a>
					{/snippet}
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	</SidebarFooter>

	<SidebarRail />
</Sidebar>
