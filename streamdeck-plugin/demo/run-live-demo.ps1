param(
  [string]$DemoRoot = (Join-Path $PSScriptRoot 'generated'),
  [switch]$Fast,
  [double]$FinalHoldSeconds = 0
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Add-Type @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class ContextDeckDemoNative
{
    public const int SW_HIDE = 0;
    public const int SW_RESTORE = 9;
    public const uint SWP_SHOWWINDOW = 0x0040;
    public const uint SPI_SETDESKWALLPAPER = 0x0014;
    public const uint SPI_GETDESKWALLPAPER = 0x0073;
    public const uint SPIF_UPDATEINIFILE = 0x0001;
    public const uint SPIF_SENDWININICHANGE = 0x0002;
    public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetWindowPos(
        IntPtr hWnd,
        IntPtr hWndInsertAfter,
        int X,
        int Y,
        int cx,
        int cy,
        uint uFlags
    );

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(
        IntPtr hWnd,
        IntPtr processId
    );

    [DllImport("kernel32.dll")]
    public static extern uint GetCurrentThreadId();

    [DllImport("user32.dll")]
    public static extern bool AttachThreadInput(
        uint idAttach,
        uint idAttachTo,
        bool attach
    );

    [DllImport("user32.dll")]
    public static extern bool BringWindowToTop(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr SetFocus(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern IntPtr FindWindowEx(
        IntPtr hWndParent,
        IntPtr hWndChildAfter,
        string lpszClass,
        string lpszWindow
    );

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc callback, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern bool SystemParametersInfo(
        uint uiAction,
        uint uiParam,
        StringBuilder pvParam,
        uint fWinIni
    );

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern bool SystemParametersInfo(
        uint uiAction,
        uint uiParam,
        string pvParam,
        uint fWinIni
    );

    public static IntPtr FindDesktopListView()
    {
        IntPtr result = IntPtr.Zero;
        EnumWindows((top, state) =>
        {
            IntPtr view = FindWindowEx(top, IntPtr.Zero, "SHELLDLL_DefView", null);
            if (view == IntPtr.Zero) return true;
            result = FindWindowEx(view, IntPtr.Zero, "SysListView32", "FolderView");
            return result == IntPtr.Zero;
        }, IntPtr.Zero);
        return result;
    }

    public static bool ForceForeground(IntPtr hWnd)
    {
        IntPtr foreground = GetForegroundWindow();
        uint currentThread = GetCurrentThreadId();
        uint foregroundThread = GetWindowThreadProcessId(
            foreground,
            IntPtr.Zero
        );
        uint targetThread = GetWindowThreadProcessId(hWnd, IntPtr.Zero);

        bool attachedForeground =
            foregroundThread != 0 &&
            foregroundThread != currentThread &&
            AttachThreadInput(currentThread, foregroundThread, true);
        bool attachedTarget =
            targetThread != 0 &&
            targetThread != currentThread &&
            targetThread != foregroundThread &&
            AttachThreadInput(currentThread, targetThread, true);

        ShowWindow(hWnd, SW_RESTORE);
        BringWindowToTop(hWnd);
        SetForegroundWindow(hWnd);
        SetFocus(hWnd);

        if (attachedTarget) {
            AttachThreadInput(currentThread, targetThread, false);
        }
        if (attachedForeground) {
            AttachThreadInput(currentThread, foregroundThread, false);
        }

        return GetForegroundWindow() == hWnd;
    }
}
'@

$workspace = Join-Path $DemoRoot 'ContextDeck Demo'
$wallpaper = Join-Path $DemoRoot 'neutral-desktop.jpg'
if (-not (Test-Path -LiteralPath $workspace)) {
  throw "Missing demo workspace: $workspace"
}
if (-not (Test-Path -LiteralPath $wallpaper)) {
  throw "Missing neutral wallpaper: $wallpaper"
}

$step = if ($Fast) { 1.4 } else { 4.2 }
$shortStep = if ($Fast) { 0.8 } else { 2.0 }
$streamDeckPath = 'C:\Program Files\Elgato\StreamDeck\StreamDeck.exe'
$shell = New-Object -ComObject Shell.Application
$desktopListView = [ContextDeckDemoNative]::FindDesktopListView()
$backgroundForm = $null
$backgroundImage = $null
$textForm = $null
$summaryForm = $null
$explorerWindow = $null

function Wait-Ui {
  param([double]$Seconds)
  $watch = [System.Diagnostics.Stopwatch]::StartNew()
  while ($watch.Elapsed.TotalSeconds -lt $Seconds) {
    [System.Windows.Forms.Application]::DoEvents()
    Start-Sleep -Milliseconds 25
  }
}

function Wait-StreamDeckWindow {
  for ($attempt = 0; $attempt -lt 80; $attempt++) {
    $process = Get-Process StreamDeck -ErrorAction SilentlyContinue |
      Select-Object -First 1
    if ($null -ne $process -and $process.MainWindowHandle -ne 0) {
      return $process
    }
    Start-Sleep -Milliseconds 125
  }
  throw 'Stream Deck window did not become available.'
}

function New-DemoForm {
  param(
    [string]$Eyebrow,
    [string]$Title,
    [string]$Description
  )
  $form = New-Object System.Windows.Forms.Form
  $form.Text = 'ContextDeck live demonstration'
  $form.StartPosition = 'Manual'
  $form.Location = New-Object System.Drawing.Point(365, 155)
  $form.Size = New-Object System.Drawing.Size(790, 610)
  $form.FormBorderStyle = 'FixedSingle'
  $form.MaximizeBox = $false
  $form.TopMost = $true
  $form.BackColor = [System.Drawing.Color]::FromArgb(7, 14, 27)

  $eyebrowLabel = New-Object System.Windows.Forms.Label
  $eyebrowLabel.Text = $Eyebrow
  $eyebrowLabel.Location = New-Object System.Drawing.Point(46, 42)
  $eyebrowLabel.AutoSize = $true
  $eyebrowLabel.Font = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
  $eyebrowLabel.ForeColor = [System.Drawing.Color]::FromArgb(34, 211, 238)
  $form.Controls.Add($eyebrowLabel)

  $titleLabel = New-Object System.Windows.Forms.Label
  $titleLabel.Text = $Title
  $titleLabel.Location = New-Object System.Drawing.Point(42, 84)
  $titleLabel.Size = New-Object System.Drawing.Size(690, 90)
  $titleLabel.Font = New-Object System.Drawing.Font('Segoe UI', 28, [System.Drawing.FontStyle]::Bold)
  $titleLabel.ForeColor = [System.Drawing.Color]::White
  $form.Controls.Add($titleLabel)

  $descriptionLabel = New-Object System.Windows.Forms.Label
  $descriptionLabel.Text = $Description
  $descriptionLabel.Location = New-Object System.Drawing.Point(47, 178)
  $descriptionLabel.Size = New-Object System.Drawing.Size(680, 62)
  $descriptionLabel.Font = New-Object System.Drawing.Font('Segoe UI', 13)
  $descriptionLabel.ForeColor = [System.Drawing.Color]::FromArgb(160, 184, 222)
  $form.Controls.Add($descriptionLabel)

  return $form
}

function Wait-ExplorerWindow {
  param([string]$Folder)
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    foreach ($window in $shell.Windows()) {
      try {
        if ([string]$window.Document.Folder.Self.Path -eq $Folder) {
          return $window
        }
      } catch {
        continue
      }
    }
    Start-Sleep -Milliseconds 150
  }
  throw "Explorer did not open $Folder"
}

function Select-ExplorerItem {
  param(
    [object]$Window,
    [string]$ItemName,
    [string]$ExpectedProfile
  )
  $item = $Window.Document.Folder.ParseName($ItemName)
  if ($null -eq $item) {
    throw "Explorer item not found: $ItemName"
  }
  [void][ContextDeckDemoNative]::ForceForeground(
    [IntPtr][long]$Window.HWND
  )
  $Window.Document.SelectItem($item, 29)
  [void][ContextDeckDemoNative]::ForceForeground(
    [IntPtr][long]$Window.HWND
  )
  Write-Output "Selected $ItemName -> $ExpectedProfile"
  Wait-Ui -Seconds $step
}

try {
  $shell.MinimizeAll()
  if ($desktopListView -ne [IntPtr]::Zero) {
    [void][ContextDeckDemoNative]::ShowWindow(
      $desktopListView,
      [ContextDeckDemoNative]::SW_HIDE
    )
  }

  $backgroundImage = [System.Drawing.Image]::FromFile($wallpaper)
  $backgroundForm = New-Object System.Windows.Forms.Form
  $backgroundForm.Text = 'ContextDeck neutral demo background'
  $backgroundForm.FormBorderStyle = 'None'
  $backgroundForm.StartPosition = 'Manual'
  $backgroundForm.Bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $backgroundForm.ShowInTaskbar = $false
  $backgroundForm.BackgroundImage = $backgroundImage
  $backgroundForm.BackgroundImageLayout = 'Stretch'
  $backgroundForm.Show()
  Wait-Ui -Seconds 0.35

  Start-Process -FilePath $streamDeckPath
  $streamDeck = Wait-StreamDeckWindow
  Start-Sleep -Milliseconds 1400
  [void][ContextDeckDemoNative]::ShowWindow(
    [IntPtr]$streamDeck.MainWindowHandle,
    [ContextDeckDemoNative]::SW_RESTORE
  )
  [void][ContextDeckDemoNative]::SetWindowPos(
    [IntPtr]$streamDeck.MainWindowHandle,
    [IntPtr]::Zero,
    1240,
    95,
    980,
    875,
    [ContextDeckDemoNative]::SWP_SHOWWINDOW
  )
  Start-Sleep -Milliseconds 350
  [void][ContextDeckDemoNative]::SetWindowPos(
    [IntPtr]$streamDeck.MainWindowHandle,
    [IntPtr]::Zero,
    1240,
    95,
    980,
    875,
    [ContextDeckDemoNative]::SWP_SHOWWINDOW
  )

  $textForm = New-DemoForm `
    -Eyebrow 'LIVE TEST 1 OF 4  -  TEXT SELECTION' `
    -Title 'Select text. Watch the controls change.' `
    -Description 'ContextDeck detects the selection locally and activates the editable Text profile.'

  $textBox = New-Object System.Windows.Forms.RichTextBox
  $textBox.Location = New-Object System.Drawing.Point(48, 255)
  $textBox.Size = New-Object System.Drawing.Size(675, 205)
  $textBox.Font = New-Object System.Drawing.Font('Segoe UI', 18)
  $textBox.BackColor = [System.Drawing.Color]::FromArgb(13, 26, 46)
  $textBox.ForeColor = [System.Drawing.Color]::White
  $textBox.BorderStyle = 'FixedSingle'
  $textBox.Text = "ContextDeck follows what you're working on.`r`n`r`nSelect this sentence to activate the Text profile."
  $textForm.Controls.Add($textBox)

  $statusLabel = New-Object System.Windows.Forms.Label
  $statusLabel.Text = 'NO SELECTION  -  DEFAULT PROFILE'
  $statusLabel.Location = New-Object System.Drawing.Point(48, 492)
  $statusLabel.Size = New-Object System.Drawing.Size(675, 38)
  $statusLabel.Font = New-Object System.Drawing.Font('Segoe UI', 11, [System.Drawing.FontStyle]::Bold)
  $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
  $textForm.Controls.Add($statusLabel)

  $textForm.Show()
  [void][ContextDeckDemoNative]::ForceForeground([IntPtr]$textForm.Handle)
  $textBox.Focus()
  Wait-Ui -Seconds $shortStep

  $needle = 'Select this sentence to activate the Text profile.'
  $start = $textBox.Text.IndexOf($needle)
  $textBox.Select($start, $needle.Length)
  $statusLabel.Text = 'TEXT DETECTED  -  TEXT PROFILE ACTIVE'
  $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(34, 211, 238)
  Write-Output 'Selected text -> Text profile'
  Wait-Ui -Seconds $step

  $textBox.Select(0, 0)
  $statusLabel.Text = 'SELECTION CLEARED  -  RETURNING AUTOMATICALLY'
  $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
  Wait-Ui -Seconds $shortStep
  $textForm.Close()
  $textForm.Dispose()
  $textForm = $null

  Start-Process -FilePath 'explorer.exe' -ArgumentList "`"$workspace`""
  $explorerWindow = Wait-ExplorerWindow -Folder $workspace
  [void][ContextDeckDemoNative]::SetWindowPos(
    [IntPtr][long]$explorerWindow.HWND,
    [ContextDeckDemoNative]::HWND_TOPMOST,
    355,
    110,
    825,
    840,
    [ContextDeckDemoNative]::SWP_SHOWWINDOW
  )
  try {
    $explorerWindow.Document.CurrentViewMode = 6
    $explorerWindow.Document.IconSize = 92
  } catch {
    Write-Output 'Explorer view mode could not be adjusted; continuing.'
  }
  Wait-Ui -Seconds $shortStep

  Select-ExplorerItem `
    -Window $explorerWindow `
    -ItemName '01 - ContextDeck Notes.txt' `
    -ExpectedProfile 'File'
  Select-ExplorerItem `
    -Window $explorerWindow `
    -ItemName '02 - Project Assets' `
    -ExpectedProfile 'Folder'
  Select-ExplorerItem `
    -Window $explorerWindow `
    -ItemName '03 - Product Mockup.png' `
    -ExpectedProfile 'Image'

  try {
    $explorerWindow.Quit()
  } catch {}
  $explorerWindow = $null

  $summaryForm = New-DemoForm `
    -Eyebrow 'REAL WINDOWS SELECTIONS  -  VERIFIED' `
    -Title 'Four contexts. Four useful profiles.' `
    -Description 'Text, file, folder, and image selections all switched the connected Stream Deck automatically.'

  $items = @(
    @('OK', 'TEXT', '#22d3ee'),
    @('OK', 'FILE', '#3b82f6'),
    @('OK', 'FOLDER', '#8b5cf6'),
    @('OK', 'IMAGE', '#d946ef')
  )
  for ($index = 0; $index -lt $items.Count; $index++) {
    $panel = New-Object System.Windows.Forms.Panel
    $panel.Location = New-Object System.Drawing.Point(
      (48 + (($index % 2) * 335)),
      (260 + ([math]::Floor($index / 2) * 105))
    )
    $panel.Size = New-Object System.Drawing.Size(310, 82)
    $panel.BackColor = [System.Drawing.Color]::FromArgb(13, 26, 46)
    $summaryForm.Controls.Add($panel)

    $check = New-Object System.Windows.Forms.Label
    $check.Text = $items[$index][0]
    $check.Location = New-Object System.Drawing.Point(22, 16)
    $check.Size = New-Object System.Drawing.Size(52, 48)
    $check.Font = New-Object System.Drawing.Font('Segoe UI', 24, [System.Drawing.FontStyle]::Bold)
    $check.ForeColor = [System.Drawing.ColorTranslator]::FromHtml($items[$index][2])
    $panel.Controls.Add($check)

    $label = New-Object System.Windows.Forms.Label
    $label.Text = $items[$index][1]
    $label.Location = New-Object System.Drawing.Point(82, 25)
    $label.AutoSize = $true
    $label.Font = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Bold)
    $label.ForeColor = [System.Drawing.Color]::White
    $panel.Controls.Add($label)
  }

  $summaryForm.Show()
  [void][ContextDeckDemoNative]::ForceForeground([IntPtr]$summaryForm.Handle)
  Wait-Ui -Seconds $step
  Write-Output 'ContextDeck live demo complete.'
  if ($FinalHoldSeconds -gt 0) {
    Wait-Ui -Seconds $FinalHoldSeconds
  }
} finally {
  if ($null -ne $textForm) {
    $textForm.Close()
    $textForm.Dispose()
  }
  if ($null -ne $summaryForm) {
    $summaryForm.Close()
    $summaryForm.Dispose()
  }
  if ($null -ne $explorerWindow) {
    try { $explorerWindow.Quit() } catch {}
  }
  if ($null -ne $backgroundForm) {
    $backgroundForm.Close()
    $backgroundForm.Dispose()
  }
  if ($null -ne $backgroundImage) {
    $backgroundImage.Dispose()
  }
  if ($desktopListView -ne [IntPtr]::Zero) {
    [void][ContextDeckDemoNative]::ShowWindow($desktopListView, 5)
  }
  $shell.UndoMinimizeALL()
}
