import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { profile } = await parent();

	const [{ data: questions }, { data: announcements }] = await Promise.all([
		locals.supabase
			.from('questions')
			.select('*, author:profiles(full_name, year, faculty_id), answers(count)')
			.order('is_pinned', { ascending: false })
			.order('created_at', { ascending: false }),
		locals.supabase
			.from('announcements')
			.select('*, author:profiles(full_name, role)')
			.order('is_pinned', { ascending: false })
			.order('created_at', { ascending: false }),
	]);

	return {
		questions: questions ?? [],
		announcements: announcements ?? [],
		userFacultyId: profile?.faculty_id,
	};
};
