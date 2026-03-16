import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { profile } = await parent();

	const { data: questions } = await locals.supabase
		.from('questions')
		.select('*, author:profiles(full_name, year, faculty_id), answers(count)')
		.order('is_pinned', { ascending: false })
		.order('created_at', { ascending: false });

	return { questions: questions ?? [], userFacultyId: profile?.faculty_id };
};
