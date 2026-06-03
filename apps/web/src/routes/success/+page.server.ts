import type { PageServerLoad } from './$types';
import { stripe } from '$lib/server/stripe';
import { supabase } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ url }) => {
	const sessionId = url.searchParams.get('session_id');
	if (!sessionId) return { session: null };

	try {
		const session = await stripe.checkout.sessions.retrieve(sessionId);

		let booking: {
			slotStart: string;
			slotEnd: string;
			timezone: string;
		} | null = null;

		const { data: bookingRow } = await supabase
			.from('bookings')
			.select('slot_start,slot_end,timezone')
			.eq('stripe_session_id', sessionId)
			.maybeSingle();

		if (bookingRow) {
			booking = {
				slotStart: bookingRow.slot_start,
				slotEnd: bookingRow.slot_end,
				timezone: bookingRow.timezone
			};
		}

		return {
			session: {
				customerEmail: session.customer_details?.email ?? null,
				amountTotal: session.amount_total,
				currency: session.currency,
				sessionType: (session.metadata?.sessionType as string) ?? null
			},
			booking
		};
	} catch {
		// If the session ID is invalid or the Stripe call fails, degrade gracefully.
		return { session: null, booking: null };
	}
};
