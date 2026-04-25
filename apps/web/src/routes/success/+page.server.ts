import type { PageServerLoad } from './$types';
import { stripe } from '$lib/server/stripe';

export const load: PageServerLoad = async ({ url }) => {
	const sessionId = url.searchParams.get('session_id');
	if (!sessionId) return { session: null };

	try {
		const session = await stripe.checkout.sessions.retrieve(sessionId);
		return {
			session: {
				customerEmail: session.customer_details?.email ?? null,
				amountTotal: session.amount_total,
				currency: session.currency,
				sessionType: (session.metadata?.sessionType as string) ?? null
			}
		};
	} catch {
		// If the session ID is invalid or the Stripe call fails, degrade gracefully.
		return { session: null };
	}
};
