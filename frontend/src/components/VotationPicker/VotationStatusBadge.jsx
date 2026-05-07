import "./VotationStatusBadge.css";

const LABELS = {
  active: "Activa",
  pending: "Pendiente",
  finished: "Finalizada",
  cancelled: "Cancelada",
};

function normalizeState(state) {
  if (!state || typeof state !== "string") return "unknown";
  const s = state.toLowerCase().trim();
  return LABELS[s] ? s : "unknown";
}

export function votationStateLabel(state) {
  const key = normalizeState(state);
  return LABELS[key] ?? String(state ?? "—");
}

// Pastilla de estado
export default function VotationStatusBadge({ state }) {
  const norm = normalizeState(state);
  return (
    <span className={`votation-status-badge votation-status-badge--${norm}`}>
      {votationStateLabel(state)}
    </span>
  );
}