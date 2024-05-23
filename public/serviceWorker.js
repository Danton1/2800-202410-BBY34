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
