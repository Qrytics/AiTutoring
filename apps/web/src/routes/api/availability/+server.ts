import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { getFutureSlots, getFutureSlotsInRange, getReservedSlotIds } from '$lib/server/booking';

export const GET: RequestHandler = async ({ url }) => {
	const start = url.searchParams.get('start');
	const end = url.searchParams.get('end');

	let slots;
	if (start || end) {
		if (!start || !end) {
			throw error(400, 'Both start and end query parameters are required.');
		}

		const startDate = new Date(start);
		const endDate = new Date(end);
		if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
			throw error(400, 'Invalid start or end query parameter.');
		}

		if (endDate <= startDate) {
			throw error(400, 'end must be greater than start.');
		}

		slots = await getFutureSlotsInRange(startDate.toISOString(), endDate.toISOString());
	} else {
		// Fallback for older clients that do not send month boundaries.
		slots = await getFutureSlots(400);
	}

	const unavailableSlotIds = await getReservedSlotIds(slots.map((slot) => slot.id));

	const availableSlots = slots
		.filter((slot) => !unavailableSlotIds.has(slot.id))
		.map((slot) => ({
			id: slot.id,
			startTime: slot.start_time,
			endTime: slot.end_time
		}));

	return json({ slots: availableSlots });
};
