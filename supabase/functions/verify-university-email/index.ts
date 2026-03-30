import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Trebuie sa fii autentificat.' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: 'Sesiunea a expirat. Te rugam sa te reconectezi.' }, 401);
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'send-code') {
      const { email } = body as { email: string };

      if (!email || !email.includes('@')) {
        return jsonResponse({ error: 'Email invalid.' }, 400);
      }

      // Extract domain from email
      const domain = email.split('@')[1].toLowerCase();

      // Validate domain against known university email domains
      const { data: domainEntry, error: domainError } = await supabase
        .from('university_email_domains')
        .select('university_id, domain')
        .eq('domain', domain)
        .limit(1)
        .single();

      if (domainError || !domainEntry) {
        return jsonResponse(
          { error: `Domeniul "${domain}" nu este asociat cu o universitate cunoscuta. Contacteaza-ne daca crezi ca este o eroare.` },
          400
        );
      }

      // Rate limit: max 3 codes per user per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await supabase
        .from('university_email_verifications')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .gte('created_at', oneHourAgo);

      if (countError) {
        return jsonResponse({ error: 'Eroare la verificarea ratei.' }, 500);
      }

      if ((count ?? 0) >= 3) {
        return jsonResponse(
          { error: 'Prea multe solicitari. Incearca din nou peste o ora.' },
          429
        );
      }

      // Generate 6-digit numeric code
      const code = String(Math.floor(100000 + Math.random() * 900000));

      // Insert verification entry (expires in 10 minutes)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error: insertError } = await supabase
        .from('university_email_verifications')
        .insert({
          profile_id: user.id,
          email,
          code,
          expires_at: expiresAt,
        });

      if (insertError) {
        return jsonResponse({ error: 'Eroare la crearea codului de verificare.' }, 500);
      }

      // Send email with Resend if API key is configured
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey) {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: Deno.env.get('RESEND_FROM_EMAIL') || 'Bazar <noreply@resend.dev>',
            to: [email],
            subject: `Codul tău Bazar: ${code}`,
            html: `
              <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
                <h2 style="font-size: 24px; margin-bottom: 8px;">Verificare email universitar</h2>
                <p style="color: #666; margin-bottom: 24px;">Folosește codul de mai jos pentru a-ți verifica emailul universitar pe Bazar.</p>
                <div style="background: #F0EFE9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</span>
                </div>
                <p style="color: #999; font-size: 13px;">Codul expiră în 10 minute.</p>
              </div>
            `,
          }),
        });

        if (!emailRes.ok) {
          console.error('Resend error:', await emailRes.text());
          return jsonResponse({ error: 'Eroare la trimiterea emailului.' }, 500);
        }

        return jsonResponse({ success: true });
      }

      // Fallback: no email provider configured — return code for testing
      console.log(`Verification code for ${email}: ${code}`);
      return jsonResponse({ success: true, code });
    } else if (action === 'verify-code') {
      const { code } = body as { code: string };

      if (!code) {
        return jsonResponse({ error: 'Codul este obligatoriu.' }, 400);
      }

      // Find the latest non-expired, non-verified verification entry for this user
      const { data: verification, error: verifyError } = await supabase
        .from('university_email_verifications')
        .select('*')
        .eq('profile_id', user.id)
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (verifyError || !verification) {
        return jsonResponse(
          { error: 'Nu exista un cod de verificare activ. Solicita un cod nou.' },
          400
        );
      }

      // Check attempts < 5
      if (verification.attempts >= 5) {
        return jsonResponse(
          { error: 'Prea multe incercari. Solicita un cod nou.' },
          400
        );
      }

      // Compare code
      if (verification.code !== code) {
        // Increment attempts
        await supabase
          .from('university_email_verifications')
          .update({ attempts: verification.attempts + 1 })
          .eq('id', verification.id);

        return jsonResponse({ error: 'Cod incorect.' }, 400);
      }

      // Code matches — mark as verified
      const { error: updateVerifError } = await supabase
        .from('university_email_verifications')
        .update({ verified: true })
        .eq('id', verification.id);

      if (updateVerifError) {
        return jsonResponse({ error: 'Eroare la verificare.' }, 500);
      }

      // Update profile: is_verified = true, university_email = email
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          is_verified: true,
          university_email: verification.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateProfileError) {
        return jsonResponse({ error: 'Eroare la actualizarea profilului.' }, 500);
      }

      return jsonResponse({ success: true });
    } else {
      return jsonResponse({ error: 'Actiune necunoscuta.' }, 400);
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
