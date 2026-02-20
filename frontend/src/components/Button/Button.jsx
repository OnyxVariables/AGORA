import "./Button.css";

export function Button({ children, onClick, className = "" }) {
  return (
    <button className={`btn ${className}`} onClick={onClick}>
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

export function ButtonEdit({ onClick }) {
  return (
    <Button className="btn--edit" onClick={onClick}>
      Editar
    </Button>
  );
}

export function ButtonDelete({ onClick }) {
  return (
    <Button className="btn--delete" onClick={onClick}>
      Eliminar
    </Button>
  );
}

export function ButtonCancel({ onClick }) {
  return (
    <Button className="btn--cancel" onClick={onClick}>
      Cancelar
    </Button>
  );
}

export function ButtonSave({ onClick }) {
  return (
    <Button className="btn--save" onClick={onClick}>
      Guardar
    </Button>
  );
}
