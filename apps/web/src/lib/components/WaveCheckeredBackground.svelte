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
			if (!visible) {
				raf = 0;
				return;
			}

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
			const speed = 24;
			const offsetX = -((t * speed) % period);

			// Wave warp (subtle, smooth).
			const amp = Math.min(18, ch * 0.07);
			const waveLen = 260;
			const waveLen2 = 520;
			const phase = t * 1.25;

			// Colors (very light, on-brand).
			const base = 'rgba(255,255,255,0.014)';
			const accent = 'rgba(54,242,194,0.052)';

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

			// Fade overlay similar to previous look.
			const grad = g.createLinearGradient(0, 0, 0, ch);
			grad.addColorStop(0, 'rgba(0,0,0,0)');
			grad.addColorStop(0.18, 'rgba(0,0,0,0.15)');
			grad.addColorStop(0.7, 'rgba(0,0,0,0.35)');
			grad.addColorStop(1, 'rgba(0,0,0,0.55)');
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

		const io = new IntersectionObserver(
			(entries) => {
				if (!entries.length) return;
				visible = entries[0].isIntersecting;
				if (visible && raf === 0) {
					raf = requestAnimationFrame(draw);
				}
			},
			{ threshold: 0 }
		);
		io.observe(container);

		return () => {
			cancelAnimationFrame(raf);
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
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
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
