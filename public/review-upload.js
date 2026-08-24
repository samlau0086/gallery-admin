(function () {
  var form = document.querySelector('#review-form');
  if (!form) return;
  var files = [];
  var field = document.createElement('div');
  field.className = 'review-upload-field';
  field.innerHTML = '<span class="review-upload-label">Photos <em>Optional, up to 5</em></span><input class="review-upload-input" type="file" accept="image/*" multiple hidden><button class="review-dropzone" type="button"><span>Drop photos here</span><small>or choose up to 5 images</small></button><div class="review-upload-previews" aria-live="polite"></div>';
  form.insertBefore(field, form.querySelector('.contact-honeypot'));
  var input = field.querySelector('.review-upload-input'); var dropzone = field.querySelector('.review-dropzone'); var previews = field.querySelector('.review-upload-previews'); var status = document.querySelector('#review-status');
  function showError(message) { if (status) status.textContent = message; }
  function render() { previews.innerHTML = ''; files.forEach(function (file, index) { var item = document.createElement('div'); item.className = 'review-upload-preview'; var image = document.createElement('img'); image.src = URL.createObjectURL(file); image.alt = ''; image.onload = function () { URL.revokeObjectURL(image.src); }; var remove = document.createElement('button'); remove.type = 'button'; remove.setAttribute('aria-label', 'Remove photo'); remove.textContent = '×'; remove.addEventListener('click', function () { files.splice(index, 1); render(); }); item.append(image, remove); previews.append(item); }); }
  function addFiles(list) { var rejected = false; Array.prototype.forEach.call(list, function (file) { if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { rejected = true; return; } if (files.length < 5) files.push(file); else rejected = true; }); if (rejected) showError('Use image files under 10MB. You can upload up to 5 photos.'); render(); }
  dropzone.addEventListener('click', function () { input.click(); }); input.addEventListener('change', function () { addFiles(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach(function (event) { dropzone.addEventListener(event, function (e) { e.preventDefault(); dropzone.classList.add('is-dragging'); }); });
  ['dragleave', 'drop'].forEach(function (event) { dropzone.addEventListener(event, function (e) { e.preventDefault(); dropzone.classList.remove('is-dragging'); }); }); dropzone.addEventListener('drop', function (event) { addFiles(event.dataTransfer.files); });
  var originalFetch = window.fetch.bind(window); window.fetch = function (url, options) { if (url !== '/api/reviews' || !options || !options.body || !files.length) return originalFetch(url, options); return Promise.all(files.map(function (file) { var upload = new FormData(); upload.set('file', file); upload.set('folder', 'reviews'); return originalFetch('/api/upload', { method: 'POST', body: upload }).then(function (response) { return response.json().then(function (body) { if (!response.ok) throw new Error(body.error || 'Unable to upload photo.'); return body.url; }); }); })).then(function (images) { var payload = JSON.parse(options.body); payload.images = images; return originalFetch(url, Object.assign({}, options, { body: JSON.stringify(payload) })); }); };
})();
