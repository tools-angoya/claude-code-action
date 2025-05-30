#!/usr/bin/env bun

import { createOctokit } from "../github/api/client";
import { parseGitHubContext } from "../github/context";
import { addCommitFeedbackToComment } from "../github/operations/commit-feedback";
import { setupGitHubToken } from "../github/token";

async function main() {
  try {
    const token = await setupGitHubToken();
    const octokit = createOctokit(token);
    const context = parseGitHubContext();

    const commentId = process.env.CLAUDE_COMMENT_ID;
    const branchName = process.env.BRANCH_NAME;

    if (!commentId) {
      console.log("No comment ID provided, skipping commit feedback");
      return;
    }

    console.log(`Adding commit feedback to comment ${commentId}`);

    const { owner, repo } = context.repository;

    const currentComment = await octokit.rest.issues.getComment({
      owner,
      repo,
      comment_id: parseInt(commentId),
    });

    await addCommitFeedbackToComment(
      octokit,
      context,
      parseInt(commentId),
      currentComment.data.body || "",
      branchName,
    );

    console.log("✅ Successfully added commit feedback to comment");
  } catch (error) {
    console.error("Error adding commit feedback:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}

export { main };
