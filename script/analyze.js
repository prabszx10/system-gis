$(function () {
  const dropArea = $('#drop-area');
  const fileInput = $('#fileInput');
  const resultDiv = $('#result');

  $('#preview-modal').modal('show');

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

  $('#button-download-shp').click(function() {
    const link = $('<a>')
        .attr('href', 'document/template_shp.zip')
        .attr('download', 'template_shp.zip')
        .appendTo('body');
  
    link[0].click();
    link.remove();
  });

  $('#button-dismiss-modal').click(function() {
    let checked = $('#checkbox_modal').prop('checked')

    if(checked){
      $('#preview-modal').modal('hide');
    } else{
      alert("Harap Centang Checkbox Persetujuan")
    }
  });

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

  var selectedFile = null;
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

      let penggunaanTanahHtml = '<ul>';
      data.detail_analisis.penggunaan_tanah.forEach(item => {
        penggunaanTanahHtml += `
              <li>
                  <strong>Penggunaan:</strong> ${item.p_lahan}<br>
                  <strong>Luas:</strong> ${item.luas} m²
              </li>`;
      });
      penggunaanTanahHtml += '</ul>';

      const reportHtml = `
          <h3>Hasil Analisis<h3>
          <h5>REVIEW BIDANG TANAH</span></h5>
          <p><strong>Alasan:</strong> ${data.alasan}</p>
          <hr>
          <h5>Detail Analisis:</h5>
          <p><strong>Total Luas Tanah:</strong> ${data.detail_analisis.total_luas_tanah_m2} m²</p>
          <p><strong>Fakta LP2B:</strong> ${data.detail_analisis.fakta_lp2b}</p>
          <p><strong>Batas Administrasi:</strong> Desa ${data.detail_analisis.batas_administrasi.desa} (Kecamantan ${data.detail_analisis.batas_administrasi.kecamatan})</p>
          <p><strong>Penggunaan Tanah:</strong> ${penggunaanTanahHtml}</p>
          <p><strong>Kemampuan Tanah:</strong> ${data.detail_analisis.kemampuan_tanah} </p>
          <p><strong>Pola Ruang RTRW:</strong> ${data.detail_analisis.pola_ruang_rtrw} </p>
          <p><strong>Ketersediaan Tanah:</strong> ${data.detail_analisis.ketersediaan_tanah} </p>
          <p><strong>Simpulan Pertimbangan Teknis Pertanahan:</strong> ${data.detail_analisis.simpulan_ptp} </p>
          <button id="btn-download-pdf" class="btn btn-success btn-lg mt-4 px-5"> Unduh Peta</button>
      `;
      resultDiv.html(reportHtml);

      $('#btn-download-pdf').off('click').on('click', function() {
          prosesDanDownloadPertek(file); 
      });

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

async function prosesDanDownloadPertek(fileData) {
    showLoading();
    try {
        const formData = new FormData();
        formData.append('file', fileData);

        const response = await fetch('http://127.0.0.1:8000/analisis-pertek/', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.status === "Success" && data.base64_file) {
            // Jalankan prosedur download Base64
            const link = document.createElement('a');
            link.href = `data:application/zip;base64,${data.base64_file}`;
            link.download = data.file_name || "hasil_peta.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("Gagal memproses download: " + (data.message || "Data tidak lengkap"));
        }
    } catch (e) {
        console.error(e);
        alert("Terjadi kesalahan saat memproses peta.");
    } finally {
        hideLoading();
    }
}

  function showLoading() {
    document.getElementById('loading-overlay').classList.remove('d-none');
  }
  
  function hideLoading() {
    document.getElementById('loading-overlay').classList.add('d-none');
  }

});
