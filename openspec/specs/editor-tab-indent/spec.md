## Purpose

Adds Tab key indentation support across all editor modes (Source, Rich, and Checklist textarea), preventing default browser focus navigation and enabling proper code/text indentation within editors.

## Requirements

### Requirement: Source mode supports Tab key indentation

Source 編輯模式 SHALL 攔截 Tab 鍵事件，在游標所在行的行首插入 2 個空格作為縮排。Shift+Tab SHALL 移除行首最多 2 個前導空格作為取消縮排。

#### Scenario: Tab inserts 2 spaces at line start

- **WHEN** 游標位於 Source 模式某一行的任意位置，使用者按下 Tab
- **THEN** 該行行首 SHALL 被插入 2 個空格，游標位置 SHALL 向右位移 2

#### Scenario: Shift+Tab removes up to 2 leading spaces

- **WHEN** 游標位於 Source 模式某一行，該行以 2 個以上空格開頭，使用者按下 Shift+Tab
- **THEN** 該行行首 SHALL 被移除 2 個空格，游標位置 SHALL 向左位移 2

#### Scenario: Shift+Tab removes 1 space when only 1 leading space exists

- **WHEN** 游標位於 Source 模式某一行，該行僅以 1 個空格開頭，使用者按下 Shift+Tab
- **THEN** 該行行首 SHALL 被移除 1 個空格，游標位置 SHALL 向左位移 1

#### Scenario: Shift+Tab is no-op when no leading spaces

- **WHEN** 游標位於 Source 模式某一行，該行無前導空格，使用者按下 Shift+Tab
- **THEN** 行內容 SHALL 不變，游標位置 SHALL 不變

#### Scenario: Multi-line selection indents all selected lines

- **WHEN** 使用者在 Source 模式中選取跨越多行的文字範圍，按下 Tab
- **THEN** 所有被選取涵蓋的行 SHALL 各自在行首插入 2 個空格

#### Scenario: Multi-line selection outdents all selected lines

- **WHEN** 使用者在 Source 模式中選取跨越多行的文字範圍，按下 Shift+Tab
- **THEN** 所有被選取涵蓋的行 SHALL 各自移除行首最多 2 個前導空格

#### Scenario: Tab on empty line inserts spaces

- **WHEN** 游標位於 Source 模式的空行，使用者按下 Tab
- **THEN** 該行 SHALL 變為包含 2 個空格的行

### Requirement: Rich mode supports Tab key indentation

Rich 編輯模式 SHALL 攔截 Tab 鍵事件，對當前 block 元素執行 indent 操作。Shift+Tab SHALL 執行 outdent 操作。

#### Scenario: Tab indents a paragraph block

- **WHEN** 游標位於 Rich 模式的某個段落中，使用者按下 Tab
- **THEN** 該段落 SHALL 增加一層縮排

#### Scenario: Tab nests a list item

- **WHEN** 游標位於 Rich 模式的列表項目中，使用者按下 Tab
- **THEN** 該列表項目 SHALL 成為上一個項目的巢狀子項目

#### Scenario: Shift+Tab outdents a paragraph block

- **WHEN** 游標位於 Rich 模式的已縮排段落中，使用者按下 Shift+Tab
- **THEN** 該段落 SHALL 減少一層縮排

#### Scenario: Shift+Tab unnests a list item

- **WHEN** 游標位於 Rich 模式的巢狀列表項目中，使用者按下 Shift+Tab
- **THEN** 該列表項目 SHALL 提升至上一層級

#### Scenario: Shift+Tab is no-op at zero indent

- **WHEN** 游標位於 Rich 模式的段落中且縮排為 0，使用者按下 Shift+Tab
- **THEN** 該段落 SHALL 不變

### Requirement: Checklist textarea supports Tab key indentation

ChecklistMarkdownEditor 的 textarea SHALL 攔截 Tab 鍵事件，在游標所在行的行首插入 2 個空格。Shift+Tab SHALL 移除行首最多 2 個前導空格。

#### Scenario: Tab inserts 2 spaces at line start in textarea

- **WHEN** 游標位於 Checklist textarea 某一行的任意位置，使用者按下 Tab
- **THEN** 該行行首 SHALL 被插入 2 個空格，游標位置 SHALL 向右位移 2

#### Scenario: Shift+Tab removes leading spaces in textarea

- **WHEN** 游標位於 Checklist textarea 某一行，該行以 2 個以上空格開頭，使用者按下 Shift+Tab
- **THEN** 該行行首 SHALL 被移除 2 個空格，游標位置 SHALL 向左位移 2

#### Scenario: Multi-line selection indent in textarea

- **WHEN** 使用者在 Checklist textarea 中選取跨越多行的文字範圍，按下 Tab
- **THEN** 所有被選取涵蓋的行 SHALL 各自在行首插入 2 個空格

### Requirement: Tab key does not trigger editor blur

在所有編輯器模式中，按下 Tab 或 Shift+Tab SHALL 不觸發 blur 事件，編輯器 SHALL 維持焦點狀態。

#### Scenario: Tab does not blur editor

- **WHEN** 使用者在任何編輯器模式中按下 Tab
- **THEN** 編輯器 SHALL 保持焦點，onBlur SHALL 不被觸發

#### Scenario: Shift+Tab does not blur editor

- **WHEN** 使用者在任何編輯器模式中按下 Shift+Tab
- **THEN** 編輯器 SHALL 保持焦點，onBlur SHALL 不被觸發
