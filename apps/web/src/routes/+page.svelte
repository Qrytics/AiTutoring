<script lang="ts">
	import { base } from '$app/paths';
	import WaveCheckeredBackground from '$lib/components/WaveCheckeredBackground.svelte';
	import { tutor, subjects, resources, pricingTiers, steps, faq } from '$lib/data/tutor';

	let toastVisible = $state(false);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	// FAQ accordion state — tracks which item is open
	let openFaqIndex = $state<number | null>(null);

	function copyEmail() {
		navigator.clipboard.writeText(tutor.email).then(() => {
			if (toastTimer !== undefined) clearTimeout(toastTimer);
			toastVisible = true;
			toastTimer = setTimeout(() => (toastVisible = false), 2500);
		});
	}

	function toggleFaq(i: number) {
		openFaqIndex = openFaqIndex === i ? null : i;
	}
</script>

<svelte:head>
	<title>Tutoring</title>
</svelte:head>

<!-- ═══════════════════════════════════════════════ HERO -->
<section class="header" aria-label="Introduction">
	<div class="hero-background" aria-hidden="true">
		<WaveCheckeredBackground />
	</div>
	<div class="header__content">
		<h1 class="header__tagline">{tutor.tagline}</h1>
		<p class="header__description">{tutor.headline}</p>
		<p class="header__cta">{tutor.description}</p>
		<div class="header__actions">
			<a href="{base}/book" class="hero-action">book a tutoring session ↗</a>
			<a href="#pricing" class="hero-action hero-action--secondary">view pricing</a>
		</div>
		<div class="header__meta">
			<a href={tutor.github} target="_blank" rel="noopener noreferrer" class="link link__mono">
				{tutor.github.replace('https://', '')}
			</a>
			<span class="meta-sep">·</span>
			<button type="button" class="link link__mono email-copy-btn" onclick={copyEmail}>
				{tutor.email}
			</button>
			<span class="meta-sep">·</span>
			<a href={tutor.linkedin} target="_blank" rel="noopener noreferrer" class="link link__mono">
				{tutor.linkedin.replace('https://www.', '')}
			</a>
		</div>
	</div>
</section>

{#if toastVisible}
	<div class="toast" role="status" aria-live="polite">email copied to clipboard</div>
{/if}

<!-- ═══════════════════════════════════════════════ SUBJECTS -->
<section class="section" id="subjects" aria-label="Subjects">
	<div class="section__inner">
		<h2 class="section-title">what i teach</h2>
		<div class="subjects-grid">
			{#each subjects as subject}
				<div class="card subject-card">
					<span class="subject-card__icon" aria-hidden="true">{subject.icon}</span>
					<h3 class="subject-card__title">{subject.title}</h3>
					<p class="subject-card__desc">{subject.description}</p>
					<div class="subject-card__tags">
						{#each subject.tags as tag}
							<span class="tag">{tag}</span>
						{/each}
					</div>
				</div>
			{/each}
			<article class="card subject-card subject-card--project">
				<h3 class="subject-card__title">
					Learn how to make a website or create your dream project!
				</h3>
				<p class="subject-card__desc">
					I teach practical end-to-end project building: GitHub workflows (issues, pull requests,
					and GitHub Actions), deployment and CI/CD pipelines, clean file architecture, and common
					engineering practices used by real teams.
				</p>
				<p class="subject-card__desc">
					We also cover modern dev tools and AI-first workflows including VS Code, Cursor,
					Copilot, ChatGPT, Claude, Gemini, Codex, and agent-driven development.
				</p>
			</article>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ FREE RESOURCES -->
<section class="section section--alt" id="resources" aria-label="Free resources">
	<div class="section__inner">
		<h2 class="section-title">free resources</h2>
		<div class="resources-grid">
			{#each resources as resource}
				<a class="resource-card" href={resource.url} target="_blank" rel="noreferrer noopener">
					<h3 class="resource-card__title">{resource.title}</h3>
					<p class="resource-card__desc">{resource.description}</p>
					<span class="resource-card__link">Open resource →</span>
				</a>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ HOW IT WORKS -->
<section class="section section--alt" id="how-it-works" aria-label="How it works">
	<div class="section__inner">
		<h2 class="section-title">how it works</h2>
		<div class="steps-grid">
			{#each steps as step}
				<div class="step-card">
					<span class="step-card__number" aria-hidden="true">{step.number}</span>
					<h3 class="step-card__title">{step.title}</h3>
					<p class="step-card__desc">{step.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ PRICING -->
<section class="section" id="pricing" aria-label="Pricing">
	<div class="section__inner">
		<h2 class="section-title">pricing</h2>
		<p class="section-lead">Simple, transparent pricing. Book your time first, then pay.</p>
		<div class="pricing-grid">
			{#each pricingTiers as tier}
				{@const disabledTier = tier.id !== 'single'}
				<div class="pricing-card" class:pricing-card--popular={tier.popular}>
					{#if tier.popular}
						<span class="popular-badge">most popular</span>
					{/if}
					{#if disabledTier}
						<span class="coming-soon-badge">native scheduling soon</span>
					{/if}
					<div class="pricing-card__header">
						<h3 class="pricing-card__name">{tier.name}</h3>
						<div class="pricing-card__price">
							<span class="pricing-card__amount">${tier.price}</span>
							<span class="pricing-card__unit">{tier.unit}</span>
						</div>
						{#if tier.pricePerHour}
							<p class="pricing-card__per-hr">${tier.pricePerHour}/hr · saves ${tier.savings}</p>
						{/if}
					</div>
					<p class="pricing-card__desc">{tier.description}</p>
					<ul class="pricing-card__features">
						{#each tier.features as feature}
							<li><span class="feature-check" aria-hidden="true">✓</span> {feature}</li>
						{/each}
					</ul>
					<a
						class="btn btn--primary pricing-card__cta"
						href={disabledTier ? '#' : `${base}/book`}
						aria-disabled={disabledTier}
					>
						{disabledTier ? 'Coming soon' : 'Book a session'}
					</a>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ FAQ -->
<section class="section section--alt" id="faq" aria-label="FAQ">
	<div class="section__inner section__inner--narrow">
		<h2 class="section-title">faq</h2>
		<div class="faq-list">
			{#each faq as item, i}
				<div class="faq-item" class:faq-item--open={openFaqIndex === i}>
					<button
						class="faq-item__trigger"
						onclick={() => toggleFaq(i)}
						aria-expanded={openFaqIndex === i}
						aria-controls="faq-answer-{i}"
					>
						<span>{item.question}</span>
						<span class="faq-item__chevron" aria-hidden="true"
							>{openFaqIndex === i ? '−' : '+'}</span
						>
					</button>
					<div class="faq-item__answer" id="faq-answer-{i}" hidden={openFaqIndex !== i}>
						<p>{item.answer}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ BOTTOM CTA -->
<section class="section cta-section" aria-label="Call to action">
	<div class="section__inner section__inner--narrow cta-inner">
		<h2 class="cta-heading">Ready to get started?</h2>
		<p class="cta-desc">
			Pick a time that works for you and we'll get to work. First session comes with a
			satisfaction guarantee — if you don't find it useful, I'll refund it.
		</p>
		<a href="{base}/book" class="btn btn--primary btn--large">Book a Session →</a>
	</div>
</section>

<style>
	/* ── Hero ───────────────────────────────────────────── */
	.header {
		position: relative;
		margin-top: 0;
		margin-bottom: 0;
		min-height: 320px;
		z-index: 1;
	}

	.hero-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 100%;
		z-index: 0;
		pointer-events: none;
	}

	.header__content {
		position: relative;
		z-index: 1;
		padding: clamp(2rem, 4vw, 3rem) clamp(2rem, 6vw, 5rem);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		min-height: 320px;
	}

	.header__content::before {
		content: '';
		position: absolute;
		inset: 50%;
		transform: translate(-50%, -50%);
		width: min(80ch, 80%);
		height: 70%;
		background: radial-gradient(
			ellipse at center,
			rgba(0, 0, 0, 0.8) 0%,
			rgba(0, 0, 0, 0.7) 30%,
			rgba(0, 0, 0, 0.5) 60%,
			transparent 85%
		);
		filter: blur(16px);
		z-index: -1;
		pointer-events: none;
	}

	.header__tagline {
		position: relative;
		margin: 0;
		color: var(--text);
		font-size: clamp(1.4rem, 3vw, 1.85rem);
		font-weight: 700;
		max-width: 75ch;
		line-height: 1.45;
		padding-bottom: 16px;
		text-shadow: 0 0 4px #000, 0 2px 12px #000, 0 0 50px #000;
	}

	.header__tagline::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: calc(100% + 2rem);
		height: calc(100% + 0.75rem);
		background: rgba(0, 0, 0, 0.4);
		filter: blur(12px);
		z-index: -1;
		pointer-events: none;
	}

	:global([data-theme='light']) .header__content::before {
		width: min(96ch, 94%);
		height: 82%;
		background: radial-gradient(
			ellipse at center,
			rgb(255, 255, 255) 100%,
			rgba(247, 253, 251, 0.92) 90%,
			rgba(228, 247, 243, 0.58) 8%,
			rgba(210, 240, 234, 0.22) 9%,
			rgba(255, 255, 255, 0) 10%
		);
		filter: blur(100px);
	}

	:global([data-theme='light']) .header__tagline::before {
		width: calc(100% + 4.25rem);
		height: calc(100% + 1.5rem);
		background: radial-gradient(
			ellipse at center,
			rgba(255, 255, 255, 0.98) 100%,
			rgba(240, 252, 248, 0.78) 5%,
			rgba(223, 247, 241, 0.32) 8%,
			rgba(255, 255, 255, 0) 100%
		);
		filter: blur(100px);
	}

	.header__description {
		position: relative;
		margin: 1rem 0 0;
		color: var(--text);
		font-size: clamp(0.9rem, 1.7vw, 1rem);
		font-weight: 400;
		max-width: 70ch;
		line-height: 1.7;
		text-shadow: 0 0 4px #000, 0 2px 12px #000, 0 0 50px #000;
	}

	.header__cta {
		position: relative;
		margin: 0.65rem 0 0;
		color: rgba(243, 246, 255, 0.82);
		font-size: clamp(0.9rem, 1.7vw, 1rem);
		font-weight: 400;
		max-width: 70ch;
		line-height: 1.6;
		text-shadow: 0 0 4px #000, 0 2px 12px #000, 0 0 50px #000;
	}

	.header__meta {
		position: relative;
		margin: 1.25rem 0 0;
		font-size: clamp(0.95rem, 1.8vw, 1.1rem);
		text-shadow: 0 0 4px #000, 0 2px 12px #000, 0 0 50px #000;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}

	.header__actions {
		position: relative;
		margin-top: 1.15rem;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;
	}

	/* ── Buttons ────────────────────────────────────────── */
	.btn {
		display: inline-block;
		padding: 0.55rem 1.2rem;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		line-height: 1.4;
		text-decoration: none;
		cursor: pointer;
		border: 1px solid transparent;
		transition: background-color 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
	}

	.btn--primary {
		background: rgba(54, 242, 194, 0.1);
		border-color: rgba(54, 242, 194, 0.5);
		color: var(--accent);
	}

	.btn--primary:hover {
		background: rgba(54, 242, 194, 0.18);
		border-color: rgba(54, 242, 194, 0.75);
		color: var(--accent);
	}

	.btn--large {
		padding: 0.75rem 1.75rem;
		font-size: 1rem;
	}

	.btn[aria-disabled='true'] {
		opacity: 0.55;
		pointer-events: none;
	}

	.hero-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0.9rem;
		border: 1px solid rgba(54, 242, 194, 0.38);
		background: color-mix(in srgb, var(--panel) 80%, transparent);
		color: rgba(243, 246, 255, 0.96);
		font-family: var(--font-mono);
		font-size: 0.88rem;
		line-height: 1.2;
		text-decoration: none;
		letter-spacing: 0.01em;
		text-transform: lowercase;
		transition: border-color 0.16s ease, color 0.16s ease, background-color 0.16s ease,
			transform 0.16s ease;
	}

	.hero-action:hover,
	.hero-action:focus-visible {
		border-color: rgba(54, 242, 194, 0.6);
		color: var(--accent);
		background: color-mix(in srgb, var(--panel) 66%, transparent);
		transform: translateY(-1px);
	}

	.hero-action--secondary {
		border-color: var(--border);
		color: var(--muted);
	}

	.hero-action--secondary:hover,
	.hero-action--secondary:focus-visible {
		border-color: rgba(222, 232, 255, 0.3);
		color: var(--text);
	}

	:global([data-theme='light']) .hero-action {
		background: color-mix(in srgb, var(--clr-light-a0) 88%, var(--clr-primary-a0) 12%);
		border-color: color-mix(in srgb, var(--clr-primary-a0) 38%, var(--clr-surface-tonal-a10));
		color: var(--clr-primary-a40);
	}

	:global([data-theme='light']) .hero-action:hover,
	:global([data-theme='light']) .hero-action:focus-visible {
		background: color-mix(in srgb, var(--clr-light-a0) 82%, var(--clr-primary-a0) 18%);
		border-color: color-mix(in srgb, var(--clr-primary-a0) 52%, var(--clr-surface-tonal-a10));
		color: var(--clr-primary-a50);
	}

	:global([data-theme='light']) .hero-action--secondary {
		background: var(--clr-light-a0);
		border-color: var(--clr-surface-tonal-a10);
		color: var(--clr-primary-a40);
	}

	:global([data-theme='light']) .hero-action--secondary:hover,
	:global([data-theme='light']) .hero-action--secondary:focus-visible {
		background: color-mix(in srgb, var(--clr-light-a0) 92%, var(--clr-primary-a0) 8%);
		border-color: color-mix(in srgb, var(--clr-primary-a0) 32%, var(--clr-surface-tonal-a10));
		color: var(--clr-primary-a50);
	}

	.link {
		color: rgba(54, 242, 194, 0.94);
		text-decoration: none;
		border-bottom: 1px solid rgba(54, 242, 194, 0.3);
		transition: border-color 0.14s ease, color 0.14s ease;
		font-family: var(--font-mono);
	}

	.link:hover {
		color: var(--accent);
		border-color: rgba(54, 242, 194, 0.55);
	}

	.link__mono {
		color: var(--text);
	}

	.meta-sep {
		color: rgba(243, 246, 255, 0.45);
		font-family: var(--font-mono);
	}

	.email-copy-btn {
		background: none;
		border-top: none;
		border-left: none;
		border-right: none;
		padding: 0;
		font: inherit;
		cursor: pointer;
		border-bottom: 1px solid rgba(54, 242, 194, 0.3);
	}

	.email-copy-btn:focus-visible {
		outline: 2px solid rgba(54, 242, 194, 0.6);
		outline-offset: 4px;
	}

	.toast {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translate(-50%);
		background: var(--panel);
		color: rgba(243, 246, 255, 0.92);
		padding: 0.75rem 1.5rem;
		border: 1px solid var(--border);
		box-shadow: var(--shadow);
		z-index: 1000;
		text-align: center;
		max-width: calc(100vw - 2rem);
		white-space: normal;
		overflow-wrap: anywhere;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		animation: toast-in 0.2s ease-out;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translate(-50%) translateY(1rem);
		}

		to {
			opacity: 1;
			transform: translate(-50%) translateY(0);
		}
	}

	@media (max-width: 520px) {
		.meta-sep {
			display: none;
		}
	}

	/* ── Wide project CTA ─────────────────────────────── */
	.subject-card--project {
		grid-column: 1 / -1;
		justify-self: center;
		width: min(100%, 56rem);
		border-color: var(--border);
		background: var(--panel);
	}

	.subject-card--project .subject-card__title {
		font-size: clamp(1rem, 2.1vw, 1.25rem);
		line-height: 1.35;
	}

	.subject-card--project .subject-card__desc + .subject-card__desc {
		margin-top: 0.5rem;
	}

	:global([data-theme='light']) .subject-card--project {
		border-color: var(--border);
		background: var(--panel);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ── Sections ───────────────────────────────────────── */
	.section {
		padding: clamp(2.5rem, 5vw, 4rem) 0;
		position: relative;
		z-index: 1;
	}

	.section--alt {
		background: var(--panel-2);
		border-top: 1px solid var(--border-2);
		border-bottom: 1px solid var(--border-2);
	}

	.section__inner {
		max-width: 86rem;
		margin: 0 auto;
		padding: 0 clamp(1.25rem, 4vw, 3rem);
	}

	.section__inner--narrow {
		max-width: 56rem;
	}

	.section-title {
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 1.75rem;
	}

	.section-lead {
		font-size: 0.95rem;
		color: var(--muted);
		margin-top: -1rem;
		margin-bottom: 2rem;
		max-width: 60ch;
	}

	/* ── Subject cards ──────────────────────────────────── */
	.subjects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}

	.card {
		background: var(--panel);
		border: 1px solid var(--border);
		padding: 1.35rem 1.5rem;
		transition: border-color 0.18s, box-shadow 0.18s;
	}

	.card:hover {
		border-color: rgba(54, 242, 194, 0.25);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
	}

	.subject-card__icon {
		display: block;
		font-size: 1.4rem;
		margin-bottom: 0.6rem;
		line-height: 1;
	}

	.subject-card__title {
		font-size: 0.95rem;
		font-weight: 600;
		margin-bottom: 0.45rem;
		color: var(--text);
	}

	.subject-card__desc {
		font-size: 0.85rem;
		color: var(--muted);
		line-height: 1.6;
		margin-bottom: 0.9rem;
	}

	.subject-card__tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.tag {
		font-size: 0.72rem;
		padding: 0.15rem 0.5rem;
		background: rgba(54, 242, 194, 0.07);
		border: 1px solid rgba(54, 242, 194, 0.2);
		color: rgba(54, 242, 194, 0.85);
		font-family: var(--font-mono);
	}

	/* ── Free resources ────────────────────────────────── */
	.resources-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1rem;
	}

	.resource-card {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		padding: 1.2rem 1.3rem;
		text-decoration: none;
		border: 1px solid var(--border);
		background: var(--panel);
		transition: border-color 0.16s, background-color 0.16s;
	}

	.resource-card:hover {
		border-color: rgba(54, 242, 194, 0.45);
		background: color-mix(in srgb, var(--panel) 88%, var(--accent) 12%);
	}

	.resource-card__title {
		font-size: 1rem;
		color: var(--text);
	}

	.resource-card__desc {
		font-size: 0.86rem;
		line-height: 1.6;
		color: var(--muted);
	}

	.resource-card__link {
		font-size: 0.78rem;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		font-family: var(--font-mono);
		color: var(--accent);
	}

	/* ── Steps ──────────────────────────────────────────── */
	.steps-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.5rem;
	}

	.step-card {
		background: var(--panel);
		border: 1px solid var(--border);
		padding: 1.5rem;
		position: relative;
	}

	.step-card__number {
		display: block;
		font-size: 2rem;
		font-weight: 700;
		color: rgba(54, 242, 194, 0.2);
		line-height: 1;
		margin-bottom: 0.75rem;
		font-family: var(--font-mono);
	}

	.step-card__title {
		font-size: 0.95rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--text);
	}

	.step-card__desc {
		font-size: 0.85rem;
		color: var(--muted);
		line-height: 1.6;
	}

	/* ── Pricing cards ──────────────────────────────────── */
	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1rem;
		align-items: start;
	}

	.pricing-card {
		background: var(--panel);
		border: 1px solid var(--border);
		padding: 1.75rem 1.5rem;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0;
		transition: border-color 0.18s, box-shadow 0.18s;
	}

	.pricing-card--popular {
		border-color: rgba(54, 242, 194, 0.4);
		box-shadow: 0 0 0 1px rgba(54, 242, 194, 0.12), 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.popular-badge {
		position: absolute;
		top: -1px;
		right: 1.25rem;
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		background: var(--accent);
		color: var(--bg);
		padding: 0.15rem 0.55rem;
		font-family: var(--font-mono);
	}

	.coming-soon-badge {
		position: absolute;
		top: -1px;
		left: 1.25rem;
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		background: rgba(222, 232, 255, 0.18);
		color: var(--muted);
		padding: 0.15rem 0.55rem;
		font-family: var(--font-mono);
	}

	.pricing-card__header {
		margin-bottom: 0.75rem;
	}

	.pricing-card__name {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.5rem;
	}

	.pricing-card__price {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
	}

	.pricing-card__amount {
		font-size: clamp(1.75rem, 3vw, 2.25rem);
		font-weight: 700;
		color: var(--text);
		line-height: 1;
	}

	.pricing-card__unit {
		font-size: 0.9rem;
		color: var(--muted);
	}

	.pricing-card__per-hr {
		font-size: 0.78rem;
		color: var(--accent);
		margin-top: 0.25rem;
	}

	.pricing-card__desc {
		font-size: 0.85rem;
		color: var(--muted);
		line-height: 1.6;
		margin-bottom: 1.1rem;
	}

	.pricing-card__features {
		list-style: none;
		font-size: 0.85rem;
		color: var(--muted);
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		margin-bottom: 1.5rem;
		flex: 1;
	}

	.feature-check {
		color: var(--accent);
		margin-right: 0.4rem;
	}

	.pricing-card__cta {
		width: 100%;
		text-align: center;
	}

	/* ── FAQ ────────────────────────────────────────────── */
	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 1px solid var(--border);
	}

	.faq-item {
		border-bottom: 1px solid var(--border-2);
	}

	.faq-item:last-child {
		border-bottom: none;
	}

	.faq-item__trigger {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: var(--panel);
		border: none;
		color: var(--text);
		font-family: var(--font-mono);
		font-size: 0.9rem;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.14s, color 0.14s;
	}

	.faq-item__trigger:hover {
		background: color-mix(in srgb, var(--panel) 60%, var(--panel-2));
		color: var(--accent);
	}

	.faq-item--open .faq-item__trigger {
		color: var(--accent);
	}

	.faq-item__chevron {
		flex-shrink: 0;
		font-size: 1.1rem;
		color: var(--muted);
		transition: color 0.14s;
	}

	.faq-item__answer {
		padding: 0.85rem 1.25rem 1.1rem;
		background: var(--panel-2);
		border-top: 1px solid var(--border-2);
	}

	.faq-item__answer[hidden] {
		display: none;
	}

	.faq-item__answer p {
		font-size: 0.88rem;
		color: var(--muted);
		line-height: 1.7;
		margin: 0;
	}

	/* ── Bottom CTA ─────────────────────────────────────── */
	.cta-section {
		border-top: 1px solid var(--border-2);
	}

	.cta-inner {
		text-align: center;
	}

	.cta-heading {
		font-size: clamp(1.25rem, 2.5vw, 1.75rem);
		margin-bottom: 0.75rem;
	}

	.cta-desc {
		font-size: 0.9rem;
		color: var(--muted);
		line-height: 1.7;
		max-width: 52ch;
		margin: 0 auto 1.75rem;
	}

	@media (max-width: 980px) {
		.subject-card--project {
			grid-column: auto;
		}

		.section {
			padding: clamp(2rem, 5vw, 3rem) 0;
		}
	}

	@media (max-width: 640px) {
		.header__content {
			padding: 2rem 1.1rem 2.4rem;
		}

		.header__actions {
			width: 100%;
			flex-direction: column;
		}

		.hero-action {
			width: min(100%, 18rem);
			text-align: center;
		}

		.subjects-grid,
		.resources-grid,
		.steps-grid,
		.pricing-grid {
			grid-template-columns: 1fr;
		}

		.section__inner {
			padding: 0 1rem;
		}

		.faq-item__trigger {
			padding: 0.85rem 0.95rem;
		}

		.faq-item__answer {
			padding: 0.8rem 0.95rem 1rem;
		}
	}
</style>
