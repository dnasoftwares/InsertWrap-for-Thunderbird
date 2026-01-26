/**
 * InsertWrap - Text Wrapper Module
 * 指定桁数で改行を挿入するロジック
 */

/**
 * 文字のコードポイントから表示幅を返す
 * 全角=2、半角=1
 * @param {number} codePoint - Unicode コードポイント
 * @returns {number} - 表示幅（1 または 2）
 */
function getCharWidth(codePoint) {
  // CJK統合漢字 (U+4E00-U+9FFF)
  if (codePoint >= 0x4E00 && codePoint <= 0x9FFF) return 2;
  // CJK統合漢字拡張A (U+3400-U+4DBF)
  if (codePoint >= 0x3400 && codePoint <= 0x4DBF) return 2;
  // CJK統合漢字拡張B-F (U+20000-U+2FA1F)
  if (codePoint >= 0x20000 && codePoint <= 0x2FA1F) return 2;
  // ひらがな (U+3040-U+309F)
  if (codePoint >= 0x3040 && codePoint <= 0x309F) return 2;
  // カタカナ (U+30A0-U+30FF)
  if (codePoint >= 0x30A0 && codePoint <= 0x30FF) return 2;
  // 全角ASCII・記号 (U+FF01-U+FF60)
  if (codePoint >= 0xFF01 && codePoint <= 0xFF60) return 2;
  // 半角カタカナ (U+FF61-U+FF9F)
  if (codePoint >= 0xFF61 && codePoint <= 0xFF9F) return 1;
  // CJK記号・句読点 (U+3000-U+303F)
  if (codePoint >= 0x3000 && codePoint <= 0x303F) return 2;
  // 全角括弧類 (U+3008-U+3011)
  if (codePoint >= 0x3008 && codePoint <= 0x3011) return 2;
  // その他の全角記号
  if (codePoint >= 0x2E80 && codePoint <= 0x2EFF) return 2; // CJK部首補助
  if (codePoint >= 0x2F00 && codePoint <= 0x2FDF) return 2; // 康煕部首

  // その他は半角として扱う
  return 1;
}

/**
 * 文字列の表示幅を計算する
 * @param {string} str - 対象文字列
 * @returns {number} - 表示幅の合計
 */
function getStringWidth(str) {
  let width = 0;
  for (const char of str) {
    width += getCharWidth(char.codePointAt(0));
  }
  return width;
}

/**
 * 引用行かどうかを判定する
 * @param {string} line - 行文字列
 * @returns {boolean} - 引用行なら true
 */
function isQuotedLine(line) {
  return /^\s*>/.test(line);
}

/**
 * 行内のURLの位置を抽出する
 * @param {string} line - 行文字列
 * @returns {Array<{start: number, end: number}>} - URL位置の配列
 */
function extractUrls(line) {
  const urlPattern = /(?:https?:\/\/|mailto:|ftp:\/\/)[^\s<>"')\]]+/gi;
  const urls = [];
  let match;

  while ((match = urlPattern.exec(line)) !== null) {
    urls.push({
      start: match.index,
      end: match.index + match[0].length
    });
  }

  return urls;
}

/**
 * 指定位置がURL内かどうかを判定する
 * @param {number} position - 文字位置
 * @param {Array<{start: number, end: number}>} urls - URL位置の配列
 * @returns {Object|null} - URL内なら該当URLオブジェクト、そうでなければnull
 */
function isInsideUrl(position, urls) {
  for (const url of urls) {
    if (position >= url.start && position < url.end) {
      return url;
    }
  }
  return null;
}

/**
 * 単一行に対して改行を挿入する
 * @param {string} line - 対象行
 * @param {number} maxWidth - 最大幅
 * @returns {string} - 改行挿入後の文字列
 */
function wrapLine(line, maxWidth) {
  // 引用行はスキップ
  if (isQuotedLine(line)) {
    return line;
  }

  // 既に収まる場合はそのまま返す
  if (getStringWidth(line) <= maxWidth) {
    return line;
  }

  const urls = extractUrls(line);
  const result = [];
  let currentLine = '';
  let currentWidth = 0;
  let charIndex = 0;

  for (const char of line) {
    const charWidth = getCharWidth(char.codePointAt(0));

    // この文字を追加すると超過するか確認
    if (currentWidth + charWidth > maxWidth && currentLine.length > 0) {
      // URL内での改行を避ける
      const urlInfo = isInsideUrl(charIndex, urls);
      if (urlInfo) {
        // URL終端まで続ける（maxWidthを超えてもURL内では改行しない）
        currentLine += char;
        currentWidth += charWidth;
        charIndex++;
        continue;
      }

      // 改行を挿入
      result.push(currentLine);
      currentLine = char;
      currentWidth = charWidth;
    } else {
      currentLine += char;
      currentWidth += charWidth;
    }

    charIndex++;
  }

  // 最後の行を追加
  if (currentLine.length > 0) {
    result.push(currentLine);
  }

  return result.join('\n');
}

/**
 * テキスト全体に対して改行を挿入する
 * @param {string} text - 対象テキスト
 * @param {number} maxWidth - 最大幅（桁数）
 * @returns {string} - 改行挿入後のテキスト
 */
function wrapText(text, maxWidth) {
  if (!text || maxWidth < 1) {
    return text;
  }

  // 既存の改行で分割
  const lines = text.split(/\r?\n/);

  // 各行を処理
  const wrappedLines = lines.map(line => wrapLine(line, maxWidth));

  return wrappedLines.join('\n');
}
