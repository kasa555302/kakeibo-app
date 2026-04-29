import { useState } from 'react'
import UploadSection from './components/UploadSection'
import RecordsTable from './components/RecordsTable'
import Charts from './components/Charts'
import { loadRecords, addReceipt, deleteRecord } from './utils/storage'

// 今月をデフォルトの絞り込み月として使う
function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export default function App() {
  // 初期値はローカルストレージから読み込む
  const [records, setRecords] = useState(() => loadRecords())
  const [selectedMonth, setSelectedMonth] = useState(currentMonth())

  // レシート解析後にレコードを追加する
  const handleAdd = (receiptData) => {
    setRecords((prev) => addReceipt(prev, receiptData))
  }

  // レコードを削除する
  const handleDelete = (id) => {
    setRecords((prev) => deleteRecord(prev, id))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧾 レシート読み込み家計簿</h1>
        <p>レシートをアップロードするとAIが自動で読み取って記録します</p>
      </header>

      {/* アップロードセクション */}
      <UploadSection onAdd={handleAdd} />

      {/* グラフセクション（データがある場合のみ表示） */}
      <Charts records={records} />

      {/* 明細一覧 */}
      <RecordsTable
        records={records}
        onDelete={handleDelete}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />
    </div>
  )
}
