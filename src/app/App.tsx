import { useEffect } from 'react';
import { useData } from '../store/DataContext';
import WorkflowCanvas from './components/WorkflowCanvas';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger, useSidebar,
} from './components/ui/sidebar';
import { Home, CheckCircle2, Activity, Check } from 'lucide-react';
import { STEPS } from '../lib/workflowSteps';
import sanafinLogo from '../assets/sanafin_logo.png';
import symbolIcon from '../assets/Symbol_no_bg.png';

// ── AppHeader ─────────────────────────────────────────────────────────────────

function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-8">
        <span className="hidden md:inline-block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Sanafin Outcome Studio
        </span>

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
    </header>
  );
}

// ── AppSidebar ────────────────────────────────────────────────────────────────

const DASHBOARD_SECTIONS = [
  { id: 'overview-section',   label: 'Overview',   Icon: Home,         color: 'text-brand-teal' },
  { id: 'completion-section', label: 'Completed',  Icon: CheckCircle2, color: 'text-brand-teal' },
  { id: 'ongoing-section',    label: 'Ongoing',    Icon: Activity,     color: 'text-brand-amber' },
] as const;

const HEADER_H = 64;

function getScrollOffset(includeMiniBar = false) {
  if (!includeMiniBar) return HEADER_H;
  const bar = document.querySelector('[data-mini-bar]');
  return HEADER_H + (bar ? bar.getBoundingClientRect().height : 0);
}

function scrollToId(id: string, includeMiniBar = false) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = getScrollOffset(includeMiniBar);
  window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset), behavior: 'smooth' });
}

function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const {
    animationSeen,
    workflowView,
    setWorkflowView,
    workflowRevealedCount,
    workflowCompletedUpTo,
    setPendingWorkflowScroll,
  } = useData();

  function handleWorkflowNodeClick(i: number) {
    if (workflowView !== 'workflow') {
      setPendingWorkflowScroll(i);
      setWorkflowView('workflow');
    } else {
      scrollToId(STEPS[i].id);
    }
  }

  function handleDashboardSectionClick(id: string) {
    if (!animationSeen) return;
    if (workflowView !== 'dashboard') {
      // Switch back to dashboard (view-only navigation), then scroll after render
      setWorkflowView('dashboard');
      setTimeout(() => scrollToId(id, true), 250);
    } else {
      scrollToId(id, true);
    }
  }

  // Dashboard links stay active as long as the user has completed the workflow
  // at least once (animationSeen). They only go grey if the user goes back to
  // actively change a step via the MiniWorkflowBar (which resets animationSeen).
  const dashboardEnabled = animationSeen;

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-sidebar">
      <SidebarHeader className={`h-16 flex items-center justify-center ${isCollapsed ? 'px-0' : 'px-3'}`}>
        {isCollapsed ? (
          <img src={symbolIcon} alt="SanaFin" className="h-8 w-8 object-contain" />
        ) : (
          <div className="flex w-full items-center justify-center px-2">
            <img src={sanafinLogo} alt="SanaFin" className="h-12 w-auto object-contain" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {isCollapsed && (
          <div className="flex justify-center pt-1">
            <SidebarTrigger className="size-8 [&_svg]:size-4" />
          </div>
        )}

        {/* ── Section 1: Clinical Workflow ─────────────────────────────── */}
        <SidebarGroup>
          {!isCollapsed ? (
            <SidebarGroupLabel className="flex w-full items-center justify-between pr-0">
              <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground/85">
                Clinical Workflow
              </span>
              <SidebarTrigger className="size-6 [&_svg]:size-3.5 shrink-0 text-muted-foreground/80 hover:text-foreground transition-colors" />
            </SidebarGroupLabel>
          ) : (
            <SidebarGroupLabel>WF</SidebarGroupLabel>
          )}

          <SidebarGroupContent className="mt-1">
            <SidebarMenu>
              {STEPS.slice(0, workflowRevealedCount).map((step, i) => {
                const Icon = step.Icon;
                const done = workflowCompletedUpTo >= i;
                return (
                  <SidebarMenuItem
                    key={step.id}
                    className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                  >
                    <SidebarMenuButton
                      onClick={() => handleWorkflowNodeClick(i)}
                      className="cursor-pointer group-data-[collapsible=icon]:size-8!"
                      title={step.label}
                    >
                      <div className={`size-5 rounded-full ${step.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="size-2.5 text-white" />
                      </div>
                      <span className="font-bold text-xs truncate flex-1 min-w-0">{step.label}</span>
                      {done && !isCollapsed && (
                        <Check className="size-3 text-emerald-500 flex-shrink-0 ml-auto" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Visual separator */}
        {!isCollapsed && <div className="mx-3 my-0.5 h-px bg-foreground/8" />}

        {/* ── Section 2: Dashboard ─────────────────────────────────────── */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel>
              <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground/85">
                Dashboard
              </span>
            </SidebarGroupLabel>
          )}
          {isCollapsed && <SidebarGroupLabel>DB</SidebarGroupLabel>}

          <SidebarGroupContent className="mt-1">
            <SidebarMenu>
              {DASHBOARD_SECTIONS.map(section => {
                const Icon = section.Icon;
                return (
                  <SidebarMenuItem
                    key={section.id}
                    className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                  >
                    <SidebarMenuButton
                      onClick={() => handleDashboardSectionClick(section.id)}
                      className={`group-data-[collapsible=icon]:size-8! transition-opacity ${
                        dashboardEnabled ? 'cursor-pointer' : 'opacity-35 cursor-not-allowed pointer-events-none'
                      }`}
                      title={section.label}
                    >
                      <Icon className={`${section.color} size-4 shrink-0`} />
                      <span className="font-bold text-xs">{section.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!isCollapsed && (
        <SidebarFooter className="px-5 py-4 bg-muted/10">
          <p className="text-xs text-muted-foreground font-semibold">Sanafin Outcome Studio</p>
          <p className="text-[10px] text-muted-foreground/75">Version 0.3</p>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

// ── AppShell ──────────────────────────────────────────────────────────────────

function AppShell() {
  // Radix UI Dialog components sometimes fail to clean up scroll locks.
  // This guarantees body scrolling stays enabled at all times.
  useEffect(() => {
    document.body.style.pointerEvents = 'auto';
    document.body.style.overflow = 'auto';
    document.documentElement.style.pointerEvents = 'auto';
    document.documentElement.style.overflow = 'auto';
  }, []);

  return (
    <SidebarProvider style={{ '--sidebar-width-icon': '4rem' } as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 bg-background">
          <AppHeader />
          <main className="flex-1 ambient-bg-glow relative">
            <WorkflowCanvas />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return <AppShell />;
}
