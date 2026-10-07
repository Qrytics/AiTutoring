/**
 * Everything editable about the site lives here: who you are, when you're free, how people pay you,
 * and all the copy. Nothing else needs touching for day-to-day changes.
 */

// ─── Tutor profile ────────────────────────────────────────────────────────────

export const tutor = {
	name: 'Mario A. Belmonte',
	handle: 'mario-belmonte',
	tagline: '1-on-1 Technical Tutoring',
	headline: 'Learn code, circuits, and system design — with a CMU engineer.',
	description:
		"I'm an Electrical & Computer Engineering graduate from Carnegie Mellon. I tutor web development, programming fundamentals, system design, and circuit analysis in focused, live 1-on-1 sessions.",
	email: 'mario4.belmonte@gmail.com',
	github: 'https://github.com/Qrytics',
	linkedin: 'https://www.linkedin.com/in/mario-belmonte/',
	portfolioUrl: 'https://mario-belmonte.com'
};

// ─── Session & price ──────────────────────────────────────────────────────────

export const session = {
	minutes: 60,
	price: 20
};

// ─── Payment ──────────────────────────────────────────────────────────────────
//
// Fill these in. Any method left as '' is simply not shown, so the site can never send someone's
// money to a placeholder. With all three empty, the booking page says payment details will come
// with the confirmation email instead.

export const payments = {
	/** Venmo username, without the @ — e.g. 'mario-belmonte'. */
	venmo: '',
	/** Cash App $cashtag, without the $ — e.g. 'mariob'. */
	cashApp: '',
	/** The email or US phone number registered with Zelle. Zelle has no pay links, so this is shown with a copy button. */
	zelle: ''
};

// ─── Availability ─────────────────────────────────────────────────────────────
//
// Your recurring weekly hours, in *your* time zone. Visitors see them converted to theirs.
// Each window is split into back-to-back sessions of `session.minutes`.
// Weekday keys: 0 = Sunday … 6 = Saturday. These are starting defaults — set your real hours.

export const availability = {
	timeZone: 'America/New_York',
	weekly: {
		0: [['12:00', '17:00']],
		1: [['18:00', '21:00']],
		2: [['18:00', '21:00']],
		3: [['18:00', '21:00']],
		4: [['18:00', '21:00']],
		5: [],
		6: [['12:00', '17:00']]
	} as Record<number, [string, string][]>,
	/** Earliest bookable slot, in hours from now — time for you to see the request and confirm. */
	minNoticeHours: 24,
	/** How far ahead people can book. */
	horizonDays: 21,
	/** Specific dates you're away, as 'YYYY-MM-DD' in your time zone. */
	blackoutDates: [] as string[]
};

export const meetingPlatforms = ['Google Meet', 'Zoom', 'Discord'] as const;

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
			'HTML, CSS, JavaScript, TypeScript, React, Next.js, SvelteKit — from a first static page to full-stack apps.',
		tags: ['HTML/CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js'],
		icon: '⬡'
	},
	{
		title: 'Programming Fundamentals',
		description: 'Python, C, C++ — data structures, algorithms, and systematic problem-solving.',
		tags: ['Python', 'C', 'C++', 'Algorithms', 'Data Structures'],
		icon: '⟨/⟩'
	},
	{
		title: 'System Design',
		description:
			'The basics of system design choices: tradeoffs, architecture patterns, scalability, reliability, and data modeling.',
		tags: ['Tradeoffs', 'Architecture', 'Scalability', 'Reliability', 'Data Modeling'],
		icon: '◫'
	},
	{
		title: 'Electrical / Software Engineering',
		description:
			'Circuit diagram analysis, plus guidance on college planning, classes, career paths, target companies, and interviews.',
		tags: ['Circuit Analysis', 'Class Planning', 'Career Advice', 'Applications', 'Interviews'],
		icon: '⚡'
	},
	{
		title: 'Build Your Project',
		description:
			'End-to-end project building: GitHub workflows, CI/CD and deployment, clean architecture, and AI-first tools like Cursor, Copilot and Claude.',
		tags: ['GitHub', 'CI/CD', 'Deployment', 'AI Tools'],
		icon: '▲'
	}
];

export interface Resource {
	title: string;
	url: string;
	description: string;
}

export const resources: Resource[] = [
	{
		title: 'LeetCode',
		url: 'https://leetcode.com',
		description: 'Practice coding interview problems with curated topic sets and difficulty filters.'
	},
	{
		title: 'AI Engineering From Scratch',
		url: 'https://github.com/rohitg00/ai-engineering-from-scratch',
		description: 'A practical GitHub resource for building AI engineering fundamentals from the ground up.'
	}
];

export const sessionFeatures = [
	`${session.minutes}-minute live video call`,
	'Live coding & screen sharing',
	'Session notes sent after',
	'Follow-up questions by email'
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
			'Choose an open slot on the booking page — times are shown in your own time zone — and tell me what you want to work on.'
	},
	{
		number: '02',
		title: 'Pay & send',
		description:
			'Pay with Venmo, Cash App or Zelle in one tap, then send your booking request. I confirm by email, usually within a few hours.'
	},
	{
		number: '03',
		title: 'Join and learn',
		description:
			"Hop on the call at your time. Bring your questions, share your screen, and we'll work through it together."
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
			"We meet on a live video call. You share your screen, show me what you're working on, and we work through it together. Every session is live — no pre-recorded content."
	},
	{
		question: 'How do I pay?',
		answer:
			'Venmo, Cash App or Zelle — the booking page fills in the amount and a note for you. No accounts, no card forms, and nothing is stored on this site.'
	},
	{
		question: "What if my time gets taken or doesn't work?",
		answer:
			"Requests are confirmed by email. If two people ask for the same slot, I'll offer you the nearest open time — and if nothing works, you get a full refund."
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
		answer: 'Email me at least 24 hours before your session to reschedule or cancel at no charge.'
	},
	{
		question: 'What video platform do we use?',
		answer: 'Google Meet by default, but Zoom or Discord work too — pick one when you book.'
	}
];
