import { useCallback, useEffect, useMemo, useState } from "react";

import Particles from "../../components/Particles/Particles";
import SpainMap from "../../components/SpainMap/SpainMap";
import { API_CONFIG } from "../../config/api";
import { popupError, popupInfo } from "../../services/alerts";
import { getXsrfToken } from "../../services/xsrf";
import {
  BarChart,
  LineChart,
  PieChart,
} from "../../components/ChartSection/ChartSection";
import { useParties } from "../../data/partidos";
import FingerIcon from "../../icons/FingerIcon";
import {
  ccaaAliasToCanonical,
  matchesCCAA,
  matchesProvince,
} from "../../utils/spainNames";

import { formatBucketLabel } from "../../utils/date";
import VotationPicker from "../../components/VotationPicker/VotationPicker";
import "./ElectionsMap.css";

const ccaaColors = {
  Andalucía: "#4CAF50",
  Aragon: "#FF9800",
  Asturias: "#2196F3",
  Cantabria: "#c4cf5eff",
  "Castilla y León": "#E91E63",
  "Castilla la Mancha": "#795548",
  Cataluña: "#3F51B5",
  Ceuta: "#009688",
  "Comunidad Valenciana": "#F44336",
  Extremadura: "#8BC34A",
  Galicia: "#FF9800",
  "Islas Baleares": "#FF5722",
  "Islas Canarias": "#673AB7",
  "La Rioja": "#6f16ffff",
  "Comunidad de Madrid": "#FFC107",
  Madrid: "#FFC107",
  Melilla: "#00BCD4",
  Murcia: "#CDDC39",
  "Navarra, Comunidad Foral de": "#FFEB3B",
  "País Vasco": "#c800ffff",
};

function getCanonicalCCAA(name) {
  if (!name) return null;
  if (ccaaColors[name]) return name;
  return ccaaAliasToCanonical[name.toLowerCase()] || null;
}

const provinceToCCAA = {
  Almería: "Andalucía",
  Cádiz: "Andalucía",
  Córdoba: "Andalucía",
  Granada: "Andalucía",
  Huelva: "Andalucía",
  Jaén: "Andalucía",
  Málaga: "Andalucía",
  Sevilla: "Andalucía",
  Huesca: "Aragon",
  Teruel: "Aragon",
  Zaragoza: "Aragon",
  Asturias: "Asturias",
  Cantabria: "Cantabria",
  Ávila: "Castilla y León",
  Burgos: "Castilla y León",
  León: "Castilla y León",
  Palencia: "Castilla y León",
  Salamanca: "Castilla y León",
  Segovia: "Castilla y León",
  Soria: "Castilla y León",
  Valladolid: "Castilla y León",
  Zamora: "Castilla y León",
  Albacete: "Castilla la Mancha",
  "Ciudad Real": "Castilla la Mancha",
  Cuenca: "Castilla la Mancha",
  Guadalajara: "Castilla la Mancha",
  Toledo: "Castilla la Mancha",
  Barcelona: "Cataluña",
  Gerona: "Cataluña",
  Girona: "Cataluña",
  "Lérida": "Cataluña",
  Lleida: "Cataluña",
  Tarragona: "Cataluña",
  Ceuta: "Ceuta",
  Valencia: "Comunidad Valenciana",
  "Valencia/València": "Comunidad Valenciana",
  Alicante: "Comunidad Valenciana",
  "Alicante/Alacant": "Comunidad Valenciana",
  Castellón: "Comunidad Valenciana",
  "Castellón/Castelló": "Comunidad Valenciana",
  Badajoz: "Extremadura",
  Cáceres: "Extremadura",
  "La Coruña": "Galicia",
  "Coruña, A": "Galicia",
  Lugo: "Galicia",
  Orense: "Galicia",
  Ourense: "Galicia",
  Pontevedra: "Galicia",
  Baleares: "Islas Baleares",
  "Illes Balears": "Islas Baleares",
  "Balears, Illes": "Islas Baleares",
  "Las Palmas": "Islas Canarias",
  "Palmas, Las": "Islas Canarias",
  "Santa Cruz de Tenerife": "Islas Canarias",
  "La Rioja": "La Rioja",
  "Rioja, La": "La Rioja",
  Madrid: "Comunidad de Madrid",
  Melilla: "Melilla",
  Murcia: "Murcia",
  Navarra: "Navarra, Comunidad Foral de",
  "Navarra, Comunidad Foral de": "Navarra, Comunidad Foral de",
  "Comunidad Foral de Navarra": "Navarra, Comunidad Foral de",
  Álava: "País Vasco",
  "Araba/Álava": "País Vasco",
  Gipuzkoa: "País Vasco",
  Bizkaia: "País Vasco",
  Vizcaya: "País Vasco",
};

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  );
}

function generateProvinceColor(baseHex, index, total) {
  const rgb = hexToRgb(baseHex);
  const factor = 1 - (0.5 * index) / total;
  return rgbToHex(
    Math.round(rgb.r * factor),
    Math.round(rgb.g * factor),
    Math.round(rgb.b * factor),
  );
}

function aggregateRegionResults(resultsDetail, regionName, level) {
  if (!resultsDetail?.byProvince) {
    return { parties: [], totalVotes: 0, totalSeats: 0 };
  }
  const provinces = resultsDetail.byProvince;
  let relevant = [];
  if (level === "nation") {
    relevant = provinces;
  } else if (level === "ccaa") {
    relevant = provinces.filter((p) =>
      matchesCCAA(regionName, p.autonomousCommunityName),
    );
  } else if (level === "province") {
    relevant = provinces.filter((p) =>
      matchesProvince(regionName, p.provinceName),
    );
  }
  const partyMap = new Map();
  for (const prov of relevant) {
    for (const row of prov.parties ?? []) {
      const k = row.partyId;
      if (!partyMap.has(k)) {
        partyMap.set(k, {
          partyId: k,
          partyName: row.partyName,
          votes: 0,
          seatsAssigned: 0,
          colorBackground: row.colorBackground,
          colorTitle: row.colorTitle,
        });
      }
      const agg = partyMap.get(k);
      agg.votes += row.votes;
      agg.seatsAssigned += row.seatsAssigned;
    }
  }
  const parties = Array.from(partyMap.values());
  const totalVotes = parties.reduce((s, p) => s + p.votes, 0);
  const totalSeats = parties.reduce((s, p) => s + p.seatsAssigned, 0);
  return { parties, totalVotes, totalSeats };
}

function buildChartData(parties) {
  const labels = parties.map((p) => p.partyName);
  const votes = parties.map((p) => p.votes);
  const colors = parties.map(
    (p) => p.colorBackground || "#cccccc",
  );
  const borders = parties.map((p) => p.colorTitle || "#333333");
  return {
    labels,
    datasets: [
      {
        label: "Votos",
        data: votes,
        backgroundColor: colors,
        borderColor: borders,
        borderWidth: 1,
      },
    ],
  };
}

function buildSeatsPieData(parties) {
  const withSeats = parties.filter((p) => p.seatsAssigned > 0);
  const labels = withSeats.map((p) => p.partyName);
  const data = withSeats.map((p) => p.seatsAssigned);
  const colors = withSeats.map((p) => p.colorBackground || "#cccccc");
  const borders = withSeats.map((p) => p.colorTitle || "#333333");
  return {
    labels,
    datasets: [
      {
        label: "Escaños",
        data,
        backgroundColor: colors,
        borderColor: borders,
        borderWidth: 1,
      },
    ],
  };
}

export default function ElectionsMap() {
  const [selectedName, setSelectedName] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [seatsAssigned, setSeatsAssigned] = useState(0);
  const [pieData, setPieData] = useState(null);
  const [barData, setBarData] = useState(null);
  const [votationSummaries, setVotationSummaries] = useState([]);
  /** Solo finalizadas: mapa y resultados */
  const [selectedVotationId, setSelectedVotationId] = useState("");
  /** Cualquier estado devuelto por /summary: verificación de voto */
  const [verifyVotationId, setVerifyVotationId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [mapLevel, setMapLevel] = useState("ccaa");
  const [resultsDetail, setResultsDetail] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(null);
  const [partiesAggregated, setPartiesAggregated] = useState([]);
  const [modalTimeseries, setModalTimeseries] = useState(null);
  const [modalTimeseriesLoading, setModalTimeseriesLoading] = useState(false);

  const { partidos: partidosCatalog } = useParties();

  const finishedVotations = useMemo(
    () => votationSummaries.filter((v) => v.state === "finished"),
    [votationSummaries],
  );

  const finishedPickerItems = useMemo(
    () =>
      finishedVotations.map((v) => ({
        id: v.id,
        title: v.title,
        state: v.state,
      })),
    [finishedVotations],
  );

  const verifyPickerItems = useMemo(
    () =>
      votationSummaries
        .filter((v) => v.state === "active" || v.state === "finished")
        .map((v) => ({
          id: v.id,
          title: v.title,
          state: v.state,
        })),
    [votationSummaries],
  );

  useEffect(() => {
    let cancelled = false;
    const loadSummaries = async () => {
      try {
        const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.VOTATIONS_SUMMARY}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !Array.isArray(data)) return;
        setVotationSummaries(data);
      } catch (e) {
        console.error(e);
      }
    };
    loadSummaries();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (votationSummaries.length > 0 && verifyVotationId === "") {
      setVerifyVotationId(String(votationSummaries[0].id));
    }
  }, [votationSummaries, verifyVotationId]);

  useEffect(() => {
    if (finishedVotations.length === 0) {
      setSelectedVotationId("");
      setResultsDetail(null);
      return;
    }
    setSelectedVotationId((prev) => {
      if (prev && finishedVotations.some((v) => String(v.id) === prev)) {
        return prev;
      }
      return String(finishedVotations[0].id);
    });
  }, [finishedVotations]);

  useEffect(() => {
    if (!showDialog || !selectedVotationId) {
      setModalTimeseries(null);
      setModalTimeseriesLoading(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setModalTimeseriesLoading(true);
      try {
        const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.VOTATION_VOTES_TIMESERIES_PUBLIC(Number(selectedVotationId))}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (cancelled) {
          return;
        }
        if (!res.ok) {
          setModalTimeseries(null);
          return;
        }
        setModalTimeseries(data);
      } catch {
        if (!cancelled) {
          setModalTimeseries(null);
        }
      } finally {
        if (!cancelled) {
          setModalTimeseriesLoading(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
      setModalTimeseriesLoading(false);
    };
  }, [showDialog, selectedVotationId]);

  useEffect(() => {
    if (!selectedVotationId) {
      setResultsDetail(null);
      setResultsError(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setResultsLoading(true);
      setResultsError(null);
      try {
        const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.VOTATION_RESULTS(Number(selectedVotationId))}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setResultsDetail(null);
          setResultsError(data.error || "No se pudieron cargar los resultados");
          return;
        }
        setResultsDetail(data);
      } catch {
        if (!cancelled) {
          setResultsError("Servicio no disponible");
          setResultsDetail(null);
        }
      } finally {
        if (!cancelled) setResultsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedVotationId]);

  const handleVerifyVote = async () => {
    const code = verificationCode.trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(code)) {
      popupError(
        "El código debe ser 64 caracteres hexadecimales (el que guardaste al votar).",
      );
      return;
    }
    if (!verifyVotationId) {
      popupError("Selecciona la votación correspondiente.");
      return;
    }
    try {
      const xsrf = await getXsrfToken();
      if (!xsrf) {
        popupError(
          "No se pudo obtener la sesión segura. ¿Has iniciado sesión?",
        );
        return;
      }
      const res = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.VOTE_VERIFY}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": xsrf,
          },
          body: JSON.stringify({
            code,
            votationId: Number(verifyVotationId),
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        popupError(data.error || "No se encontró el voto");
        return;
      }
      await popupInfo(
        `${data.nickname} votó a ${data.partyName}`,
        `Votación #${data.votationId}`,
      );
    } catch (err) {
      console.error(err);
      popupError("Servicio no disponible");
    }
  };

  const mapDisabled =
    !selectedVotationId ||
    resultsLoading ||
    !resultsDetail ||
    Boolean(resultsError);

  // Serie temporal de la votación (API); si falla, mismo fallback que Métricas: Inicio: resultado en esta región
  const modalLineConfig = useMemo(() => {
    if (!partidosCatalog.length) {
      return null;
    }

    if (modalTimeseries?.labels?.length) {
      const windowStart = modalTimeseries.startDate;
      const windowEnd = modalTimeseries.endDate;
      const labels = modalTimeseries.labels.map((iso) =>
        windowStart && windowEnd
          ? formatBucketLabel(iso, windowStart, windowEnd)
          : String(iso),
      );
      const series = {};
      partidosCatalog.forEach((p) => {
        const arr = modalTimeseries.byParty?.[String(p.id)];
        series[p.nombre] = Array.isArray(arr)
          ? arr
          : Array(modalTimeseries.labels.length).fill(0);
      });
      return {
        labels,
        series,
        showTimeAxis: modalTimeseries.labels.length >= 2,
      };
    }

    if (!partiesAggregated.length) {
      return null;
    }
    const fallbackLabels = ["Inicio", "Actual"];
    const series = {};
    partidosCatalog.forEach((p) => {
      const agg = partiesAggregated.find((ap) => ap.partyId === p.id);
      series[p.nombre] = [0, agg?.votes ?? 0];
    });
    return {
      labels: fallbackLabels,
      series,
      showTimeAxis: false,
    };
  }, [modalTimeseries, partidosCatalog, partiesAggregated]);

  const getFeatureStyle = useCallback(
    (feature, geoData) => {
      const name = feature.properties?.name ?? "";
      if (name === "Africa Norte" || name === "Portugal" || name === "Francia Sur") {
        return { fill: "#D1D1D1", pointerEvents: "none" };
      }
      if (mapDisabled) {
        return {
          fill: "url(#disabled-region-gradient)",
          pointerEvents: "none",
          stroke: "#888888",
          strokeWidth: "0.5",
        };
      }
      if (mapLevel === "ccaa") {
        const canonicalName = getCanonicalCCAA(name);
        return { fill: ccaaColors[canonicalName] || "#ccc" };
      }
      if (mapLevel === "province") {
        const province = name;
        let ccaa = provinceToCCAA[province];
        // Si no está en provinceToCCAA, puede ser que sea una CCAA directamente (ej: "País Vasco")
        if (!ccaa) {
          const canonical = getCanonicalCCAA(province);
          if (canonical && ccaaColors[canonical]) {
            return { fill: ccaaColors[canonical] };
          }
        }
        const canonicalCCAA = getCanonicalCCAA(ccaa);
        const baseColor = ccaaColors[canonicalCCAA] || "#ccc";
        const provinces = geoData.filter(
          (f) => provinceToCCAA[f.properties.name] === ccaa,
        );
        const index = provinces.indexOf(feature);
        const provinceColor = generateProvinceColor(
          baseColor,
          index,
          provinces.length,
        );
        return { fill: provinceColor };
      }
      return { fill: "#ff4141ff" };
    },
    [mapLevel, mapDisabled],
  );

  const onPathMouseEnter = useCallback(
    (map, path) => {
      if (mapDisabled) {
        return;
      }
      if (mapLevel === "nation") {
        map.querySelectorAll("path").forEach((p) => {
          const pName = p.getAttribute("data-name");
          if (pName === "Spain" || pName === "Canarias") {
            p.style.filter = "brightness(1.4)";
          } else {
            p.style.filter = "brightness(0.5)";
          }
        });
        return;
      }
      if (mapLevel === "province") {
        const provinceName = path.getAttribute("data-name");
        const ccaa = provinceToCCAA[provinceName];
        map.querySelectorAll("path").forEach((p) => {
          const pName = p.getAttribute("data-name");
          const pCCAA = provinceToCCAA[pName];
          if (p === path) {
            p.style.filter = "brightness(1.2)";
            p.style.strokeWidth = "2";
          } else if (pCCAA === ccaa) {
            p.style.filter = "brightness(0.7)";
          } else {
            p.style.filter = "brightness(0.45)";
          }
        });
      } else {
        map.querySelectorAll("path").forEach((p) => {
          if (p === path) p.style.filter = "brightness(1.2)";
          else p.style.filter = "brightness(0.5)";
        });
      }
    },
    [mapLevel, mapDisabled],
  );

  const onPathMouseLeave = useCallback(
    (map) => {
      if (mapDisabled) {
        return;
      }
      if (mapLevel === "province") {
        map.querySelectorAll("path").forEach((p) => {
          p.style.filter = "brightness(1)";
          p.style.strokeWidth = "1";
        });
      } else {
        map.querySelectorAll("path").forEach((p) => {
          p.style.filter = "brightness(1)";
        });
      }
    },
    [mapLevel, mapDisabled],
  );

  const onFeatureClick = useCallback(
    (name) => {
      if (mapDisabled || !resultsDetail?.byProvince || !name) return;
      const displayName = mapLevel === "nation" ? "España" : name;
      setSelectedName(displayName);
      setShowDialog(true);
      const { parties, totalVotes: tv, totalSeats: ts } = aggregateRegionResults(
        resultsDetail,
        name,
        mapLevel,
      );
      setPartiesAggregated(
        [...parties].sort((a, b) => b.votes - a.votes),
      );
      setTotalVotes(tv);
      setSeatsAssigned(ts);
      setBarData(buildChartData(parties));
      setPieData(buildSeatsPieData(parties));
    },
    [resultsDetail, mapLevel, mapDisabled],
  );

  const levels = [
    { value: "nation", label: "Nación" },
    { value: "ccaa", label: "Comunidad" },
    { value: "province", label: "Provincia" },
  ];

  return (
    <main className="electionsMap results-map">
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          position: "fixed",
          inset: 0,
          zIndex: 0,
        }}
      >
        <Particles
          particleColors={["#d4a0ff", "#a066ff", "#6a00d4"]}
          particleCount={5000}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles={true}
          disableRotation={true}
        />
      </div>
      <section className="section1">
        <article className="article1">
          <h2>Elecciones Generales</h2>
          <VotationPicker
            id="results-finished-votation-picker"
            label={null}
            ariaLabel="Votación finalizada"
            items={finishedPickerItems}
            value={selectedVotationId}
            onChange={(v) => setSelectedVotationId(v)}
            placeholderLabel={
              finishedPickerItems.length === 0
                ? "No hay votaciones finalizadas"
                : "Selecciona…"
            }
            placeholderValue=""
            disabled={finishedPickerItems.length === 0}
          />
        </article>
        <article className="article2">
          <p>
            {resultsLoading && "Cargando resultados…"}
            {resultsError && !resultsLoading && (
              <span style={{ color: "crimson" }}>{resultsError}</span>
            )}
            {!resultsLoading &&
              !resultsError &&
              selectedVotationId &&
              "Pincha en el mapa para ver estadísticas (datos oficiales de la votación)."}
            {!selectedVotationId &&
              !resultsLoading &&
              !resultsError &&
              "El mapa está en vista previa hasta que exista una votación finalizada."}
          </p>
        </article>
      </section>

      <section className="section2 verify-vote-card">
        <div className="verify-vote-card__intro">
          <div className="verify-vote-card__title-row">
            <h3 className="verify-vote-card__title">Verifica tu voto</h3>
            <span className="verify-vote-card__icon" aria-hidden>
              <FingerIcon />
            </span>
          </div>
          <p className="verify-vote-card__lead">
            Comprueba en cadena que tu voto se registró correctamente con el código de 64 caracteres
            que recibiste al emitirlo.
          </p>
        </div>
        <div className="verify-vote-card__form">
          <div className="verify-vote-card__fields">
            <div className="verify-vote-card__field verify-vote-card__field--votation">
              <label
                className="verify-vote-card__label verify-vote-card__label--inline"
                htmlFor="verify-votation-select"
              >
                Votación
              </label>
              <VotationPicker
                id="verify-votation-select"
                label={null}
                ariaLabel="Votación para verificación"
                variant="compact"
                items={verifyPickerItems}
                value={verifyVotationId}
                onChange={(v) => setVerifyVotationId(v)}
                placeholderLabel={
                  votationSummaries.length === 0
                    ? "Cargando…"
                    : verifyPickerItems.length === 0
                      ? "No hay votaciones disponibles"
                      : "Selecciona…"
                }
                placeholderValue=""
                disabled={verifyPickerItems.length === 0}
              />
            </div>
            <div className="verify-vote-card__field verify-vote-card__field--code">
              <label className="verify-vote-card__label" htmlFor="verification-code">
                Código de verificación
              </label>
              <div className="verify-vote-card__code-row">
                <input
                  id="verification-code"
                  className="nickname verify-vote-card__code-input"
                  placeholder="Pega aquí tu código…"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                <span className="verify-vote-card__counter" aria-live="polite">
                  {verificationCode.trim().length}/64
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="verify-vote-button verify-vote-card__submit"
            onClick={handleVerifyVote}
          >
            Verificar
          </button>
        </div>
      </section>

      <section className="section3">
        <form className="filtrado">
          {levels.map(({ value, label }) => (
            <div className="types" key={value}>
              <label>{label}</label>
              <input
                type="radio"
                name="level"
                value={value}
                checked={mapLevel === value}
                onChange={() => setMapLevel(value)}
              />
            </div>
          ))}
        </form>
      </section>

      <section className="section4">
        <article className={`map map-surface ${mapDisabled ? "map-surface--disabled" : ""}`}>
          <div
            id="map-container"
            className="map-container-inner"
          >
            <SpainMap
              disabled={mapDisabled}
              level={mapLevel}
              getFeatureStyle={getFeatureStyle}
              onFeatureClick={onFeatureClick}
              onPathMouseEnter={onPathMouseEnter}
              onPathMouseLeave={onPathMouseLeave}
            />
            {mapDisabled ? (
              <div className="map-disabled-overlay" aria-hidden>
                <span className="map-disabled-overlay__pill">
                  Esperando votaciones finalizadas
                </span>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      {showDialog && (
        <dialog className="dialog" open>
          <div className="dialog-content">
            <div className="dialog-header">
              <h2 className="dialog-title">Información de {selectedName}</h2>
              <button
                type="button"
                className="cerrar"
                onClick={() => {
                  setShowDialog(false);
                }}
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>
            <div className="results-summary">
              <div className="results-totals">
                <div className="results-total-card">
                  <span className="results-total-label">
                    Escaños asignados por el Estado
                  </span>
                  <strong className="results-total-value">{seatsAssigned}</strong>
                </div>
                <div className="results-total-card">
                  <span className="results-total-label">
                    Número total de votos
                  </span>
                  <strong className="results-total-value">
                    {totalVotes.toLocaleString("es-ES")}
                  </strong>
                </div>
              </div>
              <div className="results-table-wrap">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Partido</th>
                      <th>Votos</th>
                      <th>Escaños</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partiesAggregated.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="results-table-empty">
                          Sin datos para esta selección
                        </td>
                      </tr>
                    ) : (
                      partiesAggregated.map((p) => (
                        <tr key={p.partyId}>
                          <td>
                            <span
                              className="party-chip"
                              style={{
                                backgroundColor: p.colorBackground || "#ccc",
                              }}
                            />{" "}
                            {p.partyName}
                          </td>
                          <td>{p.votes.toLocaleString("es-ES")}</td>
                          <td>{p.seatsAssigned}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="chart-section">
              {pieData && pieData.labels.length > 0 ? (
                <div className="chart-section__slot chart-section__slot--pie">
                  <PieChart data={pieData} />
                </div>
              ) : null}
              {barData && barData.labels.length > 0 ? (
                <div className="chart-section__slot chart-section__slot--bar">
                  <BarChart data={barData} />
                </div>
              ) : null}
              {modalLineConfig ? (
                <div className="chart-section__slot chart-section__slot--line">
                  <LineChart
                    labels={modalLineConfig.labels}
                    partidos={partidosCatalog}
                    series={modalLineConfig.series}
                    showTimeAxis={modalLineConfig.showTimeAxis}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </dialog>
      )}
    </main>
  );
}