import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripe } from '$lib/server/stripe';
import {
	STRIPE_PRICE_ID_SINGLE,
	STRIPE_PRICE_ID_BUNDLE,
	STRIPE_PRICE_ID_MONTHLY
} from '$env/static/private';

// Map UI tier IDs → Stripe Price IDs (configured in .env / Vercel environment variables).
const PRICE_IDS: Record<string, string> = {
	single: STRIPE_PRICE_ID_SINGLE,
	bundle: STRIPE_PRICE_ID_BUNDLE,
	monthly: STRIPE_PRICE_ID_MONTHLY
};

export const POST: RequestHandler = async ({ request, url }) => {
	let body: { sessionType?: string; customerEmail?: string };

	try {
		body = await request.json();
	} catch {
		throw error(400, 'Request body must be valid JSON.');
	}

	const { sessionType, customerEmail } = body;

	if (!sessionType || typeof sessionType !== 'string') {
		throw error(400, 'Missing required field: sessionType.');
	}

	const priceId = PRICE_IDS[sessionType];
	if (!priceId) {
		throw error(400, `Unknown sessionType: "${sessionType}". Must be single, bundle, or monthly.`);
	}

	// Build absolute success / cancel URLs using the request origin so this
	// works both in local development and in production behind the /tutoring proxy.
	const basePath = '/tutoring';
	const origin = url.origin;
	const successUrl = `${origin}${basePath}/success?session_id={CHECKOUT_SESSION_ID}`;
	const cancelUrl = `${origin}${basePath}/cancel`;

	const session = await stripe.checkout.sessions.create({
		mode: 'payment',
		payment_method_types: ['card'],
		line_items: [{ price: priceId, quantity: 1 }],
		customer_email: customerEmail && customerEmail.trim() ? customerEmail.trim() : undefined,
		success_url: successUrl,
		cancel_url: cancelUrl,
		metadata: { sessionType }
	});

	if (!session.url) {
		throw error(500, 'Stripe did not return a checkout URL.');
	}

	return json({ url: session.url });
};
