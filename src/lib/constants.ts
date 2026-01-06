/**
 * Service List Constants
 * These are the services that users can select from when creating or editing a lead.
 */
export const SERVICE_LIST = [
    "Financial planning HOT",
    "Financial Planning COLD",
    "Mutual Fund (Lumpsum)",
    "Mutual Fund (SIP)",
    "Term Insurance",
    "Health Insurance",
    "ULIP",
    "GRIP",
    "Vehicle Insurance"
] as const;


export type ServiceType = typeof SERVICE_LIST[number];
