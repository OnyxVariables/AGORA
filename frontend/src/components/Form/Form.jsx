import "./Form.css";
import { ButtonSave, ButtonCancel } from "../Button/Button";

export default function Form({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  ...props
}) {
  return (
    <form className="form" onSubmit={onSubmit}>
      <input
        placeholder="Título"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />

      <textarea
        placeholder="Descripción"
        value={formData.description || ""}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
      />

      <label className="form-label-datetime">
        Fecha y hora de inicio (duración fija: 12 h en servidor)
        <input
          type="datetime-local"
          value={formData.startDate}
          onChange={(e) =>
            setFormData({ ...formData, startDate: e.target.value })
          }
          required
          min={
            !props.editId
              ? new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16)
              : undefined
          }
        />
      </label>

      <div className="form-actions">
        <ButtonCancel onClick={onCancel} />
        <ButtonSave />
      </div>
    </form>
  );
}
