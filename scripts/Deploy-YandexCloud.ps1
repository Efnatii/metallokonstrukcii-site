param(
  [string]$ProjectName = "",
  [string]$SiteBucket = "",
  [string]$StatsBucket = "",
  [string]$FunctionName = "",
  [string]$GatewayName = "",
  [string]$ServiceAccountName = "",
  [string]$SecretName = "",
  [string]$Runtime = "",
  [string]$Memory = "",
  [string]$Timeout = "",
  [string]$AllowedOrigin = "",
  [string]$CustomDomain = "",
  [string]$CertificateId = "",
  [switch]$SkipSecretUpdate,
  [switch]$SkipSiteUpload
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

  if ($env:USERPROFILE) {
    $defaultPath = Join-Path $env:USERPROFILE "yandex-cloud/bin/yc.exe"
    if (Test-Path -LiteralPath $defaultPath) {
      return $defaultPath
    }
  }

  throw "yc is not installed or is not in PATH. Install/configure it outside this repository first."
}

function Require-Command($Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name is not installed or is not in PATH. Install/configure it outside this repository first."
  }
}

function Resolve-Setting($Value, $EnvName, $Fallback) {
  if (-not [string]::IsNullOrWhiteSpace($Value)) {
    return $Value
  }

  $envValue = [Environment]::GetEnvironmentVariable($EnvName, "Process")
  if (-not [string]::IsNullOrWhiteSpace($envValue)) {
    return $envValue
  }

  return $Fallback
}

function With-TrailingSlash($Url) {
  if ($Url.EndsWith("/")) {
    return $Url
  }

  return "$Url/"
}

function Normalize-Origin($Value) {
  return ([string]$Value).Trim().TrimEnd("/")
}

function Add-Origin([string[]]$Origins, [string]$Origin) {
  $normalized = Normalize-Origin $Origin
  if ([string]::IsNullOrWhiteSpace($normalized)) {
    return @($Origins)
  }

  if (@($Origins) -notcontains $normalized) {
    return @($Origins) + $normalized
  }

  return @($Origins)
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
    $output = & $script:YcCommand @Arguments 2>&1
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  if ($exitCode -ne 0) {
    throw "yc $($Arguments -join ' ') failed with exit code $exitCode. $($output | Out-String)"
  }

  if ($output) {
    $output | ForEach-Object { Write-Host $_ }
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
    "SMARTCAPTCHA_SERVER_KEY",
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
    $secretOutput = $payload | & $script:YcCommand lockbox secret add-version --name $Name --payload - 2>&1
  } else {
    $secretOutput = $payload | & $script:YcCommand lockbox secret create --name $Name --payload - 2>&1
  }
  if ($LASTEXITCODE -ne 0) {
    throw "Lockbox secret upload failed. $($secretOutput | Out-String)"
  }
  if ($secretOutput) {
    $secretOutput | ForEach-Object { Write-Host $_ }
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
    "SITE_ROOT=$SiteRoot"
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

function Get-StaticContentType($Path) {
  $extension = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()

  switch ($extension) {
    ".css" { return "text/css; charset=utf-8" }
    ".geojson" { return "application/geo+json; charset=utf-8" }
    ".html" { return "text/html; charset=utf-8" }
    ".js" { return "application/javascript; charset=utf-8" }
    ".json" { return "application/json; charset=utf-8" }
    ".md" { return "text/markdown; charset=utf-8" }
    ".pdf" { return "application/pdf" }
    ".png" { return "image/png" }
    ".jpg" { return "image/jpeg" }
    ".jpeg" { return "image/jpeg" }
    ".svg" { return "image/svg+xml" }
    ".txt" { return "text/plain; charset=utf-8" }
    ".webmanifest" { return "application/manifest+json; charset=utf-8" }
    ".webp" { return "image/webp" }
    ".xml" { return "application/xml; charset=utf-8" }
    default { return "application/octet-stream" }
  }
}

function Upload-SiteDist($DistPath, $Bucket) {
  if (-not (Test-Path -LiteralPath $DistPath)) {
    throw "Static site dist path does not exist: $DistPath"
  }

  $resolvedDistPath = (Resolve-Path -LiteralPath $DistPath).Path.TrimEnd("\", "/")
  Invoke-Yc @("storage", "s3", "rm", "s3://$Bucket/", "--recursive")

  $files = Get-ChildItem -LiteralPath $DistPath -Recurse -File -Force
  foreach ($file in $files) {
    $resolvedFilePath = (Resolve-Path -LiteralPath $file.FullName).Path
    $relativePath = $resolvedFilePath.Substring($resolvedDistPath.Length).TrimStart("\", "/")
    $objectKey = $relativePath.Replace("\", "/")
    $contentType = Get-StaticContentType $file.FullName
    Invoke-Yc @("storage", "s3", "cp", $file.FullName, "s3://$Bucket/$objectKey", "--content-type", $contentType, "--quiet")
  }
}

function Ensure-GatewayDomain($GatewayName, $Domain, $CertificateId) {
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $output = & $script:YcCommand serverless api-gateway add-domain $GatewayName `
      --domain $Domain `
      --certificate-id $CertificateId 2>&1
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  if ($exitCode -ne 0) {
    $text = ($output | Out-String)
    if ($text -match "already|exists|conflict|duplicate") {
      Write-Warning "Domain $Domain appears to be already attached to API Gateway $GatewayName."
      return
    }
    throw "yc serverless api-gateway add-domain failed with exit code $exitCode. $text"
  }
}

$ProjectName = Resolve-Setting $ProjectName "YANDEX_PROJECT_NAME" "b2e-metallokonstrukcii"
$SiteBucket = Resolve-Setting $SiteBucket "YANDEX_SITE_BUCKET" "metallb2e.ru"
$StatsBucket = Resolve-Setting $StatsBucket "YANDEX_STATS_BUCKET" "b2e-metallokonstrukcii-stats"
$FunctionName = Resolve-Setting $FunctionName "YANDEX_FUNCTION_NAME" "b2e-leads"
$GatewayName = Resolve-Setting $GatewayName "YANDEX_GATEWAY_NAME" "b2e-metallokonstrukcii-gateway"
$ServiceAccountName = Resolve-Setting $ServiceAccountName "YANDEX_SERVICE_ACCOUNT_NAME" "b2e-metallokonstrukcii-sa"
$SecretName = Resolve-Setting $SecretName "YANDEX_SECRET_NAME" "b2e-metallokonstrukcii-smtp"
$Runtime = Resolve-Setting $Runtime "YANDEX_FUNCTION_RUNTIME" "nodejs22"
$Memory = Resolve-Setting $Memory "YANDEX_FUNCTION_MEMORY" "256MB"
$Timeout = Resolve-Setting $Timeout "YANDEX_FUNCTION_TIMEOUT" "15s"
$AllowedOrigin = Resolve-Setting $AllowedOrigin "YANDEX_ALLOWED_ORIGIN" ""
$CustomDomain = Resolve-Setting $CustomDomain "YANDEX_CUSTOM_DOMAIN" ""
$CertificateId = Resolve-Setting $CertificateId "YANDEX_CERTIFICATE_ID" ""

if (($CustomDomain -and -not $CertificateId) -or ($CertificateId -and -not $CustomDomain)) {
  throw "Set both YANDEX_CUSTOM_DOMAIN and YANDEX_CERTIFICATE_ID to attach a custom API Gateway domain."
}

$script:YcCommand = Resolve-YcCommand
$script:YandexFolderId = (& $script:YcCommand config get folder-id).Trim()
if ([string]::IsNullOrWhiteSpace($script:YandexFolderId)) {
  throw "yc folder-id is not configured. Run yc init or yc config set folder-id <folder-id> first."
}
Require-Command "node"
Require-Command "npm"

$repoRoot = Split-Path -Parent $PSScriptRoot
$packageZip = Join-Path $repoRoot "dist-yandex/b2e-yandex-function.zip"
$gatewaySpec = Join-Path $repoRoot "yandex/gateway/openapi.yaml"

$secretId = Ensure-Secret $SecretName
Write-Output "Lockbox secret ready: $secretId"

$serviceAccountId = Ensure-ServiceAccount $ServiceAccountName
Ensure-FolderRole $serviceAccountId "storage.editor"
Ensure-FolderRole $serviceAccountId "serverless.functions.invoker"
Ensure-FolderRole $serviceAccountId "lockbox.payloadViewer"

Ensure-Bucket $SiteBucket -PublicRead
Ensure-Bucket $StatsBucket

$websiteSettings = Join-Path $repoRoot "dist-yandex/website-settings.json"
New-Item -ItemType Directory -Force -Path (Split-Path $websiteSettings -Parent) | Out-Null
Set-Content -Encoding ASCII -LiteralPath $websiteSettings -Value '{ "index": "index.html", "error": "index.html" }'
Invoke-Yc @("storage", "bucket", "update", "--name", $SiteBucket, "--website-settings-from-file", $websiteSettings)

$functionId = Ensure-Function $FunctionName

& (Join-Path $repoRoot "scripts/Build-YandexFunctionPackage.ps1")
if ($LASTEXITCODE -ne 0) {
  throw "Function package build failed."
}

Deploy-FunctionVersion $FunctionName $packageZip $serviceAccountId $SecretName "https://placeholder.invalid" "https://placeholder.invalid/"

$gatewayVariables = "site_bucket=$SiteBucket,function_id=$functionId,service_account_id=$serviceAccountId"
$gateway = Ensure-Gateway $GatewayName $gatewaySpec $gatewayVariables
$gatewayUrl = Gateway-Url $gateway

if ($CustomDomain -and $CertificateId) {
  Ensure-GatewayDomain $GatewayName $CustomDomain $CertificateId
}

$sitePublicUrl = if ($CustomDomain) {
  "https://$CustomDomain"
} elseif ($SiteBucket.Contains(".")) {
  "https://$SiteBucket"
} else {
  $gatewayUrl
}
$usesGatewayOrigin = (Normalize-Origin $sitePublicUrl) -eq (Normalize-Origin $gatewayUrl) -or [bool]$CustomDomain
$leadEndpoint = if ($usesGatewayOrigin) { "/api/leads" } else { "$gatewayUrl/api/leads" }
$statsEndpoint = if ($usesGatewayOrigin) { "/api/stats" } else { "$gatewayUrl/api/stats" }

$origins = @()
if ($AllowedOrigin) {
  foreach ($origin in ($AllowedOrigin -split "[;,]")) {
    $origins = Add-Origin -Origins $origins -Origin $origin
  }
}

$origins = Add-Origin -Origins $origins -Origin $sitePublicUrl
if (-not $CustomDomain -and $SiteBucket.Contains(".")) {
  $origins = Add-Origin -Origins $origins -Origin "http://$SiteBucket"
}
$origins = Add-Origin -Origins $origins -Origin $gatewayUrl
$finalOrigin = $origins -join ";"

if ($env:GITHUB_ENV) {
  Add-Content -Encoding UTF8 -LiteralPath $env:GITHUB_ENV -Value "YANDEX_GATEWAY_URL=$gatewayUrl"
  Add-Content -Encoding UTF8 -LiteralPath $env:GITHUB_ENV -Value "B2E_SITE_URL=$(With-TrailingSlash $sitePublicUrl)"
}

Deploy-FunctionVersion $FunctionName $packageZip $serviceAccountId $SecretName $finalOrigin (With-TrailingSlash $sitePublicUrl)

$previousSiteUrl = $env:B2E_SITE_URL
$previousLead = $env:B2E_LEAD_ENDPOINT
$previousStats = $env:B2E_STATS_ENDPOINT
try {
  $env:B2E_SITE_URL = With-TrailingSlash $sitePublicUrl
  $env:B2E_LEAD_ENDPOINT = $leadEndpoint
  $env:B2E_STATS_ENDPOINT = $statsEndpoint
  Push-Location $repoRoot
  npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "Site build failed."
  }
  if (-not $SkipSiteUpload) {
    Upload-SiteDist (Join-Path $repoRoot "dist") $SiteBucket
  }
} finally {
  Pop-Location
  $env:B2E_SITE_URL = $previousSiteUrl
  $env:B2E_LEAD_ENDPOINT = $previousLead
  $env:B2E_STATS_ENDPOINT = $previousStats
}

Write-Output "Yandex Cloud deployment ready:"
Write-Output "  Project: $ProjectName"
  Write-Output "  Gateway: $gatewayUrl"
Write-Output "  Public site URL: $(With-TrailingSlash $sitePublicUrl)"
  Write-Output "  Site bucket: $SiteBucket"
  Write-Output "  Stats bucket: $StatsBucket"
  Write-Output "  Function: $FunctionName ($functionId)"
  Write-Output "  Service account: $ServiceAccountName ($serviceAccountId)"
if ($CustomDomain) {
  Write-Output "  Custom domain: https://$CustomDomain/"
}
