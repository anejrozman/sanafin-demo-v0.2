import { useState, useEffect } from 'react';
import { useData } from '../store/DataContext';
import WelcomePage, { useWelcomeModal } from './components/WelcomeModal';
import Dashboard from './components/Dashboard';
import DataUpload from './components/DataUpload';
import OutcomeTargets from './components/OutcomeTargets';
import { Button } from './components/ui/button';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { Dialog, DialogContent } from './components/ui/dialog';
import { Badge } from './components/ui/badge';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
  SidebarTrigger, useSidebar,
} from './components/ui/sidebar';
import { HelpCircle, SlidersHorizontal, Upload, Home, CheckCircle2, Flame } from 'lucide-react';
import sanafinLogo from '../assets/sanafin_logo.png';
import symbolIcon from '../assets/Symbol_no_bg.png';

interface AppHeaderProps {
  onConfigureTargets: () => void;
  showChangeCohort: boolean;
  onChangeCohort: () => void;
  dataSource: 'sample' | 'uploaded';
}

function AppHeader({
  onConfigureTargets,
  showChangeCohort,
  onChangeCohort,
  dataSource,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-8">
        {/* Left side: Subtitle */}
        <div className="flex items-center gap-4">
          <span className="hidden md:inline-block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sanafin Outcome Studio
          </span>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-3">
          {showChangeCohort && (
            <Button variant="outline" size="sm" onClick={onChangeCohort}>
              <Upload className="size-4 mr-2" />
              Change Cohort
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={onConfigureTargets} className="gap-1.5">
            <SlidersHorizontal className="size-4" />
            Configure Targets
          </Button>


          <Popover>
            <PopoverTrigger asChild>
              <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="size-8 cursor-pointer hover:ring-2 hover:ring-ring transition-all">
                  <AvatarFallback className="bg-brand-teal text-white text-xs font-semibold">U</AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[18rem] p-6" align="end">
              <div className="flex items-center gap-4">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-brand-teal text-white text-sm font-semibold">U</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Demo Auditor</span>
                  <span className="text-xs text-muted-foreground">auditor@sanafin.com</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}

function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { processed, animationSeen } = useData();
  const dashboardVisible = processed && animationSeen;

  const handleScroll = (id: string) => {
    if (id === 'upload-section') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-sidebar">
      <SidebarHeader className={`h-20 flex items-center justify-center ${isCollapsed ? 'px-0' : 'px-3'}`}>
        {isCollapsed ? (
          <img src={symbolIcon} alt="SanaFin" className="h-10 w-10 object-contain" />
        ) : (
          <div className="flex w-full items-center justify-center px-2">
            <img src={sanafinLogo} alt="SanaFin" className="h-14 w-auto object-contain" />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {isCollapsed && (
          <div className="flex justify-center pt-3">
            <SidebarTrigger className="size-10 [&_svg]:size-5" />
          </div>
        )}
        <SidebarGroup>
          {!isCollapsed ? (
            <SidebarGroupLabel className="flex w-full items-center justify-between pr-0">
              <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground/85">Navigation</span>
              <SidebarTrigger className="size-6 [&_svg]:size-3.5 shrink-0 text-muted-foreground/80 hover:text-foreground transition-colors" />
            </SidebarGroupLabel>
          ) : (
            <SidebarGroupLabel>Nav</SidebarGroupLabel>
          )}
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {/* Data Ingestion */}
              <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <SidebarMenuButton 
                  onClick={() => handleScroll('upload-section')}
                  className="[&>svg]:size-4 group-data-[collapsible=icon]:size-8! cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full font-bold text-xs">
                    <Upload className="text-brand-teal size-4 shrink-0" />
                    <span>Data Ingestion</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Overview */}
              <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <SidebarMenuButton 
                  onClick={() => handleScroll('overview-section')}
                  disabled={!dashboardVisible}
                  className={`[&>svg]:size-4 group-data-[collapsible=icon]:size-8! cursor-pointer ${
                    !dashboardVisible ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 w-full font-bold text-xs">
                    <Home className="text-brand-teal size-4 shrink-0" />
                    <span>Overview</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Completion */}
              <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <SidebarMenuButton 
                  onClick={() => handleScroll('completion-section')}
                  disabled={!dashboardVisible}
                  className={`[&>svg]:size-4 group-data-[collapsible=icon]:size-8! cursor-pointer ${
                    !dashboardVisible ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 w-full font-bold text-xs">
                    <CheckCircle2 className="text-brand-teal size-4 shrink-0" />
                    <span>Completion</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Ongoing */}
              <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <SidebarMenuButton 
                  onClick={() => handleScroll('ongoing-section')}
                  disabled={!dashboardVisible}
                  className={`[&>svg]:size-4 group-data-[collapsible=icon]:size-8! cursor-pointer ${
                    !dashboardVisible ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 w-full font-bold text-xs">
                    <Flame className="text-brand-amber size-4 shrink-0" />
                    <span>Ongoing</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {!isCollapsed && (
        <SidebarFooter className="px-5 py-4 bg-muted/10">
          <p className="text-xs text-muted-foreground font-semibold">Sanafin Outcome Studio</p>
          <p className="text-[10px] text-muted-foreground/75">Version 0.2</p>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

function AppShell() {
  const { open, close, reopen } = useWelcomeModal();
  const { processed, animationSeen, setProcessed, setAnimationSeen, dataSource, clearUploadedData } = useData();
  const [targetsOpen, setTargetsOpen] = useState(false);
  const [initialUploadTab, setInitialUploadTab] = useState<'sample' | 'upload'>('sample');

  // Radix UI Dialog components sometimes fail to clean up scroll locks and pointer-events constraints
  // on body and html tags. This hook guarantees scrolling is immediately re-enabled when modals close.
  useEffect(() => {
    if (!open && !targetsOpen) {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
      document.documentElement.style.pointerEvents = 'auto';
      document.documentElement.style.overflow = 'auto';
    }
  }, [open, targetsOpen]);

  const checkManualWorkflow = (workflow: string) => {
    if (workflow === 'manual') {
      setTimeout(() => setTargetsOpen(true), 400);
    }
  };

  const handleStartSample = (workflow: string) => {
    close();
    setInitialUploadTab('sample');
    if (dataSource === 'uploaded') {
      clearUploadedData();
    }
    setProcessed(true);
    setAnimationSeen(false);
    checkManualWorkflow(workflow);
  };

  const handleGoToUpload = (workflow: string) => {
    close();
    setInitialUploadTab('upload');
    checkManualWorkflow(workflow);
  };

  const handleGoToDashboard = (workflow: string) => {
    close();
    checkManualWorkflow(workflow);
  };

  const handleChangeCohort = () => {
    reopen();
  };

  const handleStepClick = (stepId: string) => {
    if (stepId === 'injection') {
      reopen();
    } else if (stepId === 'verification') {
      setTargetsOpen(true);
    } else if (stepId === 'reporting') {
      const el = document.getElementById('outcome-breakdown');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <SidebarProvider style={{ "--sidebar-width-icon": "4rem" } as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 bg-background">
          <AppHeader
            onConfigureTargets={() => setTargetsOpen(true)}
            showChangeCohort={processed && animationSeen}
            onChangeCohort={handleChangeCohort}
            dataSource={dataSource}
          />
          
          <main className="flex-1 bg-muted/15 bg-dot-grid ambient-bg-glow relative">
            <div className="max-w-7xl mx-auto p-8 space-y-8 relative z-10">
              {/* Top Section: Upload panel / Pipeline animation */}
              <DataUpload
                initialTab={initialUploadTab}
                onNodeClick={handleStepClick}
              />

              {/* Bottom Section: Dashboard outcomes (appears once animation has finished) */}
              {processed && animationSeen && (
                <div className="border-t border-muted-foreground/10 pt-4">
                  <Dashboard />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <WelcomePage
        open={open}
        onClose={close}
        onStartUpload={handleStartSample}
        onGoToUpload={handleGoToUpload}
        onGoToDashboard={handleGoToDashboard}
      />

      <Dialog open={targetsOpen} onOpenChange={setTargetsOpen}>
        <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:rounded-xl">
          <OutcomeTargets />
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <AppShell />
  );
}
