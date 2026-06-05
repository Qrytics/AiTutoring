import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getReservationExpiryIso } from '$lib/server/booking';
import { supabase } from '$lib/server/supabase';

const RESERVATION_TOKEN_COOKIE = 'booking_reservation_token';

function getOrCreateReservationToken(cookies: Parameters<RequestHandler>[0]['cookies']): string {
	const existing = cookies.get(RESERVATION_TOKEN_COOKIE);
	if (existing) return existing;

	const created = crypto.randomUUID();
	cookies.set(RESERVATION_TOKEN_COOKIE, created, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: 60 * 60 * 24 * 30
	});
	return created;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	let body: { slotId?: string; timezone?: string };

	try {
		body = await request.json();
	} catch {
		throw error(400, 'Request body must be valid JSON.');
	}

	const slotId = body.slotId?.trim();
	const timezone = body.timezone?.trim() || 'UTC';
	const reservationToken = getOrCreateReservationToken(cookies);

	if (!slotId) {
		throw error(400, 'Missing required field: slotId.');
	}

	const { data: slot, error: slotError } = await supabase
		.from('available_slots')
		.select('id,start_time,end_time,is_active')
		.eq('id', slotId)
		.single();

	if (slotError || !slot || !slot.is_active) {
		throw error(404, 'That time slot is no longer available. Please pick another time.');
	}

	if (slot.start_time <= new Date().toISOString()) {
		throw error(400, 'Cannot reserve a past time slot.');
	}

	const nowIso = new Date().toISOString();
	const { data: existingBooking, error: bookingError } = await supabase
		.from('bookings')
		.select('id,status,reservation_expires_at,reservation_token,slot_start,slot_end')
		.eq('slot_id', slotId)
		.in('status', ['reserved', 'paid'])
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (bookingError) {
		throw error(500, 'Could not verify slot reservation status.');
	}

	if (
		existingBooking &&
		(existingBooking.status === 'paid' ||
			(existingBooking.status === 'reserved' && existingBooking.reservation_expires_at > nowIso))
	) {
		if (
			existingBooking.status === 'reserved' &&
			existingBooking.reservation_expires_at > nowIso &&
			existingBooking.reservation_token === reservationToken
		) {
			const refreshedExpiry = getReservationExpiryIso();
			const { data: refreshedBooking, error: refreshError } = await supabase
				.from('bookings')
				.update({ reservation_expires_at: refreshedExpiry, timezone })
				.eq('id', existingBooking.id)
				.select('id,slot_id,slot_start,slot_end,reservation_expires_at,status')
				.single();

			if (refreshError || !refreshedBooking) {
				throw error(500, 'Could not refresh your reservation. Please try again.');
			}

			return json({
				bookingId: refreshedBooking.id,
				slotId: refreshedBooking.slot_id,
				slotStart: refreshedBooking.slot_start,
				slotEnd: refreshedBooking.slot_end,
				status: refreshedBooking.status,
				reservationExpiresAt: refreshedBooking.reservation_expires_at
			});
		}

		throw error(409, 'That slot was just taken. Please choose another one.');
	}

	const reservationExpiresAt = getReservationExpiryIso();

	const { data: booking, error: createError } = await supabase
		.from('bookings')
		.insert({
			slot_id: slotId,
			slot_start: slot.start_time,
			slot_end: slot.end_time,
			timezone,
			reservation_token: reservationToken,
			status: 'reserved',
			reservation_expires_at: reservationExpiresAt
		})
		.select('id,slot_id,slot_start,slot_end,reservation_expires_at,status')
		.single();

	if (createError || !booking) {
		throw error(500, 'Could not reserve that slot. Please try again.');
	}

	return json({
		bookingId: booking.id,
		slotId: booking.slot_id,
		slotStart: booking.slot_start,
		slotEnd: booking.slot_end,
		status: booking.status,
		reservationExpiresAt: booking.reservation_expires_at
	});
};
