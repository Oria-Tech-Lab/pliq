import { useState } from 'react';
import { Home, BarChart3, Users, CalendarDays, Receipt, CreditCard, ClipboardList, Settings, Bell, LogOut } from 'lucide-react';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useAuth } from '@/hooks/useAuth';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const NAV_ITEMS = [
  { label: 'Inicio', path: '/', icon: Home },
  { label: 'Lista de pagos', path: '/planes', icon: ClipboardList },
  { label: 'Beneficiarios', path: '/beneficiarios', icon: Users },
  { label: 'Categorías', path: '/categorias', icon: Receipt },
  { label: 'Métodos de pago', path: '/metodos', icon: CreditCard },
  { label: 'Calendario', path: '/calendario', icon: CalendarDays },
  { label: 'Reportes', path: '/reportes', icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { userName, signOut } = useAuth();
  const { settings: notifSettings, updateSettings: updateNotifSettings } = useNotificationSettings();
  const [editNotifTime, setEditNotifTime] = useState(notifSettings.defaultTime);
  const [editNotifDays, setEditNotifDays] = useState(notifSettings.defaultDaysBefore);

  const openSettings = () => {
    setEditNotifTime(notifSettings.defaultTime);
    setEditNotifDays(notifSettings.defaultDaysBefore);
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    updateNotifSettings({ defaultTime: editNotifTime, defaultDaysBefore: editNotifDays });
    setSettingsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const greeting = userName ? `Hola, ${userName}` : 'Hola 👋';

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-border/40">
        <SidebarHeader className="p-4 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md flex-shrink-0">
              <Receipt className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-display font-extrabold text-base text-foreground leading-none tracking-tight">
                  {greeting}
                </h1>
                <p className="text-[10px] text-muted-foreground mt-1 truncate">
                  Organiza tu vida financiera
                </p>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <NavLink
                          to={item.path}
                          end
                          className="flex items-center gap-3 rounded-xl px-3 py-3 text-muted-foreground transition-all hover:bg-muted/50"
                          activeClassName="bg-primary/10 text-primary font-medium"
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          {!collapsed && (
                            <span className="text-sm font-medium">{item.label}</span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Configuración"
                onClick={openSettings}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-muted-foreground transition-all hover:bg-muted/50 cursor-pointer"
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">Configuración</span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Cerrar sesión"
                onClick={handleSignOut}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">Cerrar sesión</span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Configuración</DialogTitle>
            <DialogDescription>Personaliza tu experiencia.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <Label className="text-sm font-semibold">Recordatorios predeterminados</Label>
              </div>
              <p className="text-[11px] text-muted-foreground -mt-1">Se usará como valor por defecto al crear nuevos pagos.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Días antes</Label>
                  <Select value={String(editNotifDays)} onValueChange={v => setEditNotifDays(parseInt(v))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">El mismo día</SelectItem>
                      <SelectItem value="1">1 día antes</SelectItem>
                      <SelectItem value="2">2 días antes</SelectItem>
                      <SelectItem value="3">3 días antes</SelectItem>
                      <SelectItem value="5">5 días antes</SelectItem>
                      <SelectItem value="7">7 días antes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Hora</Label>
                  <Input
                    type="time"
                    className="h-9"
                    value={editNotifTime}
                    onChange={e => setEditNotifTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancelar</Button>
            <Button onClick={saveSettings}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
