# Proxy Toggle: Simple System Proxy Switcher

Proxy Toggle is a straightforward browser extension that lets you switch between your system proxy and a direct internet connection from the popup, or assign a keyboard shortcut for direct switching.

## Key Features

- Toggle between system proxy and direct connection from the popup
- Optional keyboard shortcut for direct proxy switching
- Optional shortcut notifications with runtime permission
- Visual icon feedback for current proxy state
- Remembers your settings across browser sessions
- Display and copy list of domains of failed resources (New feature)

## How to Use

1. Install the Chrome extension from the [Chrome Store](https://chrome.google.com/webstore/detail/bcalikfdfalhmdfinflciajgopeomhfb)
2. Click the extension icon in your browser toolbar to open the popup
3. Toggle proxy from the popup, or use Set Shortcut to assign a direct toggle shortcut
4. Green icon means system proxy is on, gray means direct connection
5. View and copy the list of failed domains, if any (New feature)

Perfect for developers, privacy-conscious users, and anyone who frequently switches between proxy and direct connections.

Simplify your browsing experience with Proxy Toggle!

## Open Source

This project is open source. You can view the code and contribute on GitHub:
[https://github.com/PlayerYK/ProxyToggle](https://github.com/PlayerYK/ProxyToggle)

## Changelog

### Unreleased

- Added an optional keyboard shortcut command for direct proxy switching
- Added a visible shortcut settings entry in the popup
- Added optional shortcut notifications for every keyboard shortcut toggle without requiring notification permission at install time
- Kept the toolbar click behavior focused on opening the details popup

### Version 1.2.0 (2026-04-15)

- Added "Clear List" button to remove failed resources
- Redesigned UI with cleaner layout and better readability
- Added automatic dark mode support
- Fixed several bugs and improved stability

### Version 1.1.0 (2024-09-09)

- New feature: Display list of domains that failed due to proxy
- New feature: Button to copy the list of failed domains
- Optimization: Copy button only shows when there are failed domains

### Version 1.0.0 (2024-08-30)

- Initial release
- Implemented basic proxy switching functionality
- Added icon state feedback

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
