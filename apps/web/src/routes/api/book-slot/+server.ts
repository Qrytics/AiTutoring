import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getReservationExpiryIso } from '$lib/server/booking';
import { supabase } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
	let body: { slotId?: string; timezone?: string };

	try {
		body = await request.json();
	} catch {
		throw error(400, 'Request body must be valid JSON.');
	}

	const slotId = body.slotId?.trim();
	const timezone = body.timezone?.trim() || 'UTC';

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
		.select('id,status,reservation_expires_at')
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
			status: 'reserved',
			reservation_expires_at: reservationExpiresAt
		})
		.select('id,slot_start,slot_end,reservation_expires_at,status')
		.single();

	if (createError || !booking) {
		throw error(500, 'Could not reserve that slot. Please try again.');
	}

	return json({
		bookingId: booking.id,
		slotStart: booking.slot_start,
		slotEnd: booking.slot_end,
		status: booking.status,
		reservationExpiresAt: booking.reservation_expires_at
	});
};
