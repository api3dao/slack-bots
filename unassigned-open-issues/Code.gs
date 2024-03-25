const orgName = "api3dao"; // Replace with your organization's name
const githubApiUrl = `https://api.github.com/search/issues?q=org:${orgName}+is:issue+is:open+no:project`;
const githubPAT = "github_pat_token"; // Replace with your GitHub PAT that has 'repo' scope for accessing public and private repositories
const slackChannel = "YOUR_CHANNEL_ID"; // channel ID is accessible from the channel details window
const slackBotToken = "YOUR_TOKEN"; // Replace with your Slack bot token

// Replace "YOUR_SPREADSHEET_ID" with the actual ID of your Google Spreadsheet.
// This spreadsheet should contain the mapping of GitHub repository names to Slack user IDs for code owners and dependency owners.
// Ensure that column F contains the word "yes" (case insensitive) for active boards.
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID";
// Replace "YOUR_SHEET_NAME" with the name of the specific sheet within the spreadsheet
// that holds the repository to Slack user ID mappings and the active status in column F.
const SHEET_NAME = "YOUR_SHEET_NAME";

function fetchOwnerData() {
  var sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  var range = sheet.getDataRange();
  var values = range.getValues();
  var ownerMap = new Map();

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var repository = row[0];
    // Assume 'yes' means active. If column F is empty or anything other than 'yes', consider it inactive.
    var isActive = row[5] && row[5].toLowerCase() === "yes";
    var slackIds = isActive
      ? row
          .slice(3, 5)
          .filter((id) => id !== "")
          .map((id) => `<@${id}>`)
          .join(" ")
      : "";
    // Store both slackIds and isActive flag
    ownerMap.set(repository, { slackIds, isActive });
  }
  return ownerMap;
}

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

  let allIssues = [];
  let page = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const pagedUrl = apiUrl + "&page=" + page;
    const response = UrlFetchApp.fetch(pagedUrl, { headers: headers });
    const jsonResponse = JSON.parse(response.getContentText());

    if (jsonResponse.items && jsonResponse.items.length > 0) {
      allIssues = allIssues.concat(jsonResponse.items);
    } else {
      hasMorePages = false;
    }
    page++;
  }

  return allIssues;
}

function formatSlackMessage(issues) {
  let repoIssuesMap = new Map();
  const ownerMap = fetchOwnerData(); // Fetch the owner data

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
    const ownerData = ownerMap.get(repoName) || {
      slackIds: "",
      isActive: false,
    };
    // Check if the board is active, and prepend owner tags if it is
    const ownersTag = ownerData.isActive ? ownerData.slackIds : "";
    message += `${ownersTag} There are ${issues.length} open issues in the ${repoName} repository:\n`;
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
