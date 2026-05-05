<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import { ArrowLeft } from "@lucide/svelte";
	import { goto } from "$app/navigation";

	// Smart Back Navigation
	const handleBack = () => {
		if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
			history.back();
		} else {
			goto("/");
		}
	};
</script>

<div
	class="bg-background selection:bg-primary relative flex min-h-screen flex-col items-center justify-center p-4 font-sans selection:text-white"
>
	<!-- Terminal Grid Background -->
	<div
		class="bg-size[24px_24px] absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]"
	></div>

	<!-- Top-Left Quick Escape -->
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
		<!-- Header / Status Area -->
		<div class="mb-8 flex flex-col items-center text-center">
			<div class="bg-secondary/50 flex h-24 w-24 items-center justify-center rounded-full">
				<h1 class="text-primary text-7xl font-black">
					{page.status}
				</h1>
			</div>
		</div>

		<!-- Main Error Card -->
		<Card class="border-border border-2 shadow-lg">
			<CardHeader class="text-center">
				<CardTitle class="text-lg font-bold md:text-xl">
					{#if page.status === 404}
						Halamannya Kadada
					{:else}
						Sistem Sedang Gangguan
					{/if}
				</CardTitle>
				<CardDescription class="text-xs md:text-sm">
					{#if page.status === 404}
						Kayanya link yang pian tuju salah atau halamannya sudah dipindah.
					{:else}
						Maaf, ada kendala teknis di server. Silakan coba kembali dalam beberapa
						saat.
					{/if}
				</CardDescription>
			</CardHeader>

			<CardContent class="grid gap-4">
				<!-- Technical Error Display (Only for 500s) -->
				{#if page.error?.message && page.status !== 404}
					<div
						class="bg-destructive/10 text-destructive border-destructive/20 wrap-break-words rounded-md border p-3 text-center font-mono text-[10px] md:text-xs"
					>
						{page.error.message}
					</div>
				{/if}

				<!-- Action Buttons -->
				<div class="grid gap-3 md:mt-2">
					<Button
						onclick={handleBack}
						size="lg"
						variant="outline"
						class="w-full font-bold tracking-wide uppercase"
					>
						Kembali
					</Button>

					<Button href="/" size="lg" class="w-full font-bold tracking-wide uppercase">
						Home
					</Button>
				</div>
			</CardContent>
		</Card>

		<!-- Terminal Footer -->
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
