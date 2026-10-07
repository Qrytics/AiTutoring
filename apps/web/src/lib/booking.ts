/**
 * Booking without a backend. The request is an email the student sends from their own mail app,
 * payment goes straight to the tutor through Venmo / Cash App / Zelle, and nothing is stored
 * anywhere but the student's own browser (a draft, so switching to Venmo and back loses nothing).
 */
import { payments, session, tutor } from '$lib/data/tutor';
import { fmt, type Slot } from '$lib/schedule';

export type PayMethodId = 'venmo' | 'cashapp' | 'zelle';

export interface PayMethod {
	id: PayMethodId;
	label: string;
	/** What the student sees as the destination: @handle, $tag, email. */
	handle: string;
	/** Deep link with the amount (and, for Venmo, the note) filled in. Zelle has none. */
	href?: string;
	hint: string;
}

export interface BookingDetails {
	name: string;
	email: string;
	topic: string;
	goals: string;
	platform: string;
}

export function paymentNote(slot: Slot): string {
	return `Tutoring · ${fmt.forTutor(slot.start)}`;
}

/** Only methods with a handle configured in `tutor.ts` — an empty handle is never shown. */
export function availablePayMethods(slot: Slot): PayMethod[] {
	const note = paymentNote(slot);
	const methods: PayMethod[] = [];
	const venmo = payments.venmo.trim().replace(/^@/, '');
	const cash = payments.cashApp.trim().replace(/^\$/, '');
	const zelle = payments.zelle.trim();

	if (venmo) {
		methods.push({
			id: 'venmo',
			label: 'Venmo',
			handle: `@${venmo}`,
			href: `https://venmo.com/${encodeURIComponent(venmo)}?txn=pay&amount=${session.price}&note=${encodeURIComponent(note)}`,
			hint: 'Opens Venmo with the amount and note filled in.'
		});
	}
	if (cash) {
		methods.push({
			id: 'cashapp',
			label: 'Cash App',
			handle: `$${cash}`,
			href: `https://cash.app/$${encodeURIComponent(cash)}/${session.price}`,
			hint: 'Opens Cash App with the amount filled in. Apple Pay works there too.'
		});
	}
	if (zelle) {
		methods.push({
			id: 'zelle',
			label: 'Zelle',
			handle: zelle,
			hint: `Send from your banking app's Zelle to this ${/@/.test(zelle) ? 'email' : 'number'}.`
		});
	}
	return methods;
}

export function requestSubject(slot: Slot, d: BookingDetails): string {
	return `Tutoring request — ${fmt.forTutor(slot.start)} — ${d.name.trim()}`;
}

export function requestBody(
	slot: Slot,
	d: BookingDetails,
	method: PayMethod | undefined,
	paid: boolean,
	visitorZone: string
): string {
	const payLine = !method
		? 'Payment: please send me payment details'
		: `Payment: ${method.label} (${method.handle}) — ${paid ? 'sent' : 'will send before the session'}`;
	return [
		`Hi Mario,`,
		``,
		`I'd like to book a ${session.minutes}-minute session.`,
		``,
		`When:      ${fmt.forTutor(slot.start)}`,
		`           (${fmt.long(slot.start)}, ${fmt.time(slot.start)} my time — ${visitorZone})`,
		`Name:      ${d.name.trim()}`,
		`Email:     ${d.email.trim()}`,
		`Topic:     ${d.topic}`,
		`Platform:  ${d.platform}`,
		payLine,
		``,
		`What I'd like to work on:`,
		d.goals.trim() || '(not specified)',
		``,
		`Thanks!`
	].join('\n');
}

export function mailtoHref(subject: string, body: string): string {
	return `mailto:${tutor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const icsStamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsEscape = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

/** A calendar file for the student's own calendar, marked tentative until the tutor confirms. */
export function icsFile(slot: Slot, d: BookingDetails): string {
	return [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//mario-belmonte.com//tutoring//EN',
		'BEGIN:VEVENT',
		`UID:${icsStamp(slot.start)}-${encodeURIComponent(d.email.trim())}@mario-belmonte.com`,
		`DTSTAMP:${icsStamp(new Date())}`,
		`DTSTART:${icsStamp(slot.start)}`,
		`DTEND:${icsStamp(slot.end)}`,
		`SUMMARY:${icsEscape(`Tutoring with ${tutor.name} — ${d.topic}`)}`,
		`DESCRIPTION:${icsEscape(`The ${d.platform} link comes in the confirmation email from ${tutor.email}.`)}`,
		'STATUS:TENTATIVE',
		'END:VEVENT',
		'END:VCALENDAR'
	].join('\r\n');
}

export function googleCalendarHref(slot: Slot, d: BookingDetails): string {
	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: `Tutoring with ${tutor.name} — ${d.topic}`,
		dates: `${icsStamp(slot.start)}/${icsStamp(slot.end)}`,
		details: `The ${d.platform} link comes in the confirmation email from ${tutor.email}.`
	});
	return `https://calendar.google.com/calendar/render?${params}`;
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
