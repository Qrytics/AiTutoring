<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { tutor } from '$lib/data/tutor';

	type Slot = {
		id: string;
		startTime: string;
		endTime: string;
	};

	type ReservedBooking = {
		bookingId: string;
		slotStart: string;
		slotEnd: string;
		reservationExpiresAt: string;
	};

	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let reserveError = $state<string | null>(null);
	let slots = $state<Slot[]>([]);
	let selectedSlotId = $state<string | null>(null);
	let reserveLoading = $state(false);
	let reservedBooking = $state<ReservedBooking | null>(null);

	const slotGroups = $derived.by(() => {
		const groups = new Map<string, Slot[]>();

		for (const slot of slots) {
			const dayKey = new Intl.DateTimeFormat('en-US', {
				weekday: 'long',
				month: 'short',
				day: 'numeric'
			}).format(new Date(slot.startTime));

			if (!groups.has(dayKey)) {
				groups.set(dayKey, []);
			}
			groups.get(dayKey)?.push(slot);
		}

		return Array.from(groups.entries());
	});

	function formatTime(iso: string): string {
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(iso));
	}

	function formatDateTimeRange(startIso: string, endIso: string): string {
		const start = new Date(startIso);
		const end = new Date(endIso);
		const date = new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		}).format(start);
		const time = `${formatTime(startIso)} - ${formatTime(endIso)}`;
		return `${date}, ${time}`;
	}

	async function loadSlots() {
		loading = true;
		loadError = null;
		try {
			const response = await fetch(`${base}/api/availability`);
			if (!response.ok) {
				throw new Error('Could not load availability. Please refresh and try again.');
			}
			const data = (await response.json()) as { slots: Slot[] };
			slots = data.slots;
		} catch (err) {
			loadError =
				err instanceof Error ? err.message : 'Could not load availability. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function reserveSelectedSlot() {
		if (!selectedSlotId) {
			reserveError = 'Please select a time slot first.';
			return;
		}

		reserveLoading = true;
		reserveError = null;

		try {
			const response = await fetch(`${base}/api/book-slot`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					slotId: selectedSlotId,
					timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
				})
			});

			if (!response.ok) {
				const err = await response.json().catch(() => ({ message: 'Reservation failed.' }));
				throw new Error(err.message ?? 'Reservation failed.');
			}

			const data = (await response.json()) as ReservedBooking;
			reservedBooking = data;
			localStorage.setItem('reserved-booking', JSON.stringify(data));
		} catch (err) {
			reserveError =
				err instanceof Error ? err.message : 'Could not reserve slot. Please choose another time.';
		} finally {
			reserveLoading = false;
		}
	}

	onMount(async () => {
		await loadSlots();
	});
</script>

<svelte:head>
	<title>Book a Session — {tutor.name}</title>
</svelte:head>

<div class="page">
	<div class="page__inner">
		<a href="{base}/" class="back-link">← back to tutoring home</a>

		<h1 class="page-title">Book a Session</h1>
		<p class="page-lead">
			Choose an available 60-minute slot below. Your selection is held for 15 minutes so you can
			complete payment.
		</p>

		<ol class="steps" aria-label="Booking steps">
			<li class="step step--active" aria-current="step">
				<span class="step__num">1</span>
				<span class="step__label">Pick a time</span>
			</li>
			<li class="step">
				<span class="step__num">2</span>
				<span class="step__label">Pay securely</span>
			</li>
			<li class="step">
				<span class="step__num">3</span>
				<span class="step__label">Join &amp; learn</span>
			</li>
		</ol>

		<div class="scheduler-card">
			{#if loading}
				<p class="status-msg">Loading available times...</p>
			{:else if loadError}
				<p class="error-msg" role="alert">{loadError}</p>
				<button class="btn btn--ghost" onclick={loadSlots}>Try again</button>
			{:else if slots.length === 0}
				<p class="status-msg">
					No slots are currently available. Please check back soon or email
					<a href="mailto:{tutor.email}">{tutor.email}</a>.
				</p>
			{:else}
				{#each slotGroups as [day, daySlots]}
					<section class="day-group" aria-label={day}>
						<h2 class="day-title">{day}</h2>
						<div class="slot-grid">
							{#each daySlots as slot}
								<button
									type="button"
									class="slot-btn"
									class:slot-btn--selected={selectedSlotId === slot.id}
									onclick={() => {
										selectedSlotId = slot.id;
										reserveError = null;
										reservedBooking = null;
									}}
								>
									{formatTime(slot.startTime)}
								</button>
							{/each}
						</div>
					</section>
				{/each}

				<div class="reserve-action">
					<button
						type="button"
						class="btn btn--primary"
						disabled={!selectedSlotId || reserveLoading}
						onclick={reserveSelectedSlot}
					>
						{reserveLoading ? 'Reserving...' : 'Reserve selected slot'}
					</button>
				</div>
			{/if}

			{#if reserveError}
				<p class="error-msg" role="alert">{reserveError}</p>
			{/if}

			{#if reservedBooking}
				<div class="reservation-success">
					<p class="reservation-success__title">Time reserved</p>
					<p>{formatDateTimeRange(reservedBooking.slotStart, reservedBooking.slotEnd)}</p>
					<p>
						Hold expires at
						<strong>{new Date(reservedBooking.reservationExpiresAt).toLocaleTimeString()}</strong>.
					</p>
					<a href="{base}/checkout?bookingId={reservedBooking.bookingId}" class="btn btn--primary"
						>Continue to payment →</a
					>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.page {
		padding: clamp(2rem, 4vw, 3.5rem) 0;
		position: relative;
		z-index: 1;
	}

	.page__inner {
		max-width: 72rem;
		margin: 0 auto;
		padding: 0 clamp(1.25rem, 4vw, 3rem);
	}

	.back-link {
		display: inline-block;
		font-size: 0.85rem;
		color: var(--muted);
		text-decoration: none;
		margin-bottom: 1.5rem;
		transition: color 0.15s;
	}

	.back-link:hover {
		color: var(--accent);
	}

	.page-title {
		font-size: clamp(1.35rem, 3vw, 2rem);
		margin-bottom: 0.6rem;
	}

	.page-lead {
		font-size: 0.95rem;
		color: var(--muted);
		line-height: 1.6;
		margin-bottom: 2rem;
		max-width: 56ch;
	}

	.steps {
		display: flex;
		gap: 0;
		list-style: none;
		margin-bottom: 2rem;
		border: 1px solid var(--border);
		overflow: hidden;
	}

	.step {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.7rem 1.1rem;
		flex: 1;
		background: var(--panel);
		border-right: 1px solid var(--border);
		font-size: 0.85rem;
		color: var(--muter);
	}

	.step:last-child {
		border-right: none;
	}

	.step--active {
		background: rgba(54, 242, 194, 0.06);
		color: var(--accent);
	}

	.step__num {
		display: inline-grid;
		place-items: center;
		width: 1.4rem;
		height: 1.4rem;
		border: 1px solid currentColor;
		font-size: 0.72rem;
		font-family: var(--font-mono);
	}

	.step__label {
		font-family: var(--font-mono);
	}

	.scheduler-card {
		border: 1px solid var(--border);
		background: var(--panel);
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1.15rem;
	}

	.status-msg {
		color: var(--muted);
		font-size: 0.92rem;
	}

	.day-group {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.day-title {
		font-size: 0.85rem;
		color: var(--accent);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		font-family: var(--font-mono);
	}

	.slot-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
		gap: 0.6rem;
	}

	.slot-btn {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text);
		font-size: 0.85rem;
		font-family: var(--font-mono);
		cursor: pointer;
		transition: border-color 0.14s, background-color 0.14s, color 0.14s;
	}

	.slot-btn:hover {
		border-color: rgba(54, 242, 194, 0.45);
	}

	.slot-btn--selected {
		border-color: rgba(54, 242, 194, 0.6);
		background: rgba(54, 242, 194, 0.12);
		color: var(--accent);
	}

	.reserve-action {
		display: flex;
		justify-content: flex-start;
	}

	.reservation-success {
		border: 1px solid rgba(54, 242, 194, 0.35);
		background: rgba(54, 242, 194, 0.06);
		padding: 1rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		font-size: 0.9rem;
		color: var(--muted);
	}

	.reservation-success__title {
		font-family: var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.75rem;
		color: var(--accent);
	}

	.error-msg {
		padding: 0.65rem 1rem;
		background: rgba(255, 91, 87, 0.08);
		border: 1px solid rgba(255, 91, 87, 0.35);
		color: #ff7b78;
		font-size: 0.85rem;
	}

	.btn {
		display: inline-block;
		padding: 0.6rem 1.2rem;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		line-height: 1.4;
		text-decoration: none;
		cursor: pointer;
		border: 1px solid transparent;
		transition: background-color 0.15s, border-color 0.15s, color 0.15s;
	}

	.btn--primary {
		background: rgba(54, 242, 194, 0.1);
		border-color: rgba(54, 242, 194, 0.5);
		color: var(--accent);
	}

	.btn--primary:hover {
		background: rgba(54, 242, 194, 0.18);
		border-color: rgba(54, 242, 194, 0.75);
	}

	.btn--ghost {
		background: transparent;
		border-color: var(--border);
		color: var(--muted);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.steps {
			flex-direction: column;
		}

		.step {
			border-right: none;
			border-bottom: 1px solid var(--border);
		}

		.step:last-child {
			border-bottom: none;
		}
	}
</style>
