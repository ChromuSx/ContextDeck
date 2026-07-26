using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Windows.Automation;
using System.Windows.Automation.Text;

namespace ContextDeck.Helper;

internal static class Program
{
    private static readonly AutoResetEvent ExitSignal = new(false);
    private static readonly object EvaluationLock = new();
    private static readonly HashSet<string> ImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".avif", ".bmp", ".gif", ".heic", ".heif", ".ico", ".jpeg", ".jpg",
        ".png", ".svg", ".tif", ".tiff", ".webp"
    };

    private static Timer? pollTimer;
    private static Timer? eventDebounceTimer;
    private static string lastSignature = string.Empty;
    private static bool shuttingDown;

    [DllImport("user32.dll")]
    private static extern nint GetForegroundWindow();

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(nint hWnd, out uint processId);

    [STAThread]
    private static int Main(string[] args)
    {
        Console.OutputEncoding = System.Text.Encoding.UTF8;
        var once = args.Contains("--once", StringComparer.OrdinalIgnoreCase);
        var interval = ReadInterval(args);

        if (once)
        {
            WriteObservation(SelectionDetector.Detect(), force: true);
            return 0;
        }

        Console.CancelKeyPress += (_, eventArgs) =>
        {
            eventArgs.Cancel = true;
            Shutdown();
        };

        AppDomain.CurrentDomain.ProcessExit += (_, _) => Shutdown();
        RegisterAutomationEvents();

        pollTimer = new Timer(
            _ => Evaluate(),
            null,
            TimeSpan.Zero,
            TimeSpan.FromMilliseconds(interval));

        ExitSignal.WaitOne();
        UnregisterAutomationEvents();
        pollTimer?.Dispose();
        eventDebounceTimer?.Dispose();
        return 0;
    }

    private static int ReadInterval(string[] args)
    {
        var index = Array.FindIndex(
            args,
            argument => argument.Equals("--interval", StringComparison.OrdinalIgnoreCase));
        if (index >= 0 &&
            index + 1 < args.Length &&
            int.TryParse(args[index + 1], out var parsed))
        {
            return Math.Clamp(parsed, 250, 2000);
        }

        return 500;
    }

    private static void RegisterAutomationEvents()
    {
        try
        {
            Automation.AddAutomationFocusChangedEventHandler(OnFocusChanged);
            Automation.AddAutomationEventHandler(
                TextPattern.TextSelectionChangedEvent,
                AutomationElement.RootElement,
                TreeScope.Subtree,
                OnAutomationEvent);
            Automation.AddAutomationEventHandler(
                SelectionItemPattern.ElementSelectedEvent,
                AutomationElement.RootElement,
                TreeScope.Subtree,
                OnAutomationEvent);
            Automation.AddAutomationEventHandler(
                SelectionItemPattern.ElementAddedToSelectionEvent,
                AutomationElement.RootElement,
                TreeScope.Subtree,
                OnAutomationEvent);
            Automation.AddAutomationEventHandler(
                SelectionItemPattern.ElementRemovedFromSelectionEvent,
                AutomationElement.RootElement,
                TreeScope.Subtree,
                OnAutomationEvent);
        }
        catch (Exception error)
        {
            Console.Error.WriteLine($"UI Automation event subscription failed: {error.Message}");
        }
    }

    private static void UnregisterAutomationEvents()
    {
        try
        {
            Automation.RemoveAutomationFocusChangedEventHandler(OnFocusChanged);
            Automation.RemoveAllEventHandlers();
        }
        catch
        {
            // The host is already shutting down.
        }
    }

    private static void OnFocusChanged(object sender, AutomationFocusChangedEventArgs eventArgs)
        => ScheduleEvaluation();

    private static void OnAutomationEvent(object sender, AutomationEventArgs eventArgs)
        => ScheduleEvaluation();

    private static void ScheduleEvaluation()
    {
        if (shuttingDown) return;
        eventDebounceTimer?.Dispose();
        eventDebounceTimer = new Timer(
            _ => Evaluate(),
            null,
            TimeSpan.FromMilliseconds(70),
            Timeout.InfiniteTimeSpan);
    }

    private static void Evaluate()
    {
        if (shuttingDown || !Monitor.TryEnter(EvaluationLock)) return;
        try
        {
            WriteObservation(SelectionDetector.Detect());
        }
        catch (Exception error)
        {
            Console.Error.WriteLine($"Selection evaluation failed: {error.Message}");
        }
        finally
        {
            Monitor.Exit(EvaluationLock);
        }
    }

    private static void WriteObservation(Observation observation, bool force = false)
    {
        var signature = $"{observation.Kind}|{observation.Process}|{observation.Source}";
        if (!force && signature == lastSignature) return;
        lastSignature = signature;
        Console.WriteLine(JsonSerializer.Serialize(observation, JsonOptions.Default));
        Console.Out.Flush();
    }

    private static void Shutdown()
    {
        if (shuttingDown) return;
        shuttingDown = true;
        ExitSignal.Set();
    }

    private static class SelectionDetector
    {
        public static Observation Detect()
        {
            var foregroundWindow = GetForegroundWindow();
            var processName = GetProcessName(foregroundWindow);

            if (foregroundWindow == nint.Zero)
            {
                return Observation.None(processName, "foreground-window");
            }

            if (processName.Equals("explorer", StringComparison.OrdinalIgnoreCase))
            {
                var explorerKind = TryDetectExplorerSelection(foregroundWindow);
                if (explorerKind is not null)
                {
                    return new Observation(
                        explorerKind,
                        processName,
                        "windows-shell",
                        "high",
                        DateTimeOffset.UtcNow);
                }
            }

            AutomationElement? focused = null;
            try
            {
                focused = AutomationElement.FocusedElement;
            }
            catch
            {
                // Some elevated or custom windows cannot be inspected.
            }

            if (focused is not null && HasNonEmptyTextSelection(focused))
            {
                return new Observation(
                    "text",
                    processName,
                    "uia-text",
                    "high",
                    DateTimeOffset.UtcNow);
            }

            return Observation.None(processName, "uia");
        }

        private static string? TryDetectExplorerSelection(nint foregroundWindow)
        {
            object? shell = null;
            object? windows = null;
            try
            {
                var shellType = Type.GetTypeFromProgID("Shell.Application");
                if (shellType is null) return null;
                shell = Activator.CreateInstance(shellType);
                if (shell is null) return null;

                dynamic dynamicShell = shell;
                windows = dynamicShell.Windows();
                dynamic dynamicWindows = windows;
                var count = Convert.ToInt32(dynamicWindows.Count);

                for (var index = 0; index < count; index++)
                {
                    object? shellWindow = null;
                    object? selectedItems = null;
                    try
                    {
                        shellWindow = dynamicWindows.Item(index);
                        if (shellWindow is null) continue;
                        dynamic dynamicWindow = shellWindow;
                        var windowHandle = new nint(Convert.ToInt64(dynamicWindow.HWND));
                        if (windowHandle != foregroundWindow) continue;

                        selectedItems = dynamicWindow.Document.SelectedItems();
                        dynamic dynamicItems = selectedItems;
                        var selectedCount = Convert.ToInt32(dynamicItems.Count);
                        if (selectedCount <= 0) return null;

                        var folders = 0;
                        var imageFiles = 0;
                        var files = 0;

                        for (var itemIndex = 0; itemIndex < selectedCount; itemIndex++)
                        {
                            object? item = null;
                            try
                            {
                                item = dynamicItems.Item(itemIndex);
                                if (item is null) continue;
                                dynamic dynamicItem = item;
                                var selectedPath = Convert.ToString(dynamicItem.Path) ?? string.Empty;
                                if (Directory.Exists(selectedPath))
                                {
                                    folders++;
                                }
                                else if (ImageExtensions.Contains(Path.GetExtension(selectedPath)))
                                {
                                    imageFiles++;
                                }
                                else
                                {
                                    files++;
                                }
                            }
                            finally
                            {
                                ReleaseComObject(item);
                            }
                        }

                        if (folders == selectedCount) return "folder";
                        if (imageFiles == selectedCount) return "image-file";
                        if (files + imageFiles + folders > 0) return "file";
                        return null;
                    }
                    catch
                    {
                        // Continue with another Explorer window.
                    }
                    finally
                    {
                        ReleaseComObject(selectedItems);
                        ReleaseComObject(shellWindow);
                    }
                }
            }
            catch
            {
                return null;
            }
            finally
            {
                ReleaseComObject(windows);
                ReleaseComObject(shell);
            }

            return null;
        }

        private static bool HasNonEmptyTextSelection(AutomationElement focused)
        {
            foreach (var element in WalkAncestors(focused, 10))
            {
                try
                {
                    if (!element.TryGetCurrentPattern(TextPattern.Pattern, out var patternObject) ||
                        patternObject is not TextPattern pattern)
                    {
                        continue;
                    }

                    foreach (var range in pattern.GetSelection())
                    {
                        if (range.CompareEndpoints(
                                TextPatternRangeEndpoint.Start,
                                range,
                                TextPatternRangeEndpoint.End) != 0)
                        {
                            return true;
                        }
                    }
                }
                catch (ElementNotAvailableException)
                {
                    return false;
                }
                catch (InvalidOperationException)
                {
                    // This provider stopped exposing its text pattern.
                }
            }

            return false;
        }

        private static IEnumerable<AutomationElement> WalkAncestors(
            AutomationElement start,
            int maximumDepth)
        {
            var current = start;
            for (var depth = 0; depth < maximumDepth && current is not null; depth++)
            {
                yield return current;
                AutomationElement? parent;
                try
                {
                    parent = TreeWalker.ControlViewWalker.GetParent(current);
                }
                catch
                {
                    yield break;
                }
                current = parent;
            }
        }

        private static string GetProcessName(nint window)
        {
            if (window == nint.Zero) return string.Empty;
            try
            {
                GetWindowThreadProcessId(window, out var processId);
                using var process = Process.GetProcessById((int)processId);
                return process.ProcessName;
            }
            catch
            {
                return string.Empty;
            }
        }

        private static void ReleaseComObject(object? value)
        {
            if (value is not null && Marshal.IsComObject(value))
            {
                try
                {
                    Marshal.FinalReleaseComObject(value);
                }
                catch
                {
                    // Best-effort COM cleanup.
                }
            }
        }
    }
}

internal sealed record Observation(
    string Kind,
    string Process,
    string Source,
    string Confidence,
    DateTimeOffset Timestamp)
{
    public static Observation None(string process, string source)
        => new("none", process, source, "high", DateTimeOffset.UtcNow);
}

internal static class JsonOptions
{
    public static readonly JsonSerializerOptions Default = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };
}
