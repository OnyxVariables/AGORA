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

/**
 * Confirmación de borrado con escritura obligatoria de la palabra "Eliminar".
 * Pensado para acciones destructivas (partidos, votaciones, etc.) y mucho
 * más seguro que un `window.confirm()` nativo.
 *
 * @param {object} options
 * @param {string} options.entityType  Tipo legible del elemento, ej. "partido"
 * @param {string} options.entityName  Nombre concreto, ej. "PP" o "Elecciones 2024"
 * @param {string} [options.warning]   Texto adicional para el cuerpo del modal.
 * @returns {Promise<boolean>} true si el usuario confirma escribiendo "Eliminar".
 */
export const popupDeleteConfirm = async ({ entityType, entityName, warning } = {}) => {
  const expectedWord = "Eliminar";
  const safeName = entityName ? String(entityName) : "";
  const titleText = `Eliminar ${entityType}`;

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const html = `
    <div class="delete-confirm">
      <p class="delete-confirm__lead">
        Vas a eliminar la ${escapeHtml(entityType)}
        ${safeName ? `<strong>«${escapeHtml(safeName)}»</strong>` : ""}.
      </p>
      <p class="delete-confirm__warning">
        ${escapeHtml(warning || "Esta acción no se puede deshacer.")}
      </p>
      <p class="delete-confirm__instruction">
        Escribe <strong>${expectedWord}</strong> para confirmar:
      </p>
    </div>
  `;

  const result = await Popup.fire({
    title: titleText,
    html,
    icon: "warning",
    input: "text",
    inputAttributes: {
      autocapitalize: "off",
      autocomplete: "off",
      spellcheck: "false",
      "aria-label": `Escribe ${expectedWord} para confirmar`,
      placeholder: expectedWord,
    },
    inputValidator: (value) => {
      if (!value || value.trim() !== expectedWord) {
        return `Debes escribir exactamente "${expectedWord}" para confirmar.`;
      }
      return undefined;
    },
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc2626",
    focusCancel: true,
    customClass: {
      popup: "custom-popup delete-confirm__popup",
      container: "custom-backdrop delete-confirm__backdrop",
      input: "delete-confirm__input",
      confirmButton: "delete-confirm__confirm",
      cancelButton: "delete-confirm__cancel",
    },
  });

  return result.isConfirmed;
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
