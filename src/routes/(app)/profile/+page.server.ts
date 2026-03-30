import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { moderateContent } from '$lib/moderation';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user, profile } = await parent();
	if (!user || !profile) return { quizAnswers: null, roommatePrefs: null };

	const [{ data: quizAnswers }, { data: roommatePrefs }] = await Promise.all([
		locals.supabase.from('quiz_answers').select('*').eq('profile_id', user.id).single(),
		locals.supabase.from('roommate_preferences').select('*').eq('profile_id', user.id).single()
	]);

	return { quizAnswers, roommatePrefs };
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const fullName = form.get('full_name') as string;
		const bio = form.get('bio') as string;
		const homeCity = form.get('home_city') as string;

		if (!fullName?.trim()) return fail(400, { error: 'Numele este obligatoriu.' });

		const moderation = moderateContent(fullName, bio);
		if (!moderation.allowed) return fail(400, { error: moderation.reason });

		const { error } = await locals.supabase
			.from('profiles')
			.update({
				full_name: fullName.trim(),
				bio: bio?.trim() || null,
				home_city: homeCity?.trim() || null,
				updated_at: new Date().toISOString()
			})
			.eq('id', user.id);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	},

	updateRoommatePrefs: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const budgetMin = form.get('budget_min') as string;
		const budgetMax = form.get('budget_max') as string;
		const sectors = form.getAll('preferred_sectors') as string[];
		const moveInMonth = form.get('move_in_month') as string;
		const genderPref = form.get('gender_preference') as string;
		const hasApartment = form.get('has_apartment') === 'true';
		const apartmentLink = form.get('apartment_link') as string;

		const { error } = await locals.supabase.from('roommate_preferences').upsert({
			profile_id: user.id,
			budget_min: budgetMin ? parseInt(budgetMin) : null,
			budget_max: budgetMax ? parseInt(budgetMax) : null,
			preferred_sectors: sectors.length > 0 ? sectors : null,
			move_in_month: moveInMonth || null,
			gender_preference: genderPref || 'any',
			has_apartment: hasApartment,
			apartment_link: apartmentLink?.trim() || null,
			updated_at: new Date().toISOString()
		});

		if (error) return fail(500, { error: error.message });
		return { success: true };
	},

	deactivate: async ({ locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401);

		const { error } = await locals.supabase
			.from('profiles')
			.update({ is_active: false })
			.eq('id', user.id);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	},

	signout: async ({ locals }) => {
		await locals.supabase.auth.signOut();
		return { success: true };
	}
};
