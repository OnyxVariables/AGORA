import { useCallback, useEffect, useId, useRef, useState } from "react";
import VotationStatusBadge from "./VotationStatusBadge";
import "./VotationPicker.css";

/**
 * Selector de votación con pastilla de estado coloreada
 *
 * @param {object} props
 * @param {string} props.id - id del control (label visible opcional)
 * @param {string|null} [props.label] - Si se omite o es vacío, no se muestra etiqueta; usar `ariaLabel` para accesibilidad
 * @param {string} [props.ariaLabel] - Para el botón cuando no hay `label` visible
 * @param {{ id: number, title: string, state: string }[]} props.items
 * @param {string|number|null} props.value - id seleccionado o vacío
 * @param {(id: string) => void} props.onChange
 * @param {string} [props.placeholderLabel]
 * @param {string} [props.placeholderValue]
 * @param {boolean} [props.disabled]
 * @param {'default'|'compact'} [props.variant]
 */
export default function VotationPicker({
  id,
  label,
  ariaLabel,
  items = [],
  value,
  onChange,
  placeholderLabel = "Selecciona…",
  placeholderValue = "",
  disabled = false,
  variant = "default",
}) {
  const listId = useId();
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);

  const strVal = value === null || value === undefined ? placeholderValue : String(value);

  const selected = items.find((v) => String(v.id) === strVal);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pick = (vid) => {
    onChange(String(vid));
    close();
  };

  const showLabel = label != null && String(label).trim() !== "";

  return (
    <article
      className={`votation-picker ${variant === "compact" ? "votation-picker--compact" : ""}`}
      ref={wrapRef}
    >
      {showLabel ? (
        <label className="votation-picker__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div className="votation-picker__shell">
        <button
          type="button"
          id={id}
          className="votation-picker__trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={showLabel ? undefined : ariaLabel ?? "Seleccionar votación"}
          disabled={disabled || items.length === 0}
          onClick={() => {
            if (!disabled && items.length > 0) setOpen((o) => !o);
          }}
        >
          {selected ? (
            <>
              <span className="votation-picker__line">
                #{selected.id} — {selected.title}
              </span>
              <VotationStatusBadge state={selected.state} />
            </>
          ) : (
            <span className="votation-picker__placeholder">{placeholderLabel}</span>
          )}
          <span className="votation-picker__chevron" aria-hidden>
            ▾
          </span>
        </button>
        {open && items.length > 0 ? (
          <ul id={listId} className="votation-picker__menu" role="listbox">
            {items.map((v) => (
              <li key={v.id} role="presentation">
                <button
                  type="button"
                  className={`votation-picker__option ${
                    String(v.id) === strVal ? "votation-picker__option--current" : ""
                  }`}
                  role="option"
                  aria-selected={String(v.id) === strVal}
                  onClick={() => pick(v.id)}
                >
                  <span className="votation-picker__option-title">
                    #{v.id} — {v.title}
                  </span>
                  <VotationStatusBadge state={v.state} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}