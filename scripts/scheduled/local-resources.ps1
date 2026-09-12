param(
  [ValidateSet('Install', 'Run', 'Remove')]
  [string]$Action = 'Run',
  [string]$NodePath = ''
)
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$taskName = 'stats47-local-resources'
$stateDir = Join-Path $repo '.local/resource-health'
if (-not $NodePath) { $NodePath = (Get-Command node.exe -ErrorAction Stop).Source }

if ($Action -eq 'Install') {
  $command = "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Action Run -NodePath `"$NodePath`""
  $taskAction = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $command -WorkingDirectory $repo
  $triggers = @((New-ScheduledTaskTrigger -Daily -At '09:00'), (New-ScheduledTaskTrigger -AtLogOn -User ([Security.Principal.WindowsIdentity]::GetCurrent().Name)))
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 15)
  $principal = New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
  Register-ScheduledTask -TaskName $taskName -Action $taskAction -Trigger $triggers -Settings $settings -Principal $principal -Description 'Local resource check daily; eligible generated cache cleanup weekly; storage audit monthly. No persistent process.' -Force | Out-Null
  Get-ScheduledTask -TaskName $taskName | Select-Object TaskName, State
  exit 0
}
if ($Action -eq 'Remove') {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  exit 0
}

New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
$cadencePath = Join-Path $stateDir 'cadence.json'
$cadence = @{}
if (Test-Path -LiteralPath $cadencePath) {
  $previous = Get-Content -LiteralPath $cadencePath -Raw | ConvertFrom-Json
  foreach ($property in $previous.PSObject.Properties) { $cadence[$property.Name] = $property.Value }
}
$today = (Get-Date).ToString('yyyy-MM-dd')
if ($cadence['check'] -eq $today) { exit 0 }
$hadFailure = $false
foreach ($mode in @('check', 'cleanup', 'audit')) {
  $days = if ($mode -eq 'cleanup') { 7 } elseif ($mode -eq 'audit') { 30 } else { 0 }
  if ($days -gt 0 -and $cadence[$mode] -and ((Get-Date) - [DateTime]$cadence[$mode]).TotalDays -lt $days) { continue }
  $arguments = @((Join-Path $repo '.claude/scripts/lib/local-resources.mjs'), $mode, '--record')
  if ($mode -eq 'cleanup') { $arguments += '--apply' }
  try {
    & $NodePath @arguments > (Join-Path $stateDir "$mode.log") 2> (Join-Path $stateDir "$mode-error.log")
    if ($LASTEXITCODE -ne 0) { throw "$mode exited $LASTEXITCODE" }
    $cadence[$mode] = $today
  } catch {
    $_.Exception.Message | Set-Content -LiteralPath (Join-Path $stateDir "$mode-error.log")
    $hadFailure = $true
  }
}
$cadence | ConvertTo-Json | Set-Content -LiteralPath $cadencePath -Encoding UTF8
if ($hadFailure) { exit 1 }
