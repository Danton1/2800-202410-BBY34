publicVapidKey = 'BCsw8is7lA0YHBGCNaFcVyt2ynlL2k0pz_57K-Hdb0JUniD8czp2rOYgmlgRrO0YOxcFGWgJL4VPj4oPxWtO4Lw';
// Check for service worker
if ('serviceWorker' in navigator) {
  send().catch(err => console.error(err));
}

// Register service worker, Register Push, Send Push
async function send() {
  // Register service worker
  const register = await navigator.serviceWorker.register('/serviceWorker.js', {
    scope: '/'
  });
  // Register Push
  const subscription = await register.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
  });
  // Send Push Notification
  await fetch('/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: {
      'content-type': 'application/json'
    }
  });
}

// Function obtained from https://www.npmjs.com/package/web-push
// Convert public key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

