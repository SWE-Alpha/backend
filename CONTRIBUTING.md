## 📛 Branch Naming Convention

Follow this format: `<name>-<branchtype>-<task>`

Examples:
- manuel-feature-dashboard
- cyril-bugfix-login-error
- yaro-refactor-database-models

Branch types:
- `feature` – New features
- `bugfix` – Bug fixes
- `hotfix` – Urgent production fixes
- `refactor` – Code clean-up
- `chore` – Maintenance tasks
- `test` – Testing work

✅ Use lowercase, hyphens, and clear names.  
🚫 Avoid vague or temporary names like `final-version`, `temp-branch`, or `new-branch`.

## 🔁 Pull Request Guidelines

- **Base Branch**: Always open pull requests into the `dev` branch, not `main`.
- **Branch Format**: Follow the naming convention `<name>-<type>-<task>` (e.g., kwame-feature-login-form).
- **Small and Focused**: PRs should be focused on one task or feature. Avoid bundling unrelated changes.
- **Descriptive Title**: Use a meaningful PR title (e.g., `Add login page with validation`).
  
- **PR Description**:
  - Briefly describe what the PR does.
  - Link related issue(s) (e.g., `Fixes #12`).
    
- **Checklist**:
  - [ ] Code is tested
  - [ ] PR passes CI checks
  - [ ] Reviewer added
      
- **Code Review**: At least one teammate must approve before merging.
- **Merging**: Only merge once all checks pass and review is complete.
