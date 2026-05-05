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

	<main class="relative z-10 w-full max-w-sm px-4">
		<div class="mb-8 flex flex-col items-center text-center">
			<img
				src="/donn-robot.svg"
				class="h-24 w-24 drop-shadow-sm"
				alt="Begin Again Alt Logo"
			/>

			<div>
				<h1 class="text-xl font-black tracking-tighter uppercase md:text-2xl">
					Begin Again
				</h1>
				<p
					class="text-muted-foreground font-mono text-xs tracking-widest uppercase md:text-sm"
				>
					Terminal Kasir Kedai
				</p>
			</div>
		</div>

		<Card class="border-border border-2 shadow-lg">
			<CardHeader class="text-center">
				<CardTitle class="text-lg font-bold md:text-xl">Selamat Datang</CardTitle>
				<CardDescription>
					Masukkan kredensial Anda untuk mengakses terminal kasir.
				</CardDescription>
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
					class="grid gap-4"
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
							placeholder="cth. admin@beginagain.work"
							class="bg-background border-border h-10 text-xs md:text-sm"
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
							class="bg-background border-border h-10 text-xs md:text-sm"
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
						class="w-full font-bold tracking-wide uppercase"
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							<Loader class="mr-2 h-5 w-5 animate-spin" /> Authenticating...
						{:else}
							Masuk
						{/if}
					</Button>
				</form>
			</CardContent>
		</Card>

		<footer
			class="text-muted-foreground mt-8 flex flex-col items-center gap-2 text-center font-mono tracking-widest uppercase"
		>
			<p class="text-xs">Website Kedai Kopi</p>
			<div class="text-[8px]">
				<p>Est. 2025 • Asli Amuntai</p>
				<p>© Begin Again Coffee.</p>
			</div>
		</footer>
	</main>
</div>
