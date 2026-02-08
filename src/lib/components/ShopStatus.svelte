<script lang="ts">
	import { onMount, onDestroy } from "svelte";

	type Status = "open" | "closing-soon" | "closed";
	type TimeRange = { open: number; close: number };

	type StatusResult = {
		status: Status;
		label: string;
	};

	const CLOSING_SOON_MINUTES = 60;

	/* -------------------------------------------------
	 * Helpers
	 * ------------------------------------------------- */
	const t = (h: number, m = 0) => h * 60 + m;

	const pad = (n: number) => String(n).padStart(2, "0");

	function formatTime(minutes: number) {
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return `${pad(h)}:${pad(m)}`;
	}

	function formatDuration(minutes: number) {
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;

		if (h > 0 && m > 0) return `Buka dalam ${h} jam ${m} menit`;
		if (h > 0) return `Buka dalam ${h} jam`;
		return `Buka dalam ${m} menit`;
	}

	/* -------------------------------------------------
	 * Schedule
	 * ------------------------------------------------- */
	const weekday: TimeRange[] = [
		{ open: t(8), close: t(16) },
		{ open: t(20), close: t(22) },
	];

	const weekend: TimeRange[] = [
		{ open: t(10), close: t(16) },
		{ open: t(20), close: t(22) },
	];

	const friday: TimeRange[] = [
		{ open: t(13, 30), close: t(16, 30) },
		{ open: t(20), close: t(22) },
	];

	const schedule: Record<number, TimeRange[]> = {
		0: weekend,
		1: weekday,
		2: weekday,
		3: weekday,
		4: weekday,
		5: friday,
		6: weekend,
	};

	/* -------------------------------------------------
	 * Status Logic
	 * ------------------------------------------------- */
	function getStatus(
		today: TimeRange[],
		tomorrow: TimeRange[] | undefined,
		nowMinutes: number
	): StatusResult {
		// 1. Sedang buka?
		for (const { open, close } of today) {
			if (nowMinutes >= open && nowMinutes < close) {
				const remaining = close - nowMinutes;

				if (remaining <= CLOSING_SOON_MINUTES) {
					return {
						status: "closing-soon",
						label: "Segera Tutup",
					};
				}

				return {
					status: "open",
					label: "We Are Open",
				};
			}
		}

		// 2. Akan buka lagi hari ini
		const nextToday = today.find((r) => r.open > nowMinutes);
		if (nextToday) {
			return {
				status: "closed",
				label: formatDuration(nextToday.open - nowMinutes),
			};
		}

		// 3. Akan buka besok
		if (tomorrow && tomorrow.length > 0) {
			const time = formatTime(tomorrow[0].open);
			return {
				status: "closed",
				label: `Buka besok pukul ${time}`,
			};
		}

		// 4. Tutup sepenuhnya
		return {
			status: "closed",
			label: "Tutup",
		};
	}

	/* -------------------------------------------------
	 * State
	 * ------------------------------------------------- */
	let status: Status = "closed";
	let statusText = "";
	let intervalId: number;

	/* -------------------------------------------------
	 * Update Loop
	 * ------------------------------------------------- */
	function checkStatus() {
		const now = new Date();
		const day = now.getDay();
		const minutes = now.getHours() * 60 + now.getMinutes();

		const today = schedule[day];
		const tomorrow = schedule[(day + 1) % 7];

		if (!today) {
			status = "closed";
			statusText = "Tutup";
			return;
		}

		const result = getStatus(today, tomorrow, minutes);
		status = result.status;
		statusText = result.label;
	}

	onMount(() => {
		checkStatus();
		intervalId = window.setInterval(checkStatus, 60_000);
	});

	onDestroy(() => {
		clearInterval(intervalId);
	});

	const STATUS_META = {
		open: {
			container: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
			dot: "bg-emerald-500",
		},
		"closing-soon": {
			container: "border border-amber-500/20 bg-amber-500/10 text-amber-600",
			dot: "bg-amber-500",
		},
		closed: {
			container: "border border-border bg-secondary text-muted-foreground",
			dot: "bg-stone-400",
		},
	};
</script>

<div
	class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase transition-colors
		{STATUS_META[status].container}"
>
	<span class="relative flex h-2 w-2">
		{#if status === "open"}
			<span
				class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
			></span>
		{/if}

		<span class="relative inline-flex h-2 w-2 rounded-full {STATUS_META[status].dot}"></span>
	</span>

	{statusText}
</div>
