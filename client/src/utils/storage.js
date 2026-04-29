// ローカルストレージのキー
const STORAGE_KEY = 'kakeibo_records'

/**
 * 全レコードを取得する
 * @returns {Array} 家計簿レコードの配列
 */
export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * レコードを保存する
 * @param {Array} records 保存するレコード配列
 */
export function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

/**
 * レコードを追加してストレージを更新する
 * @param {Array} existing 既存レコード
 * @param {Object} newReceipt 新規レシートデータ
 * @returns {Array} 更新後のレコード配列
 */
export function addReceipt(existing, newReceipt) {
  // レシート単位でIDを付与し、itemsを個別レコードとして展開する
  const id = Date.now()
  const items = newReceipt.items.map((item, i) => ({
    id: `${id}-${i}`,
    date: newReceipt.date,
    storeName: newReceipt.storeName,
    name: item.name,
    price: item.price,
    category: item.category,
  }))
  const updated = [...existing, ...items]
  saveRecords(updated)
  return updated
}

/**
 * 指定IDのレコードを削除する
 * @param {Array} existing 既存レコード
 * @param {string} id 削除対象ID
 * @returns {Array} 更新後のレコード配列
 */
export function deleteRecord(existing, id) {
  const updated = existing.filter((r) => r.id !== id)
  saveRecords(updated)
  return updated
}
