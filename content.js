// Shopify PDF Auto-Downloader - Content Script
// Injects a "Download Both" button and captures PDF URLs

const PDF_URLS = {
  shippingLabel: null,
  packingSlip: null
};

// Broomfitters red color
const BROOMFITTERS_RED = '#C41E3A';

// Function to find the button container
function findPrintButtonsContainer() {
  const buttons = Array.from(document.querySelectorAll('button'));
  const shippingLabelButton = buttons.find(btn =>
    btn.textContent.includes('Print 1 shipping label') ||
    btn.textContent.includes('Reprint 1 shipping label')
  );

  if (shippingLabelButton) {
    // Find the parent container that holds both buttons
    return shippingLabelButton.closest('.Polaris-LegacyStack--vertical');
  }
  return null;
}

// Function to create and inject the "Download Both" button
function injectDownloadButton() {
  const container = findPrintButtonsContainer();
  if (!container) {
    console.log('Print buttons container not found, retrying...');
    return false;
  }

  // Check if button already exists
  if (document.getElementById('broomfitters-download-both')) {
    return true;
  }

  // Create the button wrapper (matching Shopify's structure)
  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'Polaris-LegacyStack__Item';

  const button = document.createElement('button');
  button.id = 'broomfitters-download-both';
  button.className = 'Polaris-Button Polaris-Button--pressable Polaris-Button--variantPrimary Polaris-Button--sizeMedium Polaris-Button--textAlignCenter Polaris-Button--fullWidth';
  button.style.backgroundColor = BROOMFITTERS_RED;
  button.style.borderColor = BROOMFITTERS_RED;
  button.setAttribute('type', 'button');
  button.setAttribute('aria-disabled', 'false');

  const buttonText = document.createElement('span');
  buttonText.className = 'Polaris-Text--root Polaris-Text--bodySm Polaris-Text--semibold';
  buttonText.textContent = 'Print both';

  button.appendChild(buttonText);
  buttonWrapper.appendChild(button);

  // Insert at the beginning of the container (above other buttons)
  container.insertBefore(buttonWrapper, container.firstChild);

  // Add click handler
  button.addEventListener('click', handleDownloadBothClick);

  console.log('Download Both button injected successfully');
  return true;
}

// Handle click on "Download Both" button
async function handleDownloadBothClick(e) {
  e.preventDefault();
  const button = e.currentTarget;
  const originalText = button.querySelector('span').textContent;

  // Update button text
  button.querySelector('span').textContent = 'Downloading...';
  button.disabled = true;

  try {
    // Trigger both downloads
    await triggerDownloads();

    // Show success state briefly
    button.querySelector('span').textContent = 'Downloaded!';
    setTimeout(() => {
      button.querySelector('span').textContent = originalText;
      button.disabled = false;
    }, 2000);
  } catch (error) {
    console.error('Download failed:', error);
    button.querySelector('span').textContent = 'Error - Try Again';
    setTimeout(() => {
      button.querySelector('span').textContent = originalText;
      button.disabled = false;
    }, 2000);
  }
}

// Trigger the actual downloads by clicking the original buttons and capturing URLs
async function triggerDownloads() {
  // Find the original buttons
  const buttons = Array.from(document.querySelectorAll('button'));
  const shippingLabelButton = buttons.find(btn =>
    btn.textContent.includes('Print 1 shipping label') ||
    btn.textContent.includes('Reprint 1 shipping label')
  );
  const packingSlipButton = buttons.find(btn =>
    btn.textContent.includes('Print 1 packing slip')
  );

  if (!shippingLabelButton || !packingSlipButton) {
    console.error('Could not find buttons. Available buttons:', buttons.map(b => b.textContent));
    throw new Error('Could not find original print buttons');
  }

  // Notify background script to start capture
  chrome.runtime.sendMessage({ action: 'startCapture' });

  // Set up URL capture before clicking
  const urlPromises = setupURLCapture();

  // Click both buttons
  console.log('Clicking shipping label button...');
  shippingLabelButton.click();

  // Small delay between clicks
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('Clicking packing slip button...');
  packingSlipButton.click();

  // Wait for URLs to be captured
  console.log('Waiting for URLs to be captured...');
  const urls = await urlPromises;

  console.log('URLs captured:', urls);

  // Send URLs to background script for download
  chrome.runtime.sendMessage({
    action: 'downloadPDFs',
    urls: urls
  });
}

// Set up URL capture by monitoring window.open and new tabs
function setupURLCapture() {
  return new Promise((resolve) => {
    const capturedURLs = [];
    let checkCount = 0;
    const maxChecks = 20; // 10 seconds max

    // Listen for messages from background script with URLs
    const messageListener = (message) => {
      if (message.action === 'capturedURL') {
        capturedURLs.push(message.url);

        if (capturedURLs.length >= 2) {
          chrome.runtime.onMessage.removeListener(messageListener);
          resolve(capturedURLs);
        }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Timeout fallback
    const checkInterval = setInterval(() => {
      checkCount++;
      if (checkCount >= maxChecks) {
        clearInterval(checkInterval);
        chrome.runtime.onMessage.removeListener(messageListener);
        if (capturedURLs.length > 0) {
          resolve(capturedURLs);
        } else {
          resolve([]);
        }
      }
    }, 500);
  });
}

// Initialize the extension
function init() {
  // Try to inject button immediately
  if (injectDownloadButton()) {
    console.log('Shopify PDF Auto-Downloader initialized');
    return;
  }

  // If not found, watch for DOM changes
  const observer = new MutationObserver(() => {
    if (injectDownloadButton()) {
      observer.disconnect();
      console.log('Shopify PDF Auto-Downloader initialized after DOM change');
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Stop observing after 10 seconds
  setTimeout(() => observer.disconnect(), 10000);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
