param(
  [string]$OutputPath = (
    Join-Path $PSScriptRoot '..\..\marketplace\moderator-demo-raw.mp4'
  ),
  [switch]$Fast
)

$ErrorActionPreference = 'Stop'
$ffmpeg = 'C:\Program Files\FFMPEG\ffmpeg.exe'
$streamDeck = 'C:\Program Files\Elgato\StreamDeck\StreamDeck.exe'
$demoScript = Join-Path $PSScriptRoot 'run-live-demo.ps1'
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
$duration = if ($Fast) { 24 } else { 54 }
$hold = if ($Fast) { 10 } else { 30 }

if (-not (Test-Path -LiteralPath $ffmpeg)) {
  throw "FFmpeg not found: $ffmpeg"
}
if (-not (Test-Path -LiteralPath $streamDeck)) {
  throw "Stream Deck not found: $streamDeck"
}

$outputDirectory = Split-Path -Parent $resolvedOutput
if (-not (Test-Path -LiteralPath $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

# Restart the host before every take so the plugin and native selection monitor
# begin from a known-good state.
$runningStreamDeck = Get-Process StreamDeck -ErrorAction SilentlyContinue
if ($runningStreamDeck) {
  $runningStreamDeck | Stop-Process -Force
  Start-Sleep -Seconds 2
}
Start-Process -FilePath $streamDeck
for ($attempt = 0; $attempt -lt 80; $attempt++) {
  $hostProcess = Get-Process StreamDeck -ErrorAction SilentlyContinue |
    Select-Object -First 1
  $helperProcess = Get-Process 'ContextDeck.Helper' -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if (
    $null -ne $hostProcess -and
    $hostProcess.MainWindowHandle -ne 0 -and
    $null -ne $helperProcess
  ) {
    break
  }
  Start-Sleep -Milliseconds 250
}
if ($null -eq $hostProcess -or $null -eq $helperProcess) {
  throw 'Stream Deck or ContextDeck helper did not start.'
}
Start-Sleep -Seconds 3

$arguments = @(
  '-hide_banner',
  '-y',
  '-f', 'gdigrab',
  '-framerate', '60',
  '-offset_x', '320',
  '-offset_y', '0',
  '-video_size', '1920x1080',
  '-i', 'desktop',
  '-t', $duration.ToString([System.Globalization.CultureInfo]::InvariantCulture),
  '-c:v', 'libx264',
  '-preset', 'veryfast',
  '-crf', '18',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  $resolvedOutput
)

$argumentString = (
  $arguments |
    ForEach-Object {
      if ($_ -match '[\s"]') {
        '"{0}"' -f $_.Replace('"', '\"')
      } else {
        $_
      }
    }
) -join ' '

$recorder = New-Object System.Diagnostics.Process
$recorder.StartInfo.FileName = $ffmpeg
$recorder.StartInfo.Arguments = $argumentString
$recorder.StartInfo.UseShellExecute = $false
$recorder.StartInfo.CreateNoWindow = $true
[void]$recorder.Start()

try {
  Start-Sleep -Milliseconds 850
  if ($Fast) {
    & $demoScript -Fast -FinalHoldSeconds $hold
  } else {
    & $demoScript -FinalHoldSeconds $hold
  }
  $recorder.WaitForExit()
  if ($recorder.ExitCode -ne 0) {
    throw "FFmpeg exited with code $($recorder.ExitCode)."
  }
} finally {
  if (-not $recorder.HasExited) {
    $recorder.Kill()
    $recorder.WaitForExit()
  }
}

Get-Item -LiteralPath $resolvedOutput |
  Select-Object FullName, Length, LastWriteTime
