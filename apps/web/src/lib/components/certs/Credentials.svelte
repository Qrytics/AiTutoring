<script lang="ts">
	/**
	 * Landing-page credentials: the four featured badges (gold, tap to polish), then the AI-tool
	 * credentials most relevant to what's taught here, then a link to the full list on the portfolio.
	 * Lighter than the portfolio's /certifications page on purpose — this is social proof, not a CV.
	 */
	import CertBadge from './CertBadge.svelte';
	import { certDateLabel, certifications, featuredCertifications, groupedCertifications } from '$lib/data/certifications';
	import { playSound } from '$lib/sound';

	const AI_GROUPS = ['Microsoft', 'Anthropic', 'Google Cloud'];
	const aiCreds = groupedCertifications.filter((g) => AI_GROUPS.includes(g.id)).flatMap((g) => g.items.map((c) => ({ ...c, tint: g.tint })));
	const remaining = certifications.length - featuredCertifications.length - aiCreds.length;
	const otherIssuers = groupedCertifications.filter((g) => !AI_GROUPS.includes(g.id)).map((g) => g.id);

	let shines = $state<Record<string, number>>({});
	function polish(id: string) {
		shines[id] = (shines[id] ?? 0) + 1;
		playSound('complete', 0.18);
	}
</script>

<section class="creds" id="credentials" aria-labelledby="creds-title">
	<div class="creds__inner">
		<header class="creds__head">
			<h2 id="creds-title" class="kicker">credentials</h2>
			<p class="lead">Certified on the AI tools I teach — {certifications.length} credentials and counting.</p>
		</header>

		<ol class="featured" aria-label="Featured credentials">
			{#each featuredCertifications as cert (cert.id)}
				<li class="feat">
					<button type="button" class="feat__badge" onclick={() => polish(cert.id)} aria-label="Polish the {cert.title} badge">
						<CertBadge {cert} size={104} featured shine={shines[cert.id] ?? 0} />
					</button>
					<span class="feat__ribbon">★ featured</span>
					<h3 class="feat__title">{cert.title}</h3>
					<p class="feat__meta">{cert.issuer} · {certDateLabel(cert)}</p>
				</li>
			{/each}
		</ol>

		<ul class="mini" aria-label="AI tool credentials">
			{#each aiCreds as cert (cert.id)}
				<li class="mini__item" style="--tint:{cert.tint}">
					<CertBadge {cert} size={38} showCode={false} />
					<span class="mini__text">
						<span class="mini__title">{cert.title}</span>
						<span class="mini__meta">{cert.issuer}</span>
					</span>
				</li>
			{/each}
		</ul>

		<p class="more">
			+ {remaining} more from {otherIssuers.join(', ').replace(/, ([^,]*)$/, ' & $1')} —
			<a href="https://mario-belmonte.com/certifications">see all {certifications.length} ↗</a>
		</p>
	</div>
</section>

<style>
	.creds {
		--gold: #f2c46d;
		padding: clamp(3rem, 7vw, 5rem) clamp(1rem, 4vw, 3rem);
		scroll-margin-top: 4rem;
	}

	:global([data-theme='light']) .creds {
		--gold: #a8741a;
	}

	.creds__inner {
		max-width: 76rem;
		margin: 0 auto;
	}

	.creds__head {
		margin-bottom: 1.75rem;
	}

	.kicker {
		margin-bottom: 0.4rem;
		color: var(--accent-text);
		font-size: 0.78rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.lead {
		color: var(--muted);
		font-size: 0.95rem;
		line-height: 1.65;
	}

	.featured {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1rem;
		list-style: none;
	}

	.feat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		padding: 1.4rem 0.9rem 1.1rem;
		text-align: center;
		border: 1px solid color-mix(in srgb, var(--gold) 38%, var(--border));
		background:
			radial-gradient(ellipse 80% 55% at 50% 0%, color-mix(in srgb, var(--gold) 12%, transparent), transparent 70%),
			var(--panel);
		box-shadow: 0 18px 40px -26px color-mix(in srgb, var(--gold) 55%, transparent);
		transition: transform 0.18s ease, border-color 0.18s ease;
	}

	@media (hover: hover) {
		.feat:hover {
			transform: translateY(-3px);
			border-color: color-mix(in srgb, var(--gold) 70%, var(--border));
		}
	}

	.feat__badge {
		display: grid;
		place-items: center;
		margin: 0.3rem 0 0.7rem;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.feat__badge:active {
		transform: scale(0.94);
	}

	.feat__badge:focus-visible {
		outline: 2px solid var(--focus-ring);
		outline-offset: 6px;
	}

	.feat__ribbon {
		color: var(--gold);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.feat__title {
		color: var(--text);
		font-size: 0.9rem;
		line-height: 1.35;
	}

	.feat__meta {
		color: var(--muter);
		font-size: 0.74rem;
	}

	.mini {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
		gap: 0.5rem;
		margin-top: 1.25rem;
		list-style: none;
	}

	.mini__item {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border-2);
		border-left: 2px solid color-mix(in srgb, var(--tint) 70%, transparent);
		background: var(--panel);
	}

	.mini__text {
		display: grid;
		min-width: 0;
	}

	.mini__title {
		color: var(--text);
		font-size: 0.8rem;
		line-height: 1.35;
	}

	.mini__meta {
		color: var(--muter);
		font-size: 0.7rem;
	}

	.more {
		margin-top: 1rem;
		color: var(--muter);
		font-size: 0.82rem;
		line-height: 1.7;
	}

	@media (max-width: 899px) {
		.featured {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 640px) {
		.feat__badge {
			--cert-badge-size: 88px;
		}

		.feat {
			padding: 1.1rem 0.6rem 0.9rem;
		}

		.feat__title {
			font-size: 0.8rem;
		}

		.feat__meta {
			font-size: 0.68rem;
		}

		.featured {
			gap: 0.6rem;
		}
	}
</style>
