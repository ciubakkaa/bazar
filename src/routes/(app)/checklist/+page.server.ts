import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user, profile } = await parent();
	if (!user || !profile?.faculty_id) return { items: [] };

	const { data: faculty } = await locals.supabase
		.from('faculties')
		.select('university_id')
		.eq('id', profile.faculty_id)
		.single();

	if (!faculty) return { items: [] };

	const [{ data: templates }, { data: progress }] = await Promise.all([
		locals.supabase
			.from('checklist_templates')
			.select('*')
			.or(`university_id.eq.${faculty.university_id},university_id.is.null`)
			.order('sort_order'),
		locals.supabase
			.from('checklist_progress')
			.select('*')
			.eq('profile_id', user.id),
	]);

	const progressMap = new Map(
		(progress ?? []).map((p) => [p.template_id, p])
	);

	const items = (templates ?? []).map((t) => ({
		...t,
		is_completed: progressMap.get(t.id)?.is_completed ?? false,
	}));

	return { items };
};
