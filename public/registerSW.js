// Conditional SW registration: minimal over HTTP (iPad home screen), Workbox over HTTPS
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    var url = location.protocol === 'https:' ? '/sw.js' : '/sw-minimal.js';
    navigator.serviceWorker.register(url, { scope: '/' }).catch(function () {});
  });
}
