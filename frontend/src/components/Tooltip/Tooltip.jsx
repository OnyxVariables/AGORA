import { useId } from "react";
import "./Tooltip.css";

function InfoIcon() {
  return (
    <svg
      className="info-tooltip__icon-svg"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <circle cx="8" cy="4.5" r="1" fill="#ffffff" />
      <rect x="7.05" y="6.5" width="1.9" height="5.5" rx="0.95" fill="#ffffff" />
    </svg>
  );
}

/**
 * Tooltip accesible con icono de información. Se activa por hover y por
 * focus de teclado, así que también funciona para usuarios que naveguen
 * con tab. El contenido se pasa como children o como `text`.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.children]  Texto/elementos del tooltip.
 * @param {string} [props.text]               Alternativa rápida a children.
 * @param {"right"|"left"|"top"|"bottom"} [props.position="right"]
 * @param {string} [props.label]              aria-label cuando children no es texto plano.
 * @param {string} [props.className]
 */
export default function Tooltip({
  children,
  text,
  position = "right",
  label,
  className = "",
}) {
  const tooltipId = useId();
  const content = children ?? text;
  const ariaLabel =
    label ?? (typeof content === "string" ? content : "Más información");

  return (
    <span
      className={`info-tooltip info-tooltip--${position} ${className}`.trim()}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
      aria-describedby={tooltipId}
    >
      <span className="info-tooltip__icon" aria-hidden="true">
        <InfoIcon />
      </span>
      <span
        className="info-tooltip__bubble"
        role="tooltip"
        id={tooltipId}
      >
        {content}
      </span>
    </span>
  );
}