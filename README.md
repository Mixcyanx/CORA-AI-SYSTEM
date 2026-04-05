# CORA AI 藥物解說系統 (CORA AI Medication Explainer)

這是一個基於 React 和 Google Gemini API 的 2D AI 藥物解說互動系統。使用者可以透過自然語言詢問藥物資訊，由 2D 虛擬角色 Cora 進行語音與視覺化解說。

## 功能特點

- **2D 互動角色**：具備眨眼、說話口型同步與表情變化。
- **AI 藥物解說**：使用 Google Gemini API 提供專業的藥物資訊（成分、適應症、副作用等）。
- **語音合成 (TTS)**：Cora 會同步播放語音回答。
- **語音辨識**：支援語音輸入問題。
- **響應式設計**：支援手機與桌面版，具備深色/淺色模式切換。

## 技術棧

- **前端**：React 19, Vite, Tailwind CSS 4
- **動畫**：Framer Motion (motion/react)
- **AI**：Google GenAI SDK (Gemini 3 Flash)
- **語音**：Web Audio API, Web Speech API

## 如何運行

1. 安裝依賴：
   ```bash
   npm install
   ```

2. 設定環境變數：
   在 `.env` 檔案中加入您的 Gemini API Key：
   ```env
   GEMINI_API_KEY=您的金鑰
   ```

3. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

## 檔案結構說明

- `src/App.tsx`: 主要應用程式邏輯與 UI。
- `src/components/Character2D.tsx`: 2D 角色渲染與動畫邏輯。
- `src/gemini.ts`: 與 Gemini API 互動的服務。
- `src/index.css`: 全域樣式與 Tailwind 配置。
- `package.json`: 專案依賴與腳本。
