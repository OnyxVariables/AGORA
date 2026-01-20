import { useEffect, useState } from "react";
import "./Main.css";
import Table from "../../components/Table/Table";
import Form from "../../components/Form/Form";
import {
  ButtonCreate,
  ButtonEdit,
  ButtonDelete,
} from "../../components/Button/Button";

export default function App() {
  const [votations, setVotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState({});
  const [editId, setEditId] = useState(null);

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
    actions: "ACCIONES",
  };

  useEffect(() => {
    fetchVotations();
  }, []);

  const fetchVotations = () => {
    setLoading(true);
    fetch("/api/votations", {
      credentials: "include",
      headers: { Accept: "application/json" },
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
    setEditId(null);
    setIsFormVisible(true);
  };

  const openEditForm = (votation) => {
    setFormData({
      title: votation.title,
      description: votation.description,
      startDate: votation.startDate.split("T")[0],
      endDate: votation.endDate ? votation.endDate.split("T")[0] : "",
      state: votation.state,
    });
    setEditId(votation.id);
    setIsFormVisible(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Obtener la cookie CSRF (es lo de sacntum para autenticar o da fallo)
    await fetch("/sanctum/csrf-cookie", {
      credentials: "include",
    });

    const xsrfToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];

    const url = editId ? `/api/votations/${editId}` : "/api/votations";
    const method = editId ? "PUT" : "POST";

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
        setIsFormVisible(false);
        fetchVotations();
      })
      .catch((err) => console.error(err));
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta votación?")) return;

    await fetch("/sanctum/csrf-cookie", {
      credentials: "include",
    });

    const xsrfToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];

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
  if (votations.length === 0 && !isFormVisible)
    return (
      <main className="crudvotations">
        <section className="container">
          <ButtonCreate onClick={openCreateForm}></ButtonCreate>
          <p>No hay votaciones creadas</p>
        </section>
      </main>
    );

  const headers = votations[0] ? Object.keys(votations[0]) : [];

  // Add action column
  headers.push("actions");
  const votationsWithActions = votations.map((votation) => ({
    ...votation,
    actions: (
      <div className="action-container">
        <ButtonEdit onClick={() => openEditForm(votation)} />
        <ButtonDelete onClick={() => handleDelete(votation.id)} />
      </div>
    ),
  }));

  return (
    <main className="crudvotations">
      <section className="container">
        <ButtonCreate onClick={openCreateForm} />

        {isFormVisible && (
          <Form
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormVisible(false)}
            editId={editId}
          />
        )}

        {votations.length > 0 && (
          <Table
            id="crudvotations"
            headings={headers.map((header) => columnNames[header])}
            rows={votationsWithActions}
          />
        )}
      </section>
    </main>
  );
}
