import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
	const { profile } = await parent();
	if (!profile?.is_verified) redirect(303, '/qa');

	// Load faculties for the optional faculty select
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const title = form.get('title') as string;
		const body = form.get('body') as string;
		const facultyId = form.get('faculty_id') as string;

		if (!title?.trim()) return fail(400, { error: 'Titlul este obligatoriu.' });

		const { data: question, error } = await locals.supabase
			.from('questions')
			.insert({
				author_id: user.id,
				title: title.trim(),
				body: body?.trim() || null,
				faculty_id: facultyId || null
			})
			.select('id')
			.single();

		if (error) return fail(500, { error: error.message });
		redirect(303, `/qa/${question.id}`);
	}
};
