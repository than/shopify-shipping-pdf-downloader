# Changelog

All notable changes to the Shopify PDF Auto-Downloader extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-16

### Added
- Initial release of Shopify PDF Auto-Downloader
- "Print both" button in Broomfitters red (#C41E3A) color
- Automatic download of shipping labels and packing slips with one click
- Support for both initial print and reprint workflows
- Background tab handling - PDF tabs open and close automatically without stealing focus
- Proper handling of PDF generation delays
- Custom printer icon for extension
- Support for both admin.shopify.com and *.myshopify.com domains
- Support for Google Cloud Storage and S3 PDF URLs
- Packing slips download first (slower printer optimization)

### Technical Details
- Manifest V3 Chrome extension
- Detects and captures PDF URLs from Shopify storage
- Automatically closes PDF preview tabs after download starts
- Waits for PDF generation to complete before capturing URLs
- Injects button into Shopify's Polaris UI system with matching styles
