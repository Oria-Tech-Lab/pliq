import { Home, BarChart3, Users, CalendarDays, Receipt, CreditCard, ClipboardList, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const { userName, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const greeting = userName ? `Hola, ${userName}` : 'Hola 👋';

  return (
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
              asChild
              isActive={location.pathname === '/configuracion'}
              tooltip="Configuración"
            >
              <NavLink
                to="/configuracion"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-muted-foreground transition-all hover:bg-muted/50 cursor-pointer"
                activeClassName="bg-primary/10 text-primary font-medium"
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">Configuración</span>
                )}
              </NavLink>
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
  );
}
