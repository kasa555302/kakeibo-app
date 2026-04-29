// カテゴリとその色・絵文字の定義
export const CATEGORIES = {
  食費:   { color: '#52b788', emoji: '🍚' },
  日用品: { color: '#74c69d', emoji: '🧴' },
  外食:   { color: '#f4a261', emoji: '🍜' },
  交通費: { color: '#457b9d', emoji: '🚃' },
  娯楽:   { color: '#e9c46a', emoji: '🎮' },
  医療:   { color: '#e76f51', emoji: '💊' },
  衣類:   { color: '#a8dadc', emoji: '👕' },
  その他: { color: '#adb5bd', emoji: '📦' },
}

/**
 * カテゴリ別に金額を集計する
 * @param {Array} records レコード配列
 * @returns {Object} { カテゴリ名: 合計金額 }
 */
export function aggregateByCategory(records) {
  return records.reduce((acc, r) => {
    const cat = r.category || 'その他'
    acc[cat] = (acc[cat] || 0) + (r.price || 0)
    return acc
  }, {})
}

/**
 * 月別に金額を集計する
 * @param {Array} records レコード配列
 * @returns {Object} { "YYYY-MM": 合計金額 }
 */
export function aggregateByMonth(records) {
  return records.reduce((acc, r) => {
    const month = r.date ? r.date.slice(0, 7) : '不明'
    acc[month] = (acc[month] || 0) + (r.price || 0)
    return acc
  }, {})
}
