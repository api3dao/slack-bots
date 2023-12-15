// Global variables
var TOKEN = "YOUR_TOKEN";
var TIME_OFF_CHANNEL_ID = "YOUR_CHANNEL_ID";
var WEEKLY_ROTATION_CHANNEL = "#technical-weekly-rotations";
var signersList = ["SIGNER_1", "SIGNER_1", ... , "SIGNER_N"];


function selectWeeklySigners() {
  var currentWeekNumber = getCurrentWeekNumber();
  var unavailableSigners = getUnavailableSigners();
  var weeklySigners = getWeeklySigners(currentWeekNumber, unavailableSigners);

  Logger.log("Selected Weekly Signers: " + JSON.stringify(weeklySigners));

  if (Array.isArray(weeklySigners) && weeklySigners.length > 0) {
    postSignersToSlack(weeklySigners, WEEKLY_ROTATION_CHANNEL);
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

function getUnavailableSigners() {
  var timeOffMessage = getLastBotMessage(TIME_OFF_CHANNEL_ID);
  // Extract names of unavailable signers from the message
  var unavailableSigners = []; // Extract names from timeOffMessage
  return unavailableSigners;
}

function getWeeklySigners(weekNumber, unavailableSigners) {
  var offset = (weekNumber - 1) % signersList.length;
  var selectedSigners = [];
  var count = 0;

  while (selectedSigners.length < 4) {
    var signer = signersList[(offset + count) % signersList.length];
    if (!unavailableSigners.includes(signer)) {
      selectedSigners.push(signer);
    }
    count++;
  }
  Logger.log(selectedSigners); 
  return selectedSigners;
}

function postSignersToSlack(signers, channel) {
  // Ensure that 'signers' is a non-empty array
  if (!Array.isArray(signers) || signers.length === 0) {
    Logger.log("No signers to post or invalid signers list: " + JSON.stringify(signers));
    return;
  }

  var message = "Weekly Signers: " + signers.join(", ");
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
      if (message.bot_id) { // bot messages object will have bot_id field
        return message.text;
      }
    }
  } else {
    Logger.log("Error fetching Slack history: " + jsonResponse.error);
    return null;
  }
}


// Example usage
selectWeeklySigners();
