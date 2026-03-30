import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: questions } = await locals.supabase
		.from('questions')
		.select('*, author:profiles!author_id(full_name), answers(count)')
		.order('is_pinned', { ascending: false })
		.order('created_at', { ascending: false });

	return { questions: questions ?? [] };
};

export const actions: Actions = {
	togglePin: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Neautorizat.' });

		const form = await request.formData();
		const id = form.get('id') as string;
		const currentPinned = form.get('is_pinned') === 'true';

		if (!id) return fail(400, { error: 'ID lipsa.' });

		const { error } = await locals.supabase
			.from('questions')
			.update({ is_pinned: !currentPinned })
			.eq('id', id);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Neautorizat.' });

		const form = await request.formData();
		const id = form.get('id') as string;

		if (!id) return fail(400, { error: 'ID lipsa.' });

		const { error } = await locals.supabase
			.from('questions')
			.delete()
			.eq('id', id);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	}
};
