import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripe } from '$lib/server/stripe';
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import type Stripe from 'stripe';
import { supabase } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
	const sig = request.headers.get('stripe-signature');
	if (!sig) {
		throw error(400, 'Missing Stripe-Signature header.');
	}

	// Stripe requires the raw (unparsed) request body for signature verification.
	const rawBody = await request.text();

	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		const message =
			err instanceof Error ? err.message : 'Webhook signature verification failed.';
		throw error(400, message);
	}

	// Handle the events you care about.
	switch (event.type) {
		case 'checkout.session.completed': {
			const session = event.data.object as Stripe.Checkout.Session;
			const bookingId = session.metadata?.bookingId;

			if (!bookingId) {
				throw error(400, 'Missing bookingId metadata on checkout session.');
			}

			const { error: updateError } = await supabase
				.from('bookings')
				.update({
					status: 'paid',
					paid_at: new Date().toISOString(),
					stripe_session_id: session.id,
					customer_email:
						session.customer_details?.email ?? session.customer_email ?? null,
					session_type: session.metadata?.sessionType ?? 'single'
				})
				.eq('id', bookingId)
				.eq('status', 'reserved');

			if (updateError) {
				throw error(500, 'Failed to finalize booking after payment.');
			}

			console.log('✅  Payment completed', {
				sessionId: session.id,
				customerEmail: session.customer_details?.email,
				amountTotal: session.amount_total,
				currency: session.currency,
				sessionType: session.metadata?.sessionType,
				bookingId
			});
			break;
		}

		case 'checkout.session.expired': {
			const session = event.data.object as Stripe.Checkout.Session;
			const bookingId = session.metadata?.bookingId;

			if (bookingId) {
				await supabase
					.from('bookings')
					.update({ status: 'expired' })
					.eq('id', bookingId)
					.eq('status', 'reserved');
			}

			console.log('⚠️  Checkout session expired', { sessionId: session.id });
			break;
		}

		default:
			// Silently ignore unhandled event types.
			break;
	}

	return json({ received: true });
};
