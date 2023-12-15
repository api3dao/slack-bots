# Weekly Signers Rotator for Slack

This Google Apps Script (GAS) bot selects a group of weekly signers from a predefined list and posts their names to a Slack channel. It ensures operational continuity by rotating signers every week and considering team members' availability.

## Overview

1. The bot calculates the current week number of the year.
2. Fetches the latest technical-time-off bot update from the `#technical-time-off` Slack channel to identify unavailable signers.
3. Selects 4 signers for the week, adjusting for any unavailable signers.
4. Posts the names of the weekly signers to the `#technical-weekly-rotations` Slack channel.
5. The selection is predictable and rotates through the list of signers, ensuring fair distribution over time.

## How to Set Up

### 1. Google Apps Script

- Visit [Google Apps Script](https://script.google.com/).
- Create a new project by clicking `+ New Project`.
- In the code editor, paste the provided `Code.gs` content and save the project with a relevant name.

### 2. Slack Token Setup

#### Setting up OAuth with Slack:

Note that if you already created a Slack App for the technical-time-off bot, you can reuse the same token.

1. **Create a Slack App**:
   - Navigate to [Slack Apps](https://api.slack.com/apps).
   - Click "Create New App," give it a name, and select your workspace.
2. **Permissions**:
   - In the app settings, go to "OAuth & Permissions."
   - Add the `chat:write` scope under "Bot Token Scopes" to enable message posting.
   - Add `channels:history` and `channels:read` scopes for reading channel messages.
3. **Install the App to Workspace**:
   - Click "Install to Workspace" and authorize the app.
4. **Retrieve the OAuth Token**:
   - Copy the "Bot User OAuth Token" provided after installation.
5. **Add the App to Channels**:
   - Add the app to both `#technical-time-off` and `#technical-weekly-rotations` channels.

### 4. Time Trigger Setup

1. In Google Apps Script, open the "Triggers" page via the clock icon.
2. Click `+ Add Trigger` and set up a new trigger for `selectWeeklySigners`.
3. Choose a suitable frequency, like weekly, to align with your team's rotation schedule.

### 5. Slack Channel Setup

- If you are using the same token as for the technical-time-off bot, also add the same bot to the `#technical-weekly-rotations` channel.
- Ensure the bot is added to both the `#technical-time-off` and `#technical-weekly-rotations` channels.
- Use `/invite @YourBotName` in each channel to add the bot.

### 6. Testing and Deployment

- Test the script manually by running `selectWeeklySigners`.
- Check the `#technical-weekly-rotations` channel for the message.
- Adjust the script or troubleshoot as necessary.

## Conclusion

With this setup, your team will automatically be informed of the weekly signers, ensuring clarity and consistency in operations. The bot's integration with the time-off updates adds a layer of reliability by accounting for team members' availability.

Remember to regularly check and update the signers list as needed. Adjustments can be made to tailor the script to your team's specific workflow and preferences.
