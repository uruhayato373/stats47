param()
$ErrorActionPreference = 'Stop'
$os = Get-CimInstance Win32_OperatingSystem
$all = @(Get-CimInstance Win32_Process)
$records = @($all | Where-Object { $_.Name -match '^(node|python|workerd|turbo|chrome|msedge|codex|ChatGPT|powershell|pwsh)' } | ForEach-Object {
  $command = [string]$_.CommandLine
  $kind = 'other'
  if ($_.Name -eq 'node.exe') { $kind = 'node' }
  if ($command -match 'server-filesystem|server-github|chrome-devtools-mcp|notebooklm|mcp-remote') { $kind = 'connector' }
  # Match executable arguments, not words appearing in this probe's caller text.
  $busy = $_.Name -match '^(node|workerd|turbo)' -and $command -match '(next[\\/]dist[\\/]bin[\\/]next|next-server|vitest[\\/]|typescript[\\/]bin[\\/]tsc|remotion[\\/]|turbo(?:\.exe)?["\s]+(?:run|watch))'
  [pscustomobject]@{
    pid = $_.ProcessId; parentPid = $_.ParentProcessId; name = $_.Name
    startedAt = $_.CreationDate.ToUniversalTime().ToString('o')
    privateBytes = [double]$_.PrivatePageCount; workingSetBytes = [double]$_.WorkingSetSize
    kind = $kind; busy = [bool]$busy; commandReadable = ($command.Length -gt 0)
  }
})
[pscustomobject]@{
  physicalBytes = [double]$os.TotalVisibleMemorySize * 1024
  availableBytes = [double]$os.FreePhysicalMemory * 1024
  processes = $records
} | ConvertTo-Json -Depth 4 -Compress
