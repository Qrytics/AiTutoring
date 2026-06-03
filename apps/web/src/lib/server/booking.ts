import { error } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';

export const RESERVATION_MINUTES = 15;

export type Slot = {
	id: string;
	start_time: string;
	end_time: string;
};

export type Booking = {
	id: string;
	slot_id: string;
	slot_start: string;
	slot_end: string;
	timezone: string;
	status: 'reserved' | 'paid' | 'cancelled' | 'expired';
	reservation_expires_at: string;
	customer_email: string | null;
	session_type: string | null;
	stripe_session_id: string | null;
};

export async function getFutureSlots(limit = 80): Promise<Slot[]> {
	const { data, error: queryError } = await supabase
		.from('available_slots')
		.select('id,start_time,end_time')
		.eq('is_active', true)
		.gt('start_time', new Date().toISOString())
		.order('start_time', { ascending: true })
		.limit(limit);

	if (queryError) {
		throw error(500, 'Could not load available slots.');
	}

	return (data ?? []) as Slot[];
}

export async function getReservedSlotIds(slotIds: string[]): Promise<Set<string>> {
	if (slotIds.length === 0) return new Set();

	const nowIso = new Date().toISOString();
	const { data, error: queryError } = await supabase
		.from('bookings')
		.select('slot_id,status,reservation_expires_at')
		.in('slot_id', slotIds)
		.in('status', ['reserved', 'paid']);

	if (queryError) {
		throw error(500, 'Could not verify reserved slots.');
	}

	const unavailable = new Set<string>();
	for (const row of data ?? []) {
		if (row.status === 'paid') {
			unavailable.add(row.slot_id);
			continue;
		}
		if (row.reservation_expires_at && row.reservation_expires_at > nowIso) {
			unavailable.add(row.slot_id);
		}
	}

	return unavailable;
}

export function getReservationExpiryIso(): string {
	const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60_000);
	return expiresAt.toISOString();
}
