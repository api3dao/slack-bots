# Weekly Signers Rotator for Slack

This Google Apps Script bot automates the selection of weekly signers for tasks or roles within a team and posts their names to a designated Slack channel. It ensures operational continuity by rotating through a list of signers and accounting for their availability.

## Features

- **Automated Weekly Selection**: Calculates the current week's number and selects signers in a rotating fashion.
- **Availability Check**: Integrates with the [Time off logbook](https://docs.google.com/spreadsheets/d/1-qxltbYl6316Y6ZMmkephI4Dc5fqp__rpZYjSg4inQk/edit#gid=1070316407) Google Sheet to identify unavailable signers, ensuring that only available members are selected.
- **Dynamic Replacement**: If a signer becomes unavailable during the week, the bot finds and assigns a replacement from the remaining available signers.
- **Slack Integration**: Posts the weekly signer list to a specified Slack channel, keeping the team informed.

## Setup

### Google Apps Script

1. Create a new project in [Google Apps Script](https://script.google.com/).
2. Copy and paste the provided script into the code editor.
3. Save the project with a relevant name.

### Slack Integration

1. Create or use an existing Slack App with appropriate permissions (`chat:write`, `channels:history`, `channels:read`).
2. Install the App to your workspace and retrieve the "Bot User OAuth Token".
3. Add the app to the relevant Slack channels.

### Google Sheet

1. The Google Sheet should contain two sheets: ["Signers"](https://docs.google.com/spreadsheets/d/1-qxltbYl6316Y6ZMmkephI4Dc5fqp__rpZYjSg4inQk/edit#gid=591540713) for the list of people specifying signers and ["Instructions"](https://docs.google.com/spreadsheets/d/1-qxltbYl6316Y6ZMmkephI4Dc5fqp__rpZYjSg4inQk/edit#gid=1070316407) for time-off data.
2. Update the `SPREADSHEET_ID` in the script with your Google Sheet's ID.

### Time Trigger Setup

1. Set up a daily trigger for the `selectWeeklySigners` function to ensure daily updates on signer availability.

### Running and Testing

- Test the script manually and verify that the correct signers are posted to the Slack channel.
- Adjust and troubleshoot as necessary based on your team's workflow.

## Conclusion

This bot simplifies the management of weekly signers assignments by automating the selection process and integrating team availability data. Regular updates to the signers list and time-off data will ensure smooth operation.
