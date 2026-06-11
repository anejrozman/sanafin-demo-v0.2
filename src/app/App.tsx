import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from 'react-router';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
} from './components/ui/sidebar';
import { Button } from './components/ui/button';
import { Home, FileText, Users, Target, Upload, HelpCircle, SlidersHorizontal } from 'lucide-react';
import sanafinLogo from '../assets/sanafin_logo.png';
import Dashboard from './components/Dashboard';
import OutcomeReports from './components/OutcomeReports';
import CohortAnalysis from './components/CohortAnalysis';
import ContractPerformance from './components/ContractPerformance';
import DataUpload from './components/DataUpload';
import OutcomeTargets from './components/OutcomeTargets';
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
    label: 'Run',
    items: [
      { name: 'Data Upload', href: '/upload', icon: Upload, anchor: true },
      { name: 'Outcome Targets', href: '/targets', icon: SlidersHorizontal },
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

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="px-6 py-5">
          <img src={sanafinLogo} alt="SanaFin" className="h-7 w-auto" />
        </div>

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
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link
                          to={item.href}
                          className={`flex items-center gap-3 ${isAnchor ? 'font-semibold' : ''}`}
                        >
                          <Icon className={`size-4 ${isAnchor ? 'text-primary' : ''}`} />
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
    </Sidebar>
  );
}

function AppHeader({ onHowItWorks }: { onHowItWorks: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex h-12 items-center justify-end px-6 border-b bg-background/95 backdrop-blur">
      <Button variant="ghost" size="sm" onClick={onHowItWorks} className="gap-1.5 text-muted-foreground">
        <HelpCircle className="size-4" />
        How it works
      </Button>
    </div>
  );
}

function AppShell() {
  const { open, close, reopen } = useWelcomeModal();
  const navigate = useNavigate();

  const handleStartUpload = () => {
    close();
    navigate('/upload');
  };

  const handleGoToUpload = () => {
    close();
    navigate('/upload', { state: { initialTab: 'upload' } });
  };

  const handleGoToDashboard = () => {
    close();
    navigate('/');
  };

  return (
    <SidebarProvider>
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
              <Route path="/upload" element={<DataUpload />} />
              <Route path="/targets" element={<OutcomeTargets />} />
            </Routes>
          </main>
        </div>
      </div>
      <WelcomePage open={open} onStartUpload={handleStartUpload} onGoToUpload={handleGoToUpload} onGoToDashboard={handleGoToDashboard} />
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
