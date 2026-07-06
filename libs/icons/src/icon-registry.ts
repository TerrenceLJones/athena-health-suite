// GENERATED FILE — do not edit by hand.
// Source: specs/designs/athena-icons.js.
// Regenerate with: pnpm --filter @athena/icons generate

export interface IconDefinition {
  viewBox: string;
  sw: number;
  filled: boolean;
  body: string;
}

export type IconName =
  | 'check'
  | 'x'
  | 'x-circle'
  | 'plus'
  | 'minus'
  | 'chevron-right'
  | 'chevron-down'
  | 'circle'
  | 'circle-filled'
  | 'dot'
  | 'triangle'
  | 'triangle-filled'
  | 'circle-info'
  | 'reconciled'
  | 'freeze'
  | 'clock'
  | 'lock'
  | 'shield-check'
  | 'shield-alert'
  | 'face-scan'
  | 'refresh'
  | 'spinner'
  | 'cloud-off'
  | 'wifi'
  | 'search'
  | 'trash'
  | 'camera'
  | 'camera-off'
  | 'info'
  | 'eye'
  | 'eye-off'
  | 'sev-critical'
  | 'sev-advisory'
  | 'sev-info'
  | 'heartbeat'
  | 'bell'
  | 'capsule'
  | 'user'
  | 'user-plus'
  | 'copy'
  | 'clipboard'
  | 'gear'
  | 'grid'
  | 'activity'
  | 'sun'
  | 'moon';

export type AliasName =
  | 'warning'
  | 'critical'
  | 'advisory'
  | 'stale'
  | 'resync'
  | 'retry'
  | 'unconfirmed'
  | 'offline'
  | 'vitals'
  | 'alerts'
  | 'meds'
  | 'patients'
  | 'patient'
  | 'chart'
  | 'settings'
  | 'services'
  | 'analytics'
  | 'add-user';

export const iconRegistry: Record<IconName, IconDefinition> = {
  check: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M3.5 8.5 L6.5 11.5 L12.5 5"/>',
  },
  x: { viewBox: '0 0 16 16', sw: 1.6, filled: false, body: '<path d="M4 4 L12 12 M12 4 L4 12"/>' },
  'x-circle': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<circle cx="8" cy="8" r="6.2"/><path d="M6 6 L10 10 M10 6 L6 10"/>',
  },
  plus: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M8 3.5 V12.5 M3.5 8 H12.5"/>',
  },
  minus: { viewBox: '0 0 16 16', sw: 1.6, filled: false, body: '<path d="M3.5 8 H12.5"/>' },
  'chevron-right': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M6.5 4 L10.5 8 L6.5 12"/>',
  },
  'chevron-down': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M4 6.5 L8 10.5 L12 6.5"/>',
  },
  circle: { viewBox: '0 0 16 16', sw: 1.6, filled: false, body: '<circle cx="8" cy="8" r="6"/>' },
  'circle-filled': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: true,
    body: '<circle cx="8" cy="8" r="6.5"/>',
  },
  dot: { viewBox: '0 0 16 16', sw: 1.6, filled: true, body: '<circle cx="8" cy="8" r="3.4"/>' },
  triangle: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M8 2.5 L14.5 13.5 L1.5 13.5 Z"/>',
  },
  'triangle-filled': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: true,
    body: '<path d="M8 2.5 L14.5 13.5 L1.5 13.5 Z"/>',
  },
  'circle-info': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<circle cx="8" cy="8" r="6.2"/><path d="M8 7.4 V11"/><path d="M8 4.8 V5.3"/>',
  },
  reconciled: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<circle cx="8" cy="8" r="6.2"/><path d="M5.5 8.2 L7.2 9.9 L10.6 6.3"/>',
  },
  freeze: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M8 2 V14 M2.7 5 L13.3 11 M13.3 5 L2.7 11"/>',
  },
  clock: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<circle cx="8" cy="8" r="6.2"/><path d="M8 4.5 V8 L10.5 9.8"/>',
  },
  lock: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<rect x="3.5" y="7.3" width="9" height="6.7" rx="1.2"/><path d="M5.5 7.3 V5.4 A2.5 2.5 0 0 1 10.5 5.4 V7.3"/>',
  },
  'shield-check': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M8 2 L13 4 V8 C13 11 10.5 13.2 8 14 C5.5 13.2 3 11 3 8 V4 Z"/><path d="M6 8 L7.4 9.4 L10.4 6.2"/>',
  },
  'shield-alert': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M8 2 L13 4 V8 C13 11 10.5 13.2 8 14 C5.5 13.2 3 11 3 8 V4 Z"/><path d="M8 5.6 V8.8 M8 10.9 V11.1"/>',
  },
  'face-scan': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M3 6 V4.5 A1.5 1.5 0 0 1 4.5 3 H6 M10 3 H11.5 A1.5 1.5 0 0 1 13 4.5 V6 M13 10 V11.5 A1.5 1.5 0 0 1 11.5 13 H10 M6 13 H4.5 A1.5 1.5 0 0 1 3 11.5 V10"/><path d="M6.3 7 V7.9 M9.7 7 V7.9"/><path d="M6.3 10 Q8 11.3 9.7 10"/>',
  },
  refresh: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M13 8 A5 5 0 1 1 11.4 4.3"/><path d="M11.4 1.8 L11.8 4.6 L9 4.4"/>',
  },
  spinner: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M8 2 A6 6 0 1 1 2.4 6"/>',
  },
  'cloud-off': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M4.6 12 A2.6 2.6 0 0 1 4.6 6.9 A3.5 3.5 0 0 1 11 6.6 A2.6 2.6 0 0 1 11.2 12 Z"/><path d="M2.4 2.4 L13.6 13.6"/>',
  },
  wifi: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M2.5 6.2 A8 8 0 0 1 13.5 6.2 M4.6 8.6 A5 5 0 0 1 11.4 8.6 M6.7 11 A2 2 0 0 1 9.3 11"/><circle cx="8" cy="12.6" r="0.5"/>',
  },
  search: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<circle cx="7" cy="7" r="4.2"/><path d="M10.1 10.1 L13.5 13.5"/>',
  },
  trash: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M3.5 4.5 H12.5"/><path d="M5.4 4.5 V13 A1 1 0 0 0 6.4 14 H9.6 A1 1 0 0 0 10.6 13 V4.5"/><path d="M6.5 4.5 V3.3 A1 1 0 0 1 7.5 2.3 H8.5 A1 1 0 0 1 9.5 3.3 V4.5"/>',
  },
  camera: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<rect x="2.5" y="5" width="11" height="8" rx="1.6"/><circle cx="8" cy="9" r="2.4"/><path d="M6 5 L6.8 3.5 H9.2 L10 5"/>',
  },
  'camera-off': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<rect x="2.5" y="5" width="11" height="8" rx="1.6"/><circle cx="8" cy="9" r="2.4"/><path d="M2.2 2.2 L13.8 13.8"/>',
  },
  info: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<circle cx="8" cy="8" r="6.2"/><path d="M8 7.4 V11"/><path d="M8 4.8 V5.3"/>',
  },
  eye: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M1.5 8 C3.5 4.5 12.5 4.5 14.5 8 C12.5 11.5 3.5 11.5 1.5 8 Z"/><circle cx="8" cy="8" r="2.1"/>',
  },
  'eye-off': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M3 5.5 C1.9 6.3 1.5 8 1.5 8 C3.5 11.5 12.5 11.5 14.5 8 M6.6 6.2 A2.1 2.1 0 0 1 10 9.4"/><path d="M2.2 2.2 L13.8 13.8"/>',
  },
  'sev-critical': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M5.6 1.6 H10.4 L14.4 5.6 V10.4 L10.4 14.4 H5.6 L1.6 10.4 V5.6 Z"/><path d="M8 5 V8.6"/><path d="M8 10.9 h0.01"/>',
  },
  'sev-advisory': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M8 2 L14.6 13.6 H1.4 Z"/><path d="M8 6.4 V9.9"/><path d="M8 11.9 h0.01"/>',
  },
  'sev-info': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<circle cx="8" cy="8" r="6.2"/><path d="M8 7.4 V11"/><path d="M8 4.8 V5.3"/>',
  },
  heartbeat: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M1.5 8 H4.3 L5.8 4.6 L8.3 12 L10.3 6.6 L11.6 8 H14.5"/>',
  },
  bell: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M8 2.2 A3.4 3.4 0 0 0 4.6 5.6 V8.2 L3.2 10.6 H12.8 L11.4 8.2 V5.6 A3.4 3.4 0 0 0 8 2.2 Z"/><path d="M6.4 11.4 A1.7 1.7 0 0 0 9.6 11.4"/>',
  },
  capsule: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<rect x="2.4" y="6" width="11.2" height="4" rx="2"/><path d="M8 6 V10"/>',
  },
  user: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<circle cx="8" cy="5.6" r="2.6"/><path d="M3.4 13.6 A4.6 4.6 0 0 1 12.6 13.6"/>',
  },
  'user-plus': {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<circle cx="6.4" cy="5.6" r="2.6"/><path d="M2 13.6 A4.4 4.4 0 0 1 10.8 13.6"/><path d="M12.6 4.8 V8.8 M10.6 6.8 H14.6"/>',
  },
  copy: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<rect x="5.5" y="5.5" width="8" height="8" rx="1.4"/><path d="M10.5 5.5 V3.4 A0.9 0.9 0 0 0 9.6 2.5 H3.4 A0.9 0.9 0 0 0 2.5 3.4 V9.6 A0.9 0.9 0 0 0 3.4 10.5 H5.5"/>',
  },
  clipboard: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<rect x="3.6" y="3" width="8.8" height="11" rx="1.3"/><path d="M6.2 2.3 H9.8 V4.1 H6.2 Z"/><path d="M5.8 7.2 H10.2 M5.8 9.6 H9"/>',
  },
  gear: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<circle cx="8" cy="8" r="2.2"/><path d="M8 1.6 V3.1 M8 12.9 V14.4 M1.6 8 H3.1 M12.9 8 H14.4 M3.4 3.4 L4.5 4.5 M11.5 11.5 L12.6 12.6 M12.6 3.4 L11.5 4.5 M4.5 11.5 L3.4 12.6"/>',
  },
  grid: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<rect x="2.6" y="2.6" width="4.6" height="4.6" rx="1"/><rect x="8.8" y="2.6" width="4.6" height="4.6" rx="1"/><rect x="2.6" y="8.8" width="4.6" height="4.6" rx="1"/><rect x="8.8" y="8.8" width="4.6" height="4.6" rx="1"/>',
  },
  activity: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<path d="M1.5 8.5 H4.5 L6 4 L8.5 12.5 L10.2 8.5 H14.5"/>',
  },
  sun: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: false,
    body: '<circle cx="8" cy="8" r="2.9"/><path d="M8 1.6 V3 M8 13 V14.4 M1.6 8 H3 M13 8 H14.4 M3.4 3.4 L4.4 4.4 M11.6 11.6 L12.6 12.6 M12.6 3.4 L11.6 4.4 M4.4 11.6 L3.4 12.6"/>',
  },
  moon: {
    viewBox: '0 0 16 16',
    sw: 1.6,
    filled: true,
    body: '<path d="M13.2 9.6 A5.4 5.4 0 0 1 6.4 2.8 A4.6 4.6 0 1 0 13.2 9.6 Z"/>',
  },
};

export const iconAliases: Record<AliasName, IconName> = {
  warning: 'triangle-filled',
  critical: 'circle-filled',
  advisory: 'triangle-filled',
  stale: 'triangle-filled',
  resync: 'refresh',
  retry: 'refresh',
  unconfirmed: 'dot',
  offline: 'cloud-off',
  vitals: 'heartbeat',
  alerts: 'bell',
  meds: 'capsule',
  patients: 'user',
  patient: 'user',
  chart: 'clipboard',
  settings: 'gear',
  services: 'grid',
  analytics: 'activity',
  'add-user': 'user-plus',
};
