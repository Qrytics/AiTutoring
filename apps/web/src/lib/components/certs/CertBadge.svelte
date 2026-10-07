<script lang="ts">
	/**
	 * A credential medallion: a hexagon in the issuer's tint carrying a category glyph and the
	 * credential's short code. Deliberately not the issuer's logo — those are trademarks and are never
	 * redrawn here; when `cert.image` (the official badge art) is set, it is shown instead.
	 *
	 * `featured` adds the gold treatment: a gold rim, a soft halo and slow light rays behind it. The
	 * halo/rays are static unless motion is allowed (the global reduced-motion rule stops them).
	 * `shine` replays a light sweep across the face, for a tap.
	 *
	 * TWIN FILE: copied from the portfolio's `src/lib/components/certs/CertBadge.svelte` — keep in sync.
	 */
	import { groupTint, type Certification } from '$lib/data/certifications';

	let {
		cert,
		size = 56,
		featured = false,
		shine = 0,
		showCode = true
	}: { cert: Certification; size?: number; featured?: boolean; shine?: number; showCode?: boolean } = $props();

	const uid = $props.id();
	const tint = $derived(groupTint(cert.group));
	const hex = 'M50 2 L96 28 L96 84 L50 110 L4 84 L4 28 Z';
</script>

<span
	class="badge"
	class:badge--featured={featured}
	style="--tint:{tint}; --size:var(--cert-badge-size, {size}px)"
	aria-hidden="true"
>
	{#if featured}<span class="badge__halo"></span><span class="badge__rays"></span>{/if}

	{#if cert.image}
		<img class="badge__img" src={cert.image} alt="" loading="lazy" decoding="async" width={size} height={size} />
	{:else}
		<svg class="badge__svg" viewBox="0 0 100 112" width={size} height={size * 1.12}>
			<defs>
				<linearGradient id="face-{uid}" x1="0" y1="0" x2="0.4" y2="1">
					<stop offset="0" class="stop-hi" />
					<stop offset="1" class="stop-lo" />
				</linearGradient>
				<linearGradient id="rim-{uid}" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" class="rim-a" />
					<stop offset="0.5" class="rim-b" />
					<stop offset="1" class="rim-a" />
				</linearGradient>
				<linearGradient id="sweep-{uid}" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stop-color="#fff" stop-opacity="0" />
					<stop offset="0.5" stop-color="#fff" stop-opacity="0.55" />
					<stop offset="1" stop-color="#fff" stop-opacity="0" />
				</linearGradient>
				<clipPath id="clip-{uid}"><path d={hex} /></clipPath>
			</defs>

			<path d={hex} fill="url(#face-{uid})" />
			<!-- inner bevel line -->
			<path d="M50 12 L87 33 L87 79 L50 100 L13 79 L13 33 Z" class="bevel" />
			<path d={hex} fill="none" stroke="url(#rim-{uid})" stroke-width={featured ? 5 : 3} />

			<g class="glyph" transform={showCode ? 'translate(32 22) scale(1.5)' : 'translate(26 30) scale(2)'}>
				{#if cert.category === 'quantum'}
					<ellipse cx="12" cy="12" rx="10" ry="4" />
					<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
					<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
					<circle cx="12" cy="12" r="1.8" class="fill" />
				{:else if cert.category === 'ai'}
					<path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" class="fill" />
					<path d="M19 2.5 L19.8 4.2 L21.5 5 L19.8 5.8 L19 7.5 L18.2 5.8 L16.5 5 L18.2 4.2 Z" class="fill" />
				{:else if cert.category === 'data'}
					<path d="M4 20 V13 M9.3 20 V8 M14.6 20 V11 M20 20 V4" stroke-width="3" stroke-linecap="round" />
				{:else if cert.category === 'cloud'}
					<path d="M7 18 H17.5 A4.5 4.5 0 0 0 17 9.1 A6 6 0 0 0 5.6 10.6 A3.8 3.8 0 0 0 7 18 Z" />
				{:else if cert.category === 'security'}
					<path d="M12 2.5 L20 5.5 V11.5 C20 16.5 16.5 20 12 21.5 C7.5 20 4 16.5 4 11.5 V5.5 Z" />
					<circle cx="12" cy="10.5" r="2" class="fill" />
					<path d="M12 12.5 V16" stroke-width="2.4" stroke-linecap="round" />
				{:else if cert.category === 'dev'}
					<path d="M8 6 L2.5 12 L8 18 M16 6 L21.5 12 L16 18 M13.5 4 L10.5 20" stroke-linecap="round" stroke-linejoin="round" />
				{:else if cert.category === 'design'}
					<path d="M12 2.5 L21 10 L12 21.5 L3 10 Z M3 10 H21 M8.5 10 L12 21.5 L15.5 10 M8.5 10 L10.5 2.9 M15.5 10 L13.5 2.9" stroke-linejoin="round" />
				{:else}
					<path d="M3 18 L9 12 L13 15.5 L21 6.5 M15.5 6.5 H21 V12" stroke-linecap="round" stroke-linejoin="round" />
				{/if}
			</g>

			{#if showCode}
				<text x="50" y="86" text-anchor="middle" class="code" textLength={cert.code.length > 4 ? 58 : undefined} lengthAdjust="spacingAndGlyphs">{cert.code}</text>
			{/if}

			{#key shine}
				{#if shine > 0}
					<g clip-path="url(#clip-{uid})">
						<rect class="sweep" x="-60" y="-10" width="50" height="140" fill="url(#sweep-{uid})" transform="skewX(-18)" />
					</g>
				{/if}
			{/key}
		</svg>
	{/if}
</span>

<style>
	.badge {
		/* Gold, tuned per theme so it reads as metal on both: bright on dark, deep amber on white. */
		--gold: #f2c46d;
		--gold-2: #ffe7a8;
		--gold-glow: color-mix(in srgb, #f6c177 55%, transparent);
		position: relative;
		display: inline-grid;
		place-items: center;
		width: var(--size);
		height: calc(var(--size) * 1.12);
		flex-shrink: 0;
	}

	:global([data-theme='light']) .badge {
		--gold: #b7811f;
		--gold-2: #e9b44c;
		--gold-glow: color-mix(in srgb, #d99a2b 42%, transparent);
	}

	.badge__svg,
	.badge__img {
		position: relative;
		z-index: 1;
		display: block;
		overflow: visible;
	}

	.badge__img {
		width: var(--size);
		height: var(--size);
		object-fit: contain;
	}

	/* Sized by the custom property, not the attributes, so a parent can resize badges per breakpoint
	   (`--size` on an ancestor wins over the inline default). */
	.badge__svg {
		width: var(--size);
		height: calc(var(--size) * 1.12);
	}

	.stop-hi {
		stop-color: color-mix(in srgb, var(--tint) 62%, #ffffff 8%);
	}

	.stop-lo {
		stop-color: color-mix(in srgb, var(--tint) 38%, #05080c);
	}

	.rim-a {
		stop-color: color-mix(in srgb, var(--tint) 80%, #ffffff);
	}

	.rim-b {
		stop-color: color-mix(in srgb, var(--tint) 55%, #05080c);
	}

	.badge--featured .rim-a {
		stop-color: var(--gold-2);
	}

	.badge--featured .rim-b {
		stop-color: var(--gold);
	}

	.bevel {
		fill: none;
		stroke: color-mix(in srgb, #ffffff 22%, transparent);
		stroke-width: 1.2;
	}

	.glyph {
		fill: none;
		stroke: #ffffff;
		stroke-width: 1.7;
	}

	.glyph .fill {
		fill: #ffffff;
		stroke: none;
	}

	.code {
		fill: #ffffff;
		font-family: var(--font-mono);
		font-size: 15px;
		font-weight: 700;
		letter-spacing: 0.5px;
	}

	.sweep {
		animation: sweep 0.8s cubic-bezier(0.3, 0.6, 0.3, 1) forwards;
	}

	@keyframes sweep {
		to {
			transform: skewX(-18deg) translateX(190px);
		}
	}

	/* ── Featured: halo + rays ────────────────────────── */
	.badge__halo,
	.badge__rays {
		position: absolute;
		inset: -38%;
		border-radius: 50%;
		pointer-events: none;
	}

	.badge__halo {
		background: radial-gradient(circle, var(--gold-glow) 0%, color-mix(in srgb, var(--gold) 14%, transparent) 42%, transparent 68%);
		animation: halo 3.2s ease-in-out infinite;
	}

	.badge__rays {
		inset: -30%;
		background: repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--gold) 30%, transparent) 0deg 5deg, transparent 5deg 22deg);
		-webkit-mask-image: radial-gradient(circle, #000 18%, transparent 66%);
		mask-image: radial-gradient(circle, #000 18%, transparent 66%);
		opacity: 0.55;
		animation: rays 26s linear infinite;
	}

	.badge--featured .badge__svg {
		filter: drop-shadow(0 6px 18px color-mix(in srgb, var(--gold) 40%, transparent));
	}

	@keyframes halo {
		0%,
		100% {
			opacity: 0.75;
			transform: scale(0.94);
		}
		50% {
			opacity: 1;
			transform: scale(1.06);
		}
	}

	@keyframes rays {
		to {
			transform: rotate(360deg);
		}
	}
</style>
