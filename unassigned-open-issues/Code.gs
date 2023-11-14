const orgName = "api3dao"; // Replace with your organization's name
const githubApiUrl = `https://api.github.com/search/issues?q=org:${orgName}+is:issue+is:open+no:project`;
const githubPAT = "github_pat_token"; // Replace with your GitHub PAT that has 'repo' scope for accessing public and private repositories
const slackChannel = "YOUR_CHANNEL_ID"; // channel ID is accessible from the channel details window
const slackBotToken = "YOUR_TOKEN"; // Replace with your Slack bot token

function fetchAndReportGitHubIssues() {
  // Fetch GitHub issues
  const issues = fetchGitHubIssues(githubApiUrl, githubPAT);

  // Prepare and post Slack message
  if (issues.length > 0) {
    const message = formatSlackMessage(issues);
    postToSlack(slackChannel, message, slackBotToken);
  } else {
    Logger.log("No unassigned issues found.");
  }
}

function fetchGitHubIssues(apiUrl, pat) {
  const headers = {
    Authorization: "token " + pat,
    Accept: "application/vnd.github.v3+json",
  };

  const response = UrlFetchApp.fetch(apiUrl, { headers: headers });
  const jsonResponse = JSON.parse(response.getContentText());

  return jsonResponse.items || [];
}

function formatSlackMessage(issues) {
  let repoIssuesMap = new Map();

  // Group issues by repository
  issues.forEach((issue) => {
    const repoName = issue.repository_url.split("/").pop();
    if (!repoIssuesMap.has(repoName)) {
      repoIssuesMap.set(repoName, []);
    }
    repoIssuesMap.get(repoName).push(issue);
  });

  // Format message for each repository
  let message = "Unassigned GitHub Issues Report:\n\n";
  repoIssuesMap.forEach((issues, repoName) => {
    message += `There are ${issues.length} open issues in the ${repoName} repository:\n`;
    issues.forEach((issue) => {
      message += `- <${issue.html_url}|${issue.title}>\n`;
    });
    message += "\n"; // Add a newline for spacing between repositories
  });

  return message;
}

function postToSlack(channel, message, token) {
  const payload = JSON.stringify({
    channel: channel,
    text: message,
  });

  const headers = {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  };

  const response = UrlFetchApp.fetch("https://slack.com/api/chat.postMessage", {
    method: "post",
    headers: headers,
    payload: payload,
  });

  const jsonResponse = JSON.parse(response.getContentText());
  if (!jsonResponse.ok) {
    Logger.log("Error posting to Slack: " + jsonResponse.error);
  }
}
