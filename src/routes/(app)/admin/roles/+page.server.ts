import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const VALID_ROLES = ['student', 'class_lead', 'asmi', 'admin'];

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { role } = await parent();

	if (role !== 'admin') {
		return { users: [] };
	}

	const { data: users } = await locals.supabase
		.from('profiles')
		.select('id, full_name, role, is_verified, faculty:faculties!faculty_id(short_name)')
		.order('full_name');

	return { users: users ?? [] };
};

export const actions: Actions = {
	setRole: async ({ request, locals, parent }) => {
		const { role: currentRole } = await parent();
		if (currentRole !== 'admin') return fail(403, { error: 'Acces interzis.' });

		const form = await request.formData();
		const userId = form.get('user_id') as string;
		const newRole = form.get('role') as string;

		if (!userId) return fail(400, { error: 'ID utilizator lipsa.' });
		if (!VALID_ROLES.includes(newRole)) return fail(400, { error: 'Rol invalid.' });

		const { error } = await locals.supabase
			.from('profiles')
			.update({ role: newRole })
			.eq('id', userId);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	}
};
