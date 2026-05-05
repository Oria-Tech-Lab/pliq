import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYMBOLS: Record<string, string> = {
  PEN: 'S/', USD: '$', EUR: '€', COP: 'COP$', MXN: 'MX$', CLP: 'CLP$',
  ARS: 'ARS$', BRL: 'R$', GBP: '£', BOB: 'Bs',
};
const symbolFor = (c: string) => SYMBOLS[c] ?? c ?? 'S/';

function escapeHtml(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  );
}

function buildHtml(opts: {
  name: string; planName: string; amount: number; currency: string;
  dueDate: string; category: string; method: string;
}) {
  const formattedAmount = `${symbolFor(opts.currency)} ${Number(opts.amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedDate = new Date(opts.dueDate + 'T12:00:00').toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.06);">
<tr><td style="background:#0891B2;padding:28px 32px;color:#ffffff;">
<h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-0.02em;">Pliq</h1>
<p style="margin:4px 0 0;font-size:13px;opacity:0.9;">Organiza tu vida financiera</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="margin:0 0 8px;font-size:16px;">Hola, ${escapeHtml(opts.name)} 👋</p>
<p style="margin:0 0 24px;font-size:15px;color:#475569;">Te recordamos que tienes un pago próximo:</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
<h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">${escapeHtml(opts.planName)}</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
<tr><td style="padding:6px 0;color:#64748b;">💰 Monto</td><td align="right" style="padding:6px 0;font-weight:600;">${formattedAmount}</td></tr>
<tr><td style="padding:6px 0;color:#64748b;">📅 Vence</td><td align="right" style="padding:6px 0;">${formattedDate}</td></tr>
<tr><td style="padding:6px 0;color:#64748b;">🏷️ Categoría</td><td align="right" style="padding:6px 0;">${escapeHtml(opts.category || '—')}</td></tr>
<tr><td style="padding:6px 0;color:#64748b;">💳 Método</td><td align="right" style="padding:6px 0;">${escapeHtml(opts.method || '—')}</td></tr>
</table>
</div>
<div style="text-align:center;margin:28px 0 16px;">
<a href="https://getpliq.com" style="display:inline-block;background:#0891B2;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:15px;">Ver en Pliq →</a>
</div>
<p style="margin:16px 0 0;font-size:13px;color:#64748b;text-align:center;">Si ya realizaste este pago, márcalo como pagado en Pliq para mantener tu historial actualizado.</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">
© 2026 Pliq · <a href="https://getpliq.com" style="color:#94a3b8;text-decoration:none;">getpliq.com</a> · Puedes desactivar estas notificaciones en Configuración
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
  const today = new Date();
  let sentCount = 0;
  const errors: string[] = [];

  // Users with notifications enabled
  const { data: settings, error: settingsErr } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('email_enabled', true);

  if (settingsErr) {
    return new Response(JSON.stringify({ error: settingsErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  for (const setting of settings ?? []) {
    const reminderDays: number[] = setting.reminder_days_array ?? [3, 1, 0];
    if (!setting.user_id) continue;

    // User email + name
    const { data: userData } = await supabase.auth.admin.getUserById(setting.user_id);
    const email = userData?.user?.email;
    if (!email) continue;
    const { data: profile } = await supabase
      .from('profiles').select('name').eq('id', setting.user_id).maybeSingle();
    const name = profile?.name || userData?.user?.user_metadata?.name || 'Usuario';

    for (const days of reminderDays) {
      const target = new Date(today);
      target.setDate(today.getDate() + days);
      const dateStr = target.toISOString().split('T')[0];

      const { data: instances } = await supabase
        .from('payment_instances')
        .select('id, due_date, amount, plan_id, payment_plans!inner(name, amount, currency, category, payment_method, user_id)')
        .eq('user_id', setting.user_id)
        .eq('due_date', dateStr)
        .eq('status', 'pending');

      for (const instance of instances ?? []) {
        const plan: any = (instance as any).payment_plans;
        if (!plan) continue;

        const subject = `⏰ Tu pago "${plan.name}" vence ${days === 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${days} días`}`;
        const html = buildHtml({
          name,
          planName: plan.name,
          amount: Number(instance.amount ?? plan.amount),
          currency: plan.currency || 'PEN',
          dueDate: instance.due_date,
          category: plan.category || '—',
          method: plan.payment_method || '—',
        });

        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Pliq <notificaciones@getpliq.com>',
              to: [email],
              subject,
              html,
            }),
          });
          if (!res.ok) {
            const txt = await res.text();
            errors.push(`Resend ${res.status}: ${txt}`);
          } else {
            sentCount++;
          }
        } catch (e) {
          errors.push(String(e));
        }
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent: sentCount, errors }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

// DEPLOY INSTRUCTIONS:
// 1. supabase functions deploy send-payment-reminders
// 2. En Supabase Dashboard → Edge Functions → send-payment-reminders → Add secret: RESEND_API_KEY
// 3. En Supabase Dashboard → Database → Extensions → activar pg_cron
// 4. En SQL Editor ejecutar:
//    select cron.schedule('daily-payment-reminders', '0 9 * * *', 'select net.http_post(url:=''https://[PROJECT_REF].supabase.co/functions/v1/send-payment-reminders'', headers:=''{"Authorization": "Bearer [ANON_KEY]"}''::jsonb)');
