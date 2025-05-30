import { describe, expect, it } from "bun:test";
import type { Octokits } from "../src/github/api/client";
import type { ParsedGitHubContext } from "../src/github/context";
import {
  formatCommitFeedback,
  getLatestCommits,
  type CommitInfo,
} from "../src/github/operations/commit-feedback";

const mockContext: ParsedGitHubContext = {
  runId: "123456789",
  eventName: "issue_comment",
  eventAction: "created",
  repository: {
    owner: "test-owner",
    repo: "test-repo",
    full_name: "test-owner/test-repo",
  },
  actor: "test-user",
  payload: {} as any,
  entityNumber: 1,
  isPR: false,
  inputs: {
    triggerPhrase: "@claude",
    assigneeTrigger: "",
    allowedTools: "",
    disallowedTools: "",
    customInstructions: "",
    directPrompt: "",
  },
};

const mockCommits = [
  {
    sha: "abc123def456",
    commit: {
      message: "feat: add new feature\n\nDetailed description",
      author: {
        name: "Test User",
        date: "2023-12-01T10:00:00Z",
      },
    },
    author: {
      login: "testuser",
    },
  },
  {
    sha: "def456ghi789",
    commit: {
      message: "fix: resolve bug",
      author: {
        name: "Another User",
        date: "2023-12-01T09:00:00Z",
      },
    },
    author: {
      login: "anotheruser",
    },
  },
];

const mockOctokit: Octokits = {
  rest: {
    repos: {
      listCommits: async () => ({
        data: mockCommits,
      }),
    },
  } as any,
  graphql: {} as any,
};

describe("Commit Feedback", () => {
  describe("getLatestCommits", () => {
    it("should fetch and format commits correctly", async () => {
      const commits = await getLatestCommits(
        mockOctokit,
        mockContext,
        "main",
        2,
      );

      expect(commits).toHaveLength(2);
      expect(commits[0]).toEqual({
        sha: "abc123def456",
        message: "feat: add new feature",
        author: "Test User",
        timestamp: "2023-12-01T10:00:00Z",
        url: "https://github.com/test-owner/test-repo/commit/abc123def456",
      });
      expect(commits[1]).toEqual({
        sha: "def456ghi789",
        message: "fix: resolve bug",
        author: "Another User",
        timestamp: "2023-12-01T09:00:00Z",
        url: "https://github.com/test-owner/test-repo/commit/def456ghi789",
      });
    });

    it("should handle API errors gracefully", async () => {
      const errorOctokit: Octokits = {
        rest: {
          repos: {
            listCommits: async () => {
              throw new Error("API Error");
            },
          },
        } as any,
        graphql: {} as any,
      };

      const commits = await getLatestCommits(errorOctokit, mockContext);
      expect(commits).toEqual([]);
    });
  });

  describe("formatCommitFeedback", () => {
    it("should format commits correctly", () => {
      const commits: CommitInfo[] = [
        {
          sha: "abc123def456",
          message: "feat: add new feature",
          author: "Test User",
          timestamp: "2023-12-01T10:00:00Z",
          url: "https://github.com/test-owner/test-repo/commit/abc123def456",
        },
        {
          sha: "def456ghi789",
          message: "fix: resolve bug",
          author: "Another User",
          timestamp: "2023-12-01T09:00:00Z",
          url: "https://github.com/test-owner/test-repo/commit/def456ghi789",
        },
      ];

      const feedback = formatCommitFeedback(commits);

      expect(feedback).toContain("**最新のコミット:**");
      expect(feedback).toContain("[`abc123d`]");
      expect(feedback).toContain("feat: add new feature");
      expect(feedback).toContain("Test User");
      expect(feedback).toContain("[`def456g`]");
      expect(feedback).toContain("fix: resolve bug");
      expect(feedback).toContain("Another User");
    });

    it("should return empty string for no commits", () => {
      const feedback = formatCommitFeedback([]);
      expect(feedback).toBe("");
    });
  });
});
