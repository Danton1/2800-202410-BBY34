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

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        // URL to open when notification is clicked
        clients.openWindow('https://medikate.onrender.com/') 
    );
});
