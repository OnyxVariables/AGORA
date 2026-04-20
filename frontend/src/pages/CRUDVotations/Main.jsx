import { useEffect, useRef, useState } from "react";
import "./Main.css";
import Table from "../../components/Table/Table";
import Form from "../../components/Form/Form";
import {
  ButtonCreate,
  ButtonEdit,
  ButtonDelete,
} from "../../components/Button/Button";
import { formatDate } from "../../utils/date";
import { popupError, toastSuccess, toastTiny } from "../../services/alerts";
import { getXsrfToken } from "../../services/xsrf";
import { API_CONFIG } from "../../config/api";

export default function App() {
  const [votations, setVotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState({});
  const [editId, setEditId] = useState(null);
  const prevStatesRef = useRef({});

  const emptyVotation = {
    title: "",
    description: "",
    startDate: "",
  };

  const columnNames = {
    id: "ID",
    txHash: "HASH",
    title: "TÍTULO",
    description: "DESCRIPCIÓN",
    startDate: "FECHA INICIO",
    endDate: "FECHA FIN",
    state: "ESTADO",
    startBlockHash: "BLOQUE INICIO",
    endBlockHash: "BLOQUE FIN",
    actions: "ACCIONES",
  };

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
        // Detectar votaciones que acaban de pasar a finished por el scheduler
        const prevStates = prevStatesRef.current;
        data.forEach((v) => {
          if (v.state === "finished" && prevStates[v.id] && prevStates[v.id] !== "finished") {
            toastSuccess(`Votación "${v.title}" finalizada automáticamente`);
          }
          prevStates[v.id] = v.state;
        });
        setVotations(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar
    void fetchVotations();
  }, []);

  const openCreateForm = () => {
    setFormData(emptyVotation);
    setEditId(null);
    setIsFormVisible(true);
  };

  const toDatetimeLocalValue = (isoOrMysql) => {
    if (!isoOrMysql) return "";
    const d = new Date(isoOrMysql);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openEditForm = (votation) => {
    setFormData({
      title: votation.title,
      description: votation.description,
      startDate: toDatetimeLocalValue(votation.startDate),
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
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          popupError(data.error || "Error al guardar la votación");
          throw new Error(data.error || "Error al guardar la votación");
        }
        return data;
      })
      .then(() => {
        setIsFormVisible(false);
        fetchVotations();
        toastSuccess(editId ? "Votación actualizada" : "Votación programada");
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
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          popupError(data.error || "Error al eliminar la votación");
          throw new Error(data.error || "Error al eliminar la votación");
        }
        return data;
      })
      .then(() => {
        fetchVotations();
        toastSuccess("Votación eliminada");
      })
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
    const getStateClass = (state) => {
      switch (state) {
        case 'active': return 'state-badge state-active';
        case 'cancelled': return 'state-badge state-cancelled';
        case 'finished': return 'state-badge state-finished';
        case 'pending': return 'state-badge state-pending';
        default: return 'state-badge';
      }
    };

    const CopyButton = ({ text }) => {
      if (!text) return null;
      const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
          toastTiny("Copiado");
        }).catch(() => {});
      };
      return (
        <button
          onClick={handleCopy}
          title="Copiar al portapapeles"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 0 0 4px",
            display: "inline-flex",
            alignItems: "center",
            verticalAlign: "middle",
          }}
        >
          <img
            src="/img/copy.svg"
            alt="Copiar"
            width="14"
            height="14"
            style={{ filter: "invert(0.4)" }}
          />
        </button>
      );
    };

    const votationsWithActions = votations.map((votation) => ({
      ...votation,
      txHash: votation.txHash ? (
        <>{votation.txHash.slice(0, 14)}…<CopyButton text={votation.txHash} /></>
      ) : "—",
      startBlockHash: votation.startBlockHash ? (
        <>{votation.startBlockHash.slice(0, 14)}…<CopyButton text={votation.startBlockHash} /></>
      ) : "—",
      endBlockHash: votation.endBlockHash ? (
        <>{votation.endBlockHash.slice(0, 14)}…<CopyButton text={votation.endBlockHash} /></>
      ) : "—",
      startDate: formatDate(votation.startDate),
      endDate: formatDate(votation.endDate),
      state: <span className={getStateClass(votation.state)}>{votation.state}</span>,
      _isDisabled: votation.state === "finished" || votation.state === "cancelled",
      actions: (
        <div className="action-container">
          <ButtonEdit
            disabled={votation.state === "active" || votation.state === "finished" || votation.state === "cancelled"}
            onClick={() => openEditForm(votation)}
          />
          <ButtonDelete
            disabled={votation.state === "active" || votation.state === "finished" || votation.state === "cancelled"}
            onClick={() => handleDelete(votation.id)}
          />
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
            getRowClass={(row) => row._isDisabled ? 'row-disabled' : ''}
            />
          )}
      </section>
    </main>
  );
}
