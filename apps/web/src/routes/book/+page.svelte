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
		slotId: string;
		slotStart: string;
		slotEnd: string;
		reservationExpiresAt: string;
	};

	type MonthOption = {
		key: string;
		label: string;
	};

	type CalendarDayCell = {
		day: number;
		dayKey: string;
		hasSlots: boolean;
		isToday: boolean;
	};
	
	type HourCell = {
		hour: number;
		label: string;
		slot: Slot | null;
	};

	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let reserveError = $state<string | null>(null);
	let slots = $state<Slot[]>([]);
	let selectedSlotId = $state<string | null>(null);
	let monthOptions = $state<MonthOption[]>([]);
	let selectedMonthKey = $state<string | null>(null);
	let selectedDayKey = $state<string | null>(null);
	let reserveLoading = $state(false);
	let reservedBooking = $state<ReservedBooking | null>(null);
	const monthSlotsCache = new Map<string, Slot[]>();
	let monthAvailability = $state<Record<string, boolean | undefined>>({});

	const weekDayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const businessHours = Array.from({ length: 15 }, (_, idx) => idx + 9);

	function toDayKey(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function toMonthKey(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		return `${year}-${month}`;
	}

	function dateFromDayKey(dayKey: string): Date {
		const [year, month, day] = dayKey.split('-').map(Number);
		return new Date(year, month - 1, day);
	}

	const slotsByDay = $derived.by(() => {
		const groups = new Map<string, Slot[]>();

		for (const slot of slots) {
			const dayKey = toDayKey(new Date(slot.startTime));

			if (!groups.has(dayKey)) {
				groups.set(dayKey, []);
			}
			groups.get(dayKey)?.push(slot);
		}

		for (const daySlots of groups.values()) {
			daySlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
		}

		return groups;
	});

	const selectedDaySlots = $derived.by(() => {
		if (!selectedDayKey) return [];
		return slotsByDay.get(selectedDayKey) ?? [];
	});

	const selectedDayHourCells = $derived.by(() => {
		if (!selectedDayKey) return [] as HourCell[];

		const slotByHour = new Map<number, Slot>();
		for (const slot of selectedDaySlots) {
			const hour = new Date(slot.startTime).getHours();
			slotByHour.set(hour, slot);
		}

		return businessHours.map((hour) => ({
			hour,
			label: formatHourLabel(hour),
			slot: slotByHour.get(hour) ?? null
		}));
	});

	const selectedDayLabel = $derived.by(() => {
		if (!selectedDayKey) return null;
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			month: 'short',
			day: 'numeric'
		}).format(dateFromDayKey(selectedDayKey));
	});

	const calendarCells = $derived.by(() => {
		if (!selectedMonthKey) return [] as Array<CalendarDayCell | null>;

		const [yearStr, monthStr] = selectedMonthKey.split('-');
		const year = Number(yearStr);
		const monthIndex = Number(monthStr) - 1;

		const firstDay = new Date(year, monthIndex, 1);
		const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
		const startOffset = firstDay.getDay();

		const cells: Array<CalendarDayCell | null> = [];
		for (let i = 0; i < startOffset; i += 1) {
			cells.push(null);
		}

		const todayKey = toDayKey(new Date());
		for (let day = 1; day <= daysInMonth; day += 1) {
			const dayKey = `${selectedMonthKey}-${String(day).padStart(2, '0')}`;
			cells.push({
				day,
				dayKey,
				hasSlots: slotsByDay.has(dayKey),
				isToday: dayKey === todayKey
			});
		}

		return cells;
	});

	function buildMonthOptions(monthCount = 6): MonthOption[] {
		const current = new Date();
		const options: MonthOption[] = [];

		for (let i = 0; i < monthCount; i += 1) {
			const date = new Date(current.getFullYear(), current.getMonth() + i, 1);
			options.push({
				key: toMonthKey(date),
				label: new Intl.DateTimeFormat('en-US', {
					month: 'long',
					year: 'numeric'
				}).format(date)
			});
		}

		return options;
	}

	function getMonthRangeIso(monthKey: string): { start: string; end: string } {
		const [yearStr, monthStr] = monthKey.split('-');
		const year = Number(yearStr);
		const monthIndex = Number(monthStr) - 1;

		const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
		const end = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);

		return {
			start: start.toISOString(),
			end: end.toISOString()
		};
	}

	function getDayKeysFromSlots(slotList: Slot[]): string[] {
		return Array.from(new Set(slotList.map((slot) => toDayKey(new Date(slot.startTime))))).sort();
	}

	function readStoredReservation(): ReservedBooking | null {
		const raw = localStorage.getItem('reserved-booking');
		if (!raw) return null;

		try {
			const parsed = JSON.parse(raw) as Partial<ReservedBooking>;
			if (!parsed.bookingId || !parsed.slotId || !parsed.slotStart || !parsed.slotEnd) {
				return null;
			}

			return {
				bookingId: parsed.bookingId,
				slotId: parsed.slotId,
				slotStart: parsed.slotStart,
				slotEnd: parsed.slotEnd,
				reservationExpiresAt: parsed.reservationExpiresAt ?? new Date().toISOString()
			};
		} catch {
			return null;
		}
	}

	function applyMonthSlots(slotList: Slot[]) {
		slots = slotList;
		const dayKeys = getDayKeysFromSlots(slotList);
		selectedDayKey = dayKeys[0] ?? null;
		selectedSlotId = null;
		reserveError = null;
		reservedBooking = null;
	}

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

	function formatHourLabel(hour: number): string {
		const reference = new Date(2026, 0, 1, hour, 0, 0);
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		}).format(reference);
	}

	async function loadSlotsForMonth(
		monthKey: string,
		options?: { showLoading?: boolean; forceRefresh?: boolean }
	) {
		const showLoading = options?.showLoading ?? false;
		const forceRefresh = options?.forceRefresh ?? false;

		if (!forceRefresh) {
			const cached = monthSlotsCache.get(monthKey);
			if (cached) {
				applyMonthSlots(cached);
				loadError = null;
				if (showLoading) loading = false;
				return;
			}
		}

		if (showLoading) {
			loading = true;
		}

		if (selectedMonthKey === monthKey) {
			loadError = null;
		}

		try {
			const range = getMonthRangeIso(monthKey);
			const response = await fetch(
				`${base}/api/availability?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`
			);
			if (!response.ok) {
				throw new Error('Could not load availability. Please refresh and try again.');
			}
			const data = (await response.json()) as { slots: Slot[] };
			monthSlotsCache.set(monthKey, data.slots);
			monthAvailability = {
				...monthAvailability,
				[monthKey]: data.slots.length > 0
			};

			if (selectedMonthKey === monthKey) {
				applyMonthSlots(data.slots);
			}
		} catch (err) {
			if (selectedMonthKey === monthKey) {
				loadError =
					err instanceof Error ? err.message : 'Could not load availability. Please try again.';
				slots = [];
				selectedDayKey = null;
				selectedSlotId = null;
			}
		} finally {
			if (showLoading) {
				loading = false;
			}
		}
	}

	async function prefetchRemainingMonths(activeMonthKey: string) {
		const monthsToPrefetch = monthOptions
			.map((month) => month.key)
			.filter((monthKey) => monthKey !== activeMonthKey && !monthSlotsCache.has(monthKey));

		await Promise.allSettled(monthsToPrefetch.map((monthKey) => loadSlotsForMonth(monthKey)));
	}

	async function retryLoad() {
		if (!selectedMonthKey) return;
		await loadSlotsForMonth(selectedMonthKey, { forceRefresh: true });
	}

	function selectDay(dayKey: string) {
		selectedDayKey = dayKey;
		selectedSlotId = null;
		reserveError = null;
		reservedBooking = null;
	}

	async function selectMonth(monthKey: string) {
		if (monthKey === selectedMonthKey) return;
		selectedMonthKey = monthKey;
		await loadSlotsForMonth(monthKey);
	}

	function selectHourSlot(slot: Slot | null) {
		if (!slot) return;
		selectedSlotId = slot.id;
		reserveError = null;
		reservedBooking = null;
	}

	async function reserveSlot(
		slotId: string,
		options?: { silent?: boolean; setLoading?: boolean }
	): Promise<ReservedBooking | null> {
		const silent = options?.silent ?? false;
		const setLoading = options?.setLoading ?? true;

		if (setLoading) {
			reserveLoading = true;
		}

		if (!silent) {
			reserveError = null;
		}

		try {
			const response = await fetch(`${base}/api/book-slot`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					slotId,
					timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
				})
			});

			if (!response.ok) {
				const err = await response.json().catch(() => ({ message: 'Reservation failed.' }));
				throw new Error(err.message ?? 'Reservation failed.');
			}

			const data = (await response.json()) as ReservedBooking;
			reservedBooking = data;
			selectedSlotId = data.slotId;
			selectedDayKey = toDayKey(new Date(data.slotStart));
			localStorage.setItem('reserved-booking', JSON.stringify(data));
			return data;
		} catch (err) {
			if (!silent) {
				reserveError =
					err instanceof Error
						? err.message
						: 'Could not reserve slot. Please choose another time.';
			}
			return null;
		} finally {
			if (setLoading) {
				reserveLoading = false;
			}
		}
	}

	async function silentlyRestoreReservationOnLoad() {
		const stored = readStoredReservation();
		if (!stored) return;

		const slotStart = new Date(stored.slotStart);
		if (Number.isNaN(slotStart.getTime()) || slotStart <= new Date()) {
			localStorage.removeItem('reserved-booking');
			return;
		}

		const targetMonthKey = toMonthKey(slotStart);
		if (targetMonthKey !== selectedMonthKey) {
			selectedMonthKey = targetMonthKey;
			await loadSlotsForMonth(targetMonthKey);
		}

		const refreshed = await reserveSlot(stored.slotId, { silent: true, setLoading: false });
		if (!refreshed) {
			localStorage.removeItem('reserved-booking');
			return;
		}

		selectedMonthKey = toMonthKey(new Date(refreshed.slotStart));
	}

	async function reserveSelectedSlot() {
		if (!selectedSlotId) {
			reserveError = 'Please select a time slot first.';
			return;
		}

		await reserveSlot(selectedSlotId, { silent: false, setLoading: true });
	}

	onMount(async () => {
		monthOptions = buildMonthOptions(12);
		monthAvailability = Object.fromEntries(monthOptions.map((month) => [month.key, undefined]));
		selectedMonthKey = monthOptions[0]?.key ?? null;

		if (selectedMonthKey) {
			await loadSlotsForMonth(selectedMonthKey, { showLoading: true });
			await silentlyRestoreReservationOnLoad();
			void prefetchRemainingMonths(selectedMonthKey);
		} else {
			loading = false;
		}
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
				<button class="btn btn--ghost" onclick={retryLoad}>Try again</button>
			{:else}
				<div class="picker-grid">
					<section class="picker-block" aria-label="Choose month">
						<p class="picker-title">1. Choose month</p>
						<div class="month-list" role="listbox" aria-label="Available months">
							{#each monthOptions as month}
								<button
									type="button"
									class="month-btn"
									class:month-btn--selected={selectedMonthKey === month.key}
									class:month-btn--unavailable={monthAvailability[month.key] === false}
									role="option"
									aria-selected={selectedMonthKey === month.key}
									onclick={() => selectMonth(month.key)}
								>
									{month.label}
								</button>
							{/each}
						</div>
					</section>

					<section class="picker-block" aria-label="Choose day">
						<p class="picker-title">2. Choose day</p>
						<div class="calendar-headings">
							{#each weekDayHeaders as header}
								<span>{header}</span>
							{/each}
						</div>
						<div class="calendar-grid">
							{#each calendarCells as cell}
								{#if !cell}
									<div class="calendar-day calendar-day--empty" aria-hidden="true"></div>
								{:else}
									<button
										type="button"
										class="calendar-day"
										class:calendar-day--today={cell.isToday}
										class:calendar-day--selected={selectedDayKey === cell.dayKey}
										disabled={!cell.hasSlots}
										onclick={() => selectDay(cell.dayKey)}
									>
										{cell.day}
									</button>
								{/if}
							{/each}
						</div>
					</section>

					<section class="picker-block" aria-label="Choose hour">
						<p class="picker-title">3. Choose hour</p>
						{#if selectedDayLabel}
							<p class="selected-day-label">{selectedDayLabel}</p>
						{/if}

						{#if !selectedDayKey}
							<p class="status-msg">
								{slots.length === 0
									? `No slots are available in this month. Try another month or email ${tutor.email}.`
									: 'Choose a highlighted day to see available hours.'}
							</p>
						{:else}
							<div class="slot-grid">
								{#each selectedDayHourCells as hourCell}
									<button
										type="button"
										class="slot-btn"
										class:slot-btn--selected={hourCell.slot !== null && selectedSlotId === hourCell.slot.id}
										class:slot-btn--unavailable={hourCell.slot === null}
										disabled={hourCell.slot === null}
										onclick={() => selectHourSlot(hourCell.slot)}
									>
										{hourCell.label}
									</button>
								{/each}
							</div>
							<p class="hours-note">Gray times are unavailable or already reserved.</p>
						{/if}
					</section>
				</div>

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

	.picker-grid {
		display: grid;
		grid-template-columns: 240px minmax(280px, 420px) minmax(260px, 1fr);
		gap: 1rem;
		align-items: start;
	}

	.picker-block {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		padding: 0.9rem;
		background: var(--panel-2);
		border: 1px solid var(--border);
		min-height: 100%;
	}

	.picker-title {
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		font-family: var(--font-mono);
		color: var(--accent);
	}

	.month-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 26rem;
		overflow-y: auto;
		padding-right: 0.1rem;
	}

	.month-btn {
		text-align: left;
		padding: 0.55rem 0.65rem;
		border: 1px solid var(--border);
		background: transparent;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.85rem;
		cursor: pointer;
		transition: border-color 0.14s, background-color 0.14s, color 0.14s;
	}

	.month-btn:hover {
		border-color: rgba(54, 242, 194, 0.45);
		color: var(--text);
	}

	.month-btn--selected {
		border-color: rgba(54, 242, 194, 0.7);
		background: rgba(54, 242, 194, 0.12);
		color: var(--accent);
	}

	.month-btn--unavailable {
		color: var(--muter);
		border-color: var(--border-2);
		background: color-mix(in srgb, var(--panel) 86%, #77879f 14%);
	}

	.month-btn--unavailable:hover {
		border-color: var(--border-2);
		color: var(--muted);
	}

	.calendar-headings {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.25rem;
		font-family: var(--font-mono);
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muter);
	}

	.calendar-headings span {
		text-align: center;
	}

	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.25rem;
	}

	.calendar-day {
		height: 2rem;
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text);
		font-family: var(--font-mono);
		font-size: 0.8rem;
		cursor: pointer;
		transition: border-color 0.14s, background-color 0.14s, color 0.14s;
	}

	.calendar-day--empty {
		border-color: transparent;
	}

	.calendar-day:hover:enabled {
		border-color: rgba(54, 242, 194, 0.45);
	}

	.calendar-day:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.calendar-day--today {
		border-color: rgba(54, 242, 194, 0.45);
	}

	.calendar-day--selected {
		border-color: rgba(54, 242, 194, 0.7);
		background: rgba(54, 242, 194, 0.12);
		color: var(--accent);
	}

	.selected-day-label {
		font-size: 0.82rem;
		color: var(--muted);
		margin-bottom: 0.2rem;
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

	.slot-btn:disabled {
		cursor: not-allowed;
	}

	.slot-btn--unavailable {
		color: var(--muter);
		border-color: var(--border-2);
		background: var(--panel-2);
	}

	.slot-btn--unavailable:hover {
		border-color: var(--border-2);
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

	.hours-note {
		font-size: 0.62rem;
		line-height: 1.35;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--muter);
	}

	[data-theme='light'] .picker-block {
		background: var(--panel);
	}

	[data-theme='light'] .month-btn {
		background: var(--bg);
		color: var(--muted);
	}

	[data-theme='light'] .month-btn--selected {
		background: color-mix(in srgb, var(--bg) 88%, var(--accent) 12%);
		color: var(--accent);
	}

	[data-theme='light'] .month-btn--unavailable {
		background: color-mix(in srgb, var(--bg) 88%, #9aa9a5 12%);
		color: rgba(24, 65, 60, 0.46);
		border-color: rgba(24, 65, 60, 0.16);
	}

	[data-theme='light'] .calendar-day:disabled {
		opacity: 0.55;
	}

	[data-theme='light'] .slot-btn--unavailable {
		background: color-mix(in srgb, var(--panel) 90%, #9aa9a5 10%);
		color: rgba(24, 65, 60, 0.42);
		border-color: rgba(24, 65, 60, 0.16);
		text-decoration: line-through;
		text-decoration-thickness: 1px;
	}

	[data-theme='light'] .slot-btn--unavailable:disabled {
		opacity: 1;
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

		.picker-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 980px) {
		.picker-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
