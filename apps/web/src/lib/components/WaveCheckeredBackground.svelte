<script lang="ts">
	let canvas: HTMLCanvasElement | undefined = $state();
	let container: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (!canvas || !container) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const g = ctx;

		let raf = 0;
		let start = performance.now();
		let visible = true;
		let prefersReducedMotion = false;
		let dpr = 1;
		let lastFrame = 0;
		const targetFrameMs = 1000 / 30;

		/*
		 * Colours come from CSS custom properties on `.bg` (set per theme below), not literals. They
		 * used to be hardcoded dark-mode values — near-invisible white tiles under a black fade — so in
		 * light mode the canvas painted a grey vignette that every later "fix" tried to bury under white
		 * glow layers. Re-read whenever `data-theme` changes; reading per frame would force a style
		 * recalc 30 times a second.
		 */
		let palette = { base: '', accent: '', fade: { rgb: '0,0,0', strength: 1 } };
		function readPalette() {
			if (!container) return;
			const cs = getComputedStyle(container);
			palette = {
				base: cs.getPropertyValue('--hero-tile-alt').trim() || 'rgba(255,255,255,0.014)',
				accent: cs.getPropertyValue('--hero-tile').trim() || 'rgba(54,242,194,0.052)',
				fade: {
					rgb: cs.getPropertyValue('--hero-fade-rgb').trim() || '0,0,0',
					strength: parseFloat(cs.getPropertyValue('--hero-fade-strength')) || 1
				}
			};
		}
		readPalette();
		const themeObserver = new MutationObserver(() => {
			readPalette();
			// A reduced-motion visitor gets one static frame, so it has to be redrawn on a theme change.
			if (raf === 0 && visible) raf = requestAnimationFrame(draw);
		});
		themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updateReducedMotion = () => {
			prefersReducedMotion = mediaQuery.matches;
		};
		updateReducedMotion();
		mediaQuery.addEventListener('change', updateReducedMotion);

		function resize() {
			if (!canvas || !container) return;
			const r = container.getBoundingClientRect();
			// Clamp DPR to reduce GPU work on high-density screens.
			dpr = Math.min(window.devicePixelRatio || 1, 1.5);
			canvas.width = Math.max(1, Math.floor(r.width * dpr));
			canvas.height = Math.max(1, Math.floor(r.height * dpr));
			canvas.style.width = `${r.width}px`;
			canvas.style.height = `${r.height}px`;
			lastFrame = 0;
		}

		function draw(now: number) {
			if (!canvas || !container) return;
			if (!visible) { raf = 0; return; }

			if (!prefersReducedMotion && lastFrame !== 0 && now - lastFrame < targetFrameMs) {
				raf = requestAnimationFrame(draw);
				return;
			}
			lastFrame = now;

			const w = canvas.width;
			const h = canvas.height;
			const t = prefersReducedMotion ? 0 : (now - start) / 1000;

			g.clearRect(0, 0, w, h);
			g.imageSmoothingEnabled = true;

			// Checker setup (work in CSS pixels, then scale via DPR).
			const cw = w / dpr;
			const ch = h / dpr;

			// Larger tiles = fewer rects = smoother + faster.
			const cell = 30;
			const period = cell * 2;

			// Right-to-left motion, seamless wrap every 2*cell.
			const speed = 24; // px/s
			const offsetX = -((t * speed) % period);

			// Wave warp (subtle, smooth).
			const amp = Math.min(18, ch * 0.07);
			const waveLen = 260;
			const waveLen2 = 520;
			const phase = t * 1.25;

			const { base, accent, fade } = palette;

			g.save();
			g.scale(dpr, dpr);

			const cols = Math.ceil(cw / cell) + 6;
			const rows = Math.ceil(ch / cell) + 6;

			for (let i = -3; i < cols - 3; i++) {
				const x = i * cell + offsetX;
				// Make the entire column ride the same wave for cleaner motion.
				const yWarp =
					Math.sin((x / waveLen) * Math.PI * 2 + phase) * amp +
					Math.sin((x / waveLen2) * Math.PI * 2 + phase * 0.7) * (amp * 0.45);

				for (let j = -3; j < rows - 3; j++) {
					const y = j * cell + yWarp;

					// Checker: only draw one color strongly to keep it subtle.
					if ((i + j) % 2 === 0) {
						g.fillStyle = accent;
						g.fillRect(x, y, cell, cell);
					} else {
						g.fillStyle = base;
						g.fillRect(x, y, cell, cell);
					}
				}
			}

			// Fade toward `--hero-fade`: black in dark mode (the original look), the page colour in light
			// mode, so the hero dissolves into the page instead of ending in a grey band.
			const grad = g.createLinearGradient(0, 0, 0, ch);
			grad.addColorStop(0, `rgba(${fade.rgb},0)`);
			grad.addColorStop(0.18, `rgba(${fade.rgb},${0.15 * fade.strength})`);
			grad.addColorStop(0.7, `rgba(${fade.rgb},${0.35 * fade.strength})`);
			grad.addColorStop(1, `rgba(${fade.rgb},${Math.min(1, 0.55 * fade.strength)})`);
			g.fillStyle = grad;
			g.fillRect(0, 0, cw, ch);

			g.restore();

			if (prefersReducedMotion) {
				raf = 0;
				return;
			}
			raf = requestAnimationFrame(draw);
		}

		resize();
		raf = requestAnimationFrame(draw);

		const ro = new ResizeObserver(resize);
		ro.observe(container);

		const io = new IntersectionObserver((entries) => {
			if (!entries.length) return;
			visible = entries[0].isIntersecting;
			if (visible && raf === 0) {
				raf = requestAnimationFrame(draw);
			}
		}, { threshold: 0 });
		io.observe(container);

		return () => {
			cancelAnimationFrame(raf);
			themeObserver.disconnect();
			ro.disconnect();
			io.disconnect();
			mediaQuery.removeEventListener('change', updateReducedMotion);
		};
	});
</script>

<div class="bg" aria-hidden="true" bind:this={container}>
	<canvas class="bg__canvas" bind:this={canvas}></canvas>
</div>

<style>
	.bg {
		/* Dark: the original values, unchanged. */
		--hero-tile: rgba(54, 242, 194, 0.052);
		--hero-tile-alt: rgba(255, 255, 255, 0.014);
		--hero-fade-rgb: 0, 0, 0;
		--hero-fade-strength: 1;
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
	}

	/*
	 * Light: teal tiles drawn as ink on paper rather than light on dark, fading fully into the page
	 * background at the bottom edge. `screen` blending is a no-op over white, so it is dropped, and a
	 * radial mask clears the tiles from behind the text so nothing has to fight for contrast with it.
	 */
	:global([data-theme='light']) .bg {
		--hero-tile: rgba(13, 148, 136, 0.085);
		--hero-tile-alt: rgba(13, 148, 136, 0.022);
		--hero-fade-rgb: 247, 250, 249;
		--hero-fade-strength: 1.82;
	}

	:global([data-theme='light']) .bg__canvas {
		opacity: 1;
		mix-blend-mode: normal;
		-webkit-mask-image: radial-gradient(ellipse 58% 62% at 50% 46%, transparent 30%, #000 92%);
		mask-image: radial-gradient(ellipse 58% 62% at 50% 46%, transparent 30%, #000 92%);
	}

	.bg__canvas {
		display: block;
		width: 100%;
		height: 100%;
		opacity: 0.9;
		mix-blend-mode: screen;
		/* Avoid translateZ(0): with landing `.page { isolation: isolate }` it can promote a layer
		   that incorrectly stacks above the sticky header for hit-testing in some browsers. */
	}
</style>

