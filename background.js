// Shopify PDF Auto-Downloader - Background Service Worker
// Handles PDF URL capture and automatic downloads

// Track tabs that are loading PDFs
const pdfTabs = new Map();
let originTabId = null; // Track which tab initiated the request

// Listen for tab updates to capture PDF URLs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if this is a PDF URL from Shopify storage
  if (changeInfo.url) {
    if (changeInfo.url.includes('storage.googleapis.com') ||
        changeInfo.url.includes('shopify-shipify.s3')) {
      console.log('PDF tab detected:', tabId, changeInfo.url);
      pdfTabs.set(tabId, { url: changeInfo.url, status: 'loading' });
    }
  }

  // Wait for the tab to finish loading
  if (changeInfo.status === 'complete' && pdfTabs.has(tabId)) {
    const pdfInfo = pdfTabs.get(tabId);
    console.log('PDF loaded:', tabId, pdfInfo.url);

    // Send URL back to origin content script
    if (originTabId) {
      console.log('Sending URL to origin tab:', originTabId);
      chrome.tabs.sendMessage(originTabId, {
        action: 'capturedURL',
        url: pdfInfo.url
      }).catch((err) => {
        console.error('Could not send to content script:', err);
      });
    }

    // Close the PDF tab
    setTimeout(() => {
      chrome.tabs.remove(tabId).catch(() => {});
      pdfTabs.delete(tabId);
    }, 500);
  }
});

// Listen for download requests from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startCapture') {
    // Store the origin tab ID
    originTabId = sender.tab?.id;
    console.log('Capture started from tab:', originTabId);
    sendResponse({ success: true });
  }
  else if (message.action === 'downloadPDFs') {
    console.log('Received download request for URLs:', message.urls);

    // Download each PDF
    message.urls.forEach((url, index) => {
      if (url) {
        // Extract filename from URL
        let filename = extractFilename(url);

        chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: false // Auto-save to Downloads folder
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error('Download failed:', chrome.runtime.lastError);
          } else {
            console.log('Download started:', downloadId, filename);
          }
        });
      }
    });

    sendResponse({ success: true });
  }

  return true; // Keep message channel open for async response
});

// Helper function to extract filename from URL
function extractFilename(url) {
  try {
    // Try to get filename from response-content-disposition parameter
    const urlObj = new URL(url);
    const disposition = urlObj.searchParams.get('response-content-disposition');

    if (disposition) {
      const filenameMatch = disposition.match(/filename[^;=\n]*=(['"](.*?)['"]|([^;\n]*))/);
      if (filenameMatch && filenameMatch[2]) {
        return decodeURIComponent(filenameMatch[2]);
      }
    }

    // Fallback: extract from pathname
    const pathname = urlObj.pathname;
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];

    if (lastSegment && lastSegment.includes('.pdf')) {
      return lastSegment;
    }

    // Last resort: generic name with timestamp
    const timestamp = new Date().getTime();
    return `shopify_document_${timestamp}.pdf`;
  } catch (error) {
    console.error('Error extracting filename:', error);
    const timestamp = new Date().getTime();
    return `shopify_document_${timestamp}.pdf`;
  }
}

console.log('Shopify PDF Auto-Downloader background service worker initialized');
