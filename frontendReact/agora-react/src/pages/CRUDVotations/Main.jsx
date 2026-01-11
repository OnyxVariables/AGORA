import { useEffect, useState } from "react";
import "./Main.css";

function ActionButtons({ votation, onEdit, onDelete }) {
  return (
    <div className="action-container">
      <button className="btn edit" onClick={() => onEdit(votation)}>Editar</button>
      <button className="btn delete" onClick={() => onDelete(votation.id)}>Eliminar</button>
    </div>
  );
}

export default function App() {
  const [votations, setVotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);

  const emptyVotation = {
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    state: "pending",
  };

  const columnNames = {
  id: "ID",
  title: "TÍTULO",
  description: "DESCRIPCIÓN",
  startDate: "FECHA INICIO",
  endDate: "FECHA FIN",
  state: "ESTADO",
  startBlockHash: "BLOQUE INICIO",
  endBlockHash: "BLOQUE FIN",
};

  useEffect(() => {
    fetchVotations();
  }, []);

  const fetchVotations = () => {
    setLoading(true);
    fetch("/api/votations", {
      credentials: "include",
      headers: { "Accept": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        setVotations(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const openCreateForm = () => {
    setFormData(emptyVotation);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (votation) => {
    setFormData({
      title: votation.title,
      description: votation.description,
      startDate: votation.startDate.split("T")[0],
      endDate: votation.endDate ? votation.endDate.split("T")[0] : "",
      state: votation.state,
    });
    setEditingId(votation.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Obtener la cookie CSRF (es lo de sacntum para autenticar o da fallo)
    await fetch("/sanctum/csrf-cookie", {
      credentials: "include",
    });

    const xsrfToken = document.cookie.split("; ").find((row) => row.startsWith("XSRF-TOKEN="))?.split("=")[1];
    
    const url = editingId
      ? `/api/votations/${editingId}`
      : "/api/votations";
    const method = editingId ? "PUT" : "POST";

    fetch(url, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-XSRF-TOKEN": decodeURIComponent(xsrfToken),
      },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then(() => {
        setShowForm(false);
        fetchVotations();
      })
      .catch((err) => console.error(err));
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta votación?")) return;

    await fetch("/sanctum/csrf-cookie", {
      credentials: "include",
    });

    const xsrfToken = document.cookie.split("; ").find((row) => row.startsWith("XSRF-TOKEN="))?.split("=")[1];

    fetch(`/api/votations/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { 
        Accept: "application/json",
        "X-XSRF-TOKEN": decodeURIComponent(xsrfToken), 
      },
    })
      .then(() => fetchVotations())
      .catch((err) => console.error(err));
  };

  if (loading) return <p>Cargando votaciones...</p>;
  if (votations.length === 0 && !showForm)
    return (
      <main className="crudvotations">
        <section className="container">
          <p>No hay votaciones creadas</p>
          <button className="btn create" onClick={openCreateForm}>Crear</button>
        </section>
      </main>
    );

  const headers = votations[0] ? Object.keys(votations[0]) : [];

  return (
    <main className="crudvotations">
      <section className="container">

        {showForm && (
          <form className="form" onSubmit={handleSubmit}>
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
              min={!editingId ? new Date().toISOString().split("T")[0] : ""}
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
              <button className="btn save">Guardar</button>
              <button type="button" className="btn cancel" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {votations.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header} className="cell cell-header">
                    {columnNames[header] || header.toUpperCase()}
                  </th>
                ))}
                <th className="cell cell-header">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {votations.map((votation) => (
                <tr key={votation.id} data-id={votation.id}>
                  {headers.map((key) => (
                    <td key={key} className="cell">{votation[key]}</td>
                  ))}
                  <td className="cell">
                    <ActionButtons
                      votation={votation}
                      onEdit={openEditForm}
                      onDelete={handleDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button className="btn create" onClick={openCreateForm}>Crear</button>
      </section>
    </main>
  );
}
