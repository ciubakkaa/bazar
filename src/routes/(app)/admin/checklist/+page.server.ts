import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { profile } = await parent();

	// Get university_id from the admin's faculty
	let universityId: string | null = null;
	if (profile?.faculty_id) {
		const { data: faculty } = await locals.supabase
			.from('faculties')
			.select('university_id')
			.eq('id', profile.faculty_id)
			.single();
		universityId = faculty?.university_id ?? null;
	}

	const { data: templates } = await locals.supabase
		.from('checklist_templates')
		.select('*')
		.order('sort_order');

	return { templates: templates ?? [], universityId };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Neautorizat.' });

		const form = await request.formData();
		const title = form.get('title') as string;
		const description = form.get('description') as string;
		const category = form.get('category') as string;
		const deadline_description = form.get('deadline_description') as string;
		const url = form.get('url') as string;
		const university_id = form.get('university_id') as string;
		const sort_order = form.get('sort_order') as string;

		if (!title?.trim()) return fail(400, { error: 'Titlul este obligatoriu.' });
		if (!category?.trim()) return fail(400, { error: 'Categoria este obligatorie.' });

		const { error } = await locals.supabase.from('checklist_templates').insert({
			title: title.trim(),
			description: description?.trim() || null,
			category: category.trim(),
			deadline_description: deadline_description?.trim() || null,
			url: url?.trim() || null,
			university_id: university_id?.trim() || null,
			sort_order: sort_order ? parseInt(sort_order, 10) : 0
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
		const description = form.get('description') as string;
		const category = form.get('category') as string;
		const deadline_description = form.get('deadline_description') as string;
		const url = form.get('url') as string;
		const university_id = form.get('university_id') as string;
		const sort_order = form.get('sort_order') as string;

		if (!id) return fail(400, { error: 'ID lipsa.' });
		if (!title?.trim()) return fail(400, { error: 'Titlul este obligatoriu.' });
		if (!category?.trim()) return fail(400, { error: 'Categoria este obligatorie.' });

		const { error } = await locals.supabase
			.from('checklist_templates')
			.update({
				title: title.trim(),
				description: description?.trim() || null,
				category: category.trim(),
				deadline_description: deadline_description?.trim() || null,
				url: url?.trim() || null,
				university_id: university_id?.trim() || null,
				sort_order: sort_order ? parseInt(sort_order, 10) : 0
			})
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
			.from('checklist_templates')
			.delete()
			.eq('id', id);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	}
};
