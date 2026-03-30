import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const ALLOWED_ROLES = ['class_lead', 'asmi', 'admin'];

export const load: LayoutServerLoad = async ({ parent }) => {
	const { profile } = await parent();

	if (!profile || !ALLOWED_ROLES.includes(profile.role ?? '')) {
		redirect(303, '/checklist');
	}

	return { role: profile.role as string };
};
