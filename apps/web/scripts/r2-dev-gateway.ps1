# -*- coding: utf-8 -*-
# ★このファイルは UTF-8 BOM 付きで保存する。powershell.exe (Windows PowerShell 5.1) は
#   BOM の無い .ps1 を ANSI (日本語環境では CP932) として読むため、UTF-8 の日本語が
#   コメント内にあるだけでも化けて「予期しない '}'」の構文エラーになる (2026-08-21 実測)。
param(
  [ValidateRange(1, 65535)]
  [int]$Port = 4777,
  [string]$UpstreamBase = "https://storage.stats47.jp",
  # git SSOT の page-components は、開発中の変更を本番 R2 より優先する。
  [string]$LocalOverrideRoot = "",
  # generator が作るローカル R2 派生物を本番 R2 より優先する。
  [string]$LocalR2Root = "",
  # dev セッション中は同じ R2 オブジェクトを何度も読む。0 で無効。
  [ValidateRange(0, 86400)]
  [int]$CacheSeconds = 300
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.Net.Http

$upstreamUri = [Uri]$UpstreamBase
if ($upstreamUri.Scheme -ne "https" -or -not $upstreamUri.IsAbsoluteUri) {
  throw "UpstreamBase は絶対 HTTPS URL にしてください"
}

$localOverrideBase = $null
if ($LocalOverrideRoot) {
  $localOverrideBase = [IO.Path]::GetFullPath($LocalOverrideRoot).TrimEnd(
    [IO.Path]::DirectorySeparatorChar,
    [IO.Path]::AltDirectorySeparatorChar
  )
}

$localR2Base = $null
if ($LocalR2Root) {
  $localR2Base = [IO.Path]::GetFullPath($LocalR2Root).TrimEnd(
    [IO.Path]::DirectorySeparatorChar,
    [IO.Path]::AltDirectorySeparatorChar
  )
}

$allowedMethods = @("GET", "HEAD")
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$Port/")

$handler = [System.Net.Http.HttpClientHandler]::new()
$handler.UseProxy = $true
$handler.DefaultProxyCredentials = [System.Net.CredentialCache]::DefaultNetworkCredentials
$client = [System.Net.Http.HttpClient]::new($handler)
$client.Timeout = [TimeSpan]::FromSeconds(60)

# ---------------------------------------------------------------------------
# メモリキャッシュ
#
# ★なぜ要るか (2026-08-21 実測): この gateway は GetContext() の逐次ループなので、
#   アプリが並列に投げた R2 fetch も 1 本ずつ社内プロキシへ出ていく。単発なら 80ms
#   だが 20 回逐次で 5.19s = 1 回あたり 259ms かかる。/themes/<slug> のような詳細
#   ページは毎リクエストで同じオブジェクトを読み直すため、warm でも中央値 3.1s だった
#   (一覧ページは 0.3s)。同じキーを再取得しないだけで詳細ページの遷移が桁で速くなる。
#
# 安全側の制約: 200 応答だけ / Range・条件付きリクエストは対象外 / サイズと件数に上限。
# ---------------------------------------------------------------------------
$cacheStore = [System.Collections.Generic.Dictionary[string, object]]::new()
$cacheOrder = [System.Collections.Generic.Queue[string]]::new()
$maxCacheBytes = 8MB
$maxCacheEntries = 2000

function Test-Cacheable {
  param([System.Net.HttpListenerRequest]$Request)

  if ($CacheSeconds -le 0) { return $false }
  # HEAD は本文を持たないので、GET の本文を流用すると Content-Length を偽ることになる。
  if ($Request.HttpMethod -ne "GET") { return $false }
  # Range / 条件付きは応答が要求ごとに変わるのでキャッシュしない。
  foreach ($h in @("Range", "If-None-Match", "If-Modified-Since")) {
    if ($Request.Headers[$h]) { return $false }
  }
  $cc = $Request.Headers["Cache-Control"]
  if ($cc -and $cc -match "no-cache|no-store") { return $false }
  return $true
}

function Add-CacheEntry {
  param([string]$Key, [object]$Entry)

  if ($cacheStore.ContainsKey($Key)) { return }
  $cacheStore[$Key] = $Entry
  $cacheOrder.Enqueue($Key)
  # 件数上限を超えたら古いものから落とす (dev 用なので厳密な LRU にはしない)。
  while ($cacheOrder.Count -gt $maxCacheEntries) {
    $evict = $cacheOrder.Dequeue()
    [void]$cacheStore.Remove($evict)
  }
}

function Get-CacheEntry {
  param([string]$Key)

  $entry = $null
  if (-not $cacheStore.TryGetValue($Key, [ref]$entry)) { return $null }
  if ([DateTime]::UtcNow -ge $entry.ExpiresAt) {
    [void]$cacheStore.Remove($Key)
    return $null
  }
  return $entry
}

function Write-TextResponse {
  param(
    [System.Net.HttpListenerResponse]$Response,
    [int]$StatusCode,
    [string]$Text
  )

  $bytes = [Text.Encoding]::UTF8.GetBytes($Text)
  $Response.StatusCode = $StatusCode
  $Response.ContentType = "text/plain; charset=utf-8"
  $Response.ContentLength64 = $bytes.Length
  $Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Resolve-LocalOverrideFile {
  param([string]$Key)

  if ($localR2Base -and $Key.StartsWith("app/municipalities/", [StringComparison]::Ordinal)) {
    $r2RelativePath = $Key.Replace(
      [IO.Path]::AltDirectorySeparatorChar,
      [IO.Path]::DirectorySeparatorChar
    )
    $r2Candidate = [IO.Path]::GetFullPath((Join-Path $localR2Base $r2RelativePath))
    $r2RootPrefix = $localR2Base + [IO.Path]::DirectorySeparatorChar
    if (-not $r2Candidate.StartsWith($r2RootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
      return $null
    }
    if (Test-Path -LiteralPath $r2Candidate -PathType Leaf) { return $r2Candidate }
  }

  if (-not $localOverrideBase) { return $null }
  $prefix = "app/page-components/"
  if (-not $Key.StartsWith($prefix, [StringComparison]::Ordinal)) { return $null }

  $relativePath = $Key.Substring($prefix.Length).Replace(
    [IO.Path]::AltDirectorySeparatorChar,
    [IO.Path]::DirectorySeparatorChar
  )
  $candidate = [IO.Path]::GetFullPath((Join-Path $localOverrideBase $relativePath))
  $rootPrefix = $localOverrideBase + [IO.Path]::DirectorySeparatorChar
  if (-not $candidate.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
    return $null
  }
  if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
  return $null
}

function Write-LocalFileResponse {
  param(
    [System.Net.HttpListenerRequest]$Request,
    [System.Net.HttpListenerResponse]$Response,
    [string]$FilePath
  )

  $bytes = [IO.File]::ReadAllBytes($FilePath)
  $Response.StatusCode = 200
  $Response.ContentType = "application/json; charset=utf-8"
  $Response.Headers["Cache-Control"] = "no-store"
  $Response.Headers["X-R2-Dev-Source"] = "local-override"
  $Response.ContentLength64 = $bytes.Length
  if ($Request.HttpMethod -eq "GET") {
    $Response.OutputStream.Write($bytes, 0, $bytes.Length)
  }
}

function Copy-ResponseHeader {
  param(
    [System.Net.Http.HttpResponseMessage]$Source,
    [System.Net.HttpListenerResponse]$Target,
    [string]$Name
  )

  $values = $null
  if ($Source.Headers.TryGetValues($Name, [ref]$values) -or
      $Source.Content.Headers.TryGetValues($Name, [ref]$values)) {
    $Target.Headers[$Name] = ($values -join ", ")
  }
}

$listener.Start()
Write-Host "[r2-dev-gateway] listening on http://127.0.0.1:$Port"
if ($CacheSeconds -gt 0) {
  Write-Host "[r2-dev-gateway] GET cache: ${CacheSeconds}s TTL / max $($maxCacheEntries) entries / max $($maxCacheBytes) bytes each"
} else {
  Write-Host "[r2-dev-gateway] GET cache: disabled"
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    $remoteRequest = $null
    $remoteResponse = $null
    $response.Headers["Access-Control-Allow-Origin"] = "*"
    $response.Headers["X-R2-Dev-Gateway"] = "windows-default-credentials"

    try {
      if ($request.Url.AbsolutePath -eq "/__health") {
        Write-TextResponse -Response $response -StatusCode 200 -Text "ok"
        continue
      }

      if ($allowedMethods -notcontains $request.HttpMethod) {
        $response.Headers["Allow"] = "GET, HEAD"
        Write-TextResponse -Response $response -StatusCode 405 -Text "Method Not Allowed"
        continue
      }

      $key = [Uri]::UnescapeDataString($request.Url.AbsolutePath).TrimStart("/")
      $segments = @($key -split "/")
      $hasUnsafeSegment = $segments | Where-Object { $_ -eq "." -or $_ -eq ".." }
      if (-not $key -or $key.Contains("\") -or $key.Contains([char]0) -or $hasUnsafeSegment) {
        Write-TextResponse -Response $response -StatusCode 400 -Text "Invalid R2 key"
        continue
      }

      $localFile = Resolve-LocalOverrideFile -Key $key
      if ($localFile) {
        Write-LocalFileResponse -Request $request -Response $response -FilePath $localFile
        continue
      }
      $cacheable = Test-Cacheable -Request $request
      if ($cacheable) {
        $hit = Get-CacheEntry -Key $key
        if ($null -ne $hit) {
          $response.StatusCode = 200
          $response.Headers["X-R2-Dev-Cache"] = "HIT"
          if ($hit.ContentType) { $response.ContentType = $hit.ContentType }
          foreach ($cachedHeader in $hit.Headers.Keys) {
            $response.Headers[$cachedHeader] = $hit.Headers[$cachedHeader]
          }
          $response.ContentLength64 = $hit.Bytes.Length
          $response.OutputStream.Write($hit.Bytes, 0, $hit.Bytes.Length)
          continue
        }
        $response.Headers["X-R2-Dev-Cache"] = "MISS"
      }

      $escapedKey = ($segments | ForEach-Object { [Uri]::EscapeDataString($_) }) -join "/"
      $base = $UpstreamBase.TrimEnd("/")
      $remoteRequest = [System.Net.Http.HttpRequestMessage]::new(
        [System.Net.Http.HttpMethod]::$($request.HttpMethod.Substring(0, 1) + $request.HttpMethod.Substring(1).ToLowerInvariant()),
        "$base/$escapedKey"
      )

      foreach ($headerName in @("Range", "If-None-Match", "If-Modified-Since")) {
        $headerValue = $request.Headers[$headerName]
        if ($headerValue) {
          [void]$remoteRequest.Headers.TryAddWithoutValidation($headerName, $headerValue)
        }
      }

      $remoteResponse = $client.SendAsync(
        $remoteRequest,
        [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead
      ).GetAwaiter().GetResult()
      $response.StatusCode = [int]$remoteResponse.StatusCode

      if ($remoteResponse.Content.Headers.ContentType) {
        $response.ContentType = $remoteResponse.Content.Headers.ContentType.ToString()
      }
      if ($null -ne $remoteResponse.Content.Headers.ContentLength) {
        $response.ContentLength64 = $remoteResponse.Content.Headers.ContentLength
      }
      foreach ($headerName in @("ETag", "Last-Modified", "Cache-Control", "Content-Range", "Accept-Ranges")) {
        Copy-ResponseHeader -Source $remoteResponse -Target $response -Name $headerName
      }

      # 200 かつサイズが上限内のときだけ本文を読み切って保存する。
      # それ以外は従来どおりストリームで素通しする (大きい素材でメモリを使わない)。
      $storeBytes = $null
      if ($cacheable -and [int]$remoteResponse.StatusCode -eq 200) {
        $declaredLength = $remoteResponse.Content.Headers.ContentLength
        if ($null -eq $declaredLength -or $declaredLength -le $maxCacheBytes) {
          $storeBytes = $remoteResponse.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
          if ($storeBytes.Length -gt $maxCacheBytes) { $storeBytes = $null }
        }
      }

      if ($null -ne $storeBytes) {
        $headerSnapshot = @{}
        foreach ($headerName in @("ETag", "Last-Modified", "Cache-Control", "Accept-Ranges")) {
          if ($response.Headers[$headerName]) {
            $headerSnapshot[$headerName] = $response.Headers[$headerName]
          }
        }
        Add-CacheEntry -Key $key -Entry ([PSCustomObject]@{
          ContentType = $response.ContentType
          Bytes       = $storeBytes
          Headers     = $headerSnapshot
          ExpiresAt   = [DateTime]::UtcNow.AddSeconds($CacheSeconds)
        })
        $response.ContentLength64 = $storeBytes.Length
        $response.OutputStream.Write($storeBytes, 0, $storeBytes.Length)
      }
      elseif ($request.HttpMethod -eq "GET") {
        [void]$remoteResponse.Content.CopyToAsync($response.OutputStream).GetAwaiter().GetResult()
      }
    }
    catch {
      if ($response.OutputStream.CanWrite) {
        Write-TextResponse -Response $response -StatusCode 502 -Text "R2 gateway error"
      }
      Write-Warning "[r2-dev-gateway] $($_.Exception.Message)"
    }
    finally {
      if ($null -ne $remoteResponse) {
        $remoteResponse.Dispose()
      }
      if ($null -ne $remoteRequest) {
        $remoteRequest.Dispose()
      }
      $response.OutputStream.Close()
    }
  }
}
finally {
  $listener.Stop()
  $listener.Close()
  $client.Dispose()
  $handler.Dispose()
}
