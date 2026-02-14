<script lang="ts">
	import { Quote } from "@lucide/svelte";
	import { cn } from "$lib/utils"; // Assuming you have a cn utility, if not, standard template literals work
	let {
		quote,
		name,
		role = "Pelanggan",
		topic = "STORY",
		featured = false,
		class: className = "",
	} = $props<{
		quote: string;
		name: string;
		role?: string;
		topic?: string;
		featured?: boolean;
		class?: string;
	}>();
</script>

<div
	class={cn(
		"group relative flex flex-col justify-between border p-8",
		// Default Styles
		!featured &&
			"border-white/10 bg-stone-900/40 hover:border-yellow-500/50 hover:bg-stone-900/80",
		// Featured (Yellow) Styles
		featured &&
			"border-yellow-500 bg-yellow-500/10 shadow-[0px_0px_50px_-20px_rgba(234,179,8,0.2)]",
		className
	)}
>
	<div
		class={cn(
			"absolute -top-1 -right-1 h-3 w-3 transition-colors duration-300",
			featured ? "bg-yellow-500" : "bg-white/10 group-hover:bg-yellow-500"
		)}
	></div>

	<div class="mb-6 flex items-center justify-between">
		<div
			class={cn(
				"inline-flex items-center gap-2 border px-2 py-1 font-mono text-[10px] font-bold tracking-widest uppercase",
				featured
					? "border-yellow-500 text-yellow-500"
					: "border-stone-700 text-stone-500 transition-colors group-hover:border-stone-500 group-hover:text-stone-400"
			)}
		>
			<span>/// {topic}</span>
		</div>

		<Quote
			class={cn(
				"h-6 w-6 opacity-50",
				featured ? "text-yellow-500" : "text-stone-700 group-hover:text-stone-500"
			)}
		/>
	</div>

	<div class="mb-8">
		<p
			class={cn(
				"font-mono leading-relaxed",
				featured ? "text-xl  tracking-tight text-white " : "text-lg text-stone-300"
			)}
		>
			{quote}
		</p>
	</div>

	<div
		class={cn(
			"flex items-center gap-3 border-t pt-4",
			featured ? "border-yellow-500/30" : "border-white/5"
		)}
	>
		<div
			class={cn(
				"flex h-10 w-10 items-center justify-center rounded-full text-sm font-black uppercase",
				featured
					? "bg-yellow-500 text-black"
					: "border border-white/10 bg-stone-800 text-stone-500"
			)}
		>
			{name.charAt(0)}
		</div>
		<div>
			<div
				class={cn(
					"text-sm font-bold tracking-wider uppercase",
					featured ? "text-yellow-500" : "text-white"
				)}
			>
				{name}
			</div>
			<div
				class={cn(
					"font-mono text-[10px] tracking-widest uppercase",
					featured ? "text-yellow-500/70" : "text-stone-500"
				)}
			>
				{role}
			</div>
		</div>
	</div>
</div>
