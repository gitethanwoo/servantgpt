'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';

import { HomeIcon, CompassIcon, SearchIcon, PlusIcon } from '@/components/icons';
import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { ThemeLogo } from './theme-logo';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Button } from '@/components/ui/button';

const items = [
  {
    title: "Chat",
    url: "/",
    icon: HomeIcon,
  },
  {
    title: "Tools",
    url: "/tools",
    icon: CompassIcon,
  },
  {
    title: "Research",
    url: "#",
    icon: SearchIcon,
    disabled: true,
    comingSoon: true,
  },
]

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link href="/" onClick={() => setOpenMobile(false)}>
              <ThemeLogo />
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="p-2 h-fit"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/');
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-auto">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        disabled={item.disabled}
                      >
                        <Link href={item.url} onClick={() => setOpenMobile(false)}>
                          <item.icon size={24} />
                          <span>{item.title}</span>
                          {item.comingSoon && (
                            <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarHistory user={user} />
          </div>
          
          <div className="mt-auto">
            {user && <SidebarUserNav user={user} />}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
