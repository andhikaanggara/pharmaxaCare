"use client";

import * as React from "react";
import { useTransition } from "react";
import { logoutAction } from "./logout-action";
import {
  Calendar,
  Home,
  LogOut,
  Clipboard,
  ChevronRight,
  Database,
  Wallet,
  Pill,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const data = {
  navSimple: [
    // {
    //   title: "Dashboard",
    //   url: "/",
    //   icon: Home,
    // },

    { title: "Patient Visits", url: "/patient-visits", icon: Clipboard },

    {
      title: "Attendance",
      url: "/attendance",
      icon: Calendar,
    },
    // {
    //   title: "Drug Defect",
    //   url: "/drug-defect",
    //   icon: Pill,
    // },
  ],
  navDropDown: [
    // {
    //   title: "Finance",
    //   url: "",
    //   icon: Wallet,
    //   isActive: true,
    //   items: [
    //     { title: "Receivables", url: "/finance-receivables" },
    //     { title: "Payables", url: "/finance-payables" },
    //   ],
    // },
    {
      title: "Master",
      url: "",
      icon: Database,
      isActive: true,
      items: [
        { title: "Patients", url: "/master-patients" },
        { title: "Staff", url: "/master-staff" },
        { title: "Roles", url: "/master-roles" },
        { title: "Treatments", url: "/master-treatments" },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile, isMobile } = useSidebar();
  const pathname = usePathname();

  const [isPending, startTransition] = useTransition();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="">
                {/* harusnya ini link ke dashboard atau halaman utama setelah login */}
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <img src="favicon.ico" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-blue-300">
                    Pharmaxa Care
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Clinic Management App
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navSimple.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                    onClick={handleNavClick}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {data.navDropDown.map((item) => (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link href={subItem.url} onClick={handleNavClick}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 focus:text-red-600 focus:bg-red-50 dark:hover:bg-red-950/50"
            >
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
