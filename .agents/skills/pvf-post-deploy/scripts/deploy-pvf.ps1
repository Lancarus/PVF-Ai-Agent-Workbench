#Requires -Version 5.1
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$PvfPath,

  [string]$EnvPath,

  [switch]$ConfirmDeploy,
  [switch]$SkipClientCopy,
  [switch]$SkipServerUpload,
  [switch]$NoPopup,

  [int]$StartupTimeoutSeconds = 0,
  [int]$StartupGraceSeconds = 0,
  [string]$ReadyMarkers = "",
  [string]$ReadyText = ""
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = "Stop"

try {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {
}

$script = Join-Path $PSScriptRoot "deploy_pvf.py"
$python = Get-Command python -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -eq $python) {
  $python = Get-Command py -ErrorAction SilentlyContinue | Select-Object -First 1
}
if ($null -eq $python) {
  throw "Python was not found. Install Python and the Paramiko dependency set before deploying."
}

$arguments = @()
if ($python.Name -ieq "py.exe" -or $python.Name -ieq "py") {
  $arguments += "-3"
}
$arguments += @($script, "--pvf", $PvfPath)

if ($EnvPath) {
  $arguments += @("--env", $EnvPath)
}
if ($ConfirmDeploy) {
  $arguments += "--confirm-deploy"
}
if ($SkipClientCopy) {
  $arguments += "--skip-client-copy"
}
if ($SkipServerUpload) {
  $arguments += "--skip-server-upload"
}
if ($NoPopup) {
  $arguments += "--no-popup"
}
if ($StartupTimeoutSeconds -gt 0) {
  $arguments += @("--startup-timeout-seconds", [string]$StartupTimeoutSeconds)
}
if ($StartupGraceSeconds -gt 0) {
  $arguments += @("--startup-grace-seconds", [string]$StartupGraceSeconds)
}
if (-not [string]::IsNullOrWhiteSpace($ReadyMarkers)) {
  $arguments += @("--ready-markers", $ReadyMarkers)
}
if (-not [string]::IsNullOrWhiteSpace($ReadyText)) {
  $arguments += @("--ready-text", $ReadyText)
}

& $python.Source @arguments
exit $LASTEXITCODE
