import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
  SidebarTrigger, useSidebar,
} from './components/ui/sidebar';
import { Button } from './components/ui/button';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { Home, FileText, Users, Target, HelpCircle } from 'lucide-react';
import sanafinLogo from '../assets/sanafin_logo.png';
import symbolIcon from '../assets/Symbol_no_bg.png';
import Dashboard from './components/Dashboard';
import OutcomeReports from './components/OutcomeReports';
import CohortAnalysis from './components/CohortAnalysis';
import ContractPerformance from './components/ContractPerformance';
import WelcomePage, { useWelcomeModal } from './components/WelcomeModal';

/* MARKER-MAKE-KIT-INVOKED */

const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: Home },
    ],
  },
  {
    label: 'Results',
    items: [
      { name: 'Outcome Reports', href: '/reports', icon: FileText },
      { name: 'Cohort Analysis', href: '/cohort', icon: Users },
      { name: 'Contract Performance', href: '/contract', icon: Target },
    ],
  },
];

function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className={`h-16 border-b flex items-center justify-center ${isCollapsed ? 'px-0' : 'px-3'}`}>
        {isCollapsed ? (
          <img src={symbolIcon} alt="SanaFin" className="h-12 w-12 object-contain" />
        ) : (
          <div className="flex w-full items-center justify-between px-2">
            <img src={sanafinLogo} alt="SanaFin" className="h-12 w-auto" />
            <SidebarTrigger className="size-10 [&_svg]:size-5" />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {isCollapsed && (
          <div className="flex justify-center pt-2">
            <SidebarTrigger className="size-10 [&_svg]:size-5" />
          </div>
        )}
        {navGroups.map(group => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  const isAnchor = (item as { anchor?: boolean }).anchor;
                  return (
                    <SidebarMenuItem
                      key={item.name}
                      className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="[&>svg]:size-4 group-data-[collapsible=icon]:size-8!"
                      >
                        <Link to={item.href} className="flex items-center gap-3">
                          <Icon className={isAnchor ? 'text-primary' : undefined} />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      {!isCollapsed && (
        <SidebarFooter className="px-5 py-4">
          <p className="text-xs text-muted-foreground">Sanafin Demo Version 0.2.1 - Unified Dashboard</p>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

function AppHeader({ onHowItWorks }: { onHowItWorks: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex h-16 items-center justify-end gap-3 px-6 border-b bg-background/95 backdrop-blur">
      <Button variant="ghost" size="sm" onClick={onHowItWorks} className="gap-1.5 text-muted-foreground">
        <HelpCircle className="size-4" />
        How it works
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-8 cursor-pointer hover:ring-2 hover:ring-ring transition-all">
              <AvatarFallback className="bg-brand-teal text-white text-xs font-semibold">U</AvatarFallback>
            </Avatar>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[28rem] p-8" align="end">
          <div className="flex items-center gap-6">
            <Avatar className="size-20">
              <AvatarFallback className="bg-brand-teal text-white text-xl font-semibold">U</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-semibold">Username</span>
              <span className="text-sm text-muted-foreground">demo@sanafin.com</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function AppShell() {
  const { open, close, reopen } = useWelcomeModal();
  const handleGoToDashboard = () => {
    close();
  };

  return (
    <SidebarProvider style={{ "--sidebar-width-icon": "4rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AppHeader onHowItWorks={reopen} />
          <main className="flex-1 overflow-auto bg-background">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reports" element={<OutcomeReports />} />
              <Route path="/cohort" element={<CohortAnalysis />} />
              <Route path="/contract" element={<ContractPerformance />} />
            </Routes>
          </main>
        </div>
      </div>
      <WelcomePage open={open} onGoToDashboard={handleGoToDashboard} />
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
