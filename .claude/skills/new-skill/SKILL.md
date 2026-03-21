---
name: new-skill
description: Create a new Claude Code skill with consistent structure and quality. Guides through design, writes the SKILL.md file, and optionally registers it.
license: MIT
metadata:
  author: pinflow
  version: "1.0"
---

建立一個新的 Claude Code skill，確保結構一致、品質穩定。

---

## 觸發時機

當使用者想要建立新的 skill 時觸發。使用者可能會說：
- 「建一個新 skill」
- 「我想做一個 skill 來做 X」
- `/new-skill`
- `/new-skill <skill-name>`

---

## 步驟

### 1. 收集資訊

若使用者尚未提供足夠資訊，使用 **AskUserQuestion** 依序釐清以下內容（已知的就跳過）：

| 項目 | 說明 | 範例 |
|------|------|------|
| **name** | kebab-case，英文 | `code-review-fe`, `gen-api-test` |
| **description** | 一句話描述，英文，說明用途與觸發時機 | `Review frontend code changes for quality and patterns.` |
| **目的** | 這個 skill 要解決什麼問題？ | 「每次寫完 API 都要手動寫測試很煩」 |
| **觸發情境** | 什麼時候會用到？ | 「新增或修改 handler 之後」 |
| **輸入** | 使用者會提供什麼？ | 檔案路徑、功能描述、PR 連結 |
| **輸出** | 期望產出什麼？ | 程式碼檔案、審查報告、摘要 |
| **限制** | 有什麼不該做的？ | 不要修改既有測試、不要動 config |

一次問一到兩個問題，不要一次全問。根據使用者回答自然地追問。

### 2. 設計 Skill 結構

根據收集到的資訊，在腦中規劃 SKILL.md 的結構：

```
---
frontmatter（name, description, license, metadata）
---

一句話摘要

---

## 觸發時機（選填，若 description 不夠清楚時加入）

## 輸入
描述使用者需要提供什麼

## 步驟
1. 第一步
2. 第二步
   - 子步驟
3. ...

## 輸出格式
描述產出的結構與格式

## 護欄（Guardrails）
- 不該做的事
- 邊界條件處理
```

### 3. 撰寫 SKILL.md

**遵守以下撰寫規範：**

#### Frontmatter 規範
```yaml
---
name: <kebab-case，英文>
description: <一句話，英文，明確說明用途與觸發時機>
license: MIT
metadata:
  author: <專案名稱或作者>
  version: "1.0"
---
```

- `name`：必須是 kebab-case 英文，簡潔明瞭
- `description`：必須是英文，一句話，包含「做什麼」與「何時用」
  - 好的：`Generate integration tests for Go API handlers. Use after adding or modifying a handler.`
  - 不好的：`A skill for tests`（太模糊）、`產生測試`（不是英文）

#### 內文規範
- **全部使用繁體中文撰寫**（frontmatter 的 name 和 description 除外）
- 使用 Markdown 格式，結構清晰
- 步驟要具體可執行，不要模糊的指示
- 包含具體的工具使用指引（該用哪個 tool、該跑什麼指令）
- 若有程式碼範例，程式碼本身用原始語言（英文變數名等），註解可用中文

#### 內容品質規範
- **步驟必須可執行**：每一步都要明確到 Claude 可以直接執行，不需猜測
- **包含具體範例**：用 code block 展示指令、輸出格式、檔案結構
- **定義邊界**：明確寫出「不該做什麼」（Guardrails 區塊）
- **處理模糊輸入**：當使用者給的資訊不足時，skill 要指示用 AskUserQuestion 釐清
- **冪等性**：重複執行不應造成破壞（例如：先檢查檔案是否存在再建立）

#### 風格指引
- 開頭一句話摘要，讓人快速理解這個 skill 做什麼
- 步驟用數字編號，子步驟用字母或縮排
- 用表格呈現對照資訊（如：輸入欄位、選項比較）
- 用 code block 呈現指令、檔案路徑、輸出範例
- 護欄（Guardrails）放最後，用條列式

### 4. 寫入檔案

將 SKILL.md 寫入 `.claude/skills/<name>/SKILL.md`。

```
.claude/skills/<name>/SKILL.md
```

### 5. 確認與調整

向使用者展示建立好的 skill 摘要：

```
已建立 skill: <name>
位置: .claude/skills/<name>/SKILL.md
用途: <一句話描述>

你可以用 /<name> 來觸發這個 skill。
要調整內容嗎？
```

---

## 輸出

- 一個完整的 `.claude/skills/<name>/SKILL.md` 檔案
- 遵循上述所有規範

---

## 護欄

- **不要跳過資訊收集**：即使使用者說「幫我建一個 skill」也要先問清楚用途
- **不要用中文寫 name 或 description**：這兩個欄位必須是英文
- **不要用英文寫內文**：除了 frontmatter，其餘一律繁體中文
- **不要建立空殼 skill**：每個 skill 都必須有具體可執行的步驟
- **不要過度設計**：skill 應該專注做一件事，做好做滿
- **不要重複既有 skill**：建立前先用 `Glob` 檢查 `.claude/skills/` 下是否已有類似功能的 skill
- **檔案已存在時要詢問**：若目標路徑已有 SKILL.md，先問使用者要覆蓋還是換名
