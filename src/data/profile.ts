/**
 * Every fact on this site lives here. Nothing is hardcoded into the templates,
 * so a change to a role, a date or a link is made in one place.
 *
 * Please keep this in sync with the CV. Dates that could not be confirmed from
 * a primary source are marked UNVERIFIED.
 */

export const SITE_TITLE = 'Aadhavan P Anbumunee';
export const SITE_DESCRIPTION =
	'Machine learning and data science applied to medicine. Research on explainable ' +
	'diagnostic screening, production ML systems, and healthcare analytics.';

export const profile = {
	name: 'Aadhavan P Anbumunee',
	// How the name appears in the published record.
	preferredName: 'Aadhavan',
	role: 'Machine Learning and Data Science, applied to medicine',
	location: 'Atlanta, Georgia, United States',
	email: 'aadhavanpa@gmail.com',
	links: [
		{ label: 'Email', href: 'mailto:aadhavanpa@gmail.com', text: 'aadhavanpa@gmail.com' },
		{ label: 'GitHub', href: 'https://github.com/Aadhavann', text: 'github.com/Aadhavann' },
		{
			label: 'LinkedIn',
			href: 'https://www.linkedin.com/in/aadhavan-anbumunee/',
			text: 'in/aadhavan-anbumunee',
		},
		{ label: 'CV', href: '/resume.pdf', text: 'Resume (PDF)' },
	],
	intro: [
		'I build machine learning systems for healthcare and clinical decision support, ' +
			'from research through to production deployment.',
		'My research is on interpretable diagnostic screening: making a model\u2019s ' +
			'reasoning legible to the clinicians who have to act on it. My industry work is ' +
			'on the applied side of the same problem, in workers\u2019 compensation and ' +
			'healthcare analytics, where the outputs drive treatment and claim decisions.',
		'I am currently in Data & Analytics at Enlyte, and I am applying to MS programs in ' +
			'computer science for Fall 2027.',
	],
	interests: [
		'Explainable AI for clinical decision support',
		'Medical and biomedical imaging',
		'Applied machine learning in production',
		'Retrieval-augmented and fine-tuned language models',
	],
};

export interface Publication {
	title: string;
	authors?: { name: string; isMe?: boolean }[];
	venue?: string;
	venueNote?: string;
	date?: string;
	doi?: string;
	urls?: { label: string; href: string }[];
	repo?: string;
	abstract?: string;
	keywords?: string[];
}

export const publications: Publication[] = [
	{
		title: 'Image-Based Dysgraphia Detection with Explainability Using CAMs and EDI',
		authors: [
			{ name: 'Varsha Sreekumar' },
			{ name: 'Aadhavan P Anbumunee', isMe: true },
			{ name: 'Sudha Senthilkumar' },
		],
		venue:
			'2026 International Conference on Computing, Communication, Control and ' +
			'Cyber-Physical Systems (I5CPS)',
		venueNote: 'NIT Puducherry, 26 February 2026, pp. 1\u20136. IEEE.',
		date: '2026-02-26',
		doi: '10.1109/I5CPS67958.2026.11452617',
		urls: [
			{ label: 'IEEE Xplore', href: 'https://ieeexplore.ieee.org/document/11452617/' },
			{ label: 'DOI', href: 'https://doi.org/10.1109/I5CPS67958.2026.11452617' },
		],
		repo: 'https://github.com/Aadhavann/Dysgraphia-Detection',
		abstract:
			'Dysgraphia is a learning disability that affects handwriting quality and can lead to ' +
			'poor academic outcomes if not diagnosed early. Simple diagnosis methods like manual ' +
			'observation can be subjective, and specialised tablet-based detection does not scale. ' +
			'We propose an explainable image-based detection framework using scanned notebook pages ' +
			'for accessible, low-cost screening in educational and clinical settings. It combines ' +
			'deep learning with a novel Explainable Dysgraphia Index (EDI) that quantifies ' +
			'handwriting traits weighted by Score-CAM activations, helping justify classification ' +
			'using clinically meaningful features. The framework uses ResNet-18 trained on the ' +
			'Mendeley Potential Dysgraphia dataset with writer-independent splits for ' +
			'generalisation. Score-CAM produces visual heatmaps showing which handwriting regions ' +
			'contributed to each decision, while EDI combines normalised features with CAM ' +
			'attention to give both numeric and visual explanations. The CNN and EDI fusion ' +
			'achieved 92% accuracy and 0.98 AUC, indicating that explainable features improve ' +
			'performance while giving clinicians interpretable insight.',
		keywords: [
			'explainable AI',
			'Score-CAM',
			'ResNet-18',
			'PyTorch',
			'medical screening',
			'pediatric',
		],
	},
];

export interface Venture {
	name: string;
	role: string;
	href: string;
	blurb: string;
	highlights: string[];
	stack?: string[];
}

export const ventures: Venture[] = [
	{
		name: 'Sstudize',
		role: 'Co-founder',
		href: 'https://sstudize.co.in/',
		blurb:
			'A learning platform for underprivileged students. Pre-incubated at VIT Vellore, with ' +
			'associations including GDC, IIT Madras and PIEDS, BITS Pilani.',
		highlights: [
			'Recipient of the TIDE 2.0 non-equity seed grant from the Ministry of Electronics and ' +
				'Information Technology, Government of India.',
			'Predictive ML models that increased user engagement by 30% through personalised ' +
				'learning roadmaps.',
			'Agentic AI features in a native Android app for dynamic student profiling and ' +
				'adaptive recommendations.',
		],
		stack: ['Python', 'Android', 'ML'],
	},
];

export interface Role {
	title: string;
	org: string;
	orgHref?: string;
	location: string;
	start: string;
	end: string;
	summary?: string;
	highlights: string[];
	stack?: string[];
}

export const experience: Role[] = [
	{
		title: 'Data & Analytics',
		org: 'Enlyte',
		location: 'Atlanta, GA',
		start: 'Jun 2026',
		end: 'Present',
		summary:
			'Workers\u2019 compensation and auto casualty. The work is healthcare-adjacent by ' +
			'nature: treatment authorisation, injury classification and medical cost.',
		highlights: [
			'Built an AI-powered analytics agent, integrated with dashboards across the ' +
				'organisation, that detects significant metric anomalies and identifies the affected ' +
				'client, line of business or region using external risk factors to accelerate analysis.',
			'Built and maintained SQL data pipelines on Snowflake, troubleshooting data quality ' +
				'across datasets with millions of records.',
			'Developed dashboards, simulations and forecasting models analysing client behaviour ' +
				'and monitoring KPIs to support business decisions.',
		],
		stack: ['Python', 'SQL', 'Snowflake', 'LLM agents'],
	},
	{
		title: 'AI Engineer',
		org: 'RagaAI',
		location: 'Bengaluru, India',
		start: 'Dec 2025',
		end: 'Jun 2026',
		summary: 'Production LLM systems for United States healthcare providers and clinics.',
		highlights: [
			'Developed a no-show prediction agent that reduced patient no-shows by 60%, owning the ' +
				'full model lifecycle from data acquisition through production deployment.',
			'Built and deployed production-grade LLM solutions for global clients, including US ' +
				'healthcare providers and clinics.',
			'Contributed to an agent building and orchestration framework enabling rapid creation, ' +
				'testing and deployment of AI agents.',
			'Automated Verification of Benefits and prior-authorisation workflows through RPA and ' +
				'agentic AI, reducing the risk of fraudulent and erroneous claims processing.',
		],
		stack: ['Python', 'LLM orchestration', 'RPA', 'healthcare APIs'],
	},
	{
		title: 'Research Intern, BFSI',
		org: 'Tata Consultancy Services R&D',
		location: 'Bengaluru, India',
		start: 'May 2025',
		end: 'Jul 2025',
		highlights: [
			'Built an AI-powered design-to-code pipeline using LangChain and TypeScript that ' +
				'generates production-ready React components from Figma designs via the Azure OpenAI API.',
			'Integrated agentic AI features into SDLC workflows, automating front-end tasks and ' +
				'reducing manual effort.',
			'Accelerated front-end development velocity by 25% for the platform MVP through ' +
				'workflow orchestration.',
		],
		stack: ['TypeScript', 'LangChain', 'Azure OpenAI', 'React'],
	},
];

export interface Project {
	name: string;
	role: string;
	blurb: string;
	highlights?: string[];
	links: { label: string; href: string }[];
	stack?: string[];
}

export const projects: Project[] = [
	{
		name: 'Project Elion',
		role: 'Solo',
		blurb:
			'A molecular property prediction platform built on TxGemma, for exploring how ' +
			'therapeutics-relevant properties can be predicted from structure alone.',
		highlights: [
			'Structural input through a Ketcher editor, with SMILES handling for real molecules.',
			'Regression rescaling so predicted properties are reported on their native scale.',
			'An "Ask Why" view that surfaces the model\u2019s reasoning alongside each prediction.',
		],
		links: [
			{ label: 'Live demo', href: 'https://project-elion.vercel.app' },
			{ label: 'Code', href: 'https://github.com/Aadhavann/project-elion' },
		],
		stack: ['TypeScript', 'Next.js', 'TxGemma'],
	},
];

export const education = [
	{
		degree: 'B.Tech, Computer Science and Engineering',
		org: 'Vellore Institute of Technology, Vellore',
		// UNVERIFIED: derived from a 2022 entry cohort and a four-year degree.
		// Confirm before publishing.
		start: '2022',
		end: '2026',
		detail: 'CGPA 8.64 / 10.0',
	},
];

export const certifications = [
	{ name: 'AWS Certified Machine Learning \u2013 Specialty', issuer: 'Amazon Web Services', date: 'Nov 2025' },
	{ name: 'AWS Certified Solutions Architect \u2013 Associate', issuer: 'Amazon Web Services', date: 'Jun 2025' },
	{ name: 'Microsoft Certified: Azure AI Engineer Associate', issuer: 'Microsoft', date: 'Jun 2025' },
];

export const writing = [
	'Python',
	'TypeScript',
	'SQL',
	'PyTorch',
	'scikit-learn',
	'LangChain',
	'LLM agents and orchestration',
	'Retrieval-augmented generation',
	'LoRA and parameter-efficient fine-tuning',
	'Explainable AI (Score-CAM, Grad-CAM)',
	'OpenCV and computer vision',
	'Snowflake',
	'AWS',
	'Azure AI',
	'Next.js and React',
];
