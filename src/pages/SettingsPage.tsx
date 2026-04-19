import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences, CURRENCIES, LANGUAGES, getCurrencySymbol } from '@/hooks/useUserPreferences';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Mail, Lock, Bell, Settings2, ChevronDown, ChevronUp, Coins } from 'lucide-react';

const BICURRENCY_OPTIONS = CURRENCIES.filter(c =>
  ['PEN', 'USD', 'EUR', 'COP', 'MXN', 'CLP', 'ARS', 'BRL'].includes(c.code)
);

export default function SettingsPage() {
  const { user, userName, profile } = useAuth();
  const { prefs, updatePrefs } = useUserPreferences();

  // Profile
  const [name, setName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Email
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Preferences
  const [currency, setCurrency] = useState(prefs.currency);
  const [language, setLanguage] = useState(prefs.language);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Currencies
  const [primaryCurrency, setPrimaryCurrency] = useState(prefs.primaryCurrency);
  const [secondaryCurrency, setSecondaryCurrency] = useState(prefs.secondaryCurrency);
  const [exchangeRate, setExchangeRate] = useState(prefs.exchangeRate);
  const [savingCurrencies, setSavingCurrencies] = useState(false);

  // Reminders
  const [reminderDays, setReminderDays] = useState(prefs.reminderDays);
  const [reminderTime, setReminderTime] = useState(prefs.reminderTime);
  const [savingReminders, setSavingReminders] = useState(false);

  useEffect(() => { setName(userName || ''); }, [userName]);
  useEffect(() => {
    setCurrency(prefs.currency);
    setLanguage(prefs.language);
    setReminderDays(prefs.reminderDays);
    setReminderTime(prefs.reminderTime);
    setPrimaryCurrency(prefs.primaryCurrency);
    setSecondaryCurrency(prefs.secondaryCurrency);
    setExchangeRate(prefs.exchangeRate);
  }, [prefs]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({ data: { name } });
    if (!error && user) {
      await supabase.from('profiles').update({ name }).eq('id', user.id);
      toast.success('Perfil actualizado');
    } else {
      toast.error(error?.message || 'Error al actualizar perfil');
    }
    setSavingProfile(false);
  };

  const handleChangeEmail = async () => {
    if (newEmail !== confirmEmail) { toast.error('Los correos no coinciden'); return; }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (!error) {
      toast.success('Se envió un correo de confirmación a la nueva dirección');
      setShowEmailChange(false);
      setNewEmail('');
      setConfirmEmail('');
    } else {
      toast.error(error.message);
    }
    setSavingEmail(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { toast.error('Ingresa tu contraseña actual'); return; }
    if (newPassword.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return; }
    if (newPassword !== confirmPassword) { toast.error('Las contraseñas no coinciden'); return; }
    if (!user?.email) { toast.error('No se pudo verificar tu sesión'); return; }
    setSavingPassword(true);
    // Re-authenticate by verifying current password before allowing change
    const { error: reAuthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (reAuthError) {
      toast.error('Contraseña actual incorrecta');
      setSavingPassword(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      toast.success('Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(error.message);
    }
    setSavingPassword(false);
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    await updatePrefs({ currency, language });
    toast.success('Preferencias guardadas');
    setSavingPrefs(false);
  };

  const handleSaveCurrencies = async () => {
    setSavingCurrencies(true);
    await updatePrefs({ primaryCurrency, secondaryCurrency, exchangeRate });
    toast.success('Monedas actualizadas');
    setSavingCurrencies(false);
  };

  const handleSaveReminders = async () => {
    setSavingReminders(true);
    await updatePrefs({ reminderDays, reminderTime });
    toast.success('Recordatorios actualizados');
    setSavingReminders(false);
  };

  const passwordValid = newPassword.length >= 8 && newPassword === confirmPassword;

  const secondaryLabel = BICURRENCY_OPTIONS.find(c => c.code === secondaryCurrency)?.code ?? secondaryCurrency;
  const primaryLabel = BICURRENCY_OPTIONS.find(c => c.code === primaryCurrency)?.code ?? primaryCurrency;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona tu perfil y preferencias</p>
        </div>

        {/* Section 1: Profile */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Perfil</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Nombre completo</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Correo electrónico</Label>
              <div className="flex gap-2">
                <Input value={user?.email || ''} readOnly className="bg-muted" />
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setShowEmailChange(!showEmailChange)}>
                  {showEmailChange ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                  Cambiar correo
                </Button>
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </CardContent>
        </Card>

        {/* Section 2: Change Email (collapsible) */}
        {showEmailChange && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Cambiar correo</CardTitle>
              </div>
              <CardDescription>
                Se enviará un correo de confirmación a la nueva dirección. El cambio se aplicará cuando confirmes desde ese correo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Nuevo correo electrónico</Label>
                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Confirmar nuevo correo</Label>
                <Input type="email" value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} />
              </div>
              <Button onClick={handleChangeEmail} disabled={savingEmail || !newEmail || newEmail !== confirmEmail}>
                {savingEmail ? 'Enviando...' : 'Enviar confirmación'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Section 3: Password */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Cambiar contraseña</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Contraseña actual</Label>
              <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Nueva contraseña (mínimo 8 caracteres)</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Confirmar nueva contraseña</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <Button onClick={handleChangePassword} disabled={savingPassword || !passwordValid}>
              {savingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>
          </CardContent>
        </Card>

        {/* Section 4: Currencies */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Monedas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Moneda principal</Label>
              <Select value={primaryCurrency} onValueChange={setPrimaryCurrency}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BICURRENCY_OPTIONS.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.label} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Moneda secundaria</Label>
              <Select value={secondaryCurrency} onValueChange={setSecondaryCurrency}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BICURRENCY_OPTIONS.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.label} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Tipo de cambio referencial
              </Label>
              <p className="text-xs text-muted-foreground">
                1 {secondaryLabel} = X {primaryLabel}
              </p>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="h-9"
                value={exchangeRate || ''}
                onChange={e => setExchangeRate(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground pt-1">
                Ej: {getCurrencySymbol(secondaryCurrency)} 100.00 ={' '}
                {getCurrencySymbol(primaryCurrency)} {(exchangeRate * 100).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <Button onClick={handleSaveCurrencies} disabled={savingCurrencies}>
              {savingCurrencies ? 'Guardando...' : 'Guardar'}
            </Button>
          </CardContent>
        </Card>

        {/* Section 5: Preferences */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Preferencias</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Moneda predeterminada</Label>
              <p className="text-xs text-muted-foreground">Se usará en todos tus pagos y reportes</p>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.label} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Idioma de la aplicación</Label>
              <p className="text-xs text-muted-foreground">Afecta textos, fechas y formatos numéricos</p>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => (
                    <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSavePrefs} disabled={savingPrefs}>
              {savingPrefs ? 'Guardando...' : 'Guardar preferencias'}
            </Button>
          </CardContent>
        </Card>

        {/* Section 6: Reminders */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Recordatorios</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Días antes del vencimiento</Label>
                <Select value={String(reminderDays)} onValueChange={v => setReminderDays(parseInt(v))}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">El mismo día</SelectItem>
                    <SelectItem value="1">1 día antes</SelectItem>
                    <SelectItem value="2">2 días antes</SelectItem>
                    <SelectItem value="3">3 días antes</SelectItem>
                    <SelectItem value="5">5 días antes</SelectItem>
                    <SelectItem value="7">1 semana antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Hora del recordatorio</Label>
                <Input type="time" className="h-9" value={reminderTime} onChange={e => setReminderTime(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleSaveReminders} disabled={savingReminders}>
              {savingReminders ? 'Guardando...' : 'Guardar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
