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
  // Calculate the end (Sunday) of the current week
  var endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
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
  // Calculate the end (Sunday) of the next week
  var endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
  return date >= startOfNextWeek && date <= endOfNextWeek;
}

function parseDate(input) {
  if (input instanceof Date) {
    // If the input is already a Date object, return it directly
    return input;
  } else if (typeof input === "string") {
    // If the input is a string, parse it
    var parts = input.split("/");
    if (parts.length === 3) {
      var day = parseInt(parts[0], 10);
      var month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
      var year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    } else {
      return new Date("Invalid Date");
    }
  } else {
    // If the input is neither a Date object nor a string
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
  var today = new Date(); // Use today's date as the cutoff for calculations
  today.setHours(23, 59, 59, 999); // Consider the entire day

  function countWeekdaysBetweenDates(startDate, endDate) {
    var totalDays = 0;
    var currentDate = new Date(startDate);
    while (currentDate <= endDate && currentDate <= today) {
      // Only count up to today
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        totalDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return totalDays;
  }

  for (var i = 1; i < timeOffData.length; i++) {
    var person = timeOffData[i][0];
    var typeOfLeave = timeOffData[i][3];
    var startDate = parseDate(timeOffData[i][1]);
    var endDate = parseDate(timeOffData[i][2]);
    endDate.setHours(23, 59, 59, 999);

    if (
      typeOfLeave === "B/L" ||
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime())
    ) {
      continue;
    }

    if (startDate.getFullYear() < currentYear) {
      startDate = new Date(currentYear, 0, 1);
    }
    if (endDate.getFullYear() > currentYear || endDate > today) {
      endDate = today; // Use today as the end date if the original end date is in the future
    }

    if (!accumulatedDaysOffByType[person]) {
      accumulatedDaysOffByType[person] = {};
    }
    if (!accumulatedDaysOffByType[person][typeOfLeave]) {
      accumulatedDaysOffByType[person][typeOfLeave] = 0;
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
      if (message.bot_id && message.text.startsWith("Time-off updates:")) {
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

  // Get the start of the current week
  var now = new Date();
  var startOfCurrentWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)
  );
  startOfCurrentWeek.setHours(0, 0, 0, 0); // Set time to midnight

  // Construct the slack message based on the time off data
  for (var i = 1; i < timeOffData.length; i++) {
    try {
      var person = timeOffData[i][0];
      if (!person) {
        continue;
      }
      var startDate = parseDate(timeOffData[i][1]);
      var endDate = parseDate(timeOffData[i][2]);
      endDate.setHours(23, 59, 59, 999); // Set time to the end of the day
      var today = new Date();
      today.setHours(0, 0, 0, 0); // Set time to midnight

      // Skip entries where the end date is before today
      if (endDate < today) {
        continue;
      }

      var isInThisWeek =
        isDateInThisWeek(startDate) ||
        (isDateInThisWeek(endDate) && startDate < startOfCurrentWeek);
      var isInNextWeek =
        isDateInNextWeek(startDate) && !isDateInThisWeek(startDate);

      // Check if the time-off is ongoing during the current week
      var isOngoing =
        startDate < startOfCurrentWeek && endDate >= startOfCurrentWeek;

      if (isInThisWeek || isInNextWeek || isOngoing) {
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

function postYearlyAccumulatedTimeOff() {
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
  var slackMessage = "Yearly Accumulated Time-Off:\n";
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
      "Error posting yearly accumulated time-off to Slack: " +
        jsonResponse.error
    );
  }
}
