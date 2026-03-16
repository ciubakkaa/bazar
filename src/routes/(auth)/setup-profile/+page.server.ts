import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: universities } = await locals.supabase
    .from('universities')
    .select('*, faculties(*)')
    .order('short_name');

  return { universities: universities ?? [] };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const { session, user } = await locals.safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const fullName = formData.get('full_name') as string;
    const facultyId = formData.get('faculty_id') as string;
    const homeCity = formData.get('home_city') as string;
    const inviteCode = formData.get('invite_code') as string;

    if (!fullName || !facultyId) {
      return fail(400, { error: 'Numele si facultatea sunt obligatorii.' });
    }

    // Get faculty info for the group chat name
    const { data: faculty } = await locals.supabase
      .from('faculties')
      .select('short_name')
      .eq('id', facultyId)
      .single();

    let isVerified = false;
    let inviteCodeId: string | null = null;

    // Redeem invite code if provided
    if (inviteCode) {
      const { data: codeId } = await locals.supabase.rpc('redeem_invite_code', {
        code_text: inviteCode,
      });
      if (codeId) {
        isVerified = true;
        inviteCodeId = codeId;
      }
    }

    // Create profile
    const { error: insertError } = await locals.supabase.from('profiles').insert({
      id: user.id,
      full_name: fullName,
      faculty_id: facultyId,
      home_city: homeCity || null,
      is_verified: isVerified,
      invite_code_id: inviteCodeId,
    });

    if (insertError) return fail(500, { error: insertError.message });

    // Join faculty group chat
    if (faculty) {
      await locals.supabase.rpc('join_faculty_group_chat', {
        p_profile_id: user.id,
        p_faculty_id: facultyId,
        p_faculty_short_name: faculty.short_name,
      });
    }

    redirect(303, '/checklist');
  },
};
