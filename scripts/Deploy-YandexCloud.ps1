param(
  [string]$ProjectName = "b2e-metallokonstrukcii",
  [string]$SiteBucket = "b2e-metallokonstrukcii-site",
  [string]$StatsBucket = "b2e-metallokonstrukcii-stats",
  [string]$FunctionName = "b2e-leads",
  [string]$GatewayName = "b2e-metallokonstrukcii-gateway",
  [string]$ServiceAccountName = "b2e-metallokonstrukcii-sa",
  [string]$SecretName = "b2e-metallokonstrukcii-smtp",
  [string]$Runtime = "nodejs22",
  [string]$Memory = "256MB",
  [string]$Timeout = "15s",
  [string]$AllowedOrigin = "",
  [string]$CustomDomain = "",
  [string]$CertificateId = "",
  [switch]$SkipSecretUpdate
)

$ErrorActionPreference = "Stop"
$script:BackendSecretKeys = @()
$script:YcCommand = $null
$script:YandexFolderId = ""

function Resolve-YcCommand {
  $command = Get-Command "yc" -ErrorAction SilentlyContinue
  if ($command) {
    if ($command.Path) {
      return $command.Path
    }
    return $command.Source
  }

  $defaultPath = Join-Path $env:USERPROFILE "yandex-cloud\bin\yc.exe"
  if (Test-Path -LiteralPath $defaultPath) {
    return $defaultPath
  }

  throw "yc is not installed or is not in PATH. Install/configure it outside this repository first."
}

function Require-Command($Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name is not installed or is not in PATH. Install/configure it outside this repository first."
  }
}

function Invoke-YcJson([string[]]$Arguments, [switch]$AllowFailure) {
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $output = & $script:YcCommand @Arguments --format json 2>$null
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  if ($exitCode -ne 0) {
    if ($AllowFailure) {
      return $null
    }
    throw "yc $($Arguments -join ' ') failed with exit code $exitCode"
  }

  if (-not $output) {
    return $null
  }

  return ($output | ConvertFrom-Json)
}

function Invoke-Yc([string[]]$Arguments) {
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & $script:YcCommand @Arguments
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  if ($exitCode -ne 0) {
    throw "yc $($Arguments -join ' ') failed with exit code $exitCode"
  }
}

function Ensure-ServiceAccount($Name) {
  $account = Invoke-YcJson @("iam", "service-account", "get", "--name", $Name) -AllowFailure
  if (-not $account) {
    Invoke-Yc @("iam", "service-account", "create", "--name", $Name)
    $account = Invoke-YcJson @("iam", "service-account", "get", "--name", $Name)
  }

  return $account.id
}

function Ensure-FolderRole($ServiceAccountId, $Role) {
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & $script:YcCommand resource-manager folder add-access-binding $script:YandexFolderId `
      --role $Role `
      --subject "serviceAccount:$ServiceAccountId" 2>$null
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  if ($exitCode -ne 0) {
    Write-Warning "Could not add role $Role. It may already exist, or the current yc profile lacks permission."
  }
}

function Ensure-Bucket($Name, [switch]$PublicRead) {
  $bucket = Invoke-YcJson @("storage", "bucket", "get", "--name", $Name) -AllowFailure
  if ($bucket) {
    return
  }

  $args = @("storage", "bucket", "create", "--name", $Name)
  if ($PublicRead) {
    $args += "--public-read"
  }
  Invoke-Yc $args
}

function Ensure-Function($Name) {
  $function = Invoke-YcJson @("serverless", "function", "get", "--name", $Name) -AllowFailure
  if (-not $function) {
    Invoke-Yc @("serverless", "function", "create", "--name", $Name)
    $function = Invoke-YcJson @("serverless", "function", "get", "--name", $Name)
  }

  return $function.id
}

function Ensure-Gateway($Name, $SpecPath, $Variables) {
  $gateway = Invoke-YcJson @("serverless", "api-gateway", "get", "--name", $Name) -AllowFailure
  if ($gateway) {
    Invoke-Yc @("serverless", "api-gateway", "update", $Name, "--spec", $SpecPath, "--variables", $Variables)
  } else {
    Invoke-Yc @("serverless", "api-gateway", "create", $Name, "--spec", $SpecPath, "--variables", $Variables)
  }

  return Invoke-YcJson @("serverless", "api-gateway", "get", "--name", $Name)
}

function Gateway-Url($Gateway) {
  foreach ($property in @("domain", "domain_name", "url")) {
    if ($Gateway.$property) {
      $value = [string]$Gateway.$property
      if ($value.StartsWith("http://") -or $value.StartsWith("https://")) {
        return $value.TrimEnd("/")
      }
      return "https://$($value.TrimEnd('/'))"
    }
  }

  throw "Could not find API Gateway public domain in yc response."
}

function Secret-PayloadFromEnv {
  $keys = @(
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_SECURE",
    "SMTP_USERNAME",
    "SMTP_PASSWORD",
    "SMTP_FROM",
    "SMTP_FROM_NAME",
    "SMTP_ENVELOPE_FROM",
    "SMTP_TO",
    "LEAD_WEBHOOK_URL",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID",
    "TURNSTILE_SECRET_KEY"
  )
  $entries = @()

  foreach ($key in $keys) {
    $value = [Environment]::GetEnvironmentVariable($key, "Process")
    if (-not [string]::IsNullOrWhiteSpace($value)) {
      $entries += [ordered]@{
        key = $key
        text_value = $value
      }
    }
  }

  if ($entries.Count -eq 0) {
    throw "No backend secrets found in process environment. Set SMTP_* or webhook/Telegram env vars before deploy."
  }

  $script:BackendSecretKeys = $entries | ForEach-Object { $_.key }
  return ($entries | ConvertTo-Json -Compress)
}

function Ensure-Secret($Name) {
  if ($SkipSecretUpdate) {
    $secret = Invoke-YcJson @("lockbox", "secret", "get", "--name", $Name)
    $existingKeys = [Environment]::GetEnvironmentVariable("YANDEX_FUNCTION_SECRET_KEYS", "Process")
    if ([string]::IsNullOrWhiteSpace($existingKeys)) {
      throw "When -SkipSecretUpdate is used, set YANDEX_FUNCTION_SECRET_KEYS to the comma-separated Lockbox payload keys to mount into the function."
    }
    $script:BackendSecretKeys = $existingKeys.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ }
    return $secret.id
  }

  $payload = Secret-PayloadFromEnv
  $secret = Invoke-YcJson @("lockbox", "secret", "get", "--name", $Name) -AllowFailure
  if ($secret) {
    $payload | & $script:YcCommand lockbox secret add-version --name $Name --payload -
  } else {
    $payload | & $script:YcCommand lockbox secret create --name $Name --payload -
  }
  if ($LASTEXITCODE -ne 0) {
    throw "Lockbox secret upload failed."
  }

  $secret = Invoke-YcJson @("lockbox", "secret", "get", "--name", $Name)
  return $secret.id
}

function Function-SecretArgs($SecretName) {
  $args = @()

  foreach ($key in $script:BackendSecretKeys) {
    $args += @("--secret", "name=$SecretName,key=$key,environment-variable=$key")
  }

  return $args
}

function Deploy-FunctionVersion($FunctionName, $ZipPath, $ServiceAccountId, $SecretName, $Origin, $SiteRoot) {
  $environment = @(
    "API_PREFIX=/api",
    "ENABLE_FILE_STATS=on",
    "SITE_STATS_MOUNT=/function/storage/site-stats",
    "ALLOWED_ORIGIN=$Origin",
    "SITE_ROOT=$SiteRoot",
    "SITE_LABEL=ООО B2E",
    "LEAD_SUBJECT=Новая заявка на металлоконструкции"
  ) -join ","

  $args = @(
    "serverless", "function", "version", "create",
    "--function-name", $FunctionName,
    "--runtime", $Runtime,
    "--entrypoint", "index.handler",
    "--memory", $Memory,
    "--execution-timeout", $Timeout,
    "--source-path", $ZipPath,
    "--service-account-id", $ServiceAccountId,
    "--environment", $environment,
    "--mount", "type=object-storage,mount-point=site-stats,bucket=$StatsBucket,mode=rw"
  )
  $args += Function-SecretArgs $SecretName

  Invoke-Yc $args
}

$script:YcCommand = Resolve-YcCommand
$script:YandexFolderId = (& $script:YcCommand config get folder-id).Trim()
if ([string]::IsNullOrWhiteSpace($script:YandexFolderId)) {
  throw "yc folder-id is not configured. Run yc init or yc config set folder-id <folder-id> first."
}
Require-Command "node"
Require-Command "npm"

$repoRoot = Split-Path -Parent $PSScriptRoot
$packageZip = Join-Path $repoRoot "dist-yandex\b2e-yandex-function.zip"
$gatewaySpec = Join-Path $repoRoot "yandex\gateway\openapi.yaml"

$serviceAccountId = Ensure-ServiceAccount $ServiceAccountName
Ensure-FolderRole $serviceAccountId "storage.editor"
Ensure-FolderRole $serviceAccountId "serverless.functions.invoker"
Ensure-FolderRole $serviceAccountId "lockbox.payloadViewer"

Ensure-Bucket $SiteBucket -PublicRead
Ensure-Bucket $StatsBucket

$websiteSettings = Join-Path $repoRoot "dist-yandex\website-settings.json"
New-Item -ItemType Directory -Force -Path (Split-Path $websiteSettings -Parent) | Out-Null
Set-Content -Encoding UTF8 -LiteralPath $websiteSettings -Value '{ "index": "index.html", "error": "index.html" }'
Invoke-Yc @("storage", "bucket", "update", "--name", $SiteBucket, "--website-settings-from-file", $websiteSettings)

$functionId = Ensure-Function $FunctionName
$secretId = Ensure-Secret $SecretName
Write-Output "Lockbox secret ready: $secretId"

& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repoRoot "scripts\Build-YandexFunctionPackage.ps1")
if ($LASTEXITCODE -ne 0) {
  throw "Function package build failed."
}

Deploy-FunctionVersion $FunctionName $packageZip $serviceAccountId $SecretName "https://placeholder.invalid" "https://placeholder.invalid/"

$gatewayVariables = "site_bucket=$SiteBucket,function_id=$functionId,service_account_id=$serviceAccountId"
$gateway = Ensure-Gateway $GatewayName $gatewaySpec $gatewayVariables
$gatewayUrl = Gateway-Url $gateway
$finalOrigin = if ($AllowedOrigin) { $AllowedOrigin } else { $gatewayUrl }
if ($CustomDomain) {
  $finalOrigin = "$finalOrigin,https://$CustomDomain"
}

Deploy-FunctionVersion $FunctionName $packageZip $serviceAccountId $SecretName $finalOrigin "$gatewayUrl/"

$previousSiteUrl = $env:B2E_SITE_URL
$previousLead = $env:B2E_LEAD_ENDPOINT
$previousStats = $env:B2E_STATS_ENDPOINT
try {
  $env:B2E_SITE_URL = "$gatewayUrl/"
  $env:B2E_LEAD_ENDPOINT = "/api/leads"
  $env:B2E_STATS_ENDPOINT = "/api/stats"
  Push-Location $repoRoot
  npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "Site build failed."
  }
  & $script:YcCommand storage s3 cp (Join-Path $repoRoot "dist") "s3://$SiteBucket/" --recursive --acl public-read
  if ($LASTEXITCODE -ne 0) {
    throw "Site upload failed."
  }
} finally {
  Pop-Location
  $env:B2E_SITE_URL = $previousSiteUrl
  $env:B2E_LEAD_ENDPOINT = $previousLead
  $env:B2E_STATS_ENDPOINT = $previousStats
}

if ($CustomDomain -and $CertificateId) {
  Invoke-Yc @("serverless", "api-gateway", "add-domain", $GatewayName, "--domain", $CustomDomain, "--certificate-id", $CertificateId)
}

Write-Output "Yandex Cloud deployment ready:"
Write-Output "  Gateway: $gatewayUrl"
Write-Output "  Site bucket: $SiteBucket"
Write-Output "  Stats bucket: $StatsBucket"
Write-Output "  Function: $FunctionName ($functionId)"
Write-Output "  Service account: $ServiceAccountName ($serviceAccountId)"
