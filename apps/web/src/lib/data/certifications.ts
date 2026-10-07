/**
 * Credentials, as listed by Mario. Drives the landing page's credentials section.
 *
 * TWIN FILE: the portfolio (portfolioSite) keeps the original at `src/lib/data/certifications.ts`,
 * which also drives mario-belmonte.com/certifications (the two repos share no package). Add a
 * credential in both places.
 *
 * Dates are exactly as the issuer shows them: some credentials show an issue date, others only an
 * expiry, and the Microsoft ones were given without dates — none are invented. `image` and
 * `verifyUrl` are empty until the official badge art (Credly / Microsoft Learn) and verification
 * links are added; when `image` is set it replaces the drawn medallion.
 */

export type CertGroup = 'Microsoft' | 'Anthropic' | 'Google Cloud' | 'Red Hat' | 'ServiceNow' | 'IBM';
export type CertCategory = 'quantum' | 'ai' | 'data' | 'cloud' | 'security' | 'dev' | 'business' | 'design';

export interface Certification {
	id: string;
	title: string;
	/** As printed on the credential (e.g. "IBM SkillsBuild"); `group` is what the list files it under. */
	issuer: string;
	group: CertGroup;
	category: CertCategory;
	/** Short label drawn in the medallion: an exam code, or the credential's initials. */
	code: string;
	/** ISO dates (YYYY-MM-DD). */
	issued?: string;
	expires?: string;
	/** Position in the featured row (1 = first). Featured credentials get the large gold badge. */
	featured?: number;
	/** Official badge art, e.g. a Credly image URL or a file under `static/`. */
	image?: string;
	/** Public verification page (Credly, Microsoft Learn transcript). */
	verifyUrl?: string;
}

/** Display order of the groups, and the tint each medallion is drawn in. Tints, not logos. */
export const CERT_GROUPS: ReadonlyArray<{ id: CertGroup; tint: string }> = [
	{ id: 'Microsoft', tint: '#1f9bf0' },
	{ id: 'Anthropic', tint: '#d97757' },
	{ id: 'Google Cloud', tint: '#3fae67' },
	{ id: 'Red Hat', tint: '#e5484d' },
	{ id: 'ServiceNow', tint: '#9b87f5' },
	{ id: 'IBM', tint: '#4f8dff' }
];

export const groupTint = (g: CertGroup) => CERT_GROUPS.find((x) => x.id === g)?.tint ?? '#36f2c2';

const ibm = (
	id: string,
	title: string,
	code: string,
	category: CertCategory,
	dates: { issued?: string; expires?: string },
	extra: Partial<Certification> = {}
): Certification => ({ id, title, issuer: 'IBM', group: 'IBM', code, category, ...dates, ...extra });

export const certifications: Certification[] = [
	// ── Featured ──────────────────────────────────────────────────────────────
	ibm('ibm-general-formulation-quantum-info', 'General Formulation of Quantum Information', 'GFQI', 'quantum', { issued: '2026-08-24' }, { featured: 1 }),
	ibm('ibm-deep-learning-tensorflow', 'Deep Learning using TensorFlow', 'DLTF', 'ai', { issued: '2026-09-04' }, { featured: 2 }),
	{
		id: 'gcp-gemini-enterprise-agent-dev',
		title: 'Certified Partner Specialist: Gemini Enterprise Agent Development',
		issuer: 'Google Cloud',
		group: 'Google Cloud',
		code: 'GEAD',
		category: 'ai',
		expires: '2027-03-21',
		featured: 3
	},
	{
		id: 'anthropic-claude-certified-architect-pro',
		title: 'Claude Certified Architect – Professional',
		issuer: 'Anthropic',
		group: 'Anthropic',
		code: 'CCA-P',
		category: 'ai',
		expires: '2027-09-18',
		featured: 4
	},

	// ── Microsoft ─────────────────────────────────────────────────────────────
	{ id: 'ms-dp-900', title: 'Azure Data Fundamentals (DP-900)', issuer: 'Microsoft', group: 'Microsoft', code: 'DP-900', category: 'data' },
	{ id: 'ms-ai-901', title: 'Microsoft AI-901', issuer: 'Microsoft', group: 'Microsoft', code: 'AI-901', category: 'ai' },
	{ id: 'ms-gh-300', title: 'GitHub Copilot (GH-300)', issuer: 'Microsoft', group: 'Microsoft', code: 'GH-300', category: 'dev' },

	// ── Anthropic ─────────────────────────────────────────────────────────────
	{ id: 'anthropic-claude-certified-dev-foundations', title: 'Claude Certified Developer – Foundations', issuer: 'Anthropic', group: 'Anthropic', code: 'CCD-F', category: 'ai', expires: '2027-08-28' },
	{ id: 'anthropic-claude-partner-claude-code', title: 'Claude Partner Badge – Claude Code', issuer: 'Anthropic', group: 'Anthropic', code: 'CC', category: 'dev', expires: '2027-03-08' },

	// ── Google Cloud ──────────────────────────────────────────────────────────
	{ id: 'gcp-build-with-gemini', title: 'Build with Gemini', issuer: 'Google Cloud', group: 'Google Cloud', code: 'BWG', category: 'ai', issued: '2026-09-28' },
	{ id: 'gcp-antigravity', title: 'Accelerate Development with Antigravity', issuer: 'Google Cloud', group: 'Google Cloud', code: 'ADA', category: 'dev', issued: '2026-09-21' },
	{ id: 'gcp-adk-evaluate', title: 'Evaluate and Improve Agent Development Kit Agents', issuer: 'Google Cloud', group: 'Google Cloud', code: 'ADK', category: 'ai', issued: '2026-09-21' },
	{ id: 'gcp-adk-deploy', title: 'Deploy an Agent with Agent Development Kit (ADK)', issuer: 'Google Cloud', group: 'Google Cloud', code: 'ADK', category: 'cloud', issued: '2026-09-21' },

	// ── Red Hat ───────────────────────────────────────────────────────────────
	{ id: 'redhat-ai-platform-tdp-seller', title: 'AI Platform TDP: Seller', issuer: 'Red Hat', group: 'Red Hat', code: 'TDP', category: 'ai', expires: '2027-09-19' },
	{ id: 'redhat-2026-portfolio-seller-foundational', title: '2026 Portfolio Credential Seller Foundational', issuer: 'Red Hat', group: 'Red Hat', code: 'PCSF', category: 'business', expires: '2027-09-19' },

	// ── ServiceNow ────────────────────────────────────────────────────────────
	{ id: 'servicenow-delivery-ai-agents', title: 'Delivery Accreditation – AI Agents', issuer: 'ServiceNow', group: 'ServiceNow', code: 'DA-AI', category: 'ai', issued: '2026-09-17' },

	// ── IBM ───────────────────────────────────────────────────────────────────
	ibm('ibm-healthcare-jumpstart', 'Healthcare Industry Jumpstart', 'HIJ', 'business', { issued: '2026-09-18' }),
	ibm('ibm-data-viz-python', 'Data Visualization Using Python', 'DVP', 'data', { issued: '2026-09-04' }),
	ibm('ibm-quantum-safe-encryption', 'Quantum-Safe Encryption Essentials', 'QSE', 'security', { issued: '2026-08-25' }),
	ibm('ibm-basics-quantum-info', 'Basics of Quantum Information', 'BQI', 'quantum', { issued: '2026-08-20' }),
	ibm('ibm-fundamentals-quantum-algorithms', 'Fundamentals of Quantum Algorithms', 'FQA', 'quantum', { issued: '2026-08-14' }),
	ibm('ibm-kafka-pipelines', 'Simplifying Data Pipelines with Apache Kafka', 'KAFKA', 'data', { issued: '2026-08-12' }),
	ibm('ibm-edt-practitioner', 'Enterprise Design Thinking Practitioner', 'EDT', 'design', { issued: '2026-08-11' }, { issuer: 'IBM SkillsBuild' }),
	ibm('ibm-garage-essentials', 'IBM Garage Essentials', 'IGE', 'business', { issued: '2026-08-11' }),
	ibm('ibm-garage-foundation', 'IBM Garage Foundation', 'IGF', 'business', { issued: '2026-08-11' }),
	ibm('ibm-containers-kubernetes', 'Containers & Kubernetes Essentials', 'K8S', 'cloud', { issued: '2026-07-31' }),
	ibm('ibm-trustworthy-ai', 'Trustworthy AI and AI Ethics', 'TAI', 'ai', { issued: '2026-07-31' }),
	ibm('ibm-method-essential', 'Method Essential', 'ME', 'business', { issued: '2026-07-30' }),
	ibm('ibm-python-data-science', 'Python for Data Science', 'PY-DS', 'data', { issued: '2026-07-27' }),
	ibm('ibm-deep-learning-essentials', 'Deep Learning Essentials', 'DLE', 'ai', { issued: '2026-07-25' }),
	ibm('ibm-statistics-101', 'Statistics 101', 'ST-101', 'data', { issued: '2026-07-25' }),
	ibm('ibm-think-like-a-hacker', 'Think Like a Hacker', 'TLH', 'security', { issued: '2026-07-25' }),
	ibm('ibm-docker-essentials', 'Docker Essentials: A Developer Introduction', 'DKR', 'cloud', { issued: '2026-07-25' }),
	ibm('ibm-data-analysis-python', 'Data Analysis Using Python', 'DAP', 'data', { issued: '2026-07-24' }),
	ibm('ibm-data-viz-r', 'Data Visualization with R', 'DVR', 'data', { issued: '2026-07-24' }),
	ibm('ibm-cloud-native-multicloud', 'Building Cloud-Native and Multicloud Applications', 'CNMA', 'cloud', { issued: '2026-07-24' }),
	ibm('ibm-cloud-essentials', 'Cloud Essentials', 'CE', 'cloud', { issued: '2026-07-24' }),
	ibm('ibm-quantum-business-foundations', 'Quantum Business Foundations', 'QBF', 'quantum', { issued: '2026-07-22' }),
	ibm('ibm-generative-agentic-ai', 'IBM Generative & Agentic AI Foundation', 'GAAI', 'ai', { expires: '2027-07-23' }),
	ibm('ibm-bob-intermediate', 'IBM Bob Intermediate', 'BOB', 'dev', { expires: '2027-08-25' }),
	ibm('ibm-growth-behaviors', 'IBM Growth Behaviors', 'IGB', 'business', { expires: '2036-09-22' })
];

export const featuredCertifications = certifications
	.filter((c) => c.featured)
	.sort((a, b) => (a.featured ?? 0) - (b.featured ?? 0));

/** Everything not featured, grouped in `CERT_GROUPS` order (empty groups dropped). */
export const groupedCertifications = CERT_GROUPS.map((g) => ({
	...g,
	items: certifications.filter((c) => c.group === g.id && !c.featured)
})).filter((g) => g.items.length > 0);

const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** "Issued Aug 24, 2026" / "Expires Mar 21, 2027" / "Certified" when no date was given. */
export function certDateLabel(c: Certification): string {
	if (c.issued) return `Issued ${fmt.format(new Date(`${c.issued}T00:00:00Z`))}`;
	if (c.expires) return `Expires ${fmt.format(new Date(`${c.expires}T00:00:00Z`))}`;
	return 'Certified';
}
