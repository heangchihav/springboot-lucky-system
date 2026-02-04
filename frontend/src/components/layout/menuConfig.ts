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
    description: "Call center operations and queue management",
    items: [
      {
        id: "call-dashboard",
        label: "Dashboard",
        description: "Overview of call center performance",
        path: "/call-service/dashboard",
        menuNumber: "1",
        requiredPermission: "menu.1.view",
      },
      {
        id: "call-submit-report",
        label: "Submit Report",
        description: "Submit and update call reports",
        path: "/call-service/submit-report",
        menuNumber: "2",
        requiredPermission: "menu.3.view",
      },
      {
        id: "call-reports",
        label: "Reports",
        description: "Detailed call analytics and reporting",
        path: "/call-service/reports",
        menuNumber: "3",
        requiredPermission: "menu.3.analytics",
      },

      {
        id: "call-manage-user",
        label: "Manage Users",
        description: "Manage user accounts and access levels",
        path: "/call-service/manage-user",
        menuNumber: "4",
        requiredPermission: "menu.4.view",
      },
      {
        id: "call-permissions",
        label: "Permissions",
        description: "Configure roles and access permissions",
        path: "/call-service/permissions",
        menuNumber: "5",
        requiredPermission: "menu.5.view",
      },
      {
        id: "call-area-branch",
        label: "Area & Branch",
        description: "Manage service locations and branches",
        path: "/call-service/area-branch",
        menuNumber: "6",
        requiredPermission: "menu.2.view",
      },
    ],
  },
  {
    id: "delivery-service",
    label: "Delivery Service",
    description: "Delivery fleet and operations management",
    items: [
      {
        id: "delivery-dashboard",
        label: "Dashboard",
        description: "Delivery performance overview",
        path: "/delivery-service/dashboard",
        menuNumber: "1",
      },
      {
        id: "delivery-reports",
        label: "Reports",
        description: "Detailed delivery analytics",
        path: "/delivery-service/reports",
        menuNumber: "2",
      },
      {
        id: "delivery-manage-users",
        label: "Manage Users",
        description: "Manage delivery staff and assignments",
        path: "/delivery-service/manage-users",
        menuNumber: "3",
      },
    ],
  },
  {
    id: "marketing-service",
    label: "Marketing Service",
    description: "Marketing insights and competitor analysis",
    items: [
      {
        id: "marketing-competitors",
        label: "Competitors Dashboard",
        description: "Competitor analysis and benchmarking",
        path: "/marketing-service/competitors-dashboard",
        menuNumber: "1",
        requiredPermission: "competitor.view",
      },

      {
        id: "marketing-vip",
        label: "VIP Members Dashboard",
        description: "VIP member tracking and engagement",
        path: "/marketing-service/vip-members-dashboard",
        menuNumber: "2",
        requiredPermission: "member.view",
      },
      {
        id: "marketing-goods",
        label: "Goods Dashboard",
        description: "Product category and demand monitoring",
        path: "/marketing-service/goods-dashboard",
        menuNumber: "3",
        requiredPermission: "goods.view",
      },
      {
        id: "marketing-competitors-management",
        label: "Competitor Management",
        description: "Manage competitor profiles and area assignments",
        path: "/marketing-service/competitors-management",
        menuNumber: "4",
        requiredPermission: "competitor.create",
      },
      {
        id: "marketing-goods-input",
        label: "Record Goods Data",
        description: "Record VIP member shipment data",
        path: "/marketing-service/goods-input",
        menuNumber: "5",
        requiredPermission: "goods.create",
      },
      {
        id: "marketing-area-branch",
        label: "Area · Sub Area · Branch",
        description: "Manage marketing regions and branches",
        path: "/marketing-service/area-branch",
        menuNumber: "6",
        requiredPermission: "area.view",
      },
      {
        id: "marketing-manage-vip",
        label: "Manage VIP Members",
        description: "Manage VIP member assignments",
        path: "/marketing-service/manage-vip-members",
        menuNumber: "7",
        requiredPermission: "member.create",
      },
      {
        id: "marketing-daily-report",
        label: "Daily Reports",
        description: "Create and manage daily marketing reports",
        path: "/marketing-service/daily-report",
        menuNumber: "8",
        requiredPermission: "menu.marketing.reports.view",
      },

      {
        id: "marketing-manage-users",
        label: "Manage Users",
        description: "Manage marketing service users",
        path: "/marketing-service/manage-users",
        menuNumber: "9",
        requiredPermission: "menu.5.view",
      },
      {
        id: "marketing-setups",
        label: "Setups",
        description: "Manage marketing operation setups",
        path: "/marketing-service/setups",
        menuNumber: "10",
        requiredPermission: "problem.view",
      },
      {
        id: "marketing-permissions",
        label: "Permissions",
        description: "Manage marketing service permissions",
        path: "/marketing-service/permissions",
        menuNumber: "11",
        requiredPermission: "menu.5.view",
      },
    ],
  },
  {
    id: "branchreport-service",
    label: "Branch Report Service",
    description: "Branch hierarchy and reporting management",
    items: [
      {
        id: "branchreport-area-branch",
        label: "Area · Sub Area · Branch",
        description: "Manage branch hierarchy structure",
        path: "/branchreport-service/area-branch",
        menuNumber: "1",
      },
    ],
  },
  {
    id: "user-service",
    label: "User Service",
    description: "User management and access control",
    items: [
      {
        id: "user-dashboard",
        label: "Dashboard",
        description: "User service performance metrics",
        path: "/user-service/dashboard",
        menuNumber: "1",
      },
      {
        id: "user-services",
        label: "Services",
        description: "Service configuration management",
        path: "/user-service/services",
        menuNumber: "2",
      },
      {
        id: "user-manage-users",
        label: "Manage Users",
        description: "User account administration",
        path: "/user-service/manage-users",
        menuNumber: "3",
      },
    ],
  },
];
