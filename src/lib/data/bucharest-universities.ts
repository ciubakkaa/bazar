export type UniversityGroup = {
	short?: string;
	name: string;
	faculties: string[];
};

export const bucharestUniversities: UniversityGroup[] = [
	{
		short: 'UPB',
		name: 'UPB — Universitatea Politehnica',
		faculties: [
			'Automatica si Calculatoare',
			'Electronica, Telecomunicatii si Tehnologia Informatiei',
			'Inginerie Electrica',
			'Energetica',
			'Inginerie Mecanica si Mecatronica',
			'Inginerie Industriala si Robotica',
			'Stiinta si Ingineria Materialelor',
			'Inginerie Chimica si Biotehnologii',
			'Transporturi',
			'Inginerie Aerospatiala',
			'Inginerie in Limbi Straine',
			'Inginerie Medicala',
			'Antreprenoriat, Ingineria si Managementul Afacerilor',
		],
	},
	{
		short: 'UB',
		name: 'UB — Universitatea din Bucuresti',
		faculties: [
			'Matematica si Informatica',
			'Fizica',
			'Chimie',
			'Biologie',
			'Geologie si Geofizica',
			'Geografie',
			'Litere',
			'Limbi si Literaturi Straine',
			'Istorie',
			'Filosofie',
			'Sociologie si Asistenta Sociala',
			'Psihologie si Stiintele Educatiei',
			'Stiinte Politice',
			'Jurnalism si Stiintele Comunicarii',
			'Drept',
			'Administratie si Afaceri',
			'Teologie Ortodoxa',
			'Teologie Romano-Catolica',
			'Teologie Baptista',
		],
	},
	{
		short: 'ASE',
		name: 'ASE — Academia de Studii Economice',
		faculties: [
			'Cibernetica, Statistica si Informatica Economica',
			'Contabilitate si Informatica de Gestiune',
			'Finante, Asigurari, Banci si Burse de Valori',
			'Management',
			'Marketing',
			'Economie Teoretica si Aplicata',
			'Administrarea Afacerilor (cu predare in limbi straine)',
			'Relatii Economice Internationale',
			'Administratie si Management Public',
			'Economie Agroalimentara si a Mediului',
			'Business si Turism',
		],
	},
	{
		short: 'UMF',
		name: 'UMF Carol Davila',
		faculties: ['Medicina', 'Medicina Dentara', 'Farmacie', 'Moase si Asistenta Medicala'],
	},
	{
		name: 'SNSPA — Scoala Nationala de Studii Politice si Administrative',
		faculties: [
			'Stiinte Politice',
			'Administratie Publica',
			'Comunicare si Relatii Publice',
			'Management',
			'Sociologie',
		],
	},
	{
		name: 'UNATC — Universitatea Nationala de Arta Teatrala si Cinematografica',
		faculties: ['Teatru', 'Film'],
	},
	{
		name: 'UAUIM — Universitatea de Arhitectura "Ion Mincu"',
		faculties: ['Arhitectura', 'Urbanism', 'Arhitectura de Interior'],
	},
	{
		name: 'USAMV — Universitatea de Stiinte Agronomice si Medicina Veterinara',
		faculties: [
			'Agricultura',
			'Horticultura',
			'Zootehnie',
			'Medicina Veterinara',
			'Imbunatatiri Funciare si Ingineria Mediului',
			'Biotehnologii',
			'Management si Dezvoltare Rurala',
		],
	},
	{
		name: 'UNMB — Universitatea Nationala de Muzica',
		faculties: ['Interpretare Muzicala', 'Compozitie, Muzicologie si Pedagogie Muzicala'],
	},
	{
		name: 'UNARTE — Universitatea Nationala de Arte',
		faculties: ['Arte Plastice', 'Arte Decorative si Design', 'Istoria si Teoria Artei'],
	},
	{
		name: 'ANEFS — Academia Nationala de Educatie Fizica si Sport',
		faculties: ['Educatie Fizica si Sport', 'Kinetoterapie'],
	},
	{
		name: 'Universitatea Romano-Americana',
		faculties: [
			'Informatica Manageriala',
			'Management-Marketing',
			'Drept',
			'Relatii Internationale si Studii Europene',
			'Studii Economice Europene',
			'Economia Turismului Intern si International',
		],
	},
	{
		name: 'Universitatea Titu Maiorescu',
		faculties: [
			'Drept',
			'Medicina',
			'Medicina Dentara',
			'Farmacie',
			'Informatica',
			'Psihologie',
			'Stiinte Economice',
		],
	},
	{
		name: 'Universitatea Spiru Haret',
		faculties: [
			'Drept si Administratie Publica',
			'Stiinte Economice',
			'Psihologie si Stiintele Educatiei',
			'Stiinte Juridice, Economice si Administrative',
		],
	},
	{
		name: 'Universitatea Crestina Dimitrie Cantemir',
		faculties: [
			'Drept',
			'Stiinte Economice',
			'Limbi si Literaturi Straine',
			'Relatii Internationale, Istorie si Filosofie',
		],
	},
	{
		name: 'Universitatea Nicolae Titulescu',
		faculties: ['Drept', 'Stiinte Economice', 'Stiinte Sociale si Administrative'],
	},
	{
		name: 'Universitatea Hyperion',
		faculties: [
			'Stiinte Economice',
			'Stiinte Juridice si Administrative',
			'Jurnalism',
			'Arte',
			'Psihologie si Stiintele Educatiei',
		],
	},
];
