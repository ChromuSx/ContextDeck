Add-Type @'
using System;
using System.Runtime.InteropServices;

public static class ContextDeckNativeMethods
{
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
}
'@

$projectDirectory = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$shell = New-Object -ComObject Shell.Application

Start-Process -FilePath 'explorer.exe' -ArgumentList "`"$projectDirectory`""
Start-Sleep -Seconds 3

function Find-ExplorerWindow {
  param([string]$Folder)

  foreach ($window in $shell.Windows()) {
    try {
      if ([string]$window.Document.Folder.Self.Path -eq $Folder) {
        return $window
      }
    } catch {
      continue
    }
  }

  return $null
}

function Wait-ExplorerWindow {
  param([string]$Folder)

  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    $window = Find-ExplorerWindow -Folder $Folder
    if ($null -ne $window) {
      return $window
    }
    Start-Sleep -Milliseconds 250
  }

  throw "Explorer did not navigate to $Folder"
}

function Select-ExplorerItem {
  param(
    [object]$Window,
    [string]$Folder,
    [string]$ItemName
  )

  $Window.Navigate($Folder)
  $Window = Wait-ExplorerWindow -Folder $Folder
  $item = $Window.Document.Folder.ParseName($ItemName)
  if ($null -eq $item) {
    throw "Explorer item not found: $Folder\$ItemName"
  }

  # Select, focus, reveal, and deselect all other items.
  $Window.Document.SelectItem($item, 29)
  [void][ContextDeckNativeMethods]::SetForegroundWindow(
    [IntPtr][long]$Window.HWND
  )
  Start-Sleep -Seconds 7
  return $Window
}

$explorerWindow = Wait-ExplorerWindow -Folder $projectDirectory
$explorerWindow = Select-ExplorerItem `
  -Window $explorerWindow `
  -Folder $projectDirectory `
  -ItemName 'package.json'
$explorerWindow = Select-ExplorerItem `
  -Window $explorerWindow `
  -Folder $projectDirectory `
  -ItemName 'native'
$explorerWindow = Select-ExplorerItem `
  -Window $explorerWindow `
  -Folder (Join-Path $projectDirectory 'imgs') `
  -ItemName 'action-icon.png'
