param(
  [ValidateRange(1, 65535)]
  [int]$Port = 4777,
  [string]$UpstreamBase = "https://storage.stats47.jp"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.Net.Http

$upstreamUri = [Uri]$UpstreamBase
if ($upstreamUri.Scheme -ne "https" -or -not $upstreamUri.IsAbsoluteUri) {
  throw "UpstreamBase は絶対 HTTPS URL にしてください"
}

$allowedMethods = @("GET", "HEAD")
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$Port/")

$handler = [System.Net.Http.HttpClientHandler]::new()
$handler.UseProxy = $true
$handler.DefaultProxyCredentials = [System.Net.CredentialCache]::DefaultNetworkCredentials
$client = [System.Net.Http.HttpClient]::new($handler)
$client.Timeout = [TimeSpan]::FromSeconds(60)

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

      if ($request.HttpMethod -eq "GET") {
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
