import { getCurrencySymbol } from './currency';

export interface ReminderEmailData {
  userName: string;
  paymentName: string;
  amount: number;
  currency: string;
  dueDate: string; // ISO date YYYY-MM-DD
  category: string;
  paymentMethod: string;
  daysUntil: number;
}

export function buildReminderSubject(d: ReminderEmailData): string {
  const t = d.daysUntil === 0 ? 'hoy' : d.daysUntil === 1 ? 'mañana' : `en ${d.daysUntil} días`;
  return `⏰ Tu pago "${d.paymentName}" vence ${t}`;
}

export function buildReminderEmailHtml(d: ReminderEmailData): string {
  const symbol = getCurrencySymbol(d.currency);
  const formattedAmount = `${symbol} ${Number(d.amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedDate = new Date(d.dueDate + 'T12:00:00').toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Recordatorio de pago</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.06);">
        <tr><td style="background:#0891B2;padding:28px 32px;color:#ffffff;">
          <h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-0.02em;">Pliq</h1>
          <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">Organiza tu vida financiera</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:16px;">Hola, ${escapeHtml(d.userName)} 👋</p>
          <p style="margin:0 0 24px;font-size:15px;color:#475569;">Te recordamos que tienes un pago próximo:</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
            <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">${escapeHtml(d.paymentName)}</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
              <tr><td style="padding:6px 0;color:#64748b;">💰 Monto</td><td align="right" style="padding:6px 0;font-weight:600;color:#0f172a;">${formattedAmount}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">📅 Vence</td><td align="right" style="padding:6px 0;color:#0f172a;">${formattedDate}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">🏷️ Categoría</td><td align="right" style="padding:6px 0;color:#0f172a;">${escapeHtml(d.category || '—')}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">💳 Método</td><td align="right" style="padding:6px 0;color:#0f172a;">${escapeHtml(d.paymentMethod || '—')}</td></tr>
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
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
