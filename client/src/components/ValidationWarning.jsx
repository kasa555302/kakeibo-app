/**
 * バリデーション警告ダイアログ
 * 警告内容を表示し、登録を続行するか中止するかユーザーに選択させる
 */
export default function ValidationWarning({ warnings, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3 className="modal-title">⚠️ 登録前の確認</h3>
        <ul className="warning-list">
          {warnings.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
        <p className="modal-question">このまま登録しますか？</p>
        <div className="modal-actions">
          <button className="btn btn-danger" onClick={onCancel}>
            キャンセル
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            それでも登録する
          </button>
        </div>
      </div>
    </div>
  )
}
