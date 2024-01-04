// Global variables
var TOKEN = "YOUR_TOKEN";
var TIME_OFF_CHANNEL_ID = "YOUR_CHANNEL_ID";
var WEEKLY_ROTATION_CHANNEL = "#technical-weekly-rotations";
var SPREADSHEET_ID = "YOUR_SPREADSHEET_ID";
var SIGNERS_SHEET_NAME = "Signers";
var TIME_OFF_SHEET_NAME = "Instructions";

function fetchSignersFromSheet() {
  var sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SIGNERS_SHEET_NAME);
  var range = sheet.getRange("B2:D"); // Assuming names in column B, signers status in column C, and Slack IDs in column D
  var values = range.getValues();
  var signers = [];

  for (var i = 0; i < values.length; i++) {
    var name = values[i][0];
    var isSignerIndicator = values[i][1];
    var slackId = values[i][2]; // Slack ID

    if (isSignerIndicator === "yes" || isSignerIndicator === true) {
      signers.push({ name: name, slackId: slackId });
    }
  }
  return signers;
}

function getInitialWeeklySigners(weekNumber, unavailableSigners) {
  var signersList = fetchSignersFromSheet(); // Fetch signers from the sheet
  var offset = (weekNumber - 1) % signersList.length;
  var selectedSigners = [];
  var count = 0;

  while (selectedSigners.length < 4 && count < signersList.length) {
    var signer = signersList[(offset + count) % signersList.length];
    if (!unavailableSigners.includes(signer)) {
      selectedSigners.push(signer);
    }
    count++;
  }
  return selectedSigners;
}

function findReplacementSigners(
  currentSigners,
  allSigners,
  unavailableSigners
) {
  var updatedSigners = currentSigners.filter(
    (signer) => !unavailableSigners.includes(signer)
  );
  var count = updatedSigners.length;
  var offset = 0; // Initialize offset for finding replacements

  while (count < 4) {
    var potentialSigner = allSigners[offset++];
    if (
      !updatedSigners.includes(potentialSigner) &&
      !unavailableSigners.includes(potentialSigner)
    ) {
      updatedSigners.push(potentialSigner);
      count++;
    }
  }
  return updatedSigners;
}

function updateDailySigners() {
  var currentWeekNumber = getCurrentWeekNumber();
  var allSigners = fetchSignersFromSheet();
  var unavailableSigners = getUnavailableSigners();
  var currentSigners = getInitialWeeklySigners(
    currentWeekNumber,
    unavailableSigners
  );

  currentSigners = findReplacementSigners(
    currentSigners,
    allSigners,
    unavailableSigners
  );

  Logger.log("Daily Signers: " + JSON.stringify(currentSigners));

  if (Array.isArray(currentSigners) && currentSigners.length > 0) {
    postSignersToSlack(currentSigners, WEEKLY_ROTATION_CHANNEL);
  } else {
    Logger.log("No valid signers to post this week.");
  }
}

function getCurrentWeekNumber() {
  var now = new Date();
  var start = new Date(now.getFullYear(), 0, 1);
  var diff = now - start;
  var oneWeek = 604800000; // milliseconds in one week
  return Math.ceil(diff / oneWeek);
}

function parseDate(input) {
  if (input instanceof Date) {
    return input;
  } else {
    return new Date(input); // Input should be a date string
  }
}

function getUnavailableSigners() {
  var today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to start of today

  var sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TIME_OFF_SHEET_NAME);
  var lastRow = sheet.getLastRow();
  var timeOffData = sheet.getRange(2, 1, lastRow - 1, 3).getValues(); // Data starts from row 2

  var unavailableSigners = [];

  for (var i = 0; i < timeOffData.length; i++) {
    var person = timeOffData[i][0];
    var startDate = parseDate(timeOffData[i][1]);
    var endDate = parseDate(timeOffData[i][2]);
    endDate.setHours(23, 59, 59, 999); // Set end date to the end of the day

    if (startDate <= today && endDate >= today) {
      unavailableSigners.push(person);
    }
  }
  Logger.log("Unavailable signers:");
  Logger.log(unavailableSigners);
  return unavailableSigners;
}

function postSignersToSlack(signers, channel) {
  // Ensure that 'signers' is a non-empty array
  if (!Array.isArray(signers) || signers.length === 0) {
    Logger.log(
      "No signers to post or invalid signers list: " + JSON.stringify(signers)
    );
    return;
  }

  var message = "Daily Signers: ";
  message += signers
    .map((signer) => {
      if (signer.slackId) {
        // Only add tag if Slack ID is present
        return `<@${signer.slackId}>`;
      } else {
        // If Slack ID is missing, just show the name
        return signer.name;
      }
    })
    .join(", ");

  var apiUrl = "https://slack.com/api/chat.postMessage";
  var payload = {
    channel: channel,
    text: message,
    token: TOKEN,
  };

  var headers = {
    Authorization: "Bearer " + TOKEN,
    "Content-Type": "application/json",
  };

  var options = {
    method: "post",
    headers: headers,
    payload: JSON.stringify(payload),
  };

  var response = UrlFetchApp.fetch(apiUrl, options);
  var jsonResponse = JSON.parse(response.getContentText());

  if (!jsonResponse.ok) {
    Logger.log("Error posting to Slack: " + jsonResponse.error);
  }
}

function getLastBotMessage(channelId) {
  var apiUrl = `https://slack.com/api/conversations.history?channel=${channelId}`;
  var headers = {
    Authorization: "Bearer " + TOKEN,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  var options = {
    method: "get",
    headers: headers,
  };

  var response = UrlFetchApp.fetch(apiUrl, options);
  var jsonResponse = JSON.parse(response.getContentText());

  if (jsonResponse.ok) {
    for (var i = 0; i < jsonResponse.messages.length; i++) {
      var message = jsonResponse.messages[i];
      if (message.bot_id) {
        // bot messages object will have bot_id field
        return message.text;
      }
    }
  } else {
    Logger.log("Error fetching Slack history: " + jsonResponse.error);
    return null;
  }
}
