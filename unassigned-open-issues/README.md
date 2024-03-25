# Unassigned Open Issues Bot for GitHub and Slack

This bot is designed to fetch unassigned open issues from all repositories within a specified GitHub organization and post a summary report to a designated Slack channel. It helps teams keep track of issues that are not yet assigned to any project.

## Overview

- The bot searches for open issues in the specified GitHub organization that have not been assigned to any project.
- It categorizes these issues by repository and compiles a report.
- The report is then posted daily to a designated Slack channel, providing a consolidated view of unassigned issues.
- The bot tags the dependencies and code owners in the Slack messages for each repository. This ensures that relevant team members are alerted directly in Slack, enhancing the visibility of unassigned open issues.

## How to Set Up

### 1. GitHub Personal Access Token (PAT)

- Create a PAT with 'repo' scope to access both public and private repositories within your organization.
- Store this token securely and use it in the script to authenticate GitHub API requests.

### 2. Slack Bot Token

- Create a Slack bot and generate a token with permissions to post messages to a channel.
- The required scope is typically `chat:write`.
- Store this token securely and use it in the script to authenticate Slack API requests.

### 3. Google Apps Script Setup

- Go to [Google Apps Script](https://script.google.com/) and create a new project.
- Paste the provided script into the editor.
- Replace `YOUR_CHANNEL_ID`, `YOUR_TOKEN`, and `github_pat_TOKEN` with your Slack channel ID, Slack bot token, and GitHub PAT, respectively.
- Save and name your project.

### 4. Time-Driven Trigger

- Set up a time-driven trigger in Google Apps Script to run the `fetchAndReportGitHubIssues` function daily.
- This ensures the bot posts the report to Slack at a consistent time each day.

### 5. Slack Channel Setup

- Ensure the bot is added to the intended Slack channel.
- The bot will post the report in this channel, so choose a channel that is appropriate for this type of notification.

## Conclusion

The `unassigned-open-issues` bot is a valuable tool for maintaining visibility of open issues that are not yet assigned to any project in your GitHub organization. By automating the reporting process, it assists teams in staying updated and ensures that no issue is overlooked.

## Troubleshooting

- Ensure that the GitHub PAT and Slack bot token are correctly set and have the necessary permissions.
- Check the execution logs in Google Apps Script for any errors or issues.
