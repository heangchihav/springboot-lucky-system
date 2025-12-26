export type SubMenuItem = {
  id: string;
  label: string;
  description: string;
  path: string;
  menuNumber: string;
  requiredPermission?: string;
};

export type MenuSection = {
  id: string;
  label: string;
  description: string;
  items: SubMenuItem[];
};

export const MENU_SECTIONS: MenuSection[] = [
  {
    id: "call-service",
    label: "Call Service",
    description: "Queue health, escalations, live ops",
    items: [
      {
        id: "call-dashboard",
        label: "Dashboard",
        description: "Overview of call service metrics",
        path: "/call-service/dashboard",
        menuNumber: "1",
        requiredPermission: "menu.1.view",
      },
      {
        id: "call-submit-report",
        label: "Submit Report",
        description: "Record daily call statuses",
        path: "/call-service/submit-report",
        menuNumber: "2",
        requiredPermission: "menu.3.view",
      },
       {
        id: "call-reports",
        label: "Reports",
        description: "Detailed call reports and analytics",
        path: "/call-service/reports",
        menuNumber: "3",
        requiredPermission: "menu.3.analytics",
      },

      {
        id: "call-manage-user",
        label: "Manage Users",
        description: "Manage call center users and their permissions",
        path: "/call-service/manage-user",
        menuNumber: "4",
        requiredPermission: "menu.4.view",
      },
      {
        id: "call-permissions",
        label: "Permissions",
        description: "Manage roles, permissions, and user access control",
        path: "/call-service/permissions",
        menuNumber: "5",
        requiredPermission: "menu.5.view",
      },
      {
        id: "call-area-branch",
        label: "Area & Branch",
        description: "Manage areas and branches for call service",
        path: "/call-service/area-branch",
        menuNumber: "6",
        requiredPermission: "menu.2.view",
      },
    ],
  },
  {
    id: "delivery-service",
    label: "Delivery Service",
    description: "Fleet coverage & density insights",
    items: [
      {
        id: "delivery-dashboard",
        label: "Dashboard",
        description: "Overview of delivery service metrics",
        path: "/delivery-service/dashboard",
        menuNumber: "1",
      },
      {
        id: "delivery-reports",
        label: "Reports",
        description: "View detailed delivery reports and analytics",
        path: "/delivery-service/reports",
        menuNumber: "2",
      },
      {
        id: "delivery-manage-users",
        label: "Manage Users",
        description: "Manage delivery personnel and their assignments",
        path: "/delivery-service/manage-users",
        menuNumber: "3",
      }
    ],
  },
  {
    id: "user-service",
    label: "User Service",
    description: "Directory, access, and audit trails",
    items: [
       {
        id: "user-dashboard",
        label: "Dashboard",
        description: "Overview of user service metrics",
        path: "/user-service/dashboard",
        menuNumber: "1",
       },
       {
        id: "user-services",
        label: "Services",
        description: "Manage services and their configurations",
        path: "/user-service/services",
        menuNumber: "2",
       },
       {
        id: "user-manage-users",
        label: "Manage Users",
        description: "Manage user accounts and permissions",
        path: "/user-service/manage-users",
        menuNumber: "3",
       }
    ],
  },
];
