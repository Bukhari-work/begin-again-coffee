<script lang="ts">
	import "../app.css";
	import { page } from "$app/state";
	import type { Snippet } from "svelte";

	let { children }: { children: Snippet } = $props();

	// --- DYNAMIC METADATA ---
	// We use $derived so that if the user navigates to a new page,
	// the metadata updates reactively based on that page's load data.
	let title = $derived(page.data.meta?.title || "Begin Again Coffee | Amuntai");
	let description = $derived(
		page.data.meta?.description ||
			"Specialty coffee, expertly brewed in Amuntai. Order ahead, check our menu, or visit our shop."
	);
	let image = $derived(page.data.meta?.image || "/og-image.webp");

	// This ensures the canonical URL is ALWAYS the clean, base path without ?search=queries
	let url = $derived(`${page.url.origin}${page.url.pathname}`);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="title" content={title} />
	<meta name="description" content={description} />
	<meta name="theme-color" content="#ffffff" />

	<meta property="og:type" content="website" />
	<meta property="og:url" content={url} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />

	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={url} />
	<meta property="twitter:title" content={title} />
	<meta property="twitter:description" content={description} />
	<meta property="twitter:image" content={image} />

	<link rel="canonical" href={url} />
</svelte:head>

{@render children()}
