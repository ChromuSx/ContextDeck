import {
  ContextDeckSettings,
  ProfileKind,
  RawSelectionKind,
  SelectionObservation,
} from './types';

export const DEFAULT_SETTINGS: ContextDeckSettings = {
  enabled: true,
  debounceMs: 300,
  returnDelayMs: 450,
  helperPollMs: 500,
  enableText: true,
  enableFiles: true,
  enableFolders: true,
  enableImages: true,
  imageFileMode: 'image',
  excludedProcesses: ['streamdeck', 'contextdeck.helper'],
  targetDeviceIds: [],
};

const DEVICE_SLUGS: Readonly<Record<number, string>> = {
  0: 'sd',
  1: 'sd-mini',
  2: 'sdxl',
  3: 'sd-mobile',
  7: 'sdp',
  9: 'sd-neo',
};

export function normalizeSettings(value: unknown): ContextDeckSettings {
  const input = isRecord(value) ? value : {};
  return {
    enabled: booleanValue(input.enabled, DEFAULT_SETTINGS.enabled),
    debounceMs: numberValue(input.debounceMs, 100, 2000, DEFAULT_SETTINGS.debounceMs),
    returnDelayMs: numberValue(input.returnDelayMs, 100, 3000, DEFAULT_SETTINGS.returnDelayMs),
    helperPollMs: numberValue(input.helperPollMs, 250, 2000, DEFAULT_SETTINGS.helperPollMs),
    enableText: booleanValue(input.enableText, DEFAULT_SETTINGS.enableText),
    enableFiles: booleanValue(input.enableFiles, DEFAULT_SETTINGS.enableFiles),
    enableFolders: booleanValue(input.enableFolders, DEFAULT_SETTINGS.enableFolders),
    enableImages: booleanValue(input.enableImages, DEFAULT_SETTINGS.enableImages),
    imageFileMode: input.imageFileMode === 'file' ? 'file' : 'image',
    excludedProcesses: stringArray(input.excludedProcesses, DEFAULT_SETTINGS.excludedProcesses),
    targetDeviceIds: stringArray(input.targetDeviceIds, DEFAULT_SETTINGS.targetDeviceIds),
  };
}

export function resolveProfileKind(
  observation: SelectionObservation,
  settings: ContextDeckSettings
): ProfileKind | undefined {
  if (!settings.enabled || isProcessExcluded(observation.process, settings.excludedProcesses)) {
    return undefined;
  }

  const kind = observation.kind;
  if (kind === 'text' && settings.enableText) return 'text';
  if (kind === 'file' && settings.enableFiles) return 'file';
  if (kind === 'folder' && settings.enableFolders) return 'folder';
  if (kind === 'image' && settings.enableImages) return 'image';
  if (kind === 'image-file') {
    if (settings.imageFileMode === 'image' && settings.enableImages) return 'image';
    if (settings.imageFileMode === 'file' && settings.enableFiles) return 'file';
  }

  return undefined;
}

export function profileName(kind: ProfileKind, deviceType: number): string | undefined {
  const slug = DEVICE_SLUGS[deviceType];
  return slug ? `profiles/${kind}-${slug}` : undefined;
}

export function isSupportedDeviceType(deviceType: number): boolean {
  return DEVICE_SLUGS[deviceType] !== undefined;
}

export function rawKindLabel(kind: RawSelectionKind): string {
  switch (kind) {
    case 'image-file':
      return 'Image file';
    case 'none':
      return 'No selection';
    default:
      return `${kind.charAt(0).toUpperCase()}${kind.slice(1)}`;
  }
}

function isProcessExcluded(processName: string, excludedProcesses: string[]): boolean {
  const normalized = normalizeProcessName(processName);
  return excludedProcesses.some((entry) => normalizeProcessName(entry) === normalized);
}

function normalizeProcessName(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\.exe$/, '');
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function numberValue(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function stringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];
  const unique = new Set(
    value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  );
  return [...unique];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
