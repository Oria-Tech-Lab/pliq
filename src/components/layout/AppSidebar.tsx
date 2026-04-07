import { useState, useEffect } from 'react';
import { Home, BarChart3, Users, CalendarDays, Receipt, CreditCard, ClipboardList, Settings, Bell } from 'lucide-react';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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

const USER_NAME_KEY = 'app-user-name';

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [editName, setEditName] = useState('');
  const { settings: notifSettings, updateSettings: updateNotifSettings } = useNotificationSettings();
  const [editNotifTime, setEditNotifTime] = useState(notifSettings.defaultTime);
  const [editNotifDays, setEditNotifDays] = useState(notifSettings.defaultDaysBefore);

  useEffect(() => {
    const stored = localStorage.getItem(USER_NAME_KEY);
    if (stored) setUserName(stored);
  }, []);

  const openSettings = () => {
    setEditName(userName);
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    const trimmed = editName.trim();
    setUserName(trimmed);
    localStorage.setItem(USER_NAME_KEY, trimmed);
    setSettingsOpen(false);
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
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Configuración</DialogTitle>
            <DialogDescription>Personaliza tu experiencia.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tu nombre</Label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="¿Cómo te llamas?"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveSettings(); } }}
              />
              <p className="text-[11px] text-muted-foreground">Se mostrará como saludo en el menú lateral.</p>
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
