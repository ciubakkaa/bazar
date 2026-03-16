import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user } = await parent();
	if (!user) return { conversations: [] };

	const { data: memberships } = await locals.supabase
		.from('conversation_members')
		.select('conversation_id')
		.eq('profile_id', user.id);

	if (!memberships?.length) return { conversations: [] };

	const convIds = memberships.map((m) => m.conversation_id);

	const { data: conversations } = await locals.supabase
		.from('conversations')
		.select(
			'*, conversation_members(profile_id, profile:profiles(full_name, avatar_url, faculty_id))'
		)
		.in('id', convIds)
		.order('last_message_at', { ascending: false });

	const conversationsWithPreview = await Promise.all(
		(conversations ?? []).map(async (conv) => {
			const { data: lastMsg } = await locals.supabase
				.from('messages')
				.select('content, sender_id, created_at')
				.eq('conversation_id', conv.id)
				.order('created_at', { ascending: false })
				.limit(1)
				.single();

			const otherMember =
				conv.conversation_members?.find((m: any) => m.profile_id !== user.id)?.profile ?? null;

			return { ...conv, last_message: lastMsg, other_member: otherMember };
		})
	);

	return { conversations: conversationsWithPreview };
};
