import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { other_user_id } = await request.json();
	const { session } = await locals.safeGetSession();
	if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

	// Messaging requires verification
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('is_verified')
		.eq('id', session.user.id)
		.single();
	if (!profile?.is_verified) return json({ error: 'Verification required' }, { status: 403 });

	const { data: conversationId, error } = await locals.supabase.rpc('get_or_create_dm', {
		user_a: session.user.id,
		user_b: other_user_id
	});

	if (error) return json({ error: error.message }, { status: 500 });
	return json({ conversation_id: conversationId });
};
