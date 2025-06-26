import Swal from 'sweetalert2';

export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  width: '380px',
  padding: '0.8rem',
  background: '#1a1a1a',
  color: 'white',
  iconColor: '#F32B3B',
  timer: 3000,
  timerProgressBar: true,
  showConfirmButton: false,
  didOpen: (toast) => {
    toast.style.border = '1px solid rgba(243, 43, 59, 0.3)';
    toast.style.borderRadius = '8px';
  }
}); 