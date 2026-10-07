<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { base } from '$app/paths';
	import { meetingPlatforms, session, subjects, tutor } from '$lib/data/tutor';
	import { fmt, generateSlots, groupByDay, visitorTimeZone, type Slot, type SlotDay } from '$lib/schedule';
	import {
		availablePayMethods,
		googleCalendarHref,
		icsFile,
		isEmail,
		mailtoHref,
		paymentNote,
		requestBody,
		requestSubject,
		type BookingDetails,
		type PayMethodId
	} from '$lib/booking';
	import { getItem, removeItem, setItem } from '$lib/storage';
	import { playSound } from '$lib/sound';
	import { toast } from '$lib/toast.svelte';

	type Step = 1 | 2 | 3 | 4;
	const DRAFT_KEY = 'tutoring-booking-draft';
	const DRAFT_TTL_MS = 6 * 3_600_000;
	const topics = [...subjects.map((s) => s.title), 'Something else'];

	let ready = $state(false);
	let step = $state<Step>(1);
	let days = $state<SlotDay[]>([]);
	let dayKey = $state<string | null>(null);
	let slot = $state<Slot | null>(null);
	let zone = $state('UTC');

	let details = $state<BookingDetails>({
		name: '',
		email: '',
		topic: topics[0],
		goals: '',
		platform: meetingPlatforms[0]
	});
	let methodId = $state<PayMethodId | null>(null);
	let paid = $state(false);
	let triedNext = $state(false);
	let confetti = $state(0);

	let panel = $state<HTMLElement | undefined>();

	const day = $derived(days.find((d) => d.key === dayKey) ?? null);
	const methods = $derived(slot ? availablePayMethods(slot) : []);
	const method = $derived(methods.find((m) => m.id === methodId));
	const detailsValid = $derived(details.name.trim().length > 1 && isEmail(details.email));
	const subject = $derived(slot ? requestSubject(slot, details) : '');
	const body = $derived(slot ? requestBody(slot, details, method, paid, zone) : '');
	const zoneLabel = $derived(day ? fmt.zoneName(day.date, zone) : zone);

	onMount(() => {
		zone = visitorTimeZone();
		days = groupByDay(generateSlots(), zone);

		const topic = new URLSearchParams(window.location.search).get('topic');
		if (topic && topics.includes(topic)) details.topic = topic;

		restoreDraft();
		dayKey ??= days[0]?.key ?? null;
		ready = true;
	});

	// ── Draft: survives a trip out to Venmo / Cash App and back ──────────────
	function restoreDraft() {
		try {
			const raw = getItem(DRAFT_KEY);
			if (!raw) return;
			const d = JSON.parse(raw);
			if (Date.now() - d.savedAt > DRAFT_TTL_MS) return removeItem(DRAFT_KEY);
			const found = days.flatMap((x) => x.slots).find((s) => s.id === d.slotId);
			if (d.details) details = { ...details, ...d.details };
			if (d.methodId) methodId = d.methodId;
			paid = !!d.paid;
			if (found) {
				slot = found;
				dayKey = days.find((x) => x.slots.includes(found))?.key ?? null;
				step = Math.min(d.step ?? 1, 3) as Step;
			}
		} catch {
			removeItem(DRAFT_KEY);
		}
	}

	$effect(() => {
		if (!ready || step === 4) return;
		setItem(
			DRAFT_KEY,
			JSON.stringify({ slotId: slot?.id, details, methodId, paid, step, savedAt: Date.now() })
		);
	});

	// ── Navigation ───────────────────────────────────────────────────────────
	async function goto(next: Step) {
		step = next;
		triedNext = false;
		await tick();
		panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		panel?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
	}

	function pickDay(key: string) {
		dayKey = key;
		playSound('tick', 0.15);
	}

	function pickSlot(s: Slot) {
		slot = s;
		playSound('click', 0.2);
	}

	function toDetails() {
		if (!slot) return;
		playSound('pop', 0.2);
		goto(2);
	}

	function toPay() {
		triedNext = true;
		if (!detailsValid) {
			panel?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
			return;
		}
		playSound('pop', 0.2);
		if (!methodId && methods.length === 1) methodId = methods[0].id;
		goto(3);
	}

	function sendRequest() {
		// The <a href="mailto:"> does the navigation; this only records it and moves on.
		playSound('complete', 0.25);
		confetti += 1;
		removeItem(DRAFT_KEY);
		setTimeout(() => goto(4), 120);
	}

	async function copy(text: string, label: string) {
		try {
			await navigator.clipboard.writeText(text);
			toast(`${label} copied`);
			playSound('tick', 0.18);
		} catch {
			toast('Copy failed — select the text instead');
		}
	}

	function downloadIcs() {
		if (!slot) return;
		const url = URL.createObjectURL(new Blob([icsFile(slot, details)], { type: 'text/calendar' }));
		const a = Object.assign(document.createElement('a'), { href: url, download: 'tutoring-session.ics' });
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	function startOver() {
		removeItem(DRAFT_KEY);
		slot = null;
		methodId = null;
		paid = false;
		days = groupByDay(generateSlots(), zone);
		dayKey = days[0]?.key ?? null;
		goto(1);
	}

	const stepLabels = ['time', 'details', 'pay & send', 'done'];
</script>

<div class="book">
	<header class="book__head">
		<a href="{base}/" class="back">← tutoring home</a>
		<h1 class="book__title">Book a session</h1>
		<p class="book__lead">
			{session.minutes} minutes · ${session.price} · live on video. Takes about a minute — no account needed.
		</p>

		<ol class="progress" aria-label="Booking progress">
			{#each stepLabels as label, i (label)}
				{@const n = (i + 1) as Step}
				<li
					class="progress__step"
					class:progress__step--done={step > n}
					class:progress__step--current={step === n}
					aria-current={step === n ? 'step' : undefined}
				>
					<span class="progress__num">{step > n ? '✓' : n}</span>
					<span class="progress__label">{label}</span>
				</li>
			{/each}
		</ol>
	</header>

	<section class="panel" bind:this={panel} aria-live="polite">
		{#if !ready}
			<div class="skeleton" aria-label="Loading available times">
				<div class="skeleton__row"></div>
				<div class="skeleton__grid">{#each Array(6) as _, i (i)}<div></div>{/each}</div>
			</div>
		{:else if step === 1}
			<!-- ─────────────────────────────── 1 · TIME -->
			<h2 class="panel__title" tabindex="-1">Pick a time</h2>
			<p class="panel__hint">Shown in your time zone — <strong>{zoneLabel}</strong>.</p>

			{#if days.length === 0}
				<div class="empty">
					<p>No open slots in the next few weeks.</p>
					<a class="btn btn--ghost" href="mailto:{tutor.email}?subject=Tutoring%20availability">email me for a time</a>
				</div>
			{:else}
				<div class="days" role="listbox" aria-label="Day">
					{#each days as d (d.key)}
						<button
							type="button"
							role="option"
							class="day"
							aria-selected={d.key === dayKey}
							onclick={() => pickDay(d.key)}
						>
							<span class="day__wd">{fmt.weekday(d.date)}</span>
							<span class="day__num">{fmt.dayNum(d.date)}</span>
							<span class="day__mo">{fmt.month(d.date)}</span>
							<span class="day__count">{d.slots.length} open</span>
						</button>
					{/each}
				</div>

				{#if day}
					<h3 class="times__label">{fmt.long(day.date)}</h3>
					<div class="times" role="listbox" aria-label="Start time">
						{#each day.slots as s (s.id)}
							<button
								type="button"
								role="option"
								class="time"
								aria-selected={slot?.id === s.id}
								onclick={() => pickSlot(s)}
							>
								{fmt.time(s.start)}
							</button>
						{/each}
					</div>
				{/if}
			{/if}

			<div class="actions">
				<p class="actions__summary">
					{#if slot}<strong>{fmt.weekday(slot.start)}, {fmt.month(slot.start)} {fmt.dayNum(slot.start)}</strong> · {fmt.time(slot.start)}{:else}Choose a start time{/if}
				</p>
				<button type="button" class="btn btn--solid" disabled={!slot} onclick={toDetails}>continue →</button>
			</div>
		{:else if step === 2 && slot}
			<!-- ─────────────────────────────── 2 · DETAILS -->
			<h2 class="panel__title" tabindex="-1">About you</h2>
			<p class="panel__hint">So I can prepare — and know where to send the confirmation.</p>

			<form class="form" onsubmit={(e) => (e.preventDefault(), toPay())} novalidate>
				<label class="field">
					<span class="field__label">Name</span>
					<input
						type="text"
						autocomplete="name"
						bind:value={details.name}
						aria-invalid={triedNext && details.name.trim().length < 2}
						placeholder="Ada Lovelace"
					/>
					{#if triedNext && details.name.trim().length < 2}<span class="field__err">Add your name</span>{/if}
				</label>

				<label class="field">
					<span class="field__label">Email</span>
					<input
						type="email"
						autocomplete="email"
						inputmode="email"
						bind:value={details.email}
						aria-invalid={triedNext && !isEmail(details.email)}
						placeholder="you@example.com"
					/>
					{#if triedNext && !isEmail(details.email)}<span class="field__err">Enter a valid email</span>{/if}
				</label>

				<fieldset class="field">
					<legend class="field__label">Topic</legend>
					<div class="chips">
						{#each topics as t (t)}
							<label class="chip">
								<input type="radio" name="topic" value={t} bind:group={details.topic} />
								<span>{t}</span>
							</label>
						{/each}
					</div>
				</fieldset>

				<label class="field">
					<span class="field__label">What do you want to work on? <em>(optional)</em></span>
					<textarea
						rows="4"
						bind:value={details.goals}
						placeholder="e.g. My React app re-renders forever when I fetch data. Exam on recursion next week."
					></textarea>
				</label>

				<fieldset class="field">
					<legend class="field__label">Video platform</legend>
					<div class="chips">
						{#each meetingPlatforms as p (p)}
							<label class="chip">
								<input type="radio" name="platform" value={p} bind:group={details.platform} />
								<span>{p}</span>
							</label>
						{/each}
					</div>
				</fieldset>

				<div class="actions">
					<button type="button" class="btn btn--ghost" onclick={() => goto(1)}>← time</button>
					<button type="submit" class="btn btn--solid">continue →</button>
				</div>
			</form>
		{:else if step === 3 && slot}
			<!-- ─────────────────────────────── 3 · PAY & SEND -->
			<h2 class="panel__title" tabindex="-1">Pay &amp; send your request</h2>

			<dl class="summary">
				<div class="summary__head">
					<span>your session</span>
					<button type="button" class="summary__edit" onclick={() => goto(1)}>change</button>
				</div>
				<div><dt>when</dt><dd>{fmt.long(slot.start)}, {fmt.time(slot.start)} <span class="muted">({zoneLabel})</span></dd></div>
				<div><dt>topic</dt><dd>{details.topic}</dd></div>
				<div><dt>on</dt><dd>{details.platform}</dd></div>
				<div><dt>total</dt><dd class="summary__price">${session.price}</dd></div>
			</dl>

			{#if methods.length === 0}
				<p class="notice">
					Payment details will come with my confirmation email — just send the request below.
				</p>
			{:else}
				<fieldset class="field">
					<legend class="field__label">1 · Pay ${session.price} with</legend>
					<div class="methods">
						{#each methods as m (m.id)}
							<label class="method" class:method--on={methodId === m.id}>
								<input type="radio" name="method" value={m.id} bind:group={methodId} onchange={() => playSound('tick', 0.18)} />
								<span class="method__name">{m.label}</span>
								<span class="method__handle">{m.handle}</span>
							</label>
						{/each}
					</div>
				</fieldset>

				{#if method}
					<div class="paybox">
						<p class="paybox__hint">{method.hint}</p>
						{#if method.href}
							<a class="btn btn--solid btn--block" href={method.href} target="_blank" rel="noopener noreferrer" onclick={() => playSound('pop', 0.2)}>
								pay ${session.price} on {method.label} ↗
							</a>
						{:else}
							<div class="copyrow">
								<code>{method.handle}</code>
								<button type="button" class="btn btn--ghost" onclick={() => copy(method.handle, 'Zelle info')}>copy</button>
							</div>
						{/if}
						<div class="copyrow copyrow--note">
							<span class="muted">note:</span> <code>{paymentNote(slot)}</code>
							<button type="button" class="linkbtn" onclick={() => copy(paymentNote(slot!), 'Note')}>copy</button>
						</div>
						<label class="check">
							<input type="checkbox" bind:checked={paid} />
							<span>I've sent the payment</span>
						</label>
					</div>
				{/if}
			{/if}

			<div class="field">
				<p class="field__label">{methods.length ? '2 · ' : ''}Send the request</p>
				<a
					class="btn btn--solid btn--block btn--lg"
					class:btn--disabled={methods.length > 0 && !method}
					aria-disabled={methods.length > 0 && !method}
					href={methods.length > 0 && !method ? undefined : mailtoHref(subject, body)}
					onclick={sendRequest}
				>
					✉ send booking request
				</a>
				<p class="panel__hint panel__hint--center">
					{#if methods.length > 0 && !method}
						Choose how you'll pay first.
					{:else}
						Opens your email app with everything filled in — just hit send. I'll confirm with a meeting link.
					{/if}
				</p>
			</div>

			<div class="actions">
				<button type="button" class="btn btn--ghost" onclick={() => goto(2)}>← details</button>
			</div>
		{:else if step === 4 && slot}
			<!-- ─────────────────────────────── 4 · DONE -->
			<div class="done">
				{#key confetti}
					<div class="confetti" aria-hidden="true">
						{#each Array(18) as _, i (i)}<i style="--i:{i}"></i>{/each}
					</div>
				{/key}
				<h2 class="panel__title" tabindex="-1">Request ready to send ✓</h2>
				<p class="panel__hint">
					Once you hit send in your email app, I'll reply with a confirmation and the {details.platform} link —
					usually within a few hours.
				</p>

				<div class="done__card">
					<p class="done__when">{fmt.long(slot.start)}</p>
					<p class="done__time">{fmt.time(slot.start)} – {fmt.time(slot.end)} <span class="muted">{zoneLabel}</span></p>
					<p class="muted">{details.topic} · {details.platform}</p>
				</div>

				<div class="done__actions">
					<a class="btn btn--ghost" href={googleCalendarHref(slot, details)} target="_blank" rel="noopener noreferrer">+ Google Calendar</a>
					<button type="button" class="btn btn--ghost" onclick={downloadIcs}>+ Apple / Outlook (.ics)</button>
				</div>

				<details class="fallback">
					<summary>Email app didn't open?</summary>
					<p class="panel__hint">Copy this and send it to <strong>{tutor.email}</strong>:</p>
					<pre class="fallback__body">{subject}

{body}</pre>
					<div class="done__actions">
						<button type="button" class="btn btn--ghost" onclick={() => copy(`${subject}\n\n${body}`, 'Request')}>copy request</button>
						<button type="button" class="btn btn--ghost" onclick={() => copy(tutor.email, 'Email')}>copy my email</button>
					</div>
				</details>

				<button type="button" class="linkbtn" onclick={startOver}>book another session</button>
			</div>
		{/if}
	</section>
</div>

<style>
	.book {
		max-width: 52rem;
		margin: 0 auto;
		padding: clamp(1.25rem, 4vw, 2.5rem) clamp(1rem, 4vw, 2rem) 1rem;
	}

	.back {
		color: var(--muter);
		font-size: 0.82rem;
		text-decoration: none;
	}

	.back:hover {
		color: var(--accent-text);
	}

	.book__title {
		margin-top: 0.9rem;
		font-size: clamp(1.6rem, 4vw, 2.2rem);
		letter-spacing: -0.02em;
	}

	.book__lead {
		margin-top: 0.4rem;
		color: var(--muted);
		font-size: 0.92rem;
	}

	/* ── Progress ─────────────────────────────────────── */
	.progress {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.35rem;
		margin: 1.5rem 0 1rem;
		list-style: none;
	}

	.progress__step {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-top: 0.6rem;
		border-top: 2px solid var(--border);
		color: var(--muter);
		font-size: 0.78rem;
	}

	.progress__step--current {
		border-color: var(--accent);
		color: var(--text);
	}

	.progress__step--done {
		border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
		color: var(--accent-text);
	}

	.progress__num {
		display: grid;
		place-items: center;
		width: 1.4rem;
		height: 1.4rem;
		flex-shrink: 0;
		border: 1px solid currentColor;
		font-size: 0.7rem;
	}

	/* ── Panel ────────────────────────────────────────── */
	.panel {
		padding: clamp(1.1rem, 3vw, 1.75rem);
		border: 1px solid var(--border);
		background: var(--panel);
		scroll-margin-top: 5rem;
	}

	.panel__title {
		font-size: 1.2rem;
		outline: none;
	}

	.panel__hint {
		margin-top: 0.35rem;
		color: var(--muted);
		font-size: 0.86rem;
		line-height: 1.6;
	}

	.panel__hint--center {
		text-align: center;
		margin-top: 0.6rem;
	}

	.panel__hint strong {
		color: var(--text);
	}

	.muted {
		color: var(--muter);
	}

	/* ── Days / times ─────────────────────────────────── */
	.days {
		display: flex;
		gap: 0.45rem;
		margin: 1.25rem -0.25rem 0;
		padding: 0.25rem 0.25rem 0.75rem;
		overflow-x: auto;
		scroll-snap-type: x proximity;
		scrollbar-width: thin;
	}

	.day {
		display: grid;
		justify-items: center;
		gap: 0.1rem;
		flex: 0 0 4.6rem;
		padding: 0.6rem 0.3rem;
		border: 1px solid var(--border);
		background: var(--panel-2);
		color: var(--muted);
		font: inherit;
		cursor: pointer;
		scroll-snap-align: start;
		transition: border-color 0.14s, background-color 0.14s, transform 0.14s;
	}

	.day:hover {
		border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
	}

	.day[aria-selected='true'] {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, var(--panel));
		color: var(--text);
		transform: translateY(-2px);
	}

	.day__wd,
	.day__mo {
		font-size: 0.7rem;
		text-transform: lowercase;
	}

	.day__num {
		color: var(--text);
		font-size: 1.35rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.day__count {
		margin-top: 0.2rem;
		color: var(--accent-text);
		font-size: 0.64rem;
	}

	.times__label {
		margin: 1rem 0 0.6rem;
		color: var(--muted);
		font-size: 0.84rem;
		font-weight: 400;
	}

	.times {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
		gap: 0.45rem;
	}

	.time {
		min-height: 2.9rem;
		border: 1px solid var(--border);
		background: var(--panel);
		color: var(--text);
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		transition: border-color 0.14s, background-color 0.14s;
	}

	.time:hover {
		border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
	}

	.time[aria-selected='true'] {
		border-color: var(--accent);
		background: var(--accent);
		color: #04130f;
		font-weight: 700;
	}

	:global([data-theme='light']) .time[aria-selected='true'] {
		background: var(--accent-text);
		border-color: var(--accent-text);
		color: #fff;
	}

	.empty {
		display: grid;
		justify-items: start;
		gap: 0.8rem;
		margin-top: 1.25rem;
		color: var(--muted);
	}

	/* ── Actions (sticky on phones) ───────────────────── */
	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-top: 1.5rem;
		padding-top: 1.1rem;
		border-top: 1px solid var(--border-2);
	}

	.actions__summary {
		color: var(--muted);
		font-size: 0.86rem;
	}

	.actions__summary strong {
		color: var(--text);
	}

	/* ── Buttons ──────────────────────────────────────── */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		min-height: 2.75rem;
		padding: 0 1.1rem;
		border: 1px solid var(--border);
		background: var(--panel);
		color: var(--text);
		font: inherit;
		font-size: 0.9rem;
		text-decoration: none;
		cursor: pointer;
		transition: background-color 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
	}

	.btn--lg {
		min-height: 3.25rem;
		font-size: 0.98rem;
	}

	.btn--block {
		width: 100%;
	}

	.btn--ghost:hover {
		border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
		color: var(--accent-text);
	}

	.btn--solid {
		border-color: var(--accent);
		background: var(--accent);
		color: #04130f;
		font-weight: 700;
	}

	.btn--solid:hover {
		background: color-mix(in srgb, var(--accent) 85%, #fff);
	}

	:global([data-theme='light']) .btn--solid {
		border-color: var(--accent-text);
		background: var(--accent-text);
		color: #fff;
	}

	:global([data-theme='light']) .btn--solid:hover {
		background: var(--clr-primary-a30);
	}

	.btn:disabled,
	.btn--disabled {
		opacity: 0.4;
		cursor: not-allowed;
		pointer-events: none;
	}

	.linkbtn {
		border: 0;
		background: none;
		padding: 0.3rem;
		color: var(--accent-text);
		font: inherit;
		font-size: 0.82rem;
		text-decoration: underline;
		cursor: pointer;
	}

	/* ── Form ─────────────────────────────────────────── */
	.form {
		display: grid;
		gap: 1.15rem;
		margin-top: 1.25rem;
	}

	.field {
		display: grid;
		gap: 0.45rem;
		margin-top: 1.25rem;
		border: 0;
		min-width: 0;
	}

	.form .field {
		margin-top: 0;
	}

	.field__label {
		padding: 0;
		color: var(--muted);
		font-size: 0.8rem;
	}

	.field__label em {
		color: var(--muter);
		font-style: normal;
	}

	input[type='text'],
	input[type='email'],
	textarea {
		width: 100%;
		padding: 0.75rem 0.85rem;
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--text);
		font: inherit;
		/* 16px floor so iOS doesn't zoom into the field. */
		font-size: max(16px, 0.9rem);
		resize: vertical;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
	}

	[aria-invalid='true'] {
		border-color: var(--hot);
	}

	.field__err {
		color: var(--hot);
		font-size: 0.78rem;
	}

	:global([data-theme='light']) .field__err {
		color: #b42318;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.chip input,
	.method input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.chip span {
		display: inline-flex;
		align-items: center;
		min-height: 2.5rem;
		padding: 0 0.85rem;
		border: 1px solid var(--border);
		color: var(--muted);
		font-size: 0.84rem;
		cursor: pointer;
	}

	.chip input:checked + span {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--accent-text);
	}

	.chip input:focus-visible + span,
	.method:focus-within {
		outline: 2px solid var(--focus-ring);
		outline-offset: 2px;
	}

	/* ── Summary / pay ────────────────────────────────── */
	.summary {
		display: grid;
		gap: 0.45rem;
		margin-top: 1.1rem;
		padding: 1rem 1.1rem;
		border: 1px solid var(--border-2);
		background: var(--panel-2);
		font-size: 0.88rem;
	}

	.summary div {
		display: grid;
		grid-template-columns: 4.5rem 1fr;
	}

	.summary dt {
		color: var(--muter);
	}

	.summary__price {
		font-weight: 700;
	}

	.summary .summary__head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.2rem;
		color: var(--muter);
		font-size: 0.74rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.summary__edit {
		border: 0;
		background: none;
		color: var(--accent-text);
		font: inherit;
		font-size: 0.8rem;
		letter-spacing: 0;
		text-transform: none;
		text-decoration: underline;
		cursor: pointer;
		padding: 0.3rem;
	}

	.notice {
		margin-top: 1.1rem;
		padding: 0.85rem 1rem;
		border-left: 2px solid var(--accent);
		background: color-mix(in srgb, var(--accent) 7%, transparent);
		color: var(--muted);
		font-size: 0.88rem;
	}

	.methods {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(6.75rem, 1fr));
		gap: 0.5rem;
	}

	.method {
		position: relative;
		display: grid;
		gap: 0.15rem;
		padding: 0.8rem 0.9rem;
		border: 1px solid var(--border);
		cursor: pointer;
	}

	.method--on {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}

	.method__name {
		color: var(--text);
		font-weight: 700;
	}

	.method__handle {
		color: var(--muter);
		font-size: 0.78rem;
		overflow-wrap: anywhere;
	}

	.paybox {
		display: grid;
		gap: 0.75rem;
		margin-top: 0.75rem;
		padding: 1rem;
		border: 1px dashed color-mix(in srgb, var(--accent) 40%, var(--border));
	}

	.paybox__hint {
		color: var(--muted);
		font-size: 0.84rem;
	}

	.copyrow {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.copyrow code {
		flex: 1;
		min-width: 0;
		padding: 0.6rem 0.75rem;
		overflow-wrap: anywhere;
	}

	.copyrow--note {
		font-size: 0.8rem;
	}

	.copyrow--note code {
		padding: 0.25rem 0.45rem;
	}

	.check {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-height: 2.75rem;
		color: var(--text);
		font-size: 0.9rem;
		cursor: pointer;
	}

	.check input {
		width: 1.15rem;
		height: 1.15rem;
		accent-color: var(--accent);
	}

	/* ── Done ─────────────────────────────────────────── */
	.done {
		position: relative;
		display: grid;
		justify-items: center;
		gap: 1rem;
		text-align: center;
	}

	.done__card {
		width: 100%;
		max-width: 24rem;
		padding: 1.1rem;
		border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--border));
		background: color-mix(in srgb, var(--accent) 6%, var(--panel));
	}

	.done__when {
		color: var(--accent-text);
		font-size: 0.82rem;
		text-transform: lowercase;
	}

	.done__time {
		margin: 0.2rem 0;
		font-size: 1.35rem;
		font-weight: 700;
	}

	.done__actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
	}

	.fallback {
		width: 100%;
		text-align: left;
		border: 1px solid var(--border-2);
		padding: 0.25rem 1rem;
	}

	.fallback summary {
		min-height: 2.75rem;
		display: flex;
		align-items: center;
		color: var(--muted);
		font-size: 0.86rem;
		cursor: pointer;
	}

	.fallback__body {
		margin: 0.6rem 0;
		max-height: 16rem;
		overflow: auto;
		white-space: pre-wrap;
		font-size: 0.76rem;
	}

	.fallback .done__actions {
		justify-content: flex-start;
		margin-bottom: 0.75rem;
	}

	.confetti {
		position: absolute;
		top: 1rem;
		left: 50%;
		pointer-events: none;
	}

	.confetti i {
		--a: calc(var(--i) * 20deg);
		position: absolute;
		width: 0.45rem;
		height: 0.7rem;
		background: var(--accent);
		opacity: 0;
		animation: burst 1.1s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
		animation-delay: calc(var(--i) * 8ms);
	}

	.confetti i:nth-child(3n) {
		background: var(--accent-2);
	}

	.confetti i:nth-child(4n) {
		background: var(--hot);
	}

	@keyframes burst {
		0% {
			opacity: 1;
			transform: rotate(var(--a)) translateY(0) rotate(0);
		}
		100% {
			opacity: 0;
			transform: rotate(var(--a)) translateY(-9rem) rotate(540deg);
		}
	}

	/* ── Skeleton ─────────────────────────────────────── */
	.skeleton__row,
	.skeleton__grid div {
		background: linear-gradient(90deg, var(--panel-2), var(--border-2), var(--panel-2));
		background-size: 200% 100%;
		animation: shimmer 1.2s linear infinite;
	}

	.skeleton__row {
		height: 5.5rem;
		margin-bottom: 1rem;
	}

	.skeleton__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
		gap: 0.45rem;
	}

	.skeleton__grid div {
		height: 2.9rem;
	}

	@keyframes shimmer {
		to {
			background-position: -200% 0;
		}
	}

	/* ── Phones ───────────────────────────────────────── */
	@media (max-width: 640px) {
		.progress__label {
			display: none;
		}

		.progress__step--current .progress__label {
			display: inline;
		}

		.panel {
			margin-inline: -1rem;
			border-inline: 0;
		}

		.times {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		/* The primary action stays under the thumb instead of below a long list of times. */
		.actions {
			position: sticky;
			bottom: 0;
			z-index: 5;
			margin-inline: -1.1rem;
			margin-bottom: -1.1rem;
			padding: 0.75rem 1.1rem calc(0.75rem + env(safe-area-inset-bottom));
			background: var(--panel);
			box-shadow: 0 -12px 24px -16px color-mix(in srgb, #000 55%, transparent);
		}

		.actions .btn--solid {
			flex: 1 0 auto;
		}

		.actions__summary {
			font-size: 0.78rem;
		}

		.summary div {
			grid-template-columns: 3.75rem 1fr;
		}

		/* One row per method: three columns broke handles mid-word ("@mariobelm / onte"). */
		.methods {
			grid-template-columns: 1fr;
		}

		.method {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 0.75rem;
			min-height: 3.25rem;
		}

		.method__handle {
			overflow-wrap: normal;
			white-space: nowrap;
		}
	}
</style>
