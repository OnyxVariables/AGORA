import "./Form.css";
import { ButtonSave, ButtonCancel } from "../Button/Button";
import Tooltip from "../Tooltip/Tooltip";
import { useVotationConfig } from "../../hooks/useVotationConfig";

export default function Form({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  editId = null,
}) {
  const update = (field, value) => setFormData({ ...formData, [field]: value });

  // En creación restrinjo la fecha mínima al "ahora" del usuario para
  // evitar que se programen votaciones en el pasado por accidente.
  const minStartDate = !editId
    ? new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : undefined;

  const { config } = useVotationConfig();
  const durationLabel = config?.duration?.label ?? "—";

  return (
    <form className="form votation-form" onSubmit={onSubmit}>
      <fieldset className="form__fieldset">
        <legend className="form__legend">Datos básicos</legend>

        <div className="form__field form__field--full">
          <label className="form__label" htmlFor="votation-title">
            Título de la votación
          </label>
          <input
            id="votation-title"
            className="form__input"
            type="text"
            value={formData.title || ""}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Ej. Elecciones Generales 2026"
            required
          />
        </div>

        <div className="form__field form__field--full">
          <label className="form__label" htmlFor="votation-description">
            Descripción
          </label>
          <textarea
            id="votation-description"
            className="form__input form__input--textarea"
            value={formData.description || ""}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Explica brevemente el alcance y reglas de la votación"
          />
        </div>
      </fieldset>

      <fieldset className="form__fieldset">
        <legend className="form__legend">Programación</legend>

        <div className="form__field form__field--full">
          <label className="form__label" htmlFor="votation-start-date">
            Fecha y hora de inicio
            <Tooltip position="right">
              Duración fija: <strong>{durationLabel}</strong>. La fija el
              servidor a partir de <code>VOTATION_DURATION_MINUTES</code> y se
              suma automáticamente al inicio para calcular el fin.
            </Tooltip>
          </label>
          <input
            id="votation-start-date"
            className="form__input"
            type="datetime-local"
            value={formData.startDate || ""}
            onChange={(e) => update("startDate", e.target.value)}
            required
            min={minStartDate}
          />
        </div>
      </fieldset>

      <div className="form-actions">
        <ButtonCancel onClick={onCancel} />
        <ButtonSave />
      </div>
    </form>
  );
}