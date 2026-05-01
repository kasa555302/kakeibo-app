// ===================================================
// Gmail メール自動分類スクリプト
// Claude API でメールを分類し、スプレッドシートと
// Slack に通知する
// ===================================================

// スクリプトプロパティからAPIキーを取得する
const CLAUDE_API_KEY = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY')
const SLACK_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL')

// 使用するClaudeモデル
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'

// Gmailラベル名
const LABEL_PENDING = '要処理'
const LABEL_DONE    = '処理済み'

// スプレッドシートのシート名
const SHEET_LOG   = 'メールログ'
const SHEET_ERROR = 'エラーログ'

// ===================================================
// メイン処理：「要処理」ラベルの未読メールを処理する
// ===================================================
function classifyEmails() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()

  // 「要処理」ラベルの未読メールを取得する
  const labelPending = GmailApp.getUserLabelByName(LABEL_PENDING)
  if (!labelPending) {
    logError(ss, 'ラベル未検出', `Gmailに「${LABEL_PENDING}」ラベルが存在しません`)
    return
  }

  // 未読スレッドを最大50件取得する
  const threads = labelPending.getThreads(0, 50)
  const unreadThreads = threads.filter(t => t.isUnread())

  if (unreadThreads.length === 0) return

  // 「処理済み」ラベルを取得または作成する
  let labelDone = GmailApp.getUserLabelByName(LABEL_DONE)
  if (!labelDone) {
    labelDone = GmailApp.createLabel(LABEL_DONE)
  }

  unreadThreads.forEach(thread => {
    // スレッド内の最新メッセージを対象にする
    const messages = thread.getMessages()
    const msg = messages[messages.length - 1]

    try {
      const date    = msg.getDate()
      const from    = msg.getFrom()
      const subject = msg.getSubject()
      const body    = msg.getPlainBody().slice(0, 3000) // 長文は先頭3000文字に絞る

      // Claude API でメールを分類・要約する
      const { category, summary } = classifyWithClaude(subject, body)

      // スプレッドシートに記録する
      logToSheet(ss, date, from, subject, category, summary)

      // Slack に通知する
      notifySlack(subject, from, category, summary)

      // ラベルを付け替える（要処理を外し処理済みをつける）
      thread.addLabel(labelDone)
      thread.removeLabel(labelPending)
      thread.markRead()

    } catch (e) {
      logError(ss, `メール処理エラー: ${msg.getSubject()}`, e.message)
    }
  })
}

// ===================================================
// Claude API でメールを分類・要約する
// @param {string} subject - 件名
// @param {string} body    - 本文（最大3000文字）
// @returns {{ category: string, summary: string }}
// ===================================================
function classifyWithClaude(subject, body) {
  const prompt = `以下のメールを分析し、JSON形式のみで返答してください。コードブロック不要です。

件名: ${subject}
本文:
${body}

返答形式:
{
  "category": "クレーム" | "質問" | "注文" | "その他",
  "summary": "メール内容の要約（100文字以内）"
}`

  const payload = {
    model: CLAUDE_MODEL,
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }]
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  }

  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', options)
  const json = JSON.parse(res.getContentText())

  if (res.getResponseCode() !== 200) {
    throw new Error(`Claude API エラー: ${json.error?.message || res.getContentText()}`)
  }

  const text = json.content[0].text.trim()

  // JSONをパースする（コードブロックが含まれる場合はフォールバック抽出）
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error(`Claude レスポンスのJSONパース失敗: ${text}`)
  }
}

// ===================================================
// スプレッドシートの「メールログ」シートに記録する
// ===================================================
function logToSheet(ss, date, from, subject, category, summary) {
  let sheet = ss.getSheetByName(SHEET_LOG)

  // シートがなければ作成してヘッダーを追加する
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_LOG)
    sheet.appendRow(['受信日時', '送信者', '件名', '分類', '要約'])
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold')
    sheet.setFrozenRows(1)
  }

  sheet.appendRow([
    Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm'),
    from,
    subject,
    category,
    summary
  ])
}

// ===================================================
// スプレッドシートの「エラーログ」シートにエラーを記録する
// ===================================================
function logError(ss, context, message) {
  let sheet = ss.getSheetByName(SHEET_ERROR)

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ERROR)
    sheet.appendRow(['発生日時', '内容', 'エラーメッセージ'])
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold')
    sheet.setFrozenRows(1)
  }

  sheet.appendRow([
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm:ss'),
    context,
    message
  ])

  console.error(`[エラー] ${context}: ${message}`)
}

// ===================================================
// Slack Incoming Webhook で担当者に通知する
// ===================================================
function notifySlack(subject, from, category, summary) {
  const categoryEmoji = {
    'クレーム': '🚨',
    '質問':     '❓',
    '注文':     '📦',
    'その他':   '📧'
  }
  const emoji = categoryEmoji[category] || '📧'

  const text = [
    `${emoji} *新着メール通知*`,
    `*件名:* ${subject}`,
    `*送信者:* ${from}`,
    `*分類:* ${category}`,
    `*要約:* ${summary}`
  ].join('\n')

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ text }),
    muteHttpExceptions: true
  }

  const res = UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options)
  if (res.getResponseCode() !== 200) {
    throw new Error(`Slack 通知失敗: ${res.getContentText()}`)
  }
}

// ===================================================
// 5分おきに classifyEmails を実行するトリガーを設定する
// ※ GASエディタで一度だけ手動実行してトリガーを登録する
// ===================================================
function setupTrigger() {
  // 既存の同名トリガーを削除して重複登録を防ぐ
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'classifyEmails')
    .forEach(t => ScriptApp.deleteTrigger(t))

  ScriptApp.newTrigger('classifyEmails')
    .timeBased()
    .everyMinutes(5)
    .create()

  console.log('トリガーを設定しました（5分おき）')
}
