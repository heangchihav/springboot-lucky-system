export type SubMenuItem = {
  id: string;
  label: string;
  description: string;
  path: string;
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
      },
      
      {
        id: "call-area-branch",
        label: "Area & Branch",
        description: "Manage areas and branches for call service",
        path: "/call-service/area-branch",
      },
      {
        id: "call-reports",
        label: "Reports",
        description: "Detailed call reports and analytics",
        path: "/call-service/reports",
      },
      {
        id: "call-manage-user",
        label: "Manage Users",
        description: "Manage call center users and their permissions",
        path: "/call-service/manage-user",
      }
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
      },
      {
        id: "delivery-reports",
        label: "Reports",
        description: "View detailed delivery reports and analytics",
        path: "/delivery-service/reports",
      },
      {
        id: "delivery-manage-users",
        label: "Manage Users",
        description: "Manage delivery personnel and their assignments",
        path: "/delivery-service/manage-users",
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
       },
       {
        id: "user-services",
        label: "Services",
        description: "Manage services and their configurations",
        path: "/user-service/services",
       },
       {
        id: "user-manage-users",
        label: "Manage Users",
        description: "Manage user accounts and permissions",
        path: "/user-service/manage-users",
       }
    ],
  },
];
