import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent, params }) => {
	const { user } = await parent();

	const { data: person } = await locals.supabase
		.from('profiles')
		.select(
			'*, faculty:faculties(short_name, name, university:universities(short_name, name)), quiz_answers(*), roommate_preferences(*)'
		)
		.eq('id', params.id)
		.single();

	let myQuiz = null;
	if (user) {
		const { data } = await locals.supabase
			.from('quiz_answers')
			.select('*')
			.eq('profile_id', user.id)
			.single();
		myQuiz = data;
	}

	return { person, myQuiz };
};
