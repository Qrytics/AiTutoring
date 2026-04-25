import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripe } from '$lib/server/stripe';
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import type Stripe from 'stripe';

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
			// TODO: Extend this handler as needed, e.g.:
			//   • Send a confirmation email via Resend/SendGrid
			//   • Write a booking record to Supabase
			//   • Trigger a Calendly confirmation via its API
			console.log('✅  Payment completed', {
				sessionId: session.id,
				customerEmail: session.customer_details?.email,
				amountTotal: session.amount_total,
				currency: session.currency,
				sessionType: session.metadata?.sessionType
			});
			break;
		}

		case 'checkout.session.expired': {
			const session = event.data.object as Stripe.Checkout.Session;
			console.log('⚠️  Checkout session expired', { sessionId: session.id });
			break;
		}

		default:
			// Silently ignore unhandled event types.
			break;
	}

	return json({ received: true });
};
