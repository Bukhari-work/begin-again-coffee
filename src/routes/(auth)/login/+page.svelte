<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";

	// SvelteKit form enhancement (prevents full page reloads)
	import { enhance } from "$app/forms";
	import type { ActionData } from "./$types";

	let { form } = $props<{ form: ActionData }>();
</script>

<div class="bg-muted/40 flex min-h-screen items-center justify-center px-4">
	<Card class="w-full max-w-sm">
		<CardHeader>
			<CardTitle class="text-2xl">Login</CardTitle>
			<CardDescription>Enter your credentials to access the dashboard.</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/login" use:enhance class="grid gap-4">
				<div class="grid gap-2">
					<Label for="username">Username</Label>
					<Input id="username" name="username" type="text" required placeholder="admin" />
				</div>

				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<Input id="password" name="password" type="password" required />
				</div>

				{#if form?.error}
					<p class="text-destructive text-center text-sm font-medium">
						{form.error}
					</p>
				{/if}

				<Button type="submit" class="w-full">Sign in</Button>
			</form>
		</CardContent>
	</Card>
</div>
