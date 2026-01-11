import "./Form.css"
import { ButtonSave, ButtonCancel } from "../Button/Button";

export default function Form({ formData, setFormData, onSubmit, onCancel, ...props }) {
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
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />

      <input
        type="date"
        value={formData.startDate}
        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
        required
        min={!props.editingId ? new Date().toISOString().split("T")[0] : ""}
      />

      <input
        type="date"
        value={formData.endDate}
        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
        min={formData.startDate}
      />

      <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })}>
        <option value="pending">Pending</option>
        <option value="active">Active</option>
        <option value="finished">Finished</option>
      </select>

      <div className="form-actions">
        <ButtonCancel onClick={onCancel} />
        <ButtonSave />
      </div>
    </form>
  )
}
