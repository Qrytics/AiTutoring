<script lang="ts">
	import { onMount } from 'svelte';
	import { playSound } from '$lib/sound';

	/**
	 * A looping "what a session feels like" window: a question, the explanation, the fix as a diff,
	 * and the result. Lines are typed out one at a time. It is the site's hero visual, standing in
	 * for a screen-recording GIF at a fraction of the weight and crisp at any size.
	 */
	type Line = { kind: 'student' | 'tutor' | 'del' | 'add' | 'ctx' | 'ok'; text: string };
	type Scene = { id: string; label: string; file: string; lines: Line[] };

	const scenes: Scene[] = [
		{
			id: 'python',
			label: 'python',
			file: 'average.py',
			lines: [
				{ kind: 'student', text: 'my average is always a bit too low??' },
				{ kind: 'tutor', text: "range(1, n) stops before n — you're skipping the first item." },
				{ kind: 'ctx', text: 'def average(xs):' },
				{ kind: 'del', text: '    total = sum(xs[i] for i in range(1, len(xs)))' },
				{ kind: 'add', text: '    total = sum(xs)' },
				{ kind: 'ctx', text: '    return total / len(xs)' },
				{ kind: 'ok', text: '✓ 6 tests passed' }
			]
		},
		{
			id: 'react',
			label: 'react',
			file: 'Search.tsx',
			lines: [
				{ kind: 'student', text: 'why does this fetch run in an infinite loop?' },
				{ kind: 'tutor', text: 'The effect sets state it also depends on. Depend on the query instead.' },
				{ kind: 'ctx', text: 'useEffect(() => {' },
				{ kind: 'ctx', text: '  fetchResults(query).then(setResults);' },
				{ kind: 'del', text: '}, [results]);' },
				{ kind: 'add', text: '}, [query]);' },
				{ kind: 'ok', text: '✓ 1 request per keystroke' }
			]
		},
		{
			id: 'circuits',
			label: 'circuits',
			file: 'divider.txt',
			lines: [
				{ kind: 'student', text: "how do I get 3.3V out of a 5V supply?" },
				{ kind: 'tutor', text: 'Voltage divider: Vout = Vin · R2 / (R1 + R2). Pick R1 = 1.7k, R2 = 3.3k.' },
				{ kind: 'ctx', text: 'Vin = 5.0 V' },
				{ kind: 'del', text: 'R1 = 10k, R2 = 10k   → Vout = 2.50 V' },
				{ kind: 'add', text: 'R1 = 1.7k, R2 = 3.3k → Vout = 3.30 V' },
				{ kind: 'ok', text: '✓ within ±1% of target' }
			]
		}
	];

	let sceneIndex = $state(0);
	let shown = $state(0); // fully shown lines
	let partial = $state(''); // the line being typed
	let elapsed = $state(14 * 60 + 32);
	let root = $state<HTMLElement | undefined>();

	const scene = $derived(scenes[sceneIndex]);

	let timer: ReturnType<typeof setTimeout> | undefined;
	let visible = true;
	let reduced = false;

	function schedule(fn: () => void, ms: number) {
		clearTimeout(timer);
		timer = setTimeout(() => {
			if (visible) fn();
			else schedule(fn, 400);
		}, ms);
	}

	function typeNext() {
		const line = scene.lines[shown];
		if (!line) {
			// Hold the finished scene, then move to the next one.
			schedule(() => goTo((sceneIndex + 1) % scenes.length), 3200);
			return;
		}
		const speed = line.kind === 'student' ? 34 : line.kind === 'tutor' ? 18 : 12;
		if (partial.length < line.text.length) {
			partial = line.text.slice(0, partial.length + (line.kind === 'tutor' ? 2 : 1));
			schedule(typeNext, speed);
		} else {
			shown += 1;
			partial = '';
			schedule(typeNext, line.kind === 'student' ? 650 : 260);
		}
	}

	function goTo(i: number) {
		sceneIndex = i;
		if (reduced) {
			shown = scenes[i].lines.length;
			partial = '';
			return;
		}
		shown = 0;
		partial = '';
		schedule(typeNext, 450);
	}

	function pick(i: number) {
		playSound('tick', 0.2);
		goTo(i);
	}

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
		if (root) io.observe(root);
		const clock = setInterval(() => visible && (elapsed += 1), 1000);
		goTo(0);
		return () => {
			clearTimeout(timer);
			clearInterval(clock);
			io.disconnect();
		};
	});

	const clock = $derived(
		`${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`
	);
	const typing = $derived(scene.lines[shown]);
</script>

<figure class="demo" bind:this={root} aria-label="Example tutoring session">
	<div class="demo__bar">
		<span class="demo__dots" aria-hidden="true"><i></i><i></i><i></i></span>
		<span class="demo__title"><span class="demo__live" aria-hidden="true"></span>live session · {clock}</span>
	</div>

	<div class="demo__tabs" role="tablist" aria-label="Example topics">
		{#each scenes as s, i (s.id)}
			<button
				type="button"
				role="tab"
				class="demo__tab"
				aria-selected={i === sceneIndex}
				onclick={() => pick(i)}
			>
				{s.label}
			</button>
		{/each}
		<span class="demo__file">{scene.file}</span>
	</div>

	<!-- Screen readers get the whole exchange at once instead of a stream of partial lines. -->
	<ol class="sr-only">
		{#each scene.lines as line, i (i)}<li>{line.kind}: {line.text}</li>{/each}
	</ol>

	<div class="demo__body" aria-hidden="true">
		{#each scene.lines.slice(0, shown) as line, i (sceneIndex + '-' + i)}
			<div class="line line--{line.kind}">{line.text}</div>
		{/each}
		{#if typing}
			<div class="line line--{typing.kind}">{partial}<span class="caret"></span></div>
		{/if}
	</div>
</figure>

<style>
	.demo {
		margin: 0;
		width: 100%;
		border: 1px solid var(--border);
		background: #0a0f15;
		color: #dbe4ee;
		box-shadow: 0 30px 70px -30px color-mix(in srgb, #000 80%, transparent);
		font-size: 0.8rem;
		overflow: hidden;
	}

	.demo__bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.8rem;
		border-bottom: 1px solid #1c2633;
		background: #0d141c;
	}

	.demo__dots {
		display: flex;
		gap: 0.35rem;
	}

	.demo__dots i {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: var(--hot);
	}

	.demo__dots i:nth-child(2) {
		background: var(--warm);
	}

	.demo__dots i:nth-child(3) {
		background: var(--cool);
	}

	.demo__title {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		margin-left: auto;
		color: #8b9aab;
		font-size: 0.74rem;
		font-variant-numeric: tabular-nums;
	}

	.demo__live {
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 50%;
		background: #ff5b57;
		animation: pulse 1.6s ease-in-out infinite;
	}

	@keyframes pulse {
		50% {
			opacity: 0.25;
		}
	}

	.demo__tabs {
		display: flex;
		align-items: center;
		border-bottom: 1px solid #1c2633;
		background: #0b1118;
	}

	.demo__tab {
		padding: 0.55rem 0.85rem;
		border: 0;
		border-right: 1px solid #1c2633;
		background: transparent;
		color: #7d8b9b;
		font: inherit;
		font-size: 0.74rem;
		cursor: pointer;
	}

	.demo__tab:hover {
		color: #dbe4ee;
	}

	.demo__tab[aria-selected='true'] {
		color: #36f2c2;
		background: #0a0f15;
		box-shadow: inset 0 -2px 0 #36f2c2;
	}

	.demo__file {
		margin-left: auto;
		padding: 0 0.8rem;
		color: #5f6f80;
		font-size: 0.72rem;
	}

	.demo__body {
		display: grid;
		align-content: start;
		gap: 0.35rem;
		/* Fixed height: the window never grows as lines type in, so nothing below it moves. */
		height: 17.5rem;
		padding: 0.95rem 1rem;
		overflow: hidden;
	}

	.line {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		line-height: 1.5;
		min-height: 1.2em;
	}

	.line--student,
	.line--tutor {
		padding: 0.4rem 0.6rem;
		border-left: 2px solid;
		margin-bottom: 0.2rem;
	}

	.line--student {
		border-color: #f6c177;
		background: color-mix(in srgb, #f6c177 8%, transparent);
	}

	.line--student::before {
		content: 'student › ';
		color: #f6c177;
	}

	.line--tutor {
		border-color: #36f2c2;
		background: color-mix(in srgb, #36f2c2 7%, transparent);
	}

	.line--tutor::before {
		content: 'mario › ';
		color: #36f2c2;
	}

	.line--ctx {
		color: #8b9aab;
	}

	.line--del {
		color: #ff8a87;
		background: color-mix(in srgb, #ff5b57 10%, transparent);
	}

	.line--del::before {
		content: '- ';
	}

	.line--add {
		color: #7ee2a8;
		background: color-mix(in srgb, #28c840 11%, transparent);
	}

	.line--add::before {
		content: '+ ';
	}

	.line--ctx::before {
		content: '  ';
	}

	.line--ok {
		margin-top: 0.3rem;
		color: #36f2c2;
		font-weight: 700;
	}

	.caret {
		display: inline-block;
		width: 0.5em;
		height: 1.05em;
		margin-left: 1px;
		vertical-align: text-bottom;
		background: currentColor;
		animation: blink 1s steps(1) infinite;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	@media (max-width: 640px) {
		.demo {
			font-size: 0.74rem;
		}

		.demo__body {
			height: 19rem;
			padding: 0.8rem;
		}

		.demo__file {
			display: none;
		}

		.demo__tab {
			flex: 1;
			min-height: 2.75rem;
		}
	}
</style>
