# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

InsertWrap は Thunderbird 128+ 用の WebExtension アドオン。メール送信時に指定桁数で自動改行を挿入する。

## 開発・テスト

ビルドシステムなし。Thunderbird で直接読み込んでテスト:
1. `about:debugging` を開く
2. 「このFirefox」→「一時的なアドオンを読み込む」
3. `manifest.json` を選択

## アーキテクチャ

```
manifest.json          # Manifest V3, Thunderbird 128+ 必須
background.js          # メインロジック（自動改行 + ツールバーボタン）
lib/text-wrapper.js    # テキスト処理（wrapText, wrapLine, getCharWidth, extractAsciiWord など）
options/               # 設定画面 UI
```

### 主要な処理フロー

1. **自動改行**: `compose.onBeforeSend` → `wrapText()` → 本文更新
2. **手動改行**: `composeAction.onClicked` → `wrapText()` → 本文更新

### テキスト処理の仕様

- 全角=2桁、半角=1桁でカウント（`getCharWidth()`）
- 引用行（`>` 始まり）はスキップ
- URL 内では改行しない
- プレーンテキストメールのみ対象
- **英単語保護**: ASCII単語は途中で分割せず、収まらない場合は次行へ送る
  - 単語構成文字: 英数字、ハイフン、アンダースコア、アポストロフィ
  - 単語自体が maxWidth を超える場合のみ文字単位で分割
  - 改行時の行頭スペースは自動除去

### 設定

`browser.storage.local` に保存:
- `maxWidth`: 改行桁数（デフォルト: 72、範囲: 20-200）
- `enabled`: 自動改行の有効/無効
