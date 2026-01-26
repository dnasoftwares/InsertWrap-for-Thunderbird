/**
 * ForcedWrap - Background Script
 * メール送信前に改行を挿入するバックグラウンド処理
 */

// デフォルト設定
const DEFAULT_SETTINGS = {
  maxWidth: 72,
  enabled: true
};

/**
 * 設定を取得する
 * @returns {Promise<Object>} - 設定オブジェクト
 */
async function getSettings() {
  const settings = await browser.storage.local.get(DEFAULT_SETTINGS);
  return settings;
}

/**
 * メール送信前のイベントハンドラ
 */
browser.compose.onBeforeSend.addListener(async (tab, details) => {
  try {
    const settings = await getSettings();

    // 機能が無効の場合はスキップ
    if (!settings.enabled) {
      console.log('ForcedWrap: Disabled, skipping.');
      return {};
    }

    // プレーンテキストでない場合はスキップ
    if (!details.isPlainText) {
      console.log('ForcedWrap: HTML mail detected, skipping.');
      return {};
    }

    // 本文がない場合はスキップ
    if (!details.plainTextBody) {
      console.log('ForcedWrap: No plain text body, skipping.');
      return {};
    }

    // 改行を挿入
    const originalBody = details.plainTextBody;
    const wrappedBody = wrapText(originalBody, settings.maxWidth);

    // 変更がない場合は何もしない
    if (originalBody === wrappedBody) {
      console.log('ForcedWrap: No changes needed.');
      return {};
    }

    console.log(`ForcedWrap: Wrapped text at ${settings.maxWidth} columns.`);

    return {
      cancel: false,
      details: {
        plainTextBody: wrappedBody
      }
    };
  } catch (error) {
    console.error('ForcedWrap: Error during processing:', error);
    // エラーが発生しても送信を妨げない
    return {};
  }
});

/**
 * ツールバーボタンクリック時のハンドラ
 * 手動で改行を挿入する
 */
browser.composeAction.onClicked.addListener(async (tab) => {
  try {
    const settings = await getSettings();
    const details = await browser.compose.getComposeDetails(tab.id);

    // HTMLメールの場合は何もしない
    if (!details.isPlainText) {
      console.log('ForcedWrap: HTML mail detected, manual wrap skipped.');
      return;
    }

    // 本文がない場合は何もしない
    if (!details.plainTextBody) {
      console.log('ForcedWrap: No plain text body, manual wrap skipped.');
      return;
    }

    const wrappedBody = wrapText(details.plainTextBody, settings.maxWidth);

    await browser.compose.setComposeDetails(tab.id, {
      plainTextBody: wrappedBody
    });

    console.log(`ForcedWrap: Manual wrap applied at ${settings.maxWidth} columns.`);
  } catch (error) {
    console.error('ForcedWrap: Error during manual wrap:', error);
  }
});

// 初期化ログ
console.log('ForcedWrap: Background script loaded.');
