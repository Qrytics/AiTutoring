/**
 * localStorage that never throws — private browsing, blocked site data and SSR all make the raw API
 * throw or vanish, and a booking page must keep working regardless.
 */
export function getItem(key: string): string | null {
	try {
		return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
	} catch {
		return null;
	}
}

export function setItem(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {
		/* storage unavailable — the feature just doesn't persist */
	}
}

export function removeItem(key: string): void {
	try {
		localStorage.removeItem(key);
	} catch {
		/* ignore */
	}
}
