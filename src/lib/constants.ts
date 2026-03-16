export const QUIZ_QUESTIONS = [
	{
		key: 'sleep_schedule' as const,
		question: 'Când te culci de obicei?',
		min: 1,
		max: 5,
		labels: ['22:00', '23:00', '00:00', '01:00', '02:00+'],
		type: 'slider' as const,
	},
	{
		key: 'cleanliness' as const,
		question: 'Cât de ordonat/ă ești?',
		min: 1,
		max: 5,
		labels: ['Relaxat', '', 'Moderat', '', 'Impecabil'],
		type: 'slider' as const,
	},
	{
		key: 'noise_tolerance' as const,
		question: 'Cum ești cu zgomotul?',
		min: 1,
		max: 5,
		labels: ['Liniște totală', '', 'Moderat', '', 'Nu mă deranjează'],
		type: 'slider' as const,
	},
	{
		key: 'guests_frequency' as const,
		question: 'Cât de des ai musafiri?',
		min: 1,
		max: 5,
		labels: ['Rar', '', 'Ocazional', '', 'Des'],
		type: 'slider' as const,
	},
	{
		key: 'smoking' as const,
		question: 'Fumezi?',
		options: [
			{ value: 0, label: 'Nu' },
			{ value: 1, label: 'Doar afară' },
			{ value: 2, label: 'Da' },
		],
		type: 'choice' as const,
	},
	{
		key: 'pets' as const,
		question: 'Ai sau vrei animale de companie?',
		options: [
			{ value: 0, label: 'Nu' },
			{ value: 1, label: 'Da' },
		],
		type: 'choice' as const,
	},
	{
		key: 'study_vs_social' as const,
		question: 'Cum îți petreci timpul liber acasă?',
		min: 1,
		max: 5,
		labels: ['Învăț/lucrez', '', '50/50', '', 'Socializez'],
		type: 'slider' as const,
	},
] as const;

export const BUCHAREST_SECTORS = [
	'Sector 1',
	'Sector 2',
	'Sector 3',
	'Sector 4',
	'Sector 5',
	'Sector 6',
	'Militari',
	'Drumul Taberei',
	'Titan',
	'Colentina',
	'Rahova',
	'Cotroceni',
	'Regie',
];

export const CATEGORY_LABELS: Record<string, string> = {
	documents: 'Acte',
	housing: 'Cazare',
	registration: 'Înregistrare',
	campus: 'Campus',
	transport: 'Transport',
	health: 'Sănătate',
};
