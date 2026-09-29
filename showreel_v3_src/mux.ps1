param($video, $audio, $outDir, $outName)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$ext = [System.WindowsRuntimeSystemExtensions].GetMethods()
$asOp = $ext | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
$asOpP = $ext | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperationWithProgress`2' } | Select-Object -First 1
function Await($op, [Type]$ResT) { $task = $asOp.MakeGenericMethod($ResT).Invoke($null, @($op)); $task.Wait(-1) | Out-Null; $task.Result }

[void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Storage.StorageFolder, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Media.Editing.MediaComposition, Windows.Media.Editing, ContentType = WindowsRuntime]
[void][Windows.Media.Editing.MediaClip, Windows.Media.Editing, ContentType = WindowsRuntime]
[void][Windows.Media.Editing.BackgroundAudioTrack, Windows.Media.Editing, ContentType = WindowsRuntime]
[void][Windows.Media.MediaProperties.MediaEncodingProfile, Windows.Media.MediaProperties, ContentType = WindowsRuntime]
[void][Windows.Media.Transcoding.TranscodeFailureReason, Windows.Media.Transcoding, ContentType = WindowsRuntime]

$vf = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($video)) ([Windows.Storage.StorageFile])
$af = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($audio)) ([Windows.Storage.StorageFile])
$clip = Await ([Windows.Media.Editing.MediaClip]::CreateFromFileAsync($vf)) ([Windows.Media.Editing.MediaClip])
$bat = Await ([Windows.Media.Editing.BackgroundAudioTrack]::CreateFromFileAsync($af)) ([Windows.Media.Editing.BackgroundAudioTrack])
$comp = New-Object Windows.Media.Editing.MediaComposition
[System.Collections.Generic.ICollection[Windows.Media.Editing.MediaClip]].GetMethod('Add').Invoke($comp.Clips, @($clip)) | Out-Null
[System.Collections.Generic.ICollection[Windows.Media.Editing.BackgroundAudioTrack]].GetMethod('Add').Invoke($comp.BackgroundAudioTracks, @($bat)) | Out-Null
"clip duration: " + $clip.OriginalDuration + "  audio: " + $bat.OriginalDuration

$folder = Await ([Windows.Storage.StorageFolder]::GetFolderFromPathAsync($outDir)) ([Windows.Storage.StorageFolder])
$outFile = Await ($folder.CreateFileAsync($outName, [Windows.Storage.CreationCollisionOption]::ReplaceExisting)) ([Windows.Storage.StorageFile])

$p = [Windows.Media.MediaProperties.MediaEncodingProfile]::CreateMp4([Windows.Media.MediaProperties.VideoEncodingQuality]::HD1080p)
$p.Video.Width = 1920; $p.Video.Height = 1080; $p.Video.Bitrate = 28000000
$p.Video.FrameRate.Numerator = 60; $p.Video.FrameRate.Denominator = 1
$p.Video.ProfileId = [Windows.Media.MediaProperties.H264ProfileIds]::High
$p.Audio.Bitrate = 256000; $p.Audio.SampleRate = 48000; $p.Audio.ChannelCount = 2

$op = $comp.RenderToFileAsync($outFile, [Windows.Media.Editing.MediaTrimmingPreference]::Precise, $p)
$t = $asOpP.MakeGenericMethod([Windows.Media.Transcoding.TranscodeFailureReason], [double]).Invoke($null, @($op))
$t.Wait(-1) | Out-Null
"result: " + $t.Result
