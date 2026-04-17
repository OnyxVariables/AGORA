import "./Select.css";

/**
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.label
 * @param {string|number} [props.value]
 * @param {(e: import('react').ChangeEvent<HTMLSelectElement>) => void} [props.onChange]
 * @param {{ value: string|number, label: string }[]} [props.options]
 * @param {string} [props.placeholderLabel]
 * @param {string} [props.placeholderValue]
 * @param {boolean} [props.disabled]
 */
export default function Select({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholderLabel = "Selecciona…",
  placeholderValue = "",
  disabled = false,
}) {
  const selectValue =
    value === null || value === undefined ? placeholderValue : String(value);

  return (
    <article className="select-container">
      <label htmlFor={id}>{label}</label>
      <select
        name={id}
        id={id}
        className="select"
        value={selectValue}
        onChange={onChange}
        disabled={disabled}
      >
        <option value={placeholderValue}>{placeholderLabel}</option>
        {options.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </article>
  );
}
