/**
 * Tiny UI sounds. Only ever called from a real click or tap — never on load or scroll — and muted
 * with one toggle (in the footer) that is remembered.
 */
import { base } from '$app/paths';
import { getItem, setItem } from '$lib/storage';

export type SoundId = 'tick' | 'pop' | 'complete' | 'click';

const cache = new Map<SoundId, HTMLAudioElement>();
const listeners = new Set<(on: boolean) => void>();

export function soundEnabled(): boolean {
	return getItem('sound') !== 'off';
}

export function setSoundEnabled(on: boolean): void {
	setItem('sound', on ? 'on' : 'off');
	for (const fn of listeners) fn(on);
}

export function onSoundChange(fn: (on: boolean) => void): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

export function playSound(id: SoundId, volume = 0.25): void {
	if (typeof window === 'undefined' || !soundEnabled()) return;
	let audio = cache.get(id);
	if (!audio) {
		audio = new Audio(`${base}/sounds/${id}.mp3`);
		cache.set(id, audio);
	}
	audio.volume = volume;
	audio.currentTime = 0;
	audio.play().catch(() => {
		/* autoplay policy or missing file — sounds are decoration */
	});
}
