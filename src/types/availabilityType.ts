export interface AvailabilityType {
  key: string;
  label: string;
  color: string;
  enabled: boolean;
  isDefault: boolean;
}

export const DEFAULT_AVAILABILITY_TYPES: AvailabilityType[] = [
  { key: "available",    label: "Available",       color: "#a5d6a7", enabled: true, isDefault: true },
  { key: "notAvailable", label: "Not Available",   color: "#cccccc", enabled: true, isDefault: true },
  { key: "class",        label: "Class",           color: "#90caf9", enabled: true, isDefault: true },
  { key: "preferred",    label: "Preferred Shift", color: "#ffd54f", enabled: true, isDefault: true },
];
