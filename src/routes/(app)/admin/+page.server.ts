import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { moderateContent } from '$lib/moderation';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: announcements } = await locals.supabase
		.from('announcements')
		.select('*, author:profiles!author_id(full_name)')
		.order('is_pinned', { ascending: false })
		.order('created_at', { ascending: false });

	return { announcements: announcements ?? [] };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Neautorizat.' });

		const form = await request.formData();
		const title = form.get('title') as string;
		const body = form.get('body') as string;
		const category = form.get('category') as string;

		if (!title?.trim()) return fail(400, { error: 'Titlul este obligatoriu.' });
		if (!body?.trim()) return fail(400, { error: 'Continutul este obligatoriu.' });

		const moderation = moderateContent(title, body);
		if (!moderation.allowed) return fail(400, { error: moderation.reason });

		const { error } = await locals.supabase.from('announcements').insert({
			author_id: user.id,
			title: title.trim(),
			body: body.trim(),
			category: category?.trim() || null
		});

		if (error) return fail(500, { error: error.message });
		return { success: true };
	},

	update: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Neautorizat.' });

		const form = await request.formData();
		const id = form.get('id') as string;
		const title = form.get('title') as string;
		const body = form.get('body') as string;
		const category = form.get('category') as string;

		if (!id) return fail(400, { error: 'ID lipsa.' });
		if (!title?.trim()) return fail(400, { error: 'Titlul este obligatoriu.' });
		if (!body?.trim()) return fail(400, { error: 'Continutul este obligatoriu.' });

		const moderation = moderateContent(title, body);
		if (!moderation.allowed) return fail(400, { error: moderation.reason });

		const { error } = await locals.supabase
			.from('announcements')
			.update({
				title: title.trim(),
				body: body.trim(),
				category: category?.trim() || null,
				updated_at: new Date().toISOString()
			})
			.eq('id', id);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	},

	togglePin: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Neautorizat.' });

		const form = await request.formData();
		const id = form.get('id') as string;
		const currentPinned = form.get('is_pinned') === 'true';

		if (!id) return fail(400, { error: 'ID lipsa.' });

		const { error } = await locals.supabase
			.from('announcements')
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
			.from('announcements')
			.delete()
			.eq('id', id);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	}
};
