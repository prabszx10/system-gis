$(function () {
  const dropArea = $('#drop-area');
  const fileInput = $('#fileInput');
  const resultDiv = $('#result');

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

  const allowedExt = ['zip'];

  function validateFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    return allowedExt.includes(ext);
  }

  function handleFile(file) {
    if (!file) return;

    // if (!validateFile(file)) {
    //   $('#drop-area').addClass('error');

    //   showAlert(
    //     'Format file tidak didukung. Gunakan Format <strong>ZIP</strong>.'
    //   );
    //   return;
    // }

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

  $('#btn-analyze').on('click', async () => {
    showLoading()
    try {
      if (fileInput[0].files.length === 0) {
        throw { message: "Silakan pilih file .zip terlebih dahulu." };

      }
      const file = fileInput[0].files[0];
      if (!file.name.toLowerCase().endsWith('.zip')) {
        throw { message: "File harus berekstensi .zip" };
      }
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:8000/analisis/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Terjadi kesalahan pada server.');
      }

      const rekomendasiClass = `rekomendasi-${data.rekomendasi.replace(' ', '-')}`;

      // PERUBAHAN DI SINI: Baca data objek dan buat format HTML yang lebih detail
      let faktaPolaRuangHtml = '<ul>';
      data.detail_analisis.fakta_pola_ruang.forEach(item => {
        faktaPolaRuangHtml += `
              <li>
                  <strong>Zona:</strong> ${item.zona}<br>
                  <strong>Luas:</strong> ${item.luas} m² (${item.persentase}%)
              </li>`;
      });
      faktaPolaRuangHtml += '</ul>';

      const reportHtml = `
          <h3>Hasil Analisis<h3>
          <h5>KESIMPULAN: <span class="${rekomendasiClass}">${data.rekomendasi}</span></h5>
          <p><strong>Alasan:</strong> ${data.alasan}</p>
          <hr>
          <h5>Detail Analisis:</h5>
          <p><strong>Total Luas Tanah:</strong> ${data.detail_analisis.total_luas_tanah_m2} m²</p>
          <p><strong>Fakta Pola Ruang:</strong></p>
          ${faktaPolaRuangHtml}
          <p><strong>Fakta LP2B:</strong> ${data.detail_analisis.fakta_lp2b}</p>
          <button id="btn-download-pdf" class="btn btn-success btn-lg mt-4 px-5"> Unduh Peta</button>
      `;
      resultDiv.html(reportHtml);
      $('#close_alert').click();
      resultDiv.show()
    } catch (error) {
      resultDiv.hide()
      $('#alert-area').html(`
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
          Error: ${error.message}
          <button type="button" id="close_alert" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `);
    }
    hideLoading();
  });


  $(document).on('click', '#btn-download-pdf', function () {
    console.log('download');
  
    const link = $('<a>')
      .attr('href', 'document/Archive.zip')
      .attr('download', 'Archive.zip')
      .appendTo('body');
  
    link[0].click();
    link.remove();
  });

  function showLoading() {
    document.getElementById('loading-overlay').classList.remove('d-none');
  }
  
  function hideLoading() {
    document.getElementById('loading-overlay').classList.add('d-none');
  }

});
