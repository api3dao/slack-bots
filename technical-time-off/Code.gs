// OAuth token from Slack and Slack channel name and channel ID
var TOKEN = "YOUR_TOKEN";
var CHANNEL = "#technical-time-off"; // channel ID
var CHANNEL_ID = "YOUR_CHANNEL_ID"; // channel ID is accessible from the channel details window
var SPREADSHEET_ID = "YOUR_SPREADSHEET_ID";
var SHEET_NAME = "Instructions";

function isDateInThisWeek(date) {
  var now = new Date();
  // Calculate the start (Monday) of the current week
  var startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)
  );
  // Calculate the end (Friday) of the current week
  var endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 4);
  return date >= startOfWeek && date <= endOfWeek;
}

function isDateInNextWeek(date) {
  var now = new Date();
  // Calculate the start (Monday) of the next week
  var startOfNextWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + (8 - (now.getDay() === 0 ? 7 : now.getDay()))
  );
  // Calculate the end (Friday) of the next week
  var endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 4);
  return date >= startOfNextWeek && date <= endOfNextWeek;
}

function parseDate(input) {
  if (input instanceof Date) {
    return input;
  } else {
    return new Date("Invalid Date");
  }
}

function formatDate(d) {
  return d.toDateString();
}

function getWeeksBetween(d1, d2) {
  // Calculate the weeks between two dates
  var oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  var diff = Math.abs(d2 - d1);
  return diff / oneWeek;
}

function getEndOfNextBusinessWeek() {
  var now = new Date();
  var endOfNextWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay() + 13
  ); // End of next week
  // Adjust to Friday if the end of the next week is a Saturday or Sunday
  if (endOfNextWeek.getDay() === 6) {
    // Saturday
    endOfNextWeek.setDate(endOfNextWeek.getDate() - 1);
  } else if (endOfNextWeek.getDay() === 0) {
    // Sunday
    endOfNextWeek.setDate(endOfNextWeek.getDate() - 2);
  }
  return endOfNextWeek;
}

function calculateAccumulatedTimeOff(timeOffData) {
  var accumulatedDaysOffByType = {};
  var currentYear = new Date().getFullYear();
  // Get the end of the next business week
  var endOfNextBusinessWeek = getEndOfNextBusinessWeek();

  function countWeekdaysBetweenDates(startDate, endDate) {
    var totalDays = 0;
    var currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // If the day is a working day (0 = Sunday, 6 = Saturday)
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        totalDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
    }
    return totalDays;
  }

  // Iterate through the timeOffData to calculate accumulated time off by type
  for (var i = 1; i < timeOffData.length; i++) {
    var person = timeOffData[i][0];
    var typeOfLeave = timeOffData[i][3];
    var startDate = parseDate(timeOffData[i][1]);
    var endDate = parseDate(timeOffData[i][2]);

    // Skip B/L type leaves
    if (typeOfLeave === "B/L") {
      continue;
    }

    // Check if the parsed dates are valid and from the current year
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      continue;
    }

    if (
      startDate.getFullYear() !== currentYear ||
      endDate.getFullYear() !== currentYear
    ) {
      continue;
    }

    if (!accumulatedDaysOffByType[person]) {
      accumulatedDaysOffByType[person] = {};
    }
    if (!accumulatedDaysOffByType[person][typeOfLeave]) {
      accumulatedDaysOffByType[person][typeOfLeave] = 0;
    }
    if (endDate > endOfNextBusinessWeek) {
      endDate = endOfNextBusinessWeek;
    }

    accumulatedDaysOffByType[person][typeOfLeave] += countWeekdaysBetweenDates(
      startDate,
      endDate
    );
  }

  // Convert days into fractions of a week
  var accumulatedWeeksOffByType = {};
  for (var person in accumulatedDaysOffByType) {
    accumulatedWeeksOffByType[person] = {};
    for (var typeOfLeave in accumulatedDaysOffByType[person]) {
      accumulatedWeeksOffByType[person][typeOfLeave] =
        accumulatedDaysOffByType[person][typeOfLeave];
    }
  }

  return accumulatedWeeksOffByType;
}

function getLastBotMessage() {
  var apiUrl = "https://slack.com/api/conversations.history";
  var payload = {
    channel: CHANNEL_ID,
    token: TOKEN,
    limit: 20, // fetch the last 20 messages (adjust as needed)
  };

  var headers = {
    Authorization: "Bearer " + TOKEN,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  var options = {
    method: "get",
    headers: headers,
    payload: payload,
    muteHttpExceptions: true,
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

function postToSlack() {
  // Get the time-off logbook spreadsheet.
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  var lastRow = sheet.getLastRow();
  var timeOffData = sheet.getRange(1, 1, lastRow, 4).getValues();

  var slackMessage = "Time-off updates:\n";
  var timeOffEntries = [];

  var accumulatedTimeOff = calculateAccumulatedTimeOff(timeOffData);

  // Construct the slack message based on the time off data
  for (var i = 1; i < timeOffData.length; i++) {
    try {
      var person = timeOffData[i][0];
      if (!person) {
        continue;
      }
      var startDate = parseDate(timeOffData[i][1]);
      var endDate = parseDate(timeOffData[i][2]);

      var isInThisWeek =
        isDateInThisWeek(startDate) || isDateInThisWeek(endDate);
      var isInNextWeek =
        isDateInNextWeek(startDate) || isDateInNextWeek(endDate);

      if (isInThisWeek || isInNextWeek) {
        var conciseDateRange = `${formatDate(startDate).substr(
          4,
          6
        )}-${formatDate(endDate).substr(4, 6)} (${formatDate(startDate).substr(
          0,
          3
        )}-${formatDate(endDate).substr(0, 3)})`;

        if (isInNextWeek) {
          conciseDateRange += " (next week)";
        }

        timeOffEntries.push({
          person: person,
          startDate: startDate,
          endDate: endDate,
          conciseDateRange: conciseDateRange,
        });
      }
    } catch (e) {
      Logger.log("Error in loop at index " + i + ": " + e.toString());
    }
  }

  timeOffEntries.sort(function (a, b) {
    return a.startDate - b.startDate;
  });

  // Check if there are no updates
  if (timeOffEntries.length === 0) {
    slackMessage += "No updates for this week or next week.\n";
  } else {
    // Construct the message with updates
    slackMessage += timeOffEntries
      .map(function (entry) {
        return `\n${entry.person}, ${entry.conciseDateRange}`;
      })
      .join("\n");
  }

  var lastBotMessage = getLastBotMessage();

  if (lastBotMessage !== slackMessage) {
    // Send the slack message
    var apiUrl = "https://slack.com/api/chat.postMessage";
    var payload = {
      channel: CHANNEL,
      text: slackMessage,
      token: TOKEN,
    };
    var headers = {
      Authorization: "Bearer " + TOKEN,
      "Content-Type": "application/json; charset=UTF-8",
    };

    var options = {
      method: "post",
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    var response = UrlFetchApp.fetch(apiUrl, options);
    var jsonResponse = JSON.parse(response.getContentText());

    if (!jsonResponse.ok) {
      Logger.log("Error posting to Slack: " + jsonResponse.error);
    }
  } else {
    Logger.log(
      "Message content is the same as the last message. Not sending a new message."
    );
  }
}

function postMonthlyAccumulatedTimeOff() {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  var lastRow = sheet.getLastRow();
  var timeOffData = sheet.getRange(1, 1, lastRow, 4).getValues();

  var accumulatedTimeOff = calculateAccumulatedTimeOff(timeOffData);

  // Sort the accumulated time-off by total days (descending order)
  var sortedAccumulatedTimeOff = [];
  for (var person in accumulatedTimeOff) {
    for (var typeOfLeave in accumulatedTimeOff[person]) {
      sortedAccumulatedTimeOff.push({
        person: person,
        typeOfLeave: typeOfLeave,
        days: accumulatedTimeOff[person][typeOfLeave],
      });
    }
  }

  sortedAccumulatedTimeOff.sort(function (a, b) {
    return b.days - a.days;
  });

  // Construct the Slack message
  var slackMessage = "Monthly Accumulated Time-Off:\n";
  sortedAccumulatedTimeOff.forEach(function (entry) {
    slackMessage += `${entry.person} - ${
      entry.typeOfLeave
    }: ${entry.days.toFixed(1)} days\n`;
  });

  // Post to Slack
  var apiUrl = "https://slack.com/api/chat.postMessage";
  var payload = {
    channel: CHANNEL,
    text: slackMessage,
    token: TOKEN,
  };
  var headers = {
    Authorization: "Bearer " + TOKEN,
    "Content-Type": "application/json; charset=UTF-8",
  };
  var options = {
    method: "post",
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(apiUrl, options);
  var jsonResponse = JSON.parse(response.getContentText());

  if (!jsonResponse.ok) {
    Logger.log(
      "Error posting monthly accumulated time-off to Slack: " +
        jsonResponse.error
    );
  }
}
