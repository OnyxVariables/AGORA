import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  showConfirmButton: false,
  position: "bottom-end",
  timer: 2000,
  timerProgressBar: true,
  width: "380px",
  padding: "0.5em",
});

const ToastTiny = Swal.mixin({
  toast: true,
  showConfirmButton: false,
  position: "top",
  timer: 1600,
  timerProgressBar: false,
  width: "auto",
  padding: "0.55em 0.9em 0.55em 0.75em",
  background: "#17171A",
  color: "#FFFFFF",
  customClass: {
    popup: "cmc-toast",
  },
});

const ToastNotice = Swal.mixin({
  toast: true,
  showConfirmButton: false,
  position: "top",
  timer: 5000,
  timerProgressBar: true,
  width: "auto",
  padding: "0.55em 0.9em 0.55em 0.75em",
  background: "#17171A",
  color: "#FFFFFF",
  customClass: {
    popup: "cmc-toast",
  },
});

const Popup = Swal.mixin({
  toast: false,
  confirmButtonColor: "#3d0091",
  allowOutsideClick: true,
  allowEscapeKey: true,
  customClass: {
    popup: "custom-popup",
    container: "custom-backdrop",
  },
});

export { Popup };

export const popupConfirm = async (title, text = "") => {
  const result = await Popup.fire({
    icon: "question",
    title: title,
    text: text,
    showCancelButton: true,
    confirmButtonText: "Confirmar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) {
    return false;
  }

  return true;
};

export const popupError = (title) => Popup.fire({ icon: "error", title });

export const popupInfo = (title, text = "") =>
  Popup.fire({ icon: "success", title, text });

export const toastSuccess = (title) => Toast.fire({ icon: "success", title });

export const toastTiny = (title) =>
  ToastTiny.fire({
    title,
    icon: false,
    iconHtml: '<span class="cmc-check">&#10003;</span>',
    showClass: {
      popup: "cmc-toast-in",
    },
    hideClass: {
      popup: "cmc-toast-out",
    },
  });

export const toastNotice = (title) =>
  ToastNotice.fire({
    title,
    icon: false,
    iconHtml: '<span class="cmc-check">&#10003;</span>',
    showClass: {
      popup: "cmc-toast-in",
    },
    hideClass: {
      popup: "cmc-toast-out",
    },
  });
