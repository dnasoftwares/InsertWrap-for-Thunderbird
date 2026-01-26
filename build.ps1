# build.ps1 - InsertWrap XPI ビルドスクリプト

$ErrorActionPreference = "Stop"

# スクリプトのあるディレクトリを基準にする
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceDir = Join-Path $scriptDir "InsertWrap"
$releaseDir = Join-Path $scriptDir "release"
$manifestPath = Join-Path $sourceDir "manifest.json"

# manifest.json から name と version を取得
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$name = $manifest.name
$version = $manifest.version

# 出力ファイル名
$xpiFileName = "$name-$version.xpi"
$xpiPath = Join-Path $releaseDir $xpiFileName

# release フォルダを作成（存在しない場合）
if (-not (Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Path $releaseDir | Out-Null
    Write-Host "Created: $releaseDir"
}

# 既存ファイルがあれば削除
if (Test-Path $xpiPath) {
    Remove-Item $xpiPath -Force
    Write-Host "Removed existing: $xpiFileName"
}

# 一時的なZIPファイルを作成
$tempZip = Join-Path $env:TEMP "$name-$version.zip"
if (Test-Path $tempZip) {
    Remove-Item $tempZip -Force
}

# InsertWrap フォルダの中身を ZIP 化
Compress-Archive -Path "$sourceDir\*" -DestinationPath $tempZip -CompressionLevel Optimal

# ZIP を XPI にリネームして release フォルダに移動
Move-Item -Path $tempZip -Destination $xpiPath -Force

Write-Host "Build complete: $xpiPath"
