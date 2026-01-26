/**
 * InsertWrap - Options Script
 * 設定画面のロジック
 */

// デフォルト設定
const DEFAULT_SETTINGS = {
  maxWidth: 72,
  enabled: true
};

// DOM要素
const elements = {
  enabled: document.getElementById('enabled'),
  maxWidth: document.getElementById('maxWidth'),
  saveButton: document.getElementById('save'),
  resetButton: document.getElementById('reset'),
  status: document.getElementById('status')
};

/**
 * 設定を読み込んでUIに反映
 */
async function loadSettings() {
  try {
    const settings = await browser.storage.local.get(DEFAULT_SETTINGS);
    elements.enabled.checked = settings.enabled;
    elements.maxWidth.value = settings.maxWidth;
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus('設定の読み込みに失敗しました', 'error');
  }
}

/**
 * 設定を保存
 */
async function saveSettings() {
  const maxWidth = parseInt(elements.maxWidth.value, 10);

  // バリデーション
  if (isNaN(maxWidth) || maxWidth < 20 || maxWidth > 200) {
    showStatus('改行桁数は20〜200の範囲で指定してください', 'error');
    return;
  }

  try {
    await browser.storage.local.set({
      enabled: elements.enabled.checked,
      maxWidth: maxWidth
    });
    showStatus('設定を保存しました', 'success');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus('設定の保存に失敗しました', 'error');
  }
}

/**
 * 設定を初期値に戻す
 */
async function resetSettings() {
  try {
    await browser.storage.local.set(DEFAULT_SETTINGS);
    elements.enabled.checked = DEFAULT_SETTINGS.enabled;
    elements.maxWidth.value = DEFAULT_SETTINGS.maxWidth;
    showStatus('設定を初期値に戻しました', 'success');
  } catch (error) {
    console.error('Failed to reset settings:', error);
    showStatus('設定のリセットに失敗しました', 'error');
  }
}

/**
 * ステータスメッセージを表示
 * @param {string} message - メッセージ
 * @param {string} type - 'success' または 'error'
 */
function showStatus(message, type) {
  elements.status.textContent = message;
  elements.status.className = `status ${type}`;
  elements.status.hidden = false;

  // 3秒後に非表示
  setTimeout(() => {
    elements.status.hidden = true;
  }, 3000);
}

// イベントリスナー
elements.saveButton.addEventListener('click', saveSettings);
elements.resetButton.addEventListener('click', resetSettings);

// 初期化
loadSettings();
