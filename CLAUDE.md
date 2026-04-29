# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

レシート読み込み家計簿アプリ。レシート画像をアップロードするとClaude AIが自動解析し、カテゴリ分類・グラフ表示・ローカルストレージ保存を行う。

## Architecture

```
kakeibo-app/
├── server/          # Node.js + Express バックエンド
│   └── index.js     # Claude API呼び出しエンドポイント（/api/parse-receipt）
└── client/          # React + Vite フロントエンド
    └── src/
        ├── App.jsx                    # ルートコンポーネント・状態管理
        ├── components/
        │   ├── UploadSection.jsx      # 画像アップロード・API呼び出し
        │   ├── RecordsTable.jsx       # 明細一覧・月フィルタ・削除
        │   └── Charts.jsx             # 円グラフ（カテゴリ別）・棒グラフ（月別）
        └── utils/
            ├── storage.js             # ローカルストレージCRUD
            └── categories.js         # カテゴリ定義・集計ロジック
```

**データフロー**: 画像アップロード → `/api/parse-receipt`（サーバー）→ Claude Haiku → JSONレスポンス → `storage.js`でローカルストレージに保存 → Reactステートを更新してUI再描画

## Development

**前提**: `.env`をプロジェクトルートに作成する

```
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
```

**サーバー起動**（ポート3001）:
```bash
cd server && npm install && npm run dev
```

**フロントエンド起動**（ポート5173）:
```bash
cd client && npm install && npm run dev
```

両方を同時に起動する。ViteはAPIリクエストを`localhost:3001`へプロキシする（`vite.config.js`参照）。

## Claude API

- モデル: `claude-haiku-4-5-20251001`
- 画像はbase64エンコードしてmessages APIに渡す
- レスポンスは純粋なJSONを要求し、パース失敗時は正規表現でJSONブロックを抽出するフォールバックあり

## カテゴリ

`categories.js`で定義: 食費 / 日用品 / 外食 / 交通費 / 娯楽 / 医療 / 衣類 / その他

## Git Workflow

**コードを変更するたびに、コミットしてGitHubにプッシュする。**

```bash
git add <変更ファイル>
git commit -m "concise description of change"
git push origin main
```

- `.env`は`.gitignore`で除外済み。絶対にコミットしない
- `node_modules/`も除外済み
- `main`ブランチへのforce pushは禁止
