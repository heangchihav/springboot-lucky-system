export const messages = {
  en: {
    VET_System: "VET System",
    controlCenter: "Control Center",
    staffMode: "Staff Mode",
    executive: "Executive",
    microserviceStatus: "Microservice Status",
    activePrograms: "Active Programs",
    strategicWorkbench: "Strategic Workbench",
    activeProgramsSubtitle:
      "Pin any module from the left to monitor it in real time.",
    breadcrumbsHome: "home",
    pulse: "Pulse",
    stabilityCopy: "Stability score across the module in the past 24h.",
    noModuleTitle: "No module pinned.",
    noModuleSubtitle:
      "Choose any menu item from the left panel to open it as a tab. Tabs stay active until you close them with the ✕ control.",
    localeLabel: "Language",
    themeLabel: "Theme",
    operatorLabel: "Operator",
    welcomeBack: "Welcome back",
    lastLogin: "Last login",
    signOut: "Sign Out",
    serviceAccess: "Service access",
    serviceAccessSubtitle:
      "Each module exposes its own navigation path and actions. Assign service accounts accordingly.",
    permissionPlaybook: "Permission playbook",
    manageAccess: "Manage Access",
    roleMatrixSnapshot: "Role matrix snapshot",
    operationalCoverage: "Operational coverage",
  },
  km: {
    VET_System: "ប្រព័ន្ធធ្វើរបាយការណ៍",
    controlCenter: "មជ្ឈមណ្ឌលបញ្ជា",
    staffMode: "របៀបបុគ្គលិក",
    executive: "អ្នកគ្រប់គ្រង",
    microserviceStatus: "ស្ថានភាព Microservice",
    activePrograms: "កម្មវិធីសកម្ម",
    strategicWorkbench: "តំបន់ធ្វើការ​យុទ្ធសាស្រ្ត",
    activeProgramsSubtitle: "ជ្រើសម៉ូឌុលពីខាងឆ្វេងដើម្បីតាមដានពេលវេលាពិត។",
    breadcrumbsHome: "ទំព័រដើម",
    pulse: "Pulse",
    stabilityCopy: "ពិន្ទុស្ថិរភាពក្នុងរយៈពេល 24 ម៉ោងកន្លងមក។",
    noModuleTitle: "មិនមានម៉ូឌុលដែលបានជ្រើសទេ។",
    noModuleSubtitle:
      "ជ្រើសម៉ឺនុយណាមួយពីផ្នែកខាងឆ្វេងដើម្បីបើកជាប៊េទឺប។ ប៊េទឺបនៅសកម្មរហូតដល់អ្នកបិតវាជាមួយ ✕.",
    localeLabel: "ភាសា",
    themeLabel: "ស្បែក",
    operatorLabel: "ប្រតិបត្តិករ",
    welcomeBack: "សូមស្វាគមន៍វិញ",
    lastLogin: "ការចូលចុងក្រោយ",
    signOut: "ចេញ",
    serviceAccess: "ការចូលប្រើសេវាកម្ម",
    serviceAccessSubtitle:
      "ម៉ូឌុលនីមួយៗបង្ហាញផ្លូវនាវីហ្គេសិនផ្ទាល់ខ្លួន។ ចែកចាយគណនីសេវាកម្មតាមសិទ្ធិ។",
    permissionPlaybook: "សៀវភៅណែនាំសិទ្ធិ",
    manageAccess: "គ្រប់គ្រងសិទ្ធិ",
    roleMatrixSnapshot: "ផែនទីតួនាទី",
    operationalCoverage: "ដែនកំណត់ប្រតិបត្តិការ",
  },
};

export type SupportedLocale = keyof typeof messages;

export const SUPPORTED_LOCALES = Object.keys(messages) as SupportedLocale[];

export function getMessages(locale: string) {
  return messages[locale as SupportedLocale];
}
