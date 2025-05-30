# コミットフィードバック機能

この機能は、Claude Codeがタスクを完了した後に、関連するコミットハッシュをGitHubコメントに自動的に追加します。

## 機能概要

- コミット完了後、最新のコミット情報（最大5件）をGitHubコメントに追加
- コミットハッシュ、メッセージ、作成者、日付を表示
- 各コミットへの直接リンクを提供
- 既存のコメント内容を保持しながら、コミット情報のみを更新

## 実装詳細

### 主要ファイル

1. **`src/github/operations/commit-feedback.ts`**
   - コミット情報の取得とフォーマット機能
   - `getLatestCommits()`: 最新のコミット情報を取得
   - `formatCommitFeedback()`: コミット情報を日本語でフォーマット
   - `addCommitFeedbackToComment()`: コメントにコミット情報を追加

2. **`src/entrypoints/add-commit-feedback.ts`**
   - コミットフィードバック機能のエントリーポイント
   - GitHub APIを使用してコメントを更新

3. **`src/github/operations/comment-logic.ts`**
   - 既存のコメント更新ロジックにコミットフィードバック対応を追加

### GitHub Actionワークフロー統合

`action.yml`に以下のステップが追加されています：

```yaml
- name: Add commit feedback to comment
  if: steps.prepare.outputs.contains_trigger == 'true' && steps.prepare.outputs.claude_comment_id && steps.claude-code.outputs.conclusion == 'success'
  shell: bash
  run: |
    bun run ${{ github.action_path }}/src/entrypoints/add-commit-feedback.ts
  env:
    CLAUDE_COMMENT_ID: ${{ steps.prepare.outputs.claude_comment_id }}
    BRANCH_NAME: ${{ steps.prepare.outputs.CLAUDE_BRANCH }}
    GITHUB_TOKEN: ${{ steps.prepare.outputs.GITHUB_TOKEN }}
    GITHUB_RUN_ID: ${{ github.run_id }}
```

## 使用方法

この機能は自動的に動作します。Claude Codeがタスクを正常に完了すると：

1. 指定されたブランチ（または現在のブランチ）から最新のコミットを取得
2. コミット情報を日本語でフォーマット
3. 既存のGitHubコメントにコミット情報を追加

## コメント表示例

```markdown
**Claude finished @username's task in 2m 30s** —— [View job](https://github.com/owner/repo/actions/runs/123) • [`branch-name`](https://github.com/owner/repo/tree/branch-name)

---

元のタスク内容...

**最新のコミット:**
• [`abc123d`](https://github.com/owner/repo/commit/abc123def456) feat: add new feature - Test User (2023/12/1)
• [`def456g`](https://github.com/owner/repo/commit/def456ghi789) fix: resolve bug - Another User (2023/12/1)
```

## 環境変数

- `CLAUDE_COMMENT_ID`: 更新対象のコメントID
- `BRANCH_NAME`: コミット情報を取得するブランチ名（オプション）
- `GITHUB_TOKEN`: GitHub API認証トークン
- `GITHUB_RUN_ID`: GitHub Actions実行ID

## エラーハンドリング

- GitHub API呼び出しが失敗した場合、エラーログを出力して処理を継続
- コミット情報が取得できない場合、空の配列を返して処理を継続
- コメントIDが提供されない場合、処理をスキップ

## テスト

`test/commit-feedback.test.ts`にユニットテストが含まれています：

- コミット情報の取得とフォーマット
- APIエラー時の適切な処理
- 空のコミットリストの処理

## 今後の拡張可能性

- コミット表示件数の設定可能化
- コミットメッセージのフィルタリング
- 特定のファイル変更に関連するコミットのみ表示
- コミット統計情報の追加