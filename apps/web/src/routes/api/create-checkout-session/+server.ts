import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripe } from '$lib/server/stripe';
import { STRIPE_PRICE_ID_SINGLE } from '$env/static/private';
import { BASE_PATH } from '$lib/config';
import { supabase } from '$lib/server/supabase';

// Native booking checkout is intentionally limited to single sessions.
const PRICE_IDS: Record<string, string> = {
	single: STRIPE_PRICE_ID_SINGLE
};

export const POST: RequestHandler = async ({ request, url }) => {
	let body: { sessionType?: string; customerEmail?: string; bookingId?: string };

	try {
		body = await request.json();
	} catch {
		throw error(400, 'Request body must be valid JSON.');
	}

	const { sessionType, customerEmail, bookingId } = body;

	if (!sessionType || typeof sessionType !== 'string') {
		throw error(400, 'Missing required field: sessionType.');
	}

	if (!bookingId || typeof bookingId !== 'string') {
		throw error(400, 'Missing required field: bookingId. Book a time slot before checkout.');
	}

	const priceId = PRICE_IDS[sessionType];
	if (!priceId) {
		throw error(400, `Unknown sessionType: "${sessionType}". Must be single.`);
	}

	if (sessionType !== 'single') {
		throw error(400, 'Native scheduling is currently available for single sessions only.');
	}

	const nowIso = new Date().toISOString();
	const { data: booking, error: bookingError } = await supabase
		.from('bookings')
		.select('id,status,reservation_expires_at,slot_start')
		.eq('id', bookingId)
		.maybeSingle();

	if (bookingError || !booking) {
		throw error(404, 'Booking reservation not found. Please choose a time slot again.');
	}

	if (booking.status === 'paid') {
		throw error(400, 'This booking has already been paid.');
	}

	if (booking.status !== 'reserved' || booking.reservation_expires_at <= nowIso) {
		throw error(409, 'This reservation expired. Please choose a time slot again.');
	}

	if (booking.slot_start <= nowIso) {
		throw error(400, 'Cannot pay for a past session. Please choose a new slot.');
	}

	// Build absolute success / cancel URLs using the request origin so this
	// works both in local development and in production behind the /tutoring proxy.
	const origin = url.origin;
	const successUrl = `${origin}${BASE_PATH}/success?session_id={CHECKOUT_SESSION_ID}`;
	const cancelUrl = `${origin}${BASE_PATH}/cancel`;

	const session = await stripe.checkout.sessions.create({
		mode: 'payment',
		payment_method_types: ['card'],
		line_items: [{ price: priceId, quantity: 1 }],
		customer_email: customerEmail && customerEmail.trim() ? customerEmail.trim() : undefined,
		success_url: successUrl,
		cancel_url: cancelUrl,
		metadata: { sessionType, bookingId }
	});

	const { error: updateError } = await supabase
		.from('bookings')
		.update({
			stripe_session_id: session.id,
			session_type: sessionType,
			customer_email: customerEmail && customerEmail.trim() ? customerEmail.trim() : null
		})
		.eq('id', bookingId);

	if (updateError) {
		throw error(500, 'Could not link checkout to booking. Please try again.');
	}

	if (!session.url) {
		throw error(500, 'Stripe did not return a checkout URL.');
	}

	return json({ url: session.url });
};
