import type { Octokits } from "../api/client";
import { GITHUB_SERVER_URL } from "../api/config";
import type { ParsedGitHubContext } from "../context";

export type CommitInfo = {
  sha: string;
  message: string;
  author: string;
  timestamp: string;
  url: string;
};

export async function getLatestCommits(
  octokit: Octokits,
  context: ParsedGitHubContext,
  branchName?: string,
  limit: number = 5,
): Promise<CommitInfo[]> {
  const { owner, repo } = context.repository;

  try {
    const response = await octokit.rest.repos.listCommits({
      owner,
      repo,
      sha: branchName,
      per_page: limit,
    });

    return response.data.map((commit: any) => ({
      sha: commit.sha,
      message: commit.commit.message.split("\n")[0],
      author: commit.commit.author?.name || commit.author?.login || "Unknown",
      timestamp: commit.commit.author?.date || new Date().toISOString(),
      url: `${GITHUB_SERVER_URL}/${owner}/${repo}/commit/${commit.sha}`,
    }));
  } catch (error) {
    console.error("Error fetching commits:", error);
    return [];
  }
}

export function formatCommitFeedback(commits: CommitInfo[]): string {
  if (commits.length === 0) {
    return "";
  }

  const commitList = commits
    .map((commit) => {
      const shortSha = commit.sha.substring(0, 7);
      const date = new Date(commit.timestamp).toLocaleDateString("ja-JP");
      return `• [\`${shortSha}\`](${commit.url}) ${commit.message} - ${commit.author} (${date})`;
    })
    .join("\n");

  return `\n\n**最新のコミット:**\n${commitList}`;
}

export async function addCommitFeedbackToComment(
  octokit: Octokits,
  context: ParsedGitHubContext,
  commentId: number,
  currentBody: string,
  branchName?: string,
): Promise<void> {
  try {
    const commits = await getLatestCommits(octokit, context, branchName);

    if (commits.length === 0) {
      return;
    }

    const commitFeedback = formatCommitFeedback(commits);

    const existingCommitSection = currentBody.match(
      /\n\n\*\*最新のコミット:\*\*\n[\s\S]*$/,
    );
    let updatedBody: string;

    if (existingCommitSection) {
      updatedBody = currentBody.replace(
        existingCommitSection[0],
        commitFeedback,
      );
    } else {
      updatedBody = currentBody + commitFeedback;
    }

    const { owner, repo } = context.repository;

    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: commentId,
      body: updatedBody,
    });

    console.log(
      `✅ Updated comment with commit feedback: ${commits.length} commits`,
    );
  } catch (error) {
    console.error("Error adding commit feedback to comment:", error);
  }
}
