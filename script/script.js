$(function() {

    $('#btn-start, #btn-start-2').click(function() {
      window.location.href = 'analyze.html';
    });
  
    $('#btn-sample').click(function() {
      const link = $('<a>')
          .attr('href', 'document/Archive.zip')
          .attr('download', 'Archive.zip')
          .appendTo('body');
    
      link[0].click();
      link.remove();
    });
  
    $(window).on('scroll', function() {
      if ($(this).scrollTop() > 50) {
        $('.navbar').addClass('bg-dark shadow');
      } else {
        $('.navbar').removeClass('shadow');
      }
    });

    $('#btn-upload').on('click', function () {
        window.location.href = 'analyze.html';
      });
  
  });
  