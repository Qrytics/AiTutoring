/**
 * Turns the weekly hours in `availability` (written in the tutor's time zone) into concrete
 * bookable instants, and formats them in the visitor's own zone. No date library: `Intl` already
 * knows every zone's offsets, including DST, so the only work is converting a wall-clock time in
 * one zone into a UTC instant.
 *
 * Runs in the browser only — slots depend on "now", so computing them at prerender time would bake
 * a stale schedule into the HTML.
 */
import { availability, session } from '$lib/data/tutor';

export interface Slot {
	/** UTC ISO string; also the slot's stable identity. */
	id: string;
	start: Date;
	end: Date;
}

export interface SlotDay {
	/** 'YYYY-MM-DD' in the visitor's zone. */
	key: string;
	date: Date;
	slots: Slot[];
}

type Parts = { year: number; month: number; day: number; hour: number; minute: number };

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function zoneParts(date: Date, timeZone: string): Parts {
	let fmt = partsFormatters.get(timeZone);
	if (!fmt) {
		fmt = new Intl.DateTimeFormat('en-US', {
			timeZone,
			hourCycle: 'h23',
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric'
		});
		partsFormatters.set(timeZone, fmt);
	}
	const get = (type: string) => Number(fmt.formatToParts(date).find((p) => p.type === type)?.value);
	return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') };
}

/** Offset of `timeZone` from UTC at `date`, in ms (e.g. -4h for New York in summer). */
function zoneOffset(date: Date, timeZone: string): number {
	const p = zoneParts(date, timeZone);
	return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Math.floor(date.getTime() / 60_000) * 60_000;
}

/** The UTC instant at which the clocks in `timeZone` read the given wall time. */
export function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
	const asIfUtc = Date.UTC(year, month - 1, day, hour, minute);
	let offset = zoneOffset(new Date(asIfUtc), timeZone);
	let instant = asIfUtc - offset;
	// Second pass settles the hour either side of a DST change, where the first guess used the
	// offset from the wrong side of the transition.
	const corrected = zoneOffset(new Date(instant), timeZone);
	if (corrected !== offset) instant = asIfUtc - corrected;
	return new Date(instant);
}

function toMinutes(hhmm: string): number {
	const [h, m] = hhmm.split(':').map(Number);
	return h * 60 + m;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Every open slot from `minNoticeHours` from now to `horizonDays` out. */
export function generateSlots(now = new Date()): Slot[] {
	const { timeZone, weekly, minNoticeHours, horizonDays, blackoutDates } = availability;
	const earliest = now.getTime() + minNoticeHours * 3_600_000;
	const blackout = new Set(blackoutDates);
	const today = zoneParts(now, timeZone);
	const slots: Slot[] = [];

	for (let i = 0; i <= horizonDays; i++) {
		// Calendar arithmetic on a UTC date is safe: no DST, and only y/m/d are read back.
		const d = new Date(Date.UTC(today.year, today.month - 1, today.day + i));
		const [y, m, day] = [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
		if (blackout.has(`${y}-${pad(m)}-${pad(day)}`)) continue;

		for (const [from, to] of weekly[d.getUTCDay()] ?? []) {
			for (let t = toMinutes(from); t + session.minutes <= toMinutes(to); t += session.minutes) {
				const start = zonedTimeToUtc(y, m, day, Math.floor(t / 60), t % 60, timeZone);
				if (start.getTime() < earliest) continue;
				slots.push({ id: start.toISOString(), start, end: new Date(start.getTime() + session.minutes * 60_000) });
			}
		}
	}
	return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function visitorTimeZone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
	} catch {
		return 'UTC';
	}
}

/** Group slots by calendar day *as the visitor sees it* — a 9pm ET slot is the next day in Tokyo. */
export function groupByDay(slots: Slot[], timeZone = visitorTimeZone()): SlotDay[] {
	const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
	const days = new Map<string, SlotDay>();
	for (const slot of slots) {
		const key = keyFmt.format(slot.start);
		let day = days.get(key);
		if (!day) days.set(key, (day = { key, date: slot.start, slots: [] }));
		day.slots.push(slot);
	}
	return [...days.values()];
}

export const fmt = {
	weekday: (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short' }),
	dayNum: (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric' }),
	month: (d: Date) => d.toLocaleDateString(undefined, { month: 'short' }),
	time: (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
	long: (d: Date) =>
		d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
	/** Unambiguous for the email: the tutor reads it in their own zone. */
	forTutor: (d: Date) =>
		d.toLocaleString('en-US', {
			timeZone: availability.timeZone,
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			timeZoneName: 'short'
		}),
	zoneName: (d: Date, timeZone = visitorTimeZone()) =>
		d.toLocaleTimeString('en-US', { timeZone, timeZoneName: 'short' }).split(' ').pop() ?? timeZone
};

/** "in 2 days" / "tomorrow" — for the "next open slot" chip. */
export function relativeDay(d: Date, now = new Date()): string {
	const keyFmt = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
	const diff = Math.round((Date.parse(keyFmt.format(d)) - Date.parse(keyFmt.format(now))) / 86_400_000);
	if (diff <= 0) return 'today';
	if (diff === 1) return 'tomorrow';
	if (diff < 7) return fmt.long(d).split(',')[0];
	return `${fmt.month(d)} ${fmt.dayNum(d)}`;
}
