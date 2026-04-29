import express from 'express'
import cors from 'cors'
import multer, { memoryStorage } from 'multer'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') })

const app = express()
const PORT = process.env.PORT || 3001

// メモリ上で画像を保持する（ディスク保存なし）
const upload = multer({
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 最大10MB
})

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// レシート画像を解析するエンドポイント
app.post('/api/parse-receipt', upload.single('receipt'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '画像ファイルが必要です' })
  }

  // 画像をbase64に変換
  const base64Image = req.file.buffer.toString('base64')
  const mediaType = req.file.mimetype

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Image },
            },
            {
              type: 'text',
              text: `このレシート画像を解析して、以下のJSON形式で返してください。コードブロックなしで純粋なJSONのみ返してください。

{
  "date": "YYYY-MM-DD形式の購入日（不明な場合は今日の日付）",
  "storeName": "店舗名",
  "items": [
    {
      "name": "商品名",
      "price": 金額（数値）,
      "category": "カテゴリ（食費/日用品/外食/交通費/娯楽/医療/衣類/その他 のいずれか）"
    }
  ],
  "total": 合計金額（数値）
}

レシートに記載されているすべての商品を抽出し、カテゴリを自動判定してください。`,
            },
          ],
        },
      ],
    })

    const text = message.content[0].text.trim()

    // JSONをパース
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      // JSONブロックが含まれる場合は抽出を試みる
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        parsed = JSON.parse(match[0])
      } else {
        throw new Error('レスポンスのJSONパースに失敗しました')
      }
    }

    res.json(parsed)
  } catch (error) {
    console.error('Claude API エラー:', error)
    res.status(500).json({ error: 'レシートの解析に失敗しました: ' + error.message })
  }
})

app.listen(PORT, () => {
  console.log(`サーバー起動中: http://localhost:${PORT}`)
})
