# Time-Off Announcer for Slack

This Google Apps Script (GAS) code is designed to automatically post time-off updates to a designated Slack channel, helping teams stay informed about their members' availability.

## Overview

1. Checks if any time-off dates in the provided Google Sheet fall within the current week or the next week.
2. Compiles this data into a message.
3. Sends the compiled message to a specified Slack channel, in this case the [#technical-time-off](https://api3workspace.slack.com/archives/C03L914J4ET) channel.

## How to Set Up

### 1. Google Apps Script

- Go to [Google Apps Script](https://script.google.com/).
- Click on `+ New Project`.
- In the code editor, delete any existing content and paste the provided `Code.gs` content.
- Save the project by giving it a name.

### 2. Slack Token Setup

#### Setting up OAuth with Slack:

1. **Create a Slack App**:
   - Go to [Slack Apps](https://api.slack.com/apps) and click on the "Create New App" button.
   - Provide a name for your app and select the workspace you want to post messages to.
   - Click "Create App".
2. **Permissions**:
   - In the sidebar, click on "OAuth & Permissions".
   - Scroll down to the "Scopes" section.
   - Under "Bot Token Scopes", click "Add an OAuth Scope".
   - Add the `chat:write` scope, which allows your bot to post messages.
3. **Install the App to Workspace**:
   - Above the "Scopes" section, click on the "Install to Workspace" button.
   - You'll be redirected to your Slack workspace to authorize the app. Click "Allow".
4. **Retrieve the OAuth Token**:
   - Once the app is installed, you'll be redirected back to the Slack app settings.
   - In the "OAuth & Permissions" section, you'll see a "Bot User OAuth Token". This token starts with `xoxb-`.
   - Copy this token and replace `YOUR_TOKEN` in the GAS code with it.
5. **Add the app to the channel**:
   - Go to `#technical-time-off`, click `Add apps` and add the newly created app

### 3. Google Sheet Setup

- Open the provided [Google Sheet](https://docs.google.com/spreadsheets/d/1-qxltbYl6316Y6ZMmkephI4Dc5fqp__rpZYjSg4inQk/edit#gid=1070316407).
- Replace `YOUR_SPREADSHEET_ID` in the GAS code with the ID from the sheet URL.
- The columns in the Google Sheet should have the following structure:
  - **Name (Column A)**: Select from the dropdown choices.
  - **Start Date (Column B)**: Input the date in the format `dd/mm/yyyy`.
  - **End Date (Column C)**: Same format as Start Date.
  - **Type of Leave (Column D)**: Select from the dropdown choices (e.g., `A/L` for Annual Leave, `S/L` for Sick Leave).

#### Note:

Team members should input their time-off dates in advance since the bot announces the current week's and following week's absences every Monday. The algorithm automatically excludes weekends if the time-off range extends over them.

### 4. Time Trigger Setup

1. In Google Apps Script, click on the clock icon in the sidebar to open the "Triggers" page.
2. Click on the `+ Add Trigger` button at the bottom right.
3. For the function to run, choose `postToSlack`.
4. For the deployment, choose `Head`.
5. For the event source, select `Time-driven`.
6. Choose the frequency you'd like the script to run. For example, if you want it to run every Monday, select "Week timer" and "Every Monday".
7. Save the trigger.

#### Note:

While it's suggested to run the bot every Monday, considering that team members might add or modify their time-off during the week, it might be beneficial to run the bot twice a week, e.g., on Mondays and Thursdays.

## Conclusion

With the above setup, you'll have an automated bot that checks the Google Sheet for time-off data and sends updates to a Slack channel, ensuring your team stays informed about members' availability. Adjustments can be made to the frequency of announcements based on your team's preference.
