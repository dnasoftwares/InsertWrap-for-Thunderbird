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
 * ASCII単語を構成する文字かどうかを判定する
 * 英数字、ハイフン、アンダースコア、アポストロフィを単語の一部とみなす
 * @param {string} char - 文字
 * @returns {boolean} - ASCII単語の一部なら true
 */
function isAsciiWordChar(char) {
  const code = char.charCodeAt(0);
  // a-z, A-Z
  if ((code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A)) return true;
  // 0-9
  if (code >= 0x30 && code <= 0x39) return true;
  // ハイフン、アンダースコア、アポストロフィ
  if (code === 0x2D || code === 0x5F || code === 0x27) return true;
  return false;
}

/**
 * 指定位置から始まるASCII単語を抽出する
 * @param {string} line - 行文字列
 * @param {number} startIndex - 開始位置
 * @returns {{word: string, length: number}} - 単語と文字数
 */
function extractAsciiWord(line, startIndex) {
  let word = '';
  let i = startIndex;
  const chars = [...line]; // サロゲートペア対応

  while (i < chars.length && isAsciiWordChar(chars[i])) {
    word += chars[i];
    i++;
  }

  return { word, length: word.length };
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
  const chars = [...line]; // サロゲートペア対応
  const result = [];
  let currentLine = '';
  let currentWidth = 0;
  let charIndex = 0;

  while (charIndex < chars.length) {
    const char = chars[charIndex];

    // URL内かどうかを確認
    const urlInfo = isInsideUrl(charIndex, urls);
    if (urlInfo) {
      // URL終端まで一気に追加（maxWidthを超えてもURL内では改行しない）
      while (charIndex < urlInfo.end && charIndex < chars.length) {
        currentLine += chars[charIndex];
        currentWidth += getCharWidth(chars[charIndex].codePointAt(0));
        charIndex++;
      }
      continue;
    }

    // ASCII単語の開始かどうかを確認
    if (isAsciiWordChar(char)) {
      const { word } = extractAsciiWord(line, charIndex);
      const wordWidth = getStringWidth(word);

      // 単語を追加すると超過するか確認
      if (currentWidth + wordWidth > maxWidth && currentLine.length > 0) {
        // 現在の行を確定して改行（末尾スペースを除去）
        result.push(currentLine.trimEnd());
        currentLine = '';
        currentWidth = 0;
      }

      // 単語自体がmaxWidthを超える場合は文字単位で分割
      if (wordWidth > maxWidth && currentLine.length === 0) {
        for (const wordChar of word) {
          const charWidth = getCharWidth(wordChar.codePointAt(0));
          if (currentWidth + charWidth > maxWidth && currentLine.length > 0) {
            result.push(currentLine);
            currentLine = wordChar;
            currentWidth = charWidth;
          } else {
            currentLine += wordChar;
            currentWidth += charWidth;
          }
        }
      } else {
        // 単語全体を追加
        currentLine += word;
        currentWidth += wordWidth;
      }

      charIndex += word.length;
      continue;
    }

    // 行頭のスペースはスキップ
    if (currentLine.length === 0 && char === ' ') {
      charIndex++;
      continue;
    }

    // 非ASCII文字（日本語など）は従来通り文字単位で処理
    const charWidth = getCharWidth(char.codePointAt(0));

    if (currentWidth + charWidth > maxWidth && currentLine.length > 0) {
      // 改行を挿入（末尾スペースを除去）
      result.push(currentLine.trimEnd());
      // 次の行の先頭がスペースにならないようにする
      if (char === ' ') {
        currentLine = '';
        currentWidth = 0;
      } else {
        currentLine = char;
        currentWidth = charWidth;
      }
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
