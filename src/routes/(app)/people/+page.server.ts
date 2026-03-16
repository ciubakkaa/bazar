import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user } = await parent();
	if (!user) return { people: [], myQuiz: null };

	const { data: myQuiz } = await locals.supabase
		.from('quiz_answers')
		.select('*')
		.eq('profile_id', user.id)
		.single();

	const { data: people } = await locals.supabase
		.from('profiles')
		.select(
			'*, faculty:faculties(short_name, university_id, university:universities(short_name)), quiz_answers(*), roommate_preferences(*)'
		)
		.eq('is_active', true)
		.eq('is_verified', true)
		.neq('id', user.id)
		.order('created_at', { ascending: false });

	return { people: people ?? [], myQuiz };
};
