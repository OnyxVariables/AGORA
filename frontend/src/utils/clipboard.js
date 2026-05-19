/**
 * Copia texto al portapapeles. navigator.clipboard solo existe en contexto seguro (HTTPS).
 * Fallback con execCommand para HTTP o navegadores antiguos.
 */
export async function copyTextToClipboard(text) {
  if (text == null || text === "") {
    return false;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Sigue al fallback
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}
