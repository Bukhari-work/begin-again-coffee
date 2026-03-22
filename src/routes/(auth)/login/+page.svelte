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
	import { Coffee, Loader2 } from "@lucide/svelte";

	// SvelteKit form enhancement (prevents full page reloads)
	import { enhance } from "$app/forms";
	import type { ActionData } from "./$types";

	let { form } = $props<{ form: ActionData }>();

	// Loading state for UX
	let isSubmitting = $state(false);
</script>

<div class="bg-background flex min-h-screen items-center justify-center p-4">
	<div class="w-full max-w-sm space-y-6">
		<div class="mb-8 flex flex-col items-center gap-4 text-center">
			<div
				class="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
			>
				<Coffee class="h-8 w-8" />
			</div>
			<div>
				<h1 class="text-2xl font-black tracking-widest uppercase">Begin Again</h1>
				<p
					class="text-muted-foreground mt-1 font-mono text-xs font-bold tracking-widest uppercase"
				>
					System Terminal
				</p>
			</div>
		</div>

		<Card class="border-border border-2 shadow-lg">
			<CardHeader class="space-y-1 pb-6 text-center">
				<CardTitle class="text-xl font-bold">Welcome Back</CardTitle>
				<CardDescription>Enter your credentials to access the terminal.</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					method="POST"
					action="?/login"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							isSubmitting = false;
							await update();
						};
					}}
					class="grid gap-5"
				>
					<div class="grid gap-2">
						<Label
							for="username"
							class="text-muted-foreground text-xs font-bold uppercase"
						>
							Username
						</Label>
						<Input
							id="username"
							name="username"
							type="text"
							required
							placeholder="e.g. admin"
							class="bg-background border-border h-11"
							disabled={isSubmitting}
						/>
					</div>

					<div class="grid gap-2">
						<Label
							for="password"
							class="text-muted-foreground text-xs font-bold uppercase"
						>
							Password
						</Label>
						<Input
							id="password"
							name="password"
							type="password"
							required
							class="bg-background border-border h-11"
							disabled={isSubmitting}
						/>
					</div>

					{#if form?.error}
						<div
							class="bg-destructive/10 text-destructive border-destructive/20 rounded-md border p-3 text-center text-sm font-bold"
						>
							{form.error}
						</div>
					{/if}

					<Button
						type="submit"
						size="lg"
						class="mt-2 w-full font-bold tracking-wide uppercase"
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							<Loader2 class="mr-2 h-5 w-5 animate-spin" /> Authenticating...
						{:else}
							Sign in
						{/if}
					</Button>
				</form>
			</CardContent>
		</Card>

		<div
			class="text-muted-foreground mt-8 text-center font-mono text-[10px] tracking-widest uppercase"
		>
			<p>Authorized Personnel Only</p>
			<p class="mt-1 opacity-50">v1.0.0</p>
		</div>
	</div>
</div>
