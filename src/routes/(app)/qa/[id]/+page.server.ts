import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, parent, params }) => {
	const { user } = await parent();

	const { data: question } = await locals.supabase
		.from('questions')
		.select('*, author:profiles(full_name, year, faculty_id, faculty:faculties(short_name))')
		.eq('id', params.id)
		.single();

	const { data: answers } = await locals.supabase
		.from('answers')
		.select('*, author:profiles(full_name, year)')
		.eq('question_id', params.id)
		.order('upvotes', { ascending: false });

	// Check which answers the user has voted on
	let votedAnswerIds: string[] = [];
	if (user) {
		const { data: votes } = await locals.supabase
			.from('answer_votes')
			.select('answer_id')
			.eq('voter_id', user.id);
		votedAnswerIds = (votes ?? []).map((v: any) => v.answer_id);
	}

	return { question, answers: answers ?? [], votedAnswerIds };
};

export const actions: Actions = {
	answer: async ({ request, locals, params }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const body = form.get('body') as string;
		if (!body?.trim()) return fail(400, { error: 'Raspunsul nu poate fi gol.' });

		const { error } = await locals.supabase.from('answers').insert({
			question_id: params.id,
			author_id: user.id,
			body: body.trim()
		});

		if (error) return fail(500, { error: error.message });
		return { success: true };
	}
};
