<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { CircleUser, Search } from '@lucide/svelte';
</script>

<div class="w-full flex-1">
	<form>
		<div class="relative">
			<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
			<Input
				type="search"
				placeholder="Search Dashboard..."
				class="w-full appearance-none bg-background pl-8 md:w-2/3 lg:w-1/3"
			/>
		</div>
	</form>
</div>

<DropdownMenu>
	<DropdownMenuTrigger>
		{#snippet child({ props })}
			<Button {...props} variant="secondary" size="icon" class="rounded-full">
				<CircleUser class="h-5 w-5" />
				<span class="sr-only">Toggle user menu</span>
			</Button>
		{/snippet}
	</DropdownMenuTrigger>
	<DropdownMenuContent align="end">
		<DropdownMenuLabel>My Account</DropdownMenuLabel>
		<DropdownMenuSeparator />
		<DropdownMenuItem>Settings</DropdownMenuItem>
		<DropdownMenuItem>Support</DropdownMenuItem>
		<DropdownMenuSeparator />
		<DropdownMenuItem>Logout</DropdownMenuItem>
	</DropdownMenuContent>
</DropdownMenu>
