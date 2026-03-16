import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user } = await parent();
	if (!user) return { existingAnswers: null };

	const { data: existing } = await locals.supabase
		.from('quiz_answers')
		.select('*')
		.eq('profile_id', user.id)
		.single();

	return { existingAnswers: existing };
};
