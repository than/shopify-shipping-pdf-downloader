# Shopify PDF Auto-Downloader

[![Git Slot Machine](https://img.shields.io/badge/git--slot--machine-enabled-brightgreen)](https://github.com/than/git-slot-machine)

Chrome extension to automatically download Shopify shipping labels and packing slips with one click.

## Features

- Adds a "Download Both" button (in Broomfitters red) above the standard print buttons
- Automatically downloads both shipping label and packing slip to your Downloads folder
- No manual clicking, no switching printers - just one click and done
- Works with your existing Hazel script for automatic printer routing

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `shopify-shipping-pdf-downloader` folder
5. The extension is now installed!

## Usage

1. Go to any order in your Shopify admin
2. Scroll to the "Print documents" section
3. Click the red "Download Both" button at the top
4. Both PDFs will automatically download to your Downloads folder
5. Your Hazel script will handle the rest!

## How It Works

- **Content Script**: Injects the "Download Both" button and intercepts clicks on the original print buttons to capture PDF URLs
- **Background Service Worker**: Monitors for PDF tabs opening, captures the URLs, auto-closes the tabs, and triggers downloads
- **No Manual Steps**: Everything happens automatically after clicking one button

## Permissions

- `downloads`: Required to automatically save PDFs to your Downloads folder
- Host permissions for:
  - `*.myshopify.com`: To inject the button on Shopify admin pages
  - `storage.googleapis.com`: For packing slip PDFs
  - `shopify-shipify.s3.us-east-1.amazonaws.com`: For shipping label PDFs

## Development

Files:
- `manifest.json`: Extension configuration
- `content.js`: Button injection and URL capture
- `background.js`: Download handling and tab management

## Troubleshooting

- If the button doesn't appear, refresh the Shopify order page
- Check the Chrome extension console for any errors
- Make sure the extension has the required permissions enabled
