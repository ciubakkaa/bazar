import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const publicRoutes = ['/login', '/register', '/verify-email'];

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const { session, user } = await locals.safeGetSession();

  const isPublicRoute = publicRoutes.some(r => url.pathname.startsWith(r));

  // Not logged in — allow public routes, redirect others to login
  if (!session) {
    if (!isPublicRoute && url.pathname !== '/') {
      redirect(303, '/login');
    }
    return { session, user, profile: null };
  }

  // Logged in — check for profile
  if (user) {
    const { data: profile } = await locals.supabase
      .from('profiles')
      .select('*, faculty:faculties(*, university:universities(*))')
      .eq('id', user.id)
      .single();

    // Has session but no profile — force setup (unless already there)
    if (!profile && !url.pathname.startsWith('/setup-profile')) {
      redirect(303, '/setup-profile');
    }

    // Has profile, is on a public route — redirect to app
    if (profile && isPublicRoute) {
      redirect(303, '/checklist');
    }

    return { session, user, profile };
  }

  return { session, user, profile: null };
};
