import { Button } from "../Button/Button";
import "./Pagination.css";

/**
 * @param {object} props
 * @param {number} props.page
 * @param {number} props.totalPages
 * @param {number} props.totalItems
 * @param {string} [props.itemLabel]
 * @param {boolean} props.loading
 * @param {() => void} props.onPrev
 * @param {() => void} props.onNext
 */
export default function Pagination({
  page,
  totalPages,
  totalItems,
  itemLabel = "elementos",
  loading,
  onPrev,
  onNext,
}) {
  const info = `Página ${page} de ${totalPages} · ${totalItems.toLocaleString("es-ES")} ${itemLabel}`;

  return (
    <div className="pagination" role="navigation" aria-label="Paginación">
      <p className="pagination__info">{info}</p>
      <div className="pagination__actions">
        <Button
          type="button"
          className="btn--pager"
          disabled={loading || page <= 1}
          onClick={onPrev}
        >
          « Anterior
        </Button>
        <Button
          type="button"
          className="btn--pager"
          disabled={loading || page >= totalPages}
          onClick={onNext}
        >
          Siguiente »
        </Button>
      </div>
    </div>
  );
}