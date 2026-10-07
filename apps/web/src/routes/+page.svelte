<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import WaveCheckeredBackground from '$lib/components/WaveCheckeredBackground.svelte';
	import SessionDemo from '$lib/components/SessionDemo.svelte';
	import { faq, payments, resources, session, sessionFeatures, steps, subjects, tutor } from '$lib/data/tutor';
	import { fmt, generateSlots, relativeDay, type Slot } from '$lib/schedule';
	import { playSound } from '$lib/sound';

	// Computed after mount: the page is prerendered, and "next open slot" depends on the moment it is viewed.
	let nextSlot = $state<Slot | null>(null);
	let openCount = $state(0);
	let ready = $state(false);

	onMount(() => {
		const slots = generateSlots();
		nextSlot = slots[0] ?? null;
		const weekAhead = Date.now() + 7 * 86_400_000;
		openCount = slots.filter((s) => s.start.getTime() < weekAhead).length;
		ready = true;
	});

	const payLabels = [
		payments.venmo && 'Venmo',
		payments.cashApp && 'Cash App',
		payments.zelle && 'Zelle'
	].filter(Boolean) as string[];
	const payList = payLabels.length ? payLabels : ['Venmo', 'Cash App', 'Zelle'];

	const bookHref = (topic?: string) => `${base}/book/${topic ? `?topic=${encodeURIComponent(topic)}` : ''}`;
</script>

<!-- ═══════════════════════════════════════════════ HERO -->
<section class="hero" aria-labelledby="hero-title">
	<div class="hero__bg" aria-hidden="true"><WaveCheckeredBackground /></div>

	<div class="hero__inner">
		<div class="hero__copy">
			<p class="eyebrow">
				<span class="eyebrow__dot" aria-hidden="true"></span>
				{#if ready && nextSlot}
					next open slot · <strong>{relativeDay(nextSlot.start)}, {fmt.time(nextSlot.start)}</strong>
				{:else if ready}
					fully booked right now — email me
				{:else}
					{tutor.tagline.toLowerCase()}
				{/if}
			</p>
			<h1 id="hero-title" class="hero__title">
				Learn code, circuits &amp; system design <span class="hero__accent">with a CMU engineer.</span>
			</h1>
			<p class="hero__desc">{tutor.description}</p>

			<div class="hero__actions">
				<a href={bookHref()} class="btn btn--solid btn--lg">book a session →</a>
				<a href="#subjects" class="btn btn--ghost btn--lg">what I teach</a>
			</div>

			<ul class="hero__facts" aria-label="At a glance">
				<li><strong>${session.price}</strong> / hour</li>
				<li><strong>{session.minutes}</strong> min live</li>
				<li>pay with {payList.join(' · ')}</li>
			</ul>
		</div>

		<div class="hero__demo">
			<SessionDemo />
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ CREDIBILITY STRIP -->
<section class="strip" aria-label="Background">
	<ul class="strip__list">
		<li><span class="strip__k">edu</span> Carnegie Mellon · B.S. ECE</li>
		<li><span class="strip__k">built</span> 35+ projects, embedded → full-stack</li>
		<li><span class="strip__k">style</span> live, hands-on, your code</li>
	</ul>
</section>

<!-- ═══════════════════════════════════════════════ SUBJECTS -->
<section class="section" id="subjects" aria-labelledby="subjects-title">
	<div class="section__inner">
		<header class="section__head">
			<h2 id="subjects-title" class="kicker">what I teach</h2>
			<p class="section__lead">Tap a topic to start a booking for it.</p>
		</header>
		<div class="subjects">
			{#each subjects as subject (subject.title)}
				<a class="card subject" href={bookHref(subject.title)} onclick={() => playSound('click', 0.18)}>
					<span class="subject__icon" aria-hidden="true">{subject.icon}</span>
					<h3 class="subject__title">{subject.title}</h3>
					<p class="subject__desc">{subject.description}</p>
					<ul class="tags" aria-label="Includes">
						{#each subject.tags as tag (tag)}<li class="tag">{tag}</li>{/each}
					</ul>
					<span class="subject__cta">book this <span aria-hidden="true">→</span></span>
				</a>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ HOW IT WORKS -->
<section class="section section--alt" id="how-it-works" aria-labelledby="how-title">
	<div class="section__inner">
		<header class="section__head">
			<h2 id="how-title" class="kicker">how it works</h2>
			<p class="section__lead">No accounts, no card forms. About a minute, start to finish.</p>
		</header>
		<ol class="steps">
			{#each steps as step (step.number)}
				<li class="step">
					<span class="step__num" aria-hidden="true">{step.number}</span>
					<h3 class="step__title">{step.title}</h3>
					<p class="step__desc">{step.description}</p>
				</li>
			{/each}
		</ol>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ PRICING -->
<section class="section" id="pricing" aria-labelledby="pricing-title">
	<div class="section__inner pricing">
		<div class="pricing__copy">
			<h2 id="pricing-title" class="kicker">pricing</h2>
			<p class="pricing__big">One price. No packages, no subscriptions.</p>
			<p class="section__lead">
				First session comes with a guarantee — if it wasn't useful, I'll refund it. Reschedule free
				with 24 hours' notice.
			</p>
			{#if ready}
				<p class="pricing__avail">
					<span class="eyebrow__dot" aria-hidden="true"></span>
					{openCount} open slot{openCount === 1 ? '' : 's'} in the next 7 days
				</p>
			{/if}
		</div>

		<div class="card price-card">
			<p class="price-card__name">single session</p>
			<p class="price-card__price"><span class="price-card__amount">${session.price}</span> / {session.minutes} min</p>
			<ul class="price-card__features">
				{#each sessionFeatures as feature (feature)}
					<li><span aria-hidden="true">✓</span> {feature}</li>
				{/each}
			</ul>
			<a class="btn btn--solid btn--block btn--lg" href={bookHref()}>pick a time →</a>
			<ul class="paychips" aria-label="Payment options">
				{#each payList as p (p)}<li class="paychip">{p}</li>{/each}
			</ul>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ FAQ -->
<section class="section section--alt" id="faq" aria-labelledby="faq-title">
	<div class="section__inner section__inner--narrow">
		<header class="section__head">
			<h2 id="faq-title" class="kicker">faq</h2>
		</header>
		<!-- Native <details>: keyboard, screen readers and find-in-page all work without any script. -->
		<div class="faq">
			{#each faq as item (item.question)}
				<details class="faq__item">
					<summary class="faq__q">{item.question}<span class="faq__icon" aria-hidden="true"></span></summary>
					<p class="faq__a">{item.answer}</p>
				</details>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ RESOURCES -->
<section class="section" id="resources" aria-labelledby="resources-title">
	<div class="section__inner">
		<header class="section__head">
			<h2 id="resources-title" class="kicker">free resources</h2>
			<p class="section__lead">Things I point students to between sessions.</p>
		</header>
		<div class="resources">
			{#each resources as resource (resource.url)}
				<a class="card resource" href={resource.url} target="_blank" rel="noreferrer noopener">
					<h3 class="resource__title">{resource.title} <span aria-hidden="true">↗</span></h3>
					<p class="resource__desc">{resource.description}</p>
				</a>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ CTA -->
<section class="cta" aria-labelledby="cta-title">
	<div class="cta__inner">
		<h2 id="cta-title" class="cta__title">Stuck on something? Let's fix it together.</h2>
		<a href={bookHref()} class="btn btn--solid btn--lg">book a session →</a>
		<p class="cta__note">
			Questions first? <a href="mailto:{tutor.email}">{tutor.email}</a>
		</p>
	</div>
</section>

<style>
	/* ── Hero ─────────────────────────────────────────── */
	.hero {
		position: relative;
		overflow: hidden;
		border-bottom: 1px solid var(--border-2);
	}

	.hero__bg {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.hero__inner {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
		align-items: center;
		gap: clamp(2rem, 5vw, 4rem);
		max-width: 76rem;
		margin: 0 auto;
		padding: clamp(3rem, 7vw, 5.5rem) clamp(1rem, 4vw, 3rem);
	}

	.eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		margin-bottom: 1.25rem;
		padding: 0.35rem 0.75rem;
		border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--border));
		background: color-mix(in srgb, var(--accent) 7%, var(--panel));
		color: var(--muted);
		font-size: 0.78rem;
	}

	.eyebrow strong {
		color: var(--accent-text);
		font-weight: 600;
	}

	.eyebrow__dot {
		width: 0.5rem;
		height: 0.5rem;
		flex-shrink: 0;
		border-radius: 50%;
		background: var(--cool);
		box-shadow: 0 0 0 0 color-mix(in srgb, var(--cool) 60%, transparent);
		animation: ping 2.2s ease-out infinite;
	}

	@keyframes ping {
		70% {
			box-shadow: 0 0 0 0.45rem color-mix(in srgb, var(--cool) 0%, transparent);
		}
		100% {
			box-shadow: 0 0 0 0 color-mix(in srgb, var(--cool) 0%, transparent);
		}
	}

	.hero__title {
		font-size: clamp(1.75rem, 4.2vw, 2.9rem);
		line-height: 1.15;
		letter-spacing: -0.02em;
		color: var(--text);
	}

	.hero__accent {
		color: var(--accent-text);
	}

	.hero__desc {
		margin-top: 1.1rem;
		max-width: 58ch;
		color: var(--muted);
		font-size: 0.98rem;
		line-height: 1.7;
	}

	.hero__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		margin-top: 1.75rem;
	}

	.hero__facts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.25rem;
		margin-top: 1.5rem;
		list-style: none;
		color: var(--muter);
		font-size: 0.82rem;
	}

	.hero__facts strong {
		color: var(--text);
	}

	.hero__facts li {
		padding-left: 0.75rem;
		border-left: 1px solid var(--border);
	}

	.hero__facts li:first-child {
		padding-left: 0;
		border-left: 0;
	}

	/* Light mode: the dark-mode legibility tricks are off; the canvas fades to the page itself. */
	:global([data-theme='light']) .hero {
		background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 7%, var(--bg)), var(--bg));
	}

	/* ── Buttons ──────────────────────────────────────── */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding: 0 1.1rem;
		border: 1px solid var(--border);
		font-size: 0.9rem;
		text-decoration: none;
		transition: background-color 0.15s, border-color 0.15s, color 0.15s, transform 0.15s;
	}

	.btn--lg {
		min-height: 3rem;
		padding: 0 1.4rem;
		font-size: 0.95rem;
	}

	.btn--block {
		width: 100%;
	}

	.btn--solid {
		border-color: var(--accent);
		background: var(--accent);
		color: #04130f;
		font-weight: 700;
	}

	.btn--solid:hover {
		background: color-mix(in srgb, var(--accent) 85%, #fff);
		transform: translateY(-1px);
	}

	:global([data-theme='light']) .btn--solid {
		border-color: var(--accent-text);
		background: var(--accent-text);
		color: #fff;
		box-shadow: 0 8px 20px -10px color-mix(in srgb, var(--accent-text) 70%, transparent);
	}

	:global([data-theme='light']) .btn--solid:hover {
		background: var(--clr-primary-a30);
	}

	.btn--ghost {
		background: var(--panel);
		color: var(--text);
	}

	.btn--ghost:hover {
		border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
		color: var(--accent-text);
	}

	/* ── Strip ────────────────────────────────────────── */
	.strip {
		border-bottom: 1px solid var(--border-2);
		background: var(--panel-2);
	}

	.strip__list {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem 2.5rem;
		max-width: 76rem;
		margin: 0 auto;
		padding: 1rem clamp(1rem, 4vw, 3rem);
		list-style: none;
		color: var(--muted);
		font-size: 0.84rem;
	}

	.strip__k {
		margin-right: 0.5rem;
		color: var(--accent-text);
	}

	.strip__k::after {
		content: ':';
	}

	/* ── Sections ─────────────────────────────────────── */
	.section {
		padding: clamp(3rem, 7vw, 5rem) clamp(1rem, 4vw, 3rem);
		scroll-margin-top: 4rem;
	}

	.section--alt {
		background: var(--panel-2);
		border-block: 1px solid var(--border-2);
	}

	.section__inner {
		max-width: 76rem;
		margin: 0 auto;
	}

	.section__inner--narrow {
		max-width: 48rem;
	}

	.section__head {
		margin-bottom: 1.75rem;
	}

	.kicker {
		margin-bottom: 0.4rem;
		color: var(--accent-text);
		font-size: 0.78rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.section__lead {
		max-width: 60ch;
		color: var(--muted);
		font-size: 0.95rem;
		line-height: 1.65;
	}

	.card {
		border: 1px solid var(--border);
		background: var(--panel);
	}

	/* ── Subjects ─────────────────────────────────────── */
	.subjects {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 21rem), 1fr));
		gap: 1rem;
	}

	.subject {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		padding: 1.35rem;
		color: inherit;
		text-decoration: none;
		transition: border-color 0.16s, transform 0.16s;
	}

	.subject:hover {
		border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
		transform: translateY(-2px);
	}

	.subject__icon {
		display: grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--border));
		background: color-mix(in srgb, var(--accent) 8%, transparent);
		color: var(--accent-text);
		font-size: 1rem;
	}

	.subject__title {
		font-size: 1rem;
		color: var(--text);
	}

	.subject__desc {
		color: var(--muted);
		font-size: 0.86rem;
		line-height: 1.6;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		list-style: none;
		margin-top: auto;
	}

	.tag {
		padding: 0.15rem 0.45rem;
		border: 1px solid var(--border-2);
		color: var(--muter);
		font-size: 0.7rem;
	}

	.subject__cta {
		color: var(--accent-text);
		font-size: 0.82rem;
	}

	.subject:hover .subject__cta span {
		display: inline-block;
		transform: translateX(3px);
		transition: transform 0.16s;
	}

	/* ── Steps ────────────────────────────────────────── */
	.steps {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
		list-style: none;
		counter-reset: step;
	}

	.step {
		position: relative;
		padding: 1.4rem;
		border: 1px solid var(--border);
		background: var(--panel);
	}

	.step__num {
		display: block;
		margin-bottom: 0.75rem;
		color: color-mix(in srgb, var(--accent) 55%, transparent);
		font-size: 1.9rem;
		font-weight: 700;
		line-height: 1;
	}

	.step__title {
		margin-bottom: 0.45rem;
		font-size: 1rem;
	}

	.step__desc {
		color: var(--muted);
		font-size: 0.86rem;
		line-height: 1.6;
	}

	/* ── Pricing ──────────────────────────────────────── */
	.pricing {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 24rem);
		gap: clamp(1.5rem, 5vw, 4rem);
		align-items: center;
	}

	.pricing__big {
		margin: 0.4rem 0 0.9rem;
		font-size: clamp(1.35rem, 3vw, 1.9rem);
		font-weight: 700;
		line-height: 1.25;
		color: var(--text);
	}

	.pricing__avail {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		margin-top: 1.25rem;
		color: var(--muted);
		font-size: 0.84rem;
	}

	.price-card {
		padding: 1.6rem;
		border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 12%, transparent),
			0 24px 60px -30px color-mix(in srgb, var(--accent) 45%, transparent);
	}

	.price-card__name {
		color: var(--muter);
		font-size: 0.76rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.price-card__price {
		margin: 0.3rem 0 1.1rem;
		color: var(--muted);
	}

	.price-card__amount {
		color: var(--text);
		font-size: 2.6rem;
		font-weight: 700;
		letter-spacing: -0.03em;
	}

	.price-card__features {
		display: grid;
		gap: 0.55rem;
		margin-bottom: 1.4rem;
		list-style: none;
		color: var(--muted);
		font-size: 0.88rem;
	}

	.price-card__features span {
		margin-right: 0.4rem;
		color: var(--accent-text);
	}

	.paychips {
		display: flex;
		justify-content: center;
		gap: 0.4rem;
		margin-top: 0.9rem;
		list-style: none;
	}

	.paychip {
		padding: 0.2rem 0.55rem;
		border: 1px solid var(--border-2);
		color: var(--muter);
		font-size: 0.72rem;
	}

	/* ── FAQ ──────────────────────────────────────────── */
	.faq {
		border: 1px solid var(--border);
		background: var(--panel);
	}

	.faq__item + .faq__item {
		border-top: 1px solid var(--border-2);
	}

	.faq__q {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		min-height: 3.25rem;
		padding: 0.85rem 1.15rem;
		color: var(--text);
		font-size: 0.92rem;
		cursor: pointer;
		list-style: none;
	}

	.faq__q::-webkit-details-marker {
		display: none;
	}

	.faq__q:hover {
		color: var(--accent-text);
	}

	.faq__icon {
		position: relative;
		flex-shrink: 0;
		width: 0.75rem;
		height: 0.75rem;
	}

	.faq__icon::before,
	.faq__icon::after {
		content: '';
		position: absolute;
		inset: 50% 0 auto;
		height: 1.5px;
		background: currentColor;
		transition: transform 0.2s ease;
	}

	.faq__icon::after {
		transform: rotate(90deg);
	}

	.faq__item[open] .faq__icon::after {
		transform: rotate(0);
	}

	.faq__item[open] .faq__q {
		color: var(--accent-text);
	}

	.faq__a {
		padding: 0 1.15rem 1.1rem;
		color: var(--muted);
		font-size: 0.88rem;
		line-height: 1.7;
	}

	/* ── Resources ────────────────────────────────────── */
	.resources {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
		gap: 1rem;
	}

	.resource {
		padding: 1.25rem;
		color: inherit;
		text-decoration: none;
	}

	.resource:hover {
		border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
	}

	.resource__title {
		margin-bottom: 0.4rem;
		font-size: 0.98rem;
		color: var(--accent-text);
	}

	.resource__desc {
		color: var(--muted);
		font-size: 0.86rem;
		line-height: 1.6;
	}

	/* ── CTA ──────────────────────────────────────────── */
	.cta {
		padding: clamp(3rem, 7vw, 5rem) clamp(1rem, 4vw, 3rem);
		border-top: 1px solid var(--border-2);
		background: radial-gradient(ellipse 60% 120% at 50% 100%, color-mix(in srgb, var(--accent) 12%, transparent), transparent);
	}

	.cta__inner {
		display: grid;
		justify-items: center;
		gap: 1.25rem;
		max-width: 40rem;
		margin: 0 auto;
		text-align: center;
	}

	.cta__title {
		font-size: clamp(1.4rem, 3.4vw, 2rem);
		line-height: 1.25;
	}

	.cta__note {
		color: var(--muter);
		font-size: 0.84rem;
	}

	/* ── Responsive ───────────────────────────────────── */
	@media (max-width: 899px) {
		.hero__inner {
			grid-template-columns: 1fr;
			padding-top: 2.25rem;
		}

		.steps {
			grid-template-columns: 1fr;
		}

		.pricing {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.eyebrow {
			font-size: 0.74rem;
		}

		.hero__desc {
			font-size: 0.9rem;
		}

		.hero__actions .btn {
			flex: 1 1 100%;
		}

		.hero__facts {
			gap: 0.3rem 0.75rem;
		}

		.hero__facts li:last-child {
			flex-basis: 100%;
			padding-left: 0;
			border-left: 0;
		}


		.strip__list {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.4rem;
		}

		.subject,
		.step,
		.price-card {
			padding: 1.15rem;
		}

		.subject:hover {
			transform: none;
		}
	}
</style>
