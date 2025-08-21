// This script registers the service worker only in production
if ('serviceWorker' in navigator) {
  // Skip service worker registration in development (port 3000)
  if (location.port === '3000') {
    console.log('Skipping service worker registration in development');
    // Unregister any existing service workers
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
      }
    });
  } else {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }
}
