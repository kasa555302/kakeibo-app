import { useState, useRef } from 'react'

/**
 * レシート画像のアップロード・解析UIコンポーネント
 */
export default function UploadSection({ onAdd }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  // ファイル選択時の処理
  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setError(null)
    setPreview(URL.createObjectURL(f))
  }

  const handleChange = (e) => handleFile(e.target.files[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  // Claude APIでレシートを解析する
  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('receipt', file)

    try {
      const res = await fetch('/api/parse-receipt', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'サーバーエラー')
      }
      const data = await res.json()
      onAdd(data)
      // アップロードエリアをリセット
      setFile(null)
      setPreview(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="upload-section">
      <h2>📷 レシートをアップロード</h2>

      {/* ドラッグ&ドロップエリア */}
      <div
        className={`upload-area ${dragging ? 'dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} />
        <div className="upload-icon">🧾</div>
        <p>クリックまたはドラッグ＆ドロップで画像を選択</p>
        <p className="hint">JPEG / PNG / WEBP（最大10MB）</p>
      </div>

      {/* プレビューと解析ボタン */}
      {preview && (
        <div className="preview-wrap">
          <img src={preview} alt="レシートプレビュー" />
          <div className="preview-info">
            <p>📄 {file?.name}</p>
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
              {loading ? '解析中...' : '🔍 AI解析する'}
            </button>
          </div>
        </div>
      )}

      {loading && <p className="loading">⏳ Claude AIがレシートを読み取っています...</p>}
      {error && <p className="error-msg">⚠️ {error}</p>}
    </section>
  )
}
