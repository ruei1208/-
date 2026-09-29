param($root, $port = 8765)
$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.png'='image/png'; '.jpg'='image/jpeg'; '.json'='application/json' }
$l = New-Object System.Net.HttpListener; $l.Prefixes.Add("http://localhost:$port/"); $l.Start()
Write-Output "listening $port"
while ($l.IsListening) {
  $c = $l.GetContext(); $req = $c.Request; $res = $c.Response
  try {
    $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
    $res.Headers.Add('Cache-Control','no-store')
    if ($req.HttpMethod -eq 'POST') {
      $out = Join-Path $root ("out\" + [IO.Path]::GetFileName($path))
      $fs = [IO.File]::Create($out); $req.InputStream.CopyTo($fs); $fs.Close()
      Write-Output "saved $out"
      $b = [Text.Encoding]::UTF8.GetBytes('ok')
    } else {
      if ($path -eq '') { $path = 'index.html' }
      $f = Join-Path $root $path
      if (Test-Path $f -PathType Leaf) { $b = [IO.File]::ReadAllBytes($f); $ext = [IO.Path]::GetExtension($f); if ($mime[$ext]) { $res.ContentType = $mime[$ext] } }
      else { $res.StatusCode = 404; $b = [Text.Encoding]::UTF8.GetBytes('404') }
    }
    $res.OutputStream.Write($b, 0, $b.Length)
  } catch { Write-Output $_.Exception.Message } finally { $res.Close() }
}
