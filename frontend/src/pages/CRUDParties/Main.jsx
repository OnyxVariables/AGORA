import { useEffect, useMemo, useRef, useState } from "react";
import "./Main.css";
import Table from "../../components/Table/Table";
import Pagination from "../../components/Pagination/Pagination";
import Tooltip from "../../components/Tooltip/Tooltip";
import { LockIcon } from "../../icons";
import PartidoCard from "../Votar/Main";
import {
  ButtonCreate,
  ButtonEdit,
  ButtonDelete,
  ButtonCancel,
  ButtonSave,
} from "../../components/Button/Button";
import {
  popupDeleteConfirm,
  popupError,
  toastSuccess,
  toastTiny,
} from "../../services/alerts";
import { getXsrfToken } from "../../services/xsrf";
import { API_CONFIG } from "../../config/api";

const PAGE_SIZE = 10;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
// Debe coincidir con PartyController::DESCRIPTION_MIN_LENGTH (backend)
const DESCRIPTION_MIN_LENGTH = 500;

const emptyParty = {
  name: "",
  code: "",
  description: "",
  image: "",
  color_background: "#eebefa",
  color_title: "#261a58",
  active: true,
  votationIds: [],
};

const columnNames = {
  id: "ID",
  name: "NOMBRE",
  code: "CÓDIGO",
  description: "DESCRIPCIÓN",
  image: "IMAGEN",
  color_background: "COLOR FONDO",
  color_title: "COLOR TÍTULO",
  votations: "VOTACIONES",
  active: "ESTADO",
  actions: "ACCIONES",
};

const rowKeys = [
  "id",
  "name",
  "code",
  "description",
  "image",
  "color_background",
  "color_title",
  "votations",
  "active",
  "actions",
];

function ColorCell({ value }) {
  if (!value) return "—";

  return (
    <span className="party-color-cell">
      <span className="party-color-cell__swatch" style={{ backgroundColor: value }} />
      <code>{value}</code>
    </span>
  );
}

function ImageCell({ value }) {
  if (!value) return "—";

  return (
    <span className="party-image-cell">
      <span className="party-image-cell__path" title={value}>{value}</span>
      <span className="party-image-cell__thumb">
        <img
          src={value}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </span>
    </span>
  );
}

function VotationsPicker({ votations, selectedIds, onToggle }) {
  if (votations.length === 0) {
    return (
      <p className="party-form__hint">
        No hay votaciones disponibles para asociar.
      </p>
    );
  }

  return (
    <div className="party-form__votations-grid" role="group" aria-label="Votaciones asociadas">
      {votations.map((votation) => {
        const isSelected = selectedIds.includes(votation.id);
        return (
          <button
            key={votation.id}
            type="button"
            onClick={() => onToggle(votation.id)}
            className={`party-form__votation-chip ${
              isSelected ? "party-form__votation-chip--selected" : ""
            }`}
            aria-pressed={isSelected}
          >
            <span className="party-form__votation-chip__check" aria-hidden="true">
              {isSelected ? "✓" : ""}
            </span>
            <span className="party-form__votation-chip__body">
              <span className="party-form__votation-chip__header">
                <span className="party-form__votation-chip__id">#{votation.id}</span>
                <span className="party-form__votation-chip__title">{votation.title}</span>
              </span>
              <span
                className={`party-form__votation-chip__state party-form__votation-chip__state--${votation.state}`}
              >
                {votation.state}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PartyForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  editId,
  votations,
  isUploading,
  onUploadImage,
}) {
  const fileInputRef = useRef(null);

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleVotation = (votationId) => {
    const current = formData.votationIds || [];
    const next = current.includes(votationId)
      ? current.filter((id) => id !== votationId)
      : [...current, votationId];
    updateField("votationIds", next);
  };

  const descriptionLength = (formData.description || "").length;
  const isDescriptionTooShort = descriptionLength < DESCRIPTION_MIN_LENGTH;
  const handleSubmitGuarded = (event) => {
    if (isDescriptionTooShort) {
      event.preventDefault();
      popupError(
        `La descripción debe tener al menos ${DESCRIPTION_MIN_LENGTH} caracteres (actualmente ${descriptionLength}).`
      );
      return;
    }
    if (!formData.image) {
      event.preventDefault();
      popupError("La imagen del partido es obligatoria (URL o archivo subido).");
      return;
    }
    onSubmit(event);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      popupError("Formato no permitido (PNG, JPG, WEBP o SVG)");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      popupError("La imagen excede 4 MB");
      event.target.value = "";
      return;
    }

    const url = await onUploadImage(file);
    if (url) {
      updateField("image", url);
    }
    event.target.value = "";
  };

  return (
    <form className="form party-form" onSubmit={handleSubmitGuarded}>
      <fieldset className="form__fieldset">
        <legend className="form__legend">Identidad del partido</legend>

        <div className="form__field">
          <label className="form__label" htmlFor="party-name">
            Nombre
          </label>
          <input
            id="party-name"
            className="form__input"
            type="text"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Ej. Partido Verde"
            required
          />
        </div>

        <div className="form__field">
          <label className="form__label" htmlFor="party-code">
            Código
            <Tooltip position="right">
              El código se guardará siempre en mayúsculas y debe ser único
              entre todos los partidos. Se usa internamente para identificar
              al partido en la blockchain y en /votar.
            </Tooltip>
          </label>
          <input
            id="party-code"
            className="form__input"
            type="text"
            value={formData.code}
            onChange={(e) => updateField("code", e.target.value.toUpperCase())}
            placeholder="Ej. VERDE"
            required
          />
        </div>

        <div className="form__field form__field--full">
          <label className="form__label" htmlFor="party-description">
            Descripción
            <Tooltip position="right">
              Mínimo <strong>{DESCRIPTION_MIN_LENGTH} caracteres</strong>. La
              descripción se muestra en /home dentro de la tarjeta del
              partido, así que conviene un texto razonablemente extenso.
            </Tooltip>
          </label>
          <textarea
            id="party-description"
            className={`form__input form__input--textarea ${
              isDescriptionTooShort ? "form__input--invalid" : ""
            }`}
            value={formData.description || ""}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Resumen del partido y sus propuestas principales"
            required
            minLength={DESCRIPTION_MIN_LENGTH}
            aria-describedby="party-description-counter"
            aria-invalid={isDescriptionTooShort}
          />
          <p
            id="party-description-counter"
            className={`party-form__counter ${
              isDescriptionTooShort ? "party-form__counter--invalid" : ""
            }`}
          >
            {descriptionLength} / {DESCRIPTION_MIN_LENGTH} caracteres
            {isDescriptionTooShort && (
              <> · faltan {DESCRIPTION_MIN_LENGTH - descriptionLength}</>
            )}
          </p>
        </div>
      </fieldset>

      <fieldset className="form__fieldset">
        <legend className="form__legend">Imagen del partido</legend>

        <div className="form__field form__field--full">
          <label className="form__label" htmlFor="party-image">
            Ruta o URL de la imagen
            <Tooltip position="right">
              Acepta una ruta estática del frontend, por ejemplo
              <code> /img/partidos/PP.png</code>, o una imagen subida al
              servidor con el botón <strong>Subir imagen</strong>, que se
              servirá como <code>/api/parties/image/&lt;archivo&gt;</code>.
            </Tooltip>
          </label>
          <div className="party-form__image-row">
            <input
              id="party-image"
              className="form__input"
              type="text"
              value={formData.image || ""}
              onChange={(e) => updateField("image", e.target.value)}
              placeholder="/img/partidos/EJEMPLO.png"
              required
              maxLength={255}
            />
            <div className="party-form__image-preview" aria-label="Vista previa de la imagen">
              {formData.image ? (
                <img
                  key={formData.image}
                  src={formData.image}
                  alt="Vista previa"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span>Sin imagen</span>
              )}
            </div>
          </div>
        </div>

        <div className="form__field form__field--full">
          <span className="form__label">Subir desde el equipo</span>
          <div className="party-form__image-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              onChange={handleFileChange}
              className="party-form__file-input"
              id="party-image-file"
            />
            <button
              type="button"
              className="btn party-form__upload-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? "Subiendo..." : "Subir imagen"}
            </button>
            <span className="party-form__hint">
              PNG, JPG, WEBP o SVG. Máx. 4 MB. Se guarda en el servidor y queda accesible por todas las páginas.
            </span>
          </div>
        </div>
      </fieldset>

      <fieldset className="form__fieldset form__fieldset--three-cols">
        <legend className="form__legend">Estilo y estado</legend>

        <div className="form__field">
          <label className="form__label" htmlFor="party-color-bg">
            Color de fondo
          </label>
          <input
            id="party-color-bg"
            className="form__input form__input--color"
            type="color"
            value={formData.color_background || "#eebefa"}
            onChange={(e) => updateField("color_background", e.target.value)}
          />
        </div>

        <div className="form__field">
          <label className="form__label" htmlFor="party-color-title">
            Color del título
          </label>
          <input
            id="party-color-title"
            className="form__input form__input--color"
            type="color"
            value={formData.color_title || "#261a58"}
            onChange={(e) => updateField("color_title", e.target.value)}
          />
        </div>

        <div className="form__field">
          <label className="form__label" htmlFor="party-active">
            Estado
          </label>
          <select
            id="party-active"
            className="form__input form__input--select"
            value={formData.active ? "1" : "0"}
            onChange={(e) => updateField("active", e.target.value === "1")}
          >
            <option value="1">Activo</option>
            <option value="0">Inactivo</option>
          </select>
        </div>
      </fieldset>

      <fieldset className="form__fieldset">
        <legend className="form__legend">Votaciones asociadas</legend>
        <div className="form__field form__field--full">
          <span className="form__label" id="party-votations-label">
            Selecciona en qué votaciones aparecerá el partido
            <Tooltip position="right">
              Pulsa sobre una votación para asociarla. Si una votación no
              tiene partidos asociados explícitamente, se usarán todos los
              partidos activos por compatibilidad.
            </Tooltip>
          </span>
          <div role="group" aria-labelledby="party-votations-label">
            <VotationsPicker
              votations={votations}
              selectedIds={formData.votationIds || []}
              onToggle={toggleVotation}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="form__fieldset">
        <legend className="form__legend">Vista previa (tarjeta de /votar)</legend>
        <div className="form__field form__field--full">
          <div className="party-form__preview-frame">
            <PartidoCard
              nombre={formData.name || "Vista previa del partido"}
              value={formData.code || "PREVIEW"}
              imagen={formData.image || "/img/copy.svg"}
              colores={{
                fondo: formData.color_background || "#eebefa",
                titulo: formData.color_title || "#261a58",
              }}
              isSelected={false}
              onSelect={() => {}}
            />
          </div>
        </div>
      </fieldset>

      <div className="form-actions">
        <ButtonCancel onClick={onCancel} />
        <ButtonSave />
      </div>

      {editId && <p className="party-form__hint">Editando partido ID {editId}</p>}
    </form>
  );
}

export default function Main() {
  const [parties, setParties] = useState([]);
  const [votations, setVotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState(emptyParty);
  const [editId, setEditId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchParties = () => {
    setLoading(true);
    fetch(API_CONFIG.endpoints.ADMIN_PARTIES, {
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
        setParties(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        popupError("No se pudieron cargar los partidos");
      });
  };

  const fetchVotations = () => {
    fetch(API_CONFIG.endpoints.VOTATIONS_SUMMARY, {
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error en la petición");
        return res.json();
      })
      .then((data) => setVotations(data))
      .catch((err) => {
        console.error(err);
        popupError("No se pudieron cargar las votaciones");
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar
    void fetchParties();
    void fetchVotations();
  }, []);

  const openCreateForm = () => {
    setFormData(emptyParty);
    setEditId(null);
    setIsFormVisible(true);
  };

  const openEditForm = (party) => {
    setFormData({
      name: party.name || "",
      code: party.code || "",
      description: party.description || "",
      image: party.image || "",
      color_background: party.color_background || "#eebefa",
      color_title: party.color_title || "#261a58",
      active: Boolean(party.active),
      votationIds: party.votationIds || [],
    });
    setEditId(party.id);
    setIsFormVisible(true);
  };

  const uploadImage = async (file) => {
    const xsrfToken = await getXsrfToken();
    if (!xsrfToken) {
      popupError("No se pudo subir la imagen (sin CSRF)");
      return null;
    }

    const body = new FormData();
    body.append("image", file);

    setIsUploading(true);
    try {
      const res = await fetch(API_CONFIG.endpoints.ADMIN_PARTIES_UPLOAD_IMAGE, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-XSRF-TOKEN": decodeURIComponent(xsrfToken),
        },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        popupError(data.message || "Error al subir la imagen");
        return null;
      }
      toastTiny("Imagen subida");
      return data.url;
    } catch (err) {
      console.error(err);
      popupError("Error al subir la imagen");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const xsrfToken = await getXsrfToken();
    if (!xsrfToken) {
      popupError("No se pudo realizar la operación");
      console.log("No se pudo obtener el token CSRF");
      return;
    }

    const url = editId
      ? `${API_CONFIG.endpoints.ADMIN_PARTIES}/${editId}`
      : API_CONFIG.endpoints.ADMIN_PARTIES;
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
          const message = data.message || data.error || "Error al guardar el partido";
          popupError(message);
          throw new Error(message);
        }
        return data;
      })
      .then(() => {
        setIsFormVisible(false);
        fetchParties();
        toastSuccess(editId ? "Partido actualizado" : "Partido creado");
      })
      .catch((err) => console.error(err));
  };

  const handleDelete = async (party) => {
    const confirmed = await popupDeleteConfirm({
      entityType: "partido",
      entityName: party?.name,
      warning:
        "Esta acción desactiva el partido. Si pertenece a una votación activa la operación será rechazada por el servidor.",
    });
    if (!confirmed) return;

    const xsrfToken = await getXsrfToken();
    if (!xsrfToken) {
      popupError("No se pudo desactivar el partido");
      console.log("No se pudo obtener el token CSRF");
      return;
    }

    fetch(`${API_CONFIG.endpoints.ADMIN_PARTIES}/${party.id}`, {
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
          const message = data.message || data.error || "Error al desactivar el partido";
          popupError(message);
          throw new Error(message);
        }
        return data;
      })
      .then(() => {
        fetchParties();
        toastSuccess("Partido desactivado");
      })
      .catch((err) => console.error(err));
  };

  const totalPages = Math.max(1, Math.ceil(parties.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedParties = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return parties.slice(start, start + PAGE_SIZE);
  }, [parties, page]);

  if (loading) return <p>Cargando partidos...</p>;

  const partiesWithActions = pagedParties.map((party) => {
    const isLocked = Boolean(party.lockedByActiveVotation);
    const lockTitle = isLocked
      ? `Bloqueado por la votación activa: ${
          party.activeVotations?.map((v) => `#${v.id} ${v.title}`).join(", ") || "—"
        }`
      : undefined;

    return {
      ...party,
      description: party.description
        ? `${party.description.slice(0, 90)}${party.description.length > 90 ? "…" : ""}`
        : "—",
      image: <ImageCell value={party.image} />,
      color_background: <ColorCell value={party.color_background} />,
      color_title: <ColorCell value={party.color_title} />,
      votations:
        party.votations?.length > 0 ? (
          <span className="party-votations-cell">
            {party.votations.map((votation) => (
              <span
                key={votation.id}
                className={`party-votations-cell__chip party-votations-cell__chip--${votation.state}`}
                title={`Estado: ${votation.state}`}
              >
                #{votation.id} {votation.title}
              </span>
            ))}
          </span>
        ) : (
          "Todas si no hay configuración"
        ),
      active: (
        <span
          className={`party-status ${
            party.active ? "party-status--active" : "party-status--inactive"
          }`}
        >
          {party.active ? "Activo" : "Inactivo"}
        </span>
      ),
      _isDisabled: !party.active,
      actions: (
        <div className="action-container" title={lockTitle}>
          <ButtonEdit
            disabled={isLocked}
            onClick={() => openEditForm(party)}
          />
          <ButtonDelete
            disabled={!party.active || isLocked}
            onClick={() => handleDelete(party)}
          />
          {isLocked && (
            <span className="party-lock-pill" title={lockTitle}>
              <span className="party-lock-pill__icon" aria-hidden="true">
                <LockIcon />
              </span>
              votación en curso
            </span>
          )}
        </div>
      ),
    };
  });

  return (
    <main className="crudparties admin-parties">
      <section className="container admin-parties__container">
        <ButtonCreate onClick={openCreateForm} />

        {isFormVisible && (
          <PartyForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormVisible(false)}
            editId={editId}
            votations={votations}
            isUploading={isUploading}
            onUploadImage={uploadImage}
          />
        )}

        {parties.length === 0 ? (
          <p>No hay partidos creados</p>
        ) : (
          <>
            <Table
              id="crudparties"
              headings={rowKeys.map((key) => columnNames[key])}
              rows={partiesWithActions}
              rowKeys={rowKeys}
              getRowClass={(row) => (row._isDisabled ? "row-disabled" : "")}
            />
            {parties.length > PAGE_SIZE && (
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={parties.length}
                itemLabel="partidos"
                loading={false}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}