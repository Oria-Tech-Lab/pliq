import { Home, BarChart3, Users, CalendarDays, Receipt, CreditCard, ClipboardList } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
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
  { label: 'Reportes', path: '/reportes', icon: BarChart3 },
  { label: 'Beneficiarios', path: '/beneficiarios', icon: Users },
  { label: 'Categorías', path: '/categorias', icon: Receipt },
  { label: 'Métodos de pago', path: '/metodos', icon: CreditCard },
  { label: 'Lista de pagos', path: '/planes', icon: ClipboardList },
  { label: 'Calendario', path: '/calendario', icon: CalendarDays },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm flex-shrink-0">
            <Receipt className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-display font-extrabold text-base text-foreground leading-none tracking-tight">
                MisPagos
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Organiza tu vida financiera
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
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
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-all hover:bg-muted/50"
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

      <SidebarFooter className="p-4">
        {!collapsed && (
          <p className="text-[10px] text-muted-foreground/50 text-center">
            v1.0
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
