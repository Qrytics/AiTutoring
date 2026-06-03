import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFutureSlots, getReservedSlotIds } from '$lib/server/booking';

export const GET: RequestHandler = async () => {
	const slots = await getFutureSlots(120);
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
