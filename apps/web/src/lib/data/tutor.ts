// ─── Tutor profile ────────────────────────────────────────────────────────────

export const tutor = {
	name: 'Mario A. Belmonte',
	handle: 'mario-belmonte',
	tagline: '1-on-1 Technical Tutoring',
	headline: 'Learn code, circuits, and math — with a CMU engineer.',
	description:
		"I'm a graduating Electrical & Computer Engineering student at Carnegie Mellon. I tutor web development, algorithms, embedded systems, and engineering math through focused, live 1-on-1 sessions.",
	email: 'mario4.belmonte@gmail.com',
	github: 'https://github.com/Qrytics',
	linkedin: 'https://www.linkedin.com/in/mario-belmonte/',
	portfolioUrl: 'https://mario-belmonte.com',
	// Fallback Calendly URL used when PUBLIC_CALENDLY_URL env var is not set.
	// In production the env var takes precedence (see routes/book/+page.svelte).
	// Update this value OR set PUBLIC_CALENDLY_URL — keeping them in sync avoids confusion.
	calendlyUrl: 'https://calendly.com/mario4-belmonte/tutoring-session'
};

// ─── Subjects ─────────────────────────────────────────────────────────────────

export interface Subject {
	title: string;
	description: string;
	tags: string[];
	icon: string;
}

export const subjects: Subject[] = [
	{
		title: 'Web Development',
		description:
			'HTML, CSS, JavaScript, TypeScript, React, Next.js, SvelteKit — from static sites to full-stack apps.',
		tags: ['HTML/CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js'],
		icon: '⬡'
	},
	{
		title: 'Programming Fundamentals',
		description:
			'Python, C, C++ — data structures, algorithms, and systematic problem-solving.',
		tags: ['Python', 'C', 'C++', 'Algorithms', 'Data Structures'],
		icon: '⟨/⟩'
	},
	{
		title: 'Backend & Systems',
		description: 'REST APIs, SQL/NoSQL databases, Docker, Linux, and scalable backend design.',
		tags: ['FastAPI', 'REST', 'PostgreSQL', 'Docker', 'Linux'],
		icon: '⬛'
	},
	{
		title: 'Electrical Engineering',
		description:
			'Circuit analysis, digital logic, embedded systems, FPGA design, and microcontrollers.',
		tags: ['Circuits', 'Digital Logic', 'FPGA', 'Embedded', 'SystemVerilog'],
		icon: '⚡'
	},
	{
		title: 'Machine Learning',
		description:
			'PyTorch fundamentals, training neural networks, and applied ML/computer-vision projects.',
		tags: ['PyTorch', 'Python', 'Neural Nets', 'Computer Vision'],
		icon: '◈'
	},
	{
		title: 'Engineering Math',
		description:
			'Calculus, linear algebra, discrete mathematics, and signals & systems.',
		tags: ['Calculus', 'Linear Algebra', 'Discrete Math', 'Signals'],
		icon: '∑'
	}
];

// ─── Pricing ──────────────────────────────────────────────────────────────────

export interface PricingTier {
	id: string;
	name: string;
	price: number;
	unit: string;
	pricePerHour?: number;
	savings?: number;
	description: string;
	features: string[];
	popular: boolean;
}

export const pricingTiers: PricingTier[] = [
	{
		id: 'single',
		name: 'Single Session',
		price: 60,
		unit: '/hr',
		description: 'One 60-minute session. Perfect for getting unstuck on a specific problem.',
		features: [
			'60-minute live video call',
			'Live coding & screen sharing',
			'Session notes sent after',
			'Follow-up questions by email'
		],
		popular: false
	},
	{
		id: 'bundle',
		name: '5-Session Bundle',
		price: 275,
		unit: '/bundle',
		pricePerHour: 55,
		savings: 25,
		description: 'Five 60-minute sessions. Best for a focused sprint through a topic.',
		features: [
			'5 × 60-minute live video calls',
			'Live coding & screen sharing',
			'Session notes for each call',
			'Priority scheduling',
			'Async Q&A between sessions'
		],
		popular: true
	},
	{
		id: 'monthly',
		name: 'Monthly Plan',
		price: 400,
		unit: '/mo',
		pricePerHour: 50,
		savings: 80,
		description: 'Eight sessions per month. Ongoing support for coursework or projects.',
		features: [
			'8 × 60-minute live video calls',
			'Live coding & screen sharing',
			'Session notes for each call',
			'Priority scheduling',
			'Async Slack/Discord support',
			'Cancel anytime'
		],
		popular: false
	}
];

// ─── How it works ─────────────────────────────────────────────────────────────

export interface Step {
	number: string;
	title: string;
	description: string;
}

export const steps: Step[] = [
	{
		number: '01',
		title: 'Pick a time',
		description:
			"Choose a slot that works for you on the Calendly scheduler. You'll get a calendar invite and a reminder before the session."
	},
	{
		number: '02',
		title: 'Complete payment',
		description:
			"After booking, pay securely via Stripe Checkout. You'll receive a receipt and booking confirmation by email."
	},
	{
		number: '03',
		title: 'Join and learn',
		description:
			"Join the video call at the scheduled time. Bring your questions, share your screen, and we'll work through it together."
	}
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export interface FaqItem {
	question: string;
	answer: string;
}

export const faq: FaqItem[] = [
	{
		question: 'How do sessions work?',
		answer:
			"We meet on a live video call (Google Meet or Zoom). You share your screen, show me what you're working on, and we work through it together. Every session is live — no pre-recorded content."
	},
	{
		question: 'What do I need before my first session?',
		answer:
			'Just a laptop, your code editor or course materials, and a specific question or topic to tackle. No special setup required.'
	},
	{
		question: 'Do you tutor beginners?',
		answer:
			"Absolutely. Whether you're writing your first for-loop or debugging a tricky React state issue, I'll meet you where you are and explain things step by step."
	},
	{
		question: 'Can I book for a specific assignment or exam?',
		answer:
			'Yes. Mention the topic or assignment when you book so I can prepare relevant examples and exercises in advance.'
	},
	{
		question: 'What if I need to reschedule?',
		answer:
			'You can reschedule or cancel up to 24 hours before the session at no charge, directly through the Calendly link.'
	},
	{
		question: 'How do payments work?',
		answer:
			"After booking a time on Calendly, you'll come back here to pay. Payments are processed securely via Stripe Checkout — your card details are never stored by this site."
	},
	{
		question: 'What video platform do we use?',
		answer:
			"Google Meet is the default, but I'm happy to use Zoom, Discord, or whatever works best for you. Just mention your preference when booking."
	}
];
