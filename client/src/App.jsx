import { useState } from 'react'
import UploadSection from './components/UploadSection'
import RecordsTable from './components/RecordsTable'
import Charts from './components/Charts'
import ValidationWarning from './components/ValidationWarning'
import { loadRecords, addReceipt, deleteRecord } from './utils/storage'
import { validateReceipt } from './utils/validation'

// 今月をデフォルトの絞り込み月として使う
function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export default function App() {
  // 初期値はローカルストレージから読み込む
  const [records, setRecords] = useState(() => loadRecords())
  const [selectedMonth, setSelectedMonth] = useState(currentMonth())

  // 警告表示用ステート（nullなら非表示）
  const [pendingReceipt, setPendingReceipt] = useState(null)
  const [warnings, setWarnings] = useState([])

  // レシート解析後にバリデーションを実行する
  const handleAdd = (receiptData) => {
    const found = validateReceipt(receiptData, records)
    if (found.length > 0) {
      // 警告がある場合はユーザーに確認を求める
      setWarnings(found)
      setPendingReceipt(receiptData)
    } else {
      commitAdd(receiptData)
    }
  }

  // 警告を無視して登録を確定する
  const handleConfirm = () => {
    commitAdd(pendingReceipt)
    setPendingReceipt(null)
    setWarnings([])
  }

  // 警告ダイアログをキャンセルする（登録しない）
  const handleCancel = () => {
    setPendingReceipt(null)
    setWarnings([])
  }

  // 実際にレコードを追加する
  const commitAdd = (receiptData) => {
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

      {/* バリデーション警告ダイアログ */}
      {warnings.length > 0 && (
        <ValidationWarning
          warnings={warnings}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

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
