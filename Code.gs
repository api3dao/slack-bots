function isDateInThisWeek(date) {
  var now = new Date();

  // Calculate the start and end of the current week
  var startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay()
  );
  var endOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay() + 6
  );

  return date >= startOfWeek && date <= endOfWeek;
}

function isDateInNextWeek(date) {
  var now = new Date();
  // Calculate the start and end of the next week
  var startOfNextWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay() + 7
  );
  var endOfNextWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay() + 13
  );

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

function calculateAccumulatedTimeOff(timeOffData) {
  var accumulatedDaysOffByType = {};
  var currentYear = new Date().getFullYear();

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

function postToSlack() {
  // OAuth token from Slack and Slack channel ID or name
  var TOKEN = "YOUR_TOKEN"; // Replace with your actual token
  var CHANNEL = "#technical-time-off";

  // Get the time-off logbook spreadsheet.
  var spreadsheet = SpreadsheetApp.openById("YOUR_SPREADSHEET_ID"); // Replace with your actual Spreadsheet ID
  var sheet = spreadsheet.getSheetByName("Sheet1");
  var lastRow = sheet.getLastRow();
  var timeOffData = sheet.getRange(1, 1, lastRow, 4).getValues();

  var slackMessage = "Time-off updates:\n";

  var accumulatedTimeOff = calculateAccumulatedTimeOff(timeOffData);

  // Construct the slack message based on the time off data
  for (var i = 1; i < timeOffData.length; i++) {
    try {
      var person = timeOffData[i][0];
      if (!person) {
        continue;
      }
      var typeOfTimeOff = timeOffData[i][3];
      var startDate = parseDate(timeOffData[i][1]);
      var endDate = parseDate(timeOffData[i][2]);

      if (isDateInThisWeek(startDate) || isDateInThisWeek(endDate)) {
        slackMessage += `\n${person} is away this week for ${typeOfTimeOff} from ${formatDate(
          startDate
        )} to ${formatDate(
          endDate
        )}.\n${person} then have cumulated ${accumulatedTimeOff[person][
          typeOfTimeOff
        ].toFixed(
          1
        )} days of ${typeOfTimeOff} since the beginning of the year (including the above dates).\n`;
      } else if (isDateInNextWeek(startDate) || isDateInNextWeek(endDate)) {
        slackMessage += `\n${person} will be away next week for ${typeOfTimeOff} from ${formatDate(
          startDate
        )} to ${formatDate(
          endDate
        )}.\n${person} will then have cumulated ${accumulatedTimeOff[person][
          typeOfTimeOff
        ].toFixed(
          1
        )} days of ${typeOfTimeOff} since the beginning of the year (including the above dates).\n`;
      }
    } catch (e) {
      Logger.log("Error in loop at index " + i + ": " + e.toString());
    }
  }

  if (slackMessage === "Time-off updates:\n") {
    slackMessage += "No updates for this week or next week.\n";
  }

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
}
