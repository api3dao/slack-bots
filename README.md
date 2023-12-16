# Slack Bots Repository

Welcome to the Slack Bots Repository! This repository contains a collection of custom Slack bots designed to automate and enhance various functionalities within Slack workspaces.

Each bot in this repository is stored in its own folder, where you can find detailed documentation, setup instructions, and source code.

## Bots Index

Below is a list of the Slack bots available in this repository:

1. **Technical Time-Off Bot** - Located in [`/technical-time-off`](./technical-time-off)

   - This bot tracks and reports time-off requests within technical teams. It automates the process of notifying team members about upcoming time-offs and managing time-off records.

2. **Unassigned Open Issues Bot** - Located in [`/unassigned-open-issues`](./unassigned-open-issues)

   - This bot is designed to monitor open issues across all repositories in a GitHub organization that have not been assigned to any project. It fetches and posts a daily report to a specified Slack channel, helping teams keep track of unassigned issues and ensuring they are not overlooked.

3. **Technical Weekly Rotations Bot** - Located in [`/technical-weekly-rotations`](./technical-weekly-rotations)

   - This bot automates the selection of weekly signers. It dynamically adjusts the signers list based on their availability, as indicated in the Time off logbook Google Sheet, and accounts for any mid-week changes. The updated list of signers is posted to a Slack channel, ensuring operational continuity and keeping the team informed.

## Getting Started

To use these bots, navigate to the specific bot's folder and follow the setup instructions provided in the README file there.

## Contribution

Contributions to this repository are welcome! If you have an idea for a new bot or improvements to existing ones, feel free to provide suggestions and contribute.

---

Thank you for exploring our Slack Bots Repository!
