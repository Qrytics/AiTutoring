import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

// Singleton Stripe client — import this in all server-only files.
// Never import this module from a +page.svelte or any client-side code.
export const stripe = new Stripe(STRIPE_SECRET_KEY);
