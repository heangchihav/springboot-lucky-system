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
        id: "call-overview",
        label: "Overview",
        description: "Command summary of the call center",
        path: "/call-service/overview",
      },
      {
        id: "call-queue",
        label: "Queue Health",
        description: "Monitor wait times and SLAs",
        path: "/call-service/queue-health",
      },
      {
        id: "call-escalations",
        label: "Escalations",
        description: "Track open incidents and handoffs",
        path: "/call-service/escalations",
      },
    ],
  },
  {
    id: "delivery-service",
    label: "Delivery Service",
    description: "Fleet coverage & density insights",
    items: [
      {
        id: "delivery-overview",
        label: "Overview",
        description: "Live KPIs for the delivery network",
        path: "/delivery-service/overview",
      },
      {
        id: "delivery-fleet",
        label: "Fleet Tracking",
        description: "Vehicle routes and progress",
        path: "/delivery-service/fleet-tracking",
      },
      {
        id: "delivery-density",
        label: "Drop Density",
        description: "Heat-maps of fulfillment zones",
        path: "/delivery-service/drop-density",
      },
    ],
  },
  {
    id: "user-service",
    label: "User Service",
    description: "Directory, access, and audit trails",
    items: [
      {
        id: "user-directory",
        label: "Directory",
        description: "All operators and contact data",
        path: "/user-service/directory",
      },
      {
        id: "user-roles",
        label: "Roles & Access",
        description: "Permission matrices & journeys",
        path: "/user-service/roles",
      },
      {
        id: "user-audit",
        label: "Audit Center",
        description: "Session history & approvals",
        path: "/user-service/audit",
      },
    ],
  },
];
