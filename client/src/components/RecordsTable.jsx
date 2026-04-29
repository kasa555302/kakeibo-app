import { CATEGORIES } from '../utils/categories'

/**
 * 家計簿明細一覧テーブルコンポーネント
 */
export default function RecordsTable({ records, onDelete, selectedMonth, onMonthChange }) {
  // 選択月でフィルタリング
  const filtered = selectedMonth
    ? records.filter((r) => r.date?.startsWith(selectedMonth))
    : records

  // 日付の新しい順に並べる
  const sorted = [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const totalAmount = sorted.reduce((sum, r) => sum + (r.price || 0), 0)

  return (
    <section className="records-section">
      <div className="records-header">
        <h2>📋 明細一覧</h2>
        <div className="month-filter">
          <label>月を絞り込む：</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
          />
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="empty-msg">まだデータがありません。レシートをアップロードして追加しましょう。</p>
      ) : (
        <>
          <table className="records-table">
            <thead>
              <tr>
                <th>日付</th>
                <th>店舗名</th>
                <th>商品名</th>
                <th>カテゴリ</th>
                <th>金額</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const cat = CATEGORIES[r.category] || CATEGORIES['その他']
                return (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{r.storeName || '—'}</td>
                    <td>{r.name}</td>
                    <td>
                      <span
                        className="category-badge"
                        style={{ background: cat.color }}
                      >
                        {cat.emoji} {r.category}
                      </span>
                    </td>
                    <td className="amount">¥{(r.price || 0).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => onDelete(r.id)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p style={{ textAlign: 'right', marginTop: 12, fontWeight: 700, color: '#2d6a4f' }}>
            合計：¥{totalAmount.toLocaleString()}
          </p>
        </>
      )}
    </section>
  )
}
