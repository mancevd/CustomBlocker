# Privacy Policy for CustomBlocker

**Last Updated:** November 19, 2025

## Overview

CustomBlocker is committed to protecting your privacy. This extension is designed to help you filter and block web page elements based on custom rules you create.

## Data Collection and Usage

### What Data We Collect

CustomBlocker collects and stores only the following data **locally on your device**:

1. **User-Created Rules**: Custom blocking rules you create, including:
   - Rule names and descriptions
   - URL patterns for websites
   - XPath and CSS selectors
   - Keywords and filtering criteria
   - Word groups

2. **Extension Settings**: Your preferences for:
   - Extension enabled/disabled state
   - Badge display settings
   - UI preferences

### How Data is Stored

- All data is stored using Chrome's `chrome.storage.sync` and `chrome.storage.local` APIs
- Data stored in `chrome.storage.sync` may be synchronized across your Chrome browsers if you're signed into Chrome with sync enabled
- **We do not transmit any data to external servers**
- **We do not collect, sell, or share any user data with third parties**

### Data You Control

You have complete control over your data:
- All rules and settings can be viewed, modified, or deleted through the extension's interface
- Uninstalling the extension will remove all locally stored data
- You can export and import your rules for backup purposes

## Permissions Explained

CustomBlocker requires the following permissions to function:

1. **storage**: To save your custom blocking rules and extension settings locally
2. **contextMenus**: To add right-click menu options for creating rules
3. **unlimitedStorage**: To allow storing a large number of custom rules without limitations
4. **host_permissions (http://*/* and https:///*/*)**: To apply your custom blocking rules on web pages you visit

## Third-Party Services

CustomBlocker does **not** use any third-party services, analytics, or tracking tools.

## Children's Privacy

CustomBlocker does not knowingly collect any information from children under the age of 13.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the extension updates with a new "Last Updated" date.

## Contact

If you have questions about this privacy policy, please open an issue on our GitHub repository:
https://github.com/mancevd/CustomBlocker/issues

## Your Consent

By using CustomBlocker, you consent to this privacy policy.
