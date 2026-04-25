// Shared TypeScript types for the AiTutoring monorepo

export type PricingTierId = 'single' | 'bundle' | 'monthly';

export interface BookingSession {
	sessionType: PricingTierId;
	customerEmail?: string;
}

export interface CheckoutResponse {
	url: string;
}

export interface StripeSessionSummary {
	customerEmail: string | null;
	amountTotal: number | null;
	currency: string | null;
	sessionType: string | null;
}
