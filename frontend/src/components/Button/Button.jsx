import "./Button.css";

export function Button({
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}) {
  return (
    <button
      type={type}
      className={`btn ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function ButtonCreate({ onClick }) {
  return (
    <Button className="btn--create" onClick={onClick}>
      Crear
    </Button>
  );
}

export function ButtonEdit({ onClick, disabled = false }) {
  return (
    <Button className="btn--edit" onClick={onClick} disabled={disabled}>
      Editar
    </Button>
  );
}

export function ButtonDelete({ onClick, disabled = false }) {
  return (
    <Button className="btn--delete" onClick={onClick} disabled={disabled}>
      Eliminar
    </Button>
  );
}

export function ButtonCancel({ onClick }) {
  return (
    <Button type="button" className="btn--cancel" onClick={onClick}>
      Cancelar
    </Button>
  );
}

export function ButtonSave({ onClick }) {
  return (
    <Button type="submit" className="btn--save" onClick={onClick}>
      Guardar
    </Button>
  );
}