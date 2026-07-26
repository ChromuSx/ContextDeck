export type RawSelectionKind =
  | 'none'
  | 'text'
  | 'file'
  | 'folder'
  | 'image'
  | 'image-file'
  | 'unknown';

export type ProfileKind = 'text' | 'file' | 'folder' | 'image';

export interface SelectionObservation {
  kind: RawSelectionKind;
  process: string;
  source: string;
  confidence: 'low' | 'medium' | 'high';
  timestamp: string;
}

export interface ContextDeckSettings {
  profileRepairVersion: number;
  enabled: boolean;
  debounceMs: number;
  returnDelayMs: number;
  helperPollMs: number;
  enableText: boolean;
  enableFiles: boolean;
  enableFolders: boolean;
  enableImages: boolean;
  imageFileMode: 'image' | 'file';
  excludedProcesses: string[];
  targetDeviceIds: string[];
}

export interface StreamDeckDevice {
  id: string;
  name: string;
  type: number;
  size?: {
    columns: number;
    rows: number;
  };
}

export interface RegistrationInfo {
  application?: {
    version?: string;
    platform?: string;
    platformVersion?: string;
  };
  devices?: StreamDeckDevice[];
}
