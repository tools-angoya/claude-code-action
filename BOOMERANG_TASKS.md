# ブーメランタスク機能

ClaudeCodeActionにRooのブーメランタスク機能を実装しました。この機能により、特定のコマンドを使用してタスクを専門的なモードに委譲できます。

## 機能概要

ブーメランタスク機能は、コメント内で特定のコマンドを使用することで、タスクを適切なモードに自動的に委譲する機能です。

### サポートされているコマンド

- `/architect [タスク]` - アーキテクチャ設計モードに委譲
- `/debug [タスク]` - デバッグモードに委譲
- `/ask [タスク]` - 質問回答モードに委譲
- `/orchestrator [タスク]` - オーケストレーターモードに委譲
- `/code [タスク]` - コーディングモードに委譲

## 使用例

### アーキテクチャ設計の委譲
```
/architect システムの全体設計を見直して、マイクロサービス化の提案をしてください
```

### デバッグタスクの委譲
```
/debug このメモリリークの原因を特定して修正方法を提案してください
```

### 技術的質問の委譲
```
/ask TypeScriptの最新機能とベストプラクティスについて教えてください
```

### 複雑なタスクの調整
```
/orchestrator フロントエンド、バックエンド、データベースの更新を調整してください
```

### コード実装の委譲
```
/code ユーザー認証機能を実装してください
```

## 実装詳細

### 1. トリガー検出 (`claude-code-action`)

`src/github/validation/trigger.ts`でブーメランタスクのパターンを検出：

```typescript
const boomerangPatterns = [
  /\/architect\s+/i,
  /\/debug\s+/i,
  /\/ask\s+/i,
  /\/orchestrator\s+/i,
  /\/code\s+/i,
];
```

### 2. タスク処理 (`claude-code-base-action`)

`src/boomerang-task.ts`でブーメランタスクの検出と処理：

- `detectBoomerangTask()`: コンテンツからブーメランタスクを検出
- `createBoomerangTaskPrompt()`: 専用プロンプトを生成
- `processBoomerangTask()`: ブーメランタスクの全体処理

### 3. プロンプト準備

`src/prepare-prompt.ts`でブーメランタスク用のプロンプトを準備：

- 元のプロンプトを解析
- ブーメランタスクが検出された場合、専用プロンプトに変換
- 対象モードの情報を含むプロンプトを生成

### 4. 実行制御

`src/index.ts`でブーメランタスクの実行を制御：

- ブーメランタスクが検出された場合、`new_task`ツールを有効化
- 適切なツール設定でClaude実行

## 設定方法

### ワークフロー設定

```yaml
name: Claude Assistant with Boomerang Tasks
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  claude-response:
    runs-on: ubuntu-latest
    steps:
      - uses: Akira-Papa/claude-code-action@beta
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          trigger_phrase: "@claude"
          custom_instructions: |
            ブーメランタスク機能が有効です。
            /architect, /debug, /ask, /orchestrator, /code コマンドを使用できます。
```

## テスト

`test/boomerang-task.test.ts`で機能のテストを実装：

- 各モードのタスク検出テスト
- プロンプト生成テスト
- エラーハンドリングテスト

## 利点

1. **専門性**: 各モードに特化した処理が可能
2. **効率性**: 適切なモードに直接委譲することで処理効率が向上
3. **柔軟性**: 新しいモードの追加が容易
4. **一貫性**: Rooの既存機能との統合

## 今後の拡張

- カスタムモードの追加サポート
- タスク結果の自動統合
- 複数モードの連携処理
- タスク履歴の管理