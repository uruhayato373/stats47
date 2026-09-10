# Cache payload budget is total, in addition to the per-response limit.
$maxCacheBytes = 8MB
$maxTotalCacheBytes = 64MB
$maxCacheEntries = 2000
$cacheStore = [ordered]@{}
$cacheTotalBytes = [long]0

function Remove-CacheEntry {
  param([string]$Key)
  if ($cacheStore.Contains($Key)) {
    $script:cacheTotalBytes -= $cacheStore[$Key].Bytes.LongLength
    $cacheStore.Remove($Key)
  }
}

function Remove-ExpiredCacheEntries {
  param([DateTime]$Now = [DateTime]::UtcNow)
  foreach ($key in @($cacheStore.Keys)) {
    if ($Now -ge $cacheStore[$key].ExpiresAt) { Remove-CacheEntry -Key $key }
  }
}

function Add-CacheEntry {
  param([string]$Key, [object]$Entry)
  Remove-ExpiredCacheEntries
  if ($Entry.Bytes.LongLength -gt $maxCacheBytes -or $Entry.Bytes.LongLength -gt $maxTotalCacheBytes) { return }
  Remove-CacheEntry -Key $Key
  while ($cacheStore.Count -gt 0 -and (
    $cacheStore.Count -ge $maxCacheEntries -or
    $script:cacheTotalBytes + $Entry.Bytes.LongLength -gt $maxTotalCacheBytes
  )) { Remove-CacheEntry -Key ([string]@($cacheStore.Keys)[0]) }
  $cacheStore[$Key] = $Entry
  $script:cacheTotalBytes += $Entry.Bytes.LongLength
}

function Get-CacheEntry {
  param([string]$Key)
  Remove-ExpiredCacheEntries
  if ($cacheStore.Contains($Key)) { return $cacheStore[$Key] }
  return $null
}
