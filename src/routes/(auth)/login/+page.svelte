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
	import { Loader, ArrowLeft } from "@lucide/svelte";

	// SvelteKit form enhancement (prevents full page reloads)
	import { enhance } from "$app/forms";
	import type { ActionData } from "./$types";

	let { form } = $props<{ form: ActionData }>();

	// Loading state for UX
	let isSubmitting = $state(false);
</script>

<div
	class="bg-background selection:bg-primary relative flex min-h-screen flex-col items-center justify-center p-4 font-sans selection:text-white"
>
	<div
		class="bg-size[24px_24px] absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]"
	></div>

	<header class="absolute top-0 left-0 z-10 flex w-full items-center p-4 md:p-6">
		<Button
			href="/"
			variant="ghost"
			class="text-muted-foreground hover:text-foreground gap-2 font-mono text-xs uppercase"
		>
			<ArrowLeft class="h-4 w-4" />
			Back to Home
		</Button>
	</header>

	<main class="relative z-10 w-full max-w-sm space-y-6">
		<div class="mb-8 flex flex-col items-center gap-4 text-center">
			<img src="/favicon.svg" class="h-24 w-24 drop-shadow-sm" alt="Begin Again Logo" />

			<div>
				<h1 class="text-2xl font-black tracking-tighter uppercase">Begin Again</h1>
				<p class="text-muted-foreground font-mono text-sm tracking-widest uppercase">
					Terminal Kasir Kedai
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
							for="email"
							class="text-muted-foreground text-xs font-bold uppercase"
						>
							Email
						</Label>
						<Input
							id="email"
							name="email"
							type="email"
							required
							placeholder="cth. admin@beginagain.cv"
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
							<Loader class="mr-2 h-5 w-5 animate-spin" /> Authenticating...
						{:else}
							Sign in
						{/if}
					</Button>
				</form>
			</CardContent>
		</Card>

		<footer
			class="text-muted-foreground mt-8 flex flex-col items-center gap-2 text-center font-mono tracking-widest uppercase"
		>
			<p class="text-xs">Authorized Personnel Only</p>
			<div class="text-[8px] opacity-75">
				<p>Est. 2025 • Asli Amuntai</p>
				<p>© Begin Again Coffee.</p>
			</div>
		</footer>
	</main>
</div>
