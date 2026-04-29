/**
 * レシートデータのバリデーションを行い、警告メッセージの配列を返す
 * @param {Object} receiptData Claude APIから返されたレシートデータ
 * @param {Array} existingRecords 既存のレコード配列
 * @returns {string[]} 警告メッセージの配列（空なら問題なし）
 */
export function validateReceipt(receiptData, existingRecords) {
  const warnings = []

  // 負の金額チェック
  const negativeItems = (receiptData.items || []).filter((item) => item.price < 0)
  if (negativeItems.length > 0) {
    const names = negativeItems.map((i) => `「${i.name}」(¥${i.price})`).join('、')
    warnings.push(`金額が負の値の商品があります: ${names}`)
  }

  // 重複レシートチェック（同一日付 × 同一合計金額）
  const newTotal = receiptData.total ?? (receiptData.items || []).reduce((s, i) => s + i.price, 0)
  const newDate = receiptData.date ?? ''

  // 既存レコードをレシート単位でグループ化して合計を比較する
  // レコードのidは "{timestamp}-{index}" 形式なのでタイムスタンプ部分でグループ化する
  const receiptGroups = {}
  for (const r of existingRecords) {
    const groupKey = r.id.split('-')[0]
    if (!receiptGroups[groupKey]) {
      receiptGroups[groupKey] = { date: r.date, total: 0 }
    }
    receiptGroups[groupKey].total += r.price || 0
  }

  const isDuplicate = Object.values(receiptGroups).some(
    (g) => g.date === newDate && Math.round(g.total) === Math.round(newTotal)
  )

  if (isDuplicate) {
    warnings.push(
      `同じ日付（${newDate}）・合計金額（¥${newTotal.toLocaleString()}）のレシートが既に登録されています`
    )
  }

  return warnings
}
