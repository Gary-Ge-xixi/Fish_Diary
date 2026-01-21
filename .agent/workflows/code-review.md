---
description: Perform a high-signal code review on local changes or a GitHub Pull Request.
---
# /code-review [PR_NUMBER]

A unified, high-signal code review workflow that detects context automatically. If a PR number is provided, it reviews the PR; otherwise, it reviews local changes.

## 🎯 Standards (High Signal Only)
Follow [/Users/wanshuiwanqigaozhishang/.gemini/antigravity/workflows/review-standards.md](file:///Users/wanshuiwanqigaozhishang/.gemini/antigravity/workflows/review-standards.md):
- **Bugs & Logic**: Objective crashes or errors in new code.
- **Security**: Vulnerabilities (Injection, Auth, etc.).
- **Gemini.md Audit**: Strict adherence to project-specific rules.
- **Ignore**: Style nits, pre-existing issues, and linter noise.

## 🛠 Steps

1.  **Context Detection**:
    -   **If PR provided**: Run `gh pr view [PR_NUMBER]` and `gh pr diff [PR_NUMBER]`. Check if it's a draft or already reviewed.
    -   **If local**: Identify changed files in the current workspace and relevant `Gemini.md` files.

2.  **Audit**:
    -   Scan for **Bugs**, **Security**, and **Gemini.md** violations.
    -   Validate every finding to ensure it is "High Signal."

3.  **Reporting**:
    -   **For PRs**: Use `gh pr review` to post inline comments or `gh pr comment` for a summary.
    -   **For Local**: Provide a concise list of issues with line citations.
    -   **Suggestions**: Use `suggestion` blocks for small fixes (< 6 lines) or copyable prompts for complex ones.

If no issues are found, conclude with:
"✅ No high-signal issues found. Checked for bugs and Gemini.md compliance."