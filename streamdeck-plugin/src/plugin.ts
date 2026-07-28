import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';
import * as WebSocketLib from 'ws';
import {
  DEFAULT_SETTINGS,
  isSupportedDeviceType,
  normalizeSettings,
  profileName,
  rawKindLabel,
  resolveProfileKind,
} from './settings';
import {
  ContextDeckSettings,
  ProfileKind,
  RegistrationInfo,
  SelectionObservation,
  StreamDeckDevice,
} from './types';

const pluginUUID = 'com.chromusx.contextdeck';
const controlActionUUID = `${pluginUUID}.control`;

let ws: WebSocketLib.WebSocket;
let pluginApiContext = '';
let registrationInfo: RegistrationInfo = {};
let settings: ContextDeckSettings = DEFAULT_SETTINGS;
let helper: ChildProcess | undefined;
let helperRestartTimer: NodeJS.Timeout | undefined;
let observationTimer: NodeJS.Timeout | undefined;
let helperBuffer = '';
let shuttingDown = false;
let currentObservation: SelectionObservation = emptyObservation();
let pendingObservation: SelectionObservation = currentObservation;
let transitionQueue: Promise<void> = Promise.resolve();

const devices = new Map<string, StreamDeckDevice>();
const controlContexts = new Set<string>();
const activeKinds = new Map<string, ProfileKind>();

function connectElgatoStreamDeckSocket(
  inPort: string,
  inPluginUUID: string,
  inRegisterEvent: string,
  inInfo: string
) {
  pluginApiContext = inPluginUUID;
  registrationInfo = parseRegistrationInfo(inInfo);
  for (const device of registrationInfo.devices || []) {
    devices.set(device.id, device);
  }

  ws = new WebSocketLib.WebSocket(`ws://127.0.0.1:${inPort}`);

  ws.on('open', () => {
    ws.send(JSON.stringify({ event: inRegisterEvent, uuid: inPluginUUID }));
    logMessage('ContextDeck connected');
    sendEvent('getGlobalSettings', pluginApiContext);
    startHelper();
  });

  ws.on('message', (data: WebSocketLib.RawData) => {
    let message: any;
    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      logMessage(`Invalid Stream Deck message: ${toErrorMessage(error)}`);
      return;
    }

    handleMessage(message).catch((error) => {
      logMessage(`Message error: ${toErrorMessage(error)}`);
      setControlState(6);
    });
  });

  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', shutdown);
}

async function handleMessage(message: any) {
  const { event, action, context, payload, device, deviceInfo } = message;

  switch (event) {
    case 'didReceiveGlobalSettings': {
      const previousPollMs = settings.helperPollMs;
      settings = normalizeSettings(payload?.settings);
      if (previousPollMs !== settings.helperPollMs && helper) {
        restartHelper();
      }
      if (!settings.enabled) {
        scheduleObservation(emptyObservation(), true);
      } else {
        scheduleObservation(currentObservation, true);
      }
      updateControlActions();
      sendStatusToAllInspectors();
      break;
    }

    case 'willAppear':
      if (action === controlActionUUID) {
        controlContexts.add(context);
        updateControlAction(context);
      }
      break;

    case 'willDisappear':
      controlContexts.delete(context);
      break;

    case 'keyDown':
      if (action === controlActionUUID) {
        await saveSettings({ ...settings, enabled: !settings.enabled });
      }
      break;

    case 'sendToPlugin':
      if (action === controlActionUUID) {
        await handlePropertyInspectorMessage(context, payload);
      }
      break;

    case 'propertyInspectorDidAppear':
      if (action === controlActionUUID) {
        sendStatus(context);
      }
      break;

    case 'deviceDidConnect':
      if (device && deviceInfo) {
        devices.set(device, {
          id: device,
          name: deviceInfo.name || 'Stream Deck',
          type: deviceInfo.type,
          size: deviceInfo.size,
        });
        scheduleObservation(
          settings.enabled ? currentObservation : emptyObservation(),
          true
        );
        sendStatusToAllInspectors();
      }
      break;

    case 'deviceDidDisconnect':
      devices.delete(device);
      activeKinds.delete(device);
      sendStatusToAllInspectors();
      break;
  }
}

async function handlePropertyInspectorMessage(context: string, payload: any) {
  if (payload?.type === 'getStatus') {
    sendStatus(context);
    return;
  }

  if (payload?.type === 'saveSettings') {
    await saveSettings(normalizeSettings(payload.settings));
  }
}

async function saveSettings(next: ContextDeckSettings) {
  settings = normalizeSettings(next);
  sendEvent('setGlobalSettings', pluginApiContext, settings);
  if (!settings.enabled) {
    scheduleObservation(emptyObservation(), true);
  } else {
    scheduleObservation(currentObservation, true);
  }
  updateControlActions();
  sendStatusToAllInspectors();
}

function startHelper() {
  if (helper || shuttingDown) return;

  const executable = path.join(__dirname, '..', 'ContextDeck.Helper.exe');
  helperBuffer = '';
  const child = spawn(
    executable,
    ['--monitor', '--interval', String(settings.helperPollMs)],
    {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  helper = child;

  child.stdout?.on('data', (chunk: Buffer) => {
    helperBuffer += chunk.toString('utf8');
    const lines = helperBuffer.split(/\r?\n/);
    helperBuffer = lines.pop() || '';
    for (const line of lines) {
      handleHelperLine(line);
    }
  });

  child.stderr?.on('data', (chunk: Buffer) => {
    const message = chunk.toString('utf8').trim();
    if (message) logMessage(`Helper: ${message}`);
  });

  child.on('error', (error) => {
    logMessage(`Selection helper failed: ${toErrorMessage(error)}`);
    setControlState(6);
  });

  child.on('exit', (code) => {
    helper = undefined;
    if (shuttingDown) return;
    logMessage(`Selection helper exited (${code ?? 'unknown'}), restarting`);
    helperRestartTimer = setTimeout(startHelper, 1500);
  });
}

function restartHelper() {
  if (helperRestartTimer) {
    clearTimeout(helperRestartTimer);
    helperRestartTimer = undefined;
  }
  if (helper) {
    helper.removeAllListeners('exit');
    helper.kill();
    helper = undefined;
  }
  startHelper();
}

function handleHelperLine(line: string) {
  if (!line.trim()) return;
  try {
    const observation = JSON.parse(line) as SelectionObservation;
    if (!isObservation(observation)) {
      throw new Error('invalid observation shape');
    }
    currentObservation = observation;
    scheduleObservation(observation);
    updateControlActions();
    sendStatusToAllInspectors();
  } catch (error) {
    logMessage(`Invalid helper output: ${toErrorMessage(error)}`);
  }
}

function scheduleObservation(observation: SelectionObservation, immediate = false) {
  pendingObservation = observation;
  if (observationTimer) clearTimeout(observationTimer);

  const kind = resolveProfileKind(observation, settings);
  const delayMs = immediate
    ? 0
    : kind
      ? settings.debounceMs
      : settings.returnDelayMs;

  observationTimer = setTimeout(() => {
    const scheduled = pendingObservation;
    const scheduledKind = resolveProfileKind(scheduled, settings);
    transitionQueue = transitionQueue
      .then(() => transitionAllDevices(scheduledKind))
      .catch((error) => {
        logMessage(`Profile transition failed: ${toErrorMessage(error)}`);
        setControlState(6);
      });
  }, delayMs);
}

async function transitionAllDevices(nextKind: ProfileKind | undefined) {
  const targets = [...devices.values()].filter(isTargetDevice);
  for (const device of targets) {
    await transitionDevice(device, nextKind);
  }
  updateControlActions();
  sendStatusToAllInspectors();
}

async function transitionDevice(
  device: StreamDeckDevice,
  nextKind: ProfileKind | undefined
) {
  const currentKind = activeKinds.get(device.id);
  if (currentKind === nextKind) return;

  if (currentKind) {
    switchToProfile(device.id);
    activeKinds.delete(device.id);
    if (nextKind) await delay(120);
  }

  if (!nextKind) return;

  const targetProfile = profileName(nextKind, device.type);
  if (!targetProfile) {
    logMessage(`Unsupported Stream Deck device type ${device.type}: ${device.name}`);
    return;
  }

  switchToProfile(device.id, targetProfile);
  activeKinds.set(device.id, nextKind);
  logMessage(`Switched ${device.name} to ${nextKind} context`);
}

function switchToProfile(deviceId: string, profile?: string) {
  sendEvent(
    'switchToProfile',
    pluginApiContext,
    profile ? { profile } : {},
    undefined,
    deviceId
  );
}

function isTargetDevice(device: StreamDeckDevice): boolean {
  if (!isSupportedDeviceType(device.type)) return false;
  return (
    settings.targetDeviceIds.length === 0 ||
    settings.targetDeviceIds.includes(device.id)
  );
}

function updateControlActions() {
  for (const context of controlContexts) {
    updateControlAction(context);
  }
}

function updateControlAction(context: string) {
  if (!settings.enabled) {
    setState(context, 1);
    setTitle(context, '');
    return;
  }

  const active = firstActiveKind();
  if (active === 'text') {
    setState(context, 2);
  } else if (active === 'file') {
    setState(context, 3);
  } else if (active === 'folder') {
    setState(context, 4);
  } else if (active === 'image') {
    setState(context, 5);
  } else {
    setState(context, 0);
  }
  setTitle(context, '');
}

function firstActiveKind(): ProfileKind | undefined {
  return activeKinds.values().next().value;
}

function setControlState(state: number) {
  for (const context of controlContexts) {
    setState(context, state);
    setTitle(context, '');
  }
}

function sendStatus(context: string) {
  sendEvent(
    'sendToPropertyInspector',
    context,
    {
      type: 'status',
      settings,
      observation: currentObservation,
      activeKind: firstActiveKind() || null,
      devices: [...devices.values()].map((device) => ({
        ...device,
        supported: isSupportedDeviceType(device.type),
      })),
      helperRunning: Boolean(helper),
    },
    controlActionUUID
  );
}

function sendStatusToAllInspectors() {
  for (const context of controlContexts) {
    sendStatus(context);
  }
}

function setState(context: string, state: number) {
  sendEvent('setState', context, { state });
}

function setTitle(context: string, title: string) {
  sendEvent('setTitle', context, { title });
}

function logMessage(message: string) {
  sendEvent('logMessage', undefined, { message });
  console.log(message);
}

function sendEvent(
  event: string,
  context?: string,
  payload?: unknown,
  action?: string,
  device?: string
) {
  const message: Record<string, unknown> = { event };
  if (context) message.context = context;
  if (action) message.action = action;
  if (device) message.device = device;
  if (payload !== undefined) message.payload = payload;
  if (ws && ws.readyState === WebSocketLib.WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  if (observationTimer) clearTimeout(observationTimer);
  if (helperRestartTimer) clearTimeout(helperRestartTimer);
  if (helper) {
    helper.kill();
    helper = undefined;
  }
}

function parseRegistrationInfo(value: string): RegistrationInfo {
  try {
    return JSON.parse(value) as RegistrationInfo;
  } catch {
    return {};
  }
}

function isObservation(value: SelectionObservation): boolean {
  return (
    typeof value?.kind === 'string' &&
    typeof value?.process === 'string' &&
    typeof value?.source === 'string'
  );
}

function emptyObservation(): SelectionObservation {
  return {
    kind: 'none',
    process: '',
    source: 'startup',
    confidence: 'high',
    timestamp: new Date().toISOString(),
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return JSON.stringify(error);
}

export function startPluginFromArgs(argv: string[] = process.argv.slice(2)) {
  const params: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]?.replace(/^-+/, '');
    const value = argv[index + 1];
    if (key && value) params[key] = value;
  }

  if (params.port && params.pluginUUID && params.registerEvent && params.info) {
    connectElgatoStreamDeckSocket(
      params.port,
      params.pluginUUID,
      params.registerEvent,
      params.info
    );
  } else {
    console.error('Missing required arguments:', params);
    process.exit(1);
  }
}

if (require.main === module) {
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', shutdown);
  startPluginFromArgs();
}
