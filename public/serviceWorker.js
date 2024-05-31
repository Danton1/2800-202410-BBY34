/*  Service Worker for Push Notifications
    It needs to be in the public folder to be accessible from the client side
    and to have visibility of all paths in the project.*/

// Register the service worker
self.addEventListener('push', function(event) {
    const data = event.data.json();
    const options = {
        body: data.message,
        icon: 'favicon.png',
        badge: 'favicon.png'
    };
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Handle notification click event
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        // URL to open when notification is clicked
        clients.openWindow('https://medikate.onrender.com/') 
    );
});
