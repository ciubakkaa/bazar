import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	const { user } = await parent();
	if (!user) return { conversation: null, messages: [], members: [], isVerified: false };

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('is_verified')
		.eq('id', user.id)
		.single();

	const { data: conversation } = await locals.supabase
		.from('conversations')
		.select('*')
		.eq('id', params.id)
		.single();

	if (!conversation) return { conversation: null, messages: [], members: [], isVerified: false };

	const { data: members } = await locals.supabase
		.from('conversation_members')
		.select('profile_id, profile:profiles(id, full_name, avatar_url)')
		.eq('conversation_id', params.id);

	const { data: messages } = await locals.supabase
		.from('messages')
		.select('*')
		.eq('conversation_id', params.id)
		.order('created_at', { ascending: true })
		.limit(50);

	return {
		conversation,
		messages: messages ?? [],
		members: members ?? [],
		isVerified: profile?.is_verified ?? false
	};
};
