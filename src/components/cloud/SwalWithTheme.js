import Swal from 'sweetalert2';

export function swalWithTheme(config) {
  return Swal.fire({
    background: '#1a1a1a',
    color: 'white',
    confirmButtonColor: '#F32B3B',
    cancelButtonColor: '#333',
    iconColor: '#F32B3B',
    customClass: {
      popup: 'swal-dark',
      confirmButton: 'swal-dark-confirm',
      cancelButton: 'swal-dark-cancel'
    },
    ...config
  });
} 