$(function () {
  const dropArea = $('#drop-area');
  const fileInput = $('#fileInput');
  const map = L.map("map-bg", {
    zoomControl: true,
    attributionControl: false
  }).setView([-2.5, 118], 5); // Indonesia center

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18
  }).addTo(map);

  // klik area -> buka file picker
  dropArea.on('click', function () {
    fileInput.click();
  });

  // drag events
  dropArea.on('dragover', function (e) {
    e.preventDefault();
    dropArea.addClass('dragover');
  });

  dropArea.on('dragleave drop', function (e) {
    e.preventDefault();
    dropArea.removeClass('dragover');
  });

  dropArea.on('drop', function (e) {
    const files = e.originalEvent.dataTransfer.files;
    handleFile(files[0]);
  });

  fileInput.on('change', function () {
    handleFile(this.files[0]);
  });

  const allowedExt = ['shp', 'geojson', 'gpkg','html'];

  function validateFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    return allowedExt.includes(ext);
  }

  function handleFile(file) {
    if (!file) return;
  
    if (!validateFile(file)) {
      $('#drop-area').addClass('error');
  
      showAlert(
        'Format file tidak didukung. Gunakan <strong>SHP</strong>, <strong>GeoJSON</strong>, atau <strong>GPKG</strong>.'
      );
      return;
    }
  
    $('#drop-area').removeClass('error');
    $('#alert-area').html('');

    $('.drop-content').html(`
      <p class="fw-semibold mb-1">${file.name}</p>
      <p class="text-muted small">${(file.size / 1024).toFixed(2)} KB</p>
    `);
    
    window.selectedFile = file;
  }

  function showAlert(message, type = 'danger') {
    $('#alert-area').html(`
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `);
  }

  $('#btn-analyze').on('click', function () {
    alert('Proses analisis belum terhubung 😄');
  });
});
