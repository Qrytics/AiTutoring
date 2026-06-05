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

	const { data: existingEvent, error: existingEventError } = await supabase
		.from('stripe_webhook_events')
		.select('id,processed_at')
		.eq('id', event.id)
		.maybeSingle();

	if (existingEventError) {
		throw error(500, 'Could not verify webhook event state.');
	}

	if (existingEvent?.processed_at) {
		return json({ received: true, duplicate: true });
	}

	if (!existingEvent) {
		const { error: insertEventError } = await supabase.from('stripe_webhook_events').insert({
			id: event.id,
			type: event.type,
			payload: event as unknown as Record<string, unknown>
		});

		if (insertEventError) {
			throw error(500, 'Could not persist webhook event.');
		}
	}

	// Handle the events you care about.
	try {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				const metadataBookingId = session.metadata?.bookingId;

				let targetBookingId = metadataBookingId;
				if (!targetBookingId) {
					const { data: bySession, error: bySessionError } = await supabase
						.from('bookings')
						.select('id')
						.eq('stripe_session_id', session.id)
						.maybeSingle();

					if (bySessionError) {
						throw error(500, 'Could not resolve booking for completed checkout session.');
					}

					targetBookingId = bySession?.id;
				}

				if (!targetBookingId) {
					throw error(400, 'Could not resolve booking for completed checkout session.');
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
					.eq('id', targetBookingId)
					.in('status', ['reserved', 'expired']);

				if (updateError) {
					throw error(500, 'Failed to finalize booking after payment.');
				}

				console.log('✅  Payment completed', {
					sessionId: session.id,
					customerEmail: session.customer_details?.email,
					amountTotal: session.amount_total,
					currency: session.currency,
					sessionType: session.metadata?.sessionType,
					bookingId: targetBookingId
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

		const { error: markProcessedError } = await supabase
			.from('stripe_webhook_events')
			.update({
				processed_at: new Date().toISOString(),
				processing_error: null
			})
			.eq('id', event.id);

		if (markProcessedError) {
			throw error(500, 'Could not mark webhook as processed.');
		}
	} catch (err) {
		await supabase
			.from('stripe_webhook_events')
			.update({
				processing_error: err instanceof Error ? err.message : 'Webhook processing failed.'
			})
			.eq('id', event.id);

		throw err;
	}

	return json({ received: true });
};
