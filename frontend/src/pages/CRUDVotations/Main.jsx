import { useEffect, useState } from "react";
import "./Main.css";
import Table from "../../components/Table/Table";
import Form from "../../components/Form/Form";
import {
  ButtonCreate,
  ButtonEdit,
  ButtonDelete,
} from "../../components/Button/Button";
import { popupError } from "../../services/alerts";
import { getXsrfToken } from "../../services/xsrf";
import { API_CONFIG } from "../../config/api";

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
  fetch(API_CONFIG.endpoints.VOTATIONS, {
    credentials: "include",
    headers: { Accept: "application/json" },
  })
    .then((res) => {
      if (res.status === 403) {
        window.location.href = "/";  
      }
      if (!res.ok) throw new Error("Error en la petición");
      return res.json();
    })
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

    const xsrfToken = await getXsrfToken();
    if (!xsrfToken) {
      popupError("No se pudo realizar la operación");
      console.log("No se pudo obtener el token CSRF");
      return;
    }

    const url = editId ? `${API_CONFIG.endpoints.VOTATIONS}/${editId}` : API_CONFIG.endpoints.VOTATIONS;
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

    const xsrfToken = await getXsrfToken();
    if (!xsrfToken) {
      popupError("No se pudo eliminar la votación");
      console.log("No se pudo obtener el token CSRF");
      return;
    }

    fetch(`${API_CONFIG.endpoints.VOTATIONS}/${id}`, {
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
