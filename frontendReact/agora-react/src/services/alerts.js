import Swal from "sweetalert2";

const Toast = Swal.mixin({
    toast: true,
    showConfirmButton: false,
    position: 'bottom-end',
    timer: 2000,
    timerProgressBar: true,
    width: '380px',
    padding: '0.5em',
});
  
const Popup = Swal.mixin({
    toast: false,
    confirmButtonColor: "#3d0091",
    allowOutsideClick: true,
    allowEscapeKey: true,
    customClass: {
      popup: 'custom-popup',
      container: "custom-backdrop"
    }
});

export const popupError = (title) =>
  Popup.fire({ icon: "error", title });

export const toastSuccess = (title) =>
  Toast.fire({ icon: "success", title });