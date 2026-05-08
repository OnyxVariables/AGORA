import {
  useCallback,
  useMemo,
  useEffect,
  memo,
  useDeferredValue,
  useRef,
  useState,
} from "react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

import { Pie, Bar, Line } from "react-chartjs-2";
import "./ChartSection.css";
import { usePartiesCatalog } from "../../data/partidos";
import SpainMap from "../SpainMap/SpainMap";
import { votesForMapProvince } from "../../utils/spainNames";
import { formatBucketLabel } from "../../utils/date";

ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

function PieChartComponent({ data }) {
  const customPieLabels = {
    id: "agoraPluginPieLabels",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      if (!meta) {
        return;
      }

      const dataset = chart.data.datasets[0];
      let totalVotes = 0;

      meta.data.forEach((element, index) => {
        if (!element.hidden) {
          totalVotes += dataset.data[index];
        }
      });

      if (totalVotes === 0) {
        return;
      }

      meta.data.forEach((element, index) => {
        if (element.hidden) {
          return;
        }

        const partyVotes = dataset.data[index];
        const percentage = totalVotes > 0 ? ((partyVotes / totalVotes) * 100).toFixed(0) : 0;
        if (percentage < 5 || percentage === 0) {
          return;
        }

        const centerX = element.x;
        const centerY = element.y;

        const { startAngle, endAngle, outerRadius } = element;
        const angle = (startAngle + endAngle) / 2;

        const distanceFromCenter = 0.6;

        const x = centerX + Math.cos(angle) * outerRadius * distanceFromCenter;
        const y = centerY + Math.sin(angle) * outerRadius * distanceFromCenter;

        ctx.save();
        ctx.font = "0.8rem system-ui";
        ctx.fillStyle = "#111";
        ctx.textAlign = "center";

        ctx.fillText(`${percentage}%`, x, y);
        ctx.restore();
      });
    },
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          generateLabels(chart) {
            const dataset = chart.data.datasets[0];
            const meta = chart.getDatasetMeta(0);

            return chart.data.labels.map((label, i) => ({
              text: label,
              fillStyle: dataset.backgroundColor[i],
              strokeStyle: dataset.borderColor[i],
              lineWidth: 1,
              hidden: meta.data[i].hidden || false,
              index: i,
            }));
          },
        },
        onClick: (e, legendItem, legend) => {
          const index = legendItem.index;
          const chart = legend.chart;
          const meta = chart.getDatasetMeta(0);

          meta.data[index].hidden = !meta.data[index].hidden;

          chart.update();
        },
      },
    },
  };

  return (
    <div className="chart-container pie-chart">
      <div className="chart-host">
        <Pie data={data} options={options} plugins={[customPieLabels]} />
      </div>
    </div>
  );
}

export const PieChart = memo(PieChartComponent);

function BarChartComponent({ data }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          generateLabels(chart) {
            const dataset = chart.data.datasets[0];

            return chart.data.labels.map((label, i) => ({
              text: label,
              fillStyle: dataset.backgroundColor[i],
              strokeStyle: dataset.borderColor[i],
              lineWidth: 1,
              hidden: chart.getDataVisibility(i) === false,
              i,
            }));
          },
        },
        onClick(e, legendItem, legend) {
          const i = legendItem.i;
          legend.chart.toggleDataVisibility(i);
          legend.chart.update();
        },
      },
    },
    scales: {
      x: {
        display: false,
      },
    },
  };

  return (
    <div className="chart-container bar-chart">
      <div className="chart-host">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export const BarChart = memo(BarChartComponent);

export function LineChart({
  labels,
  partidos,
  series,
  showTimeAxis = false,
  lineTension = 0.3,
  xAxisMaxTicks,
}) {
  const data = useMemo(
    () => ({
      labels,
      datasets: partidos.map((p) => {
        const borderColor = p.colores?.fondo ?? p.colorFondo ?? "grey";
        const backgroundColor = p.colores?.fondo ?? p.colorFondo ?? "grey";
        const strokeColor = p.colores?.titulo ?? p.colorTitulo ?? "grey";

        return {
          label: p.nombre,
          data: series[p.nombre] ?? [],
          borderColor,
          backgroundColor,
          strokeColor,
          lineWidth: 1,
          tension: lineTension,
          pointRadius: showTimeAxis ? 2 : 3,
          pointHoverRadius: 6,
        };
      }),
    }),
    [labels, partidos, series, showTimeAxis, lineTension],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            generateLabels(chart) {
              const datasets = chart.data.datasets;

              return datasets.map((dataset, i) => ({
                text: dataset.label,
                fillStyle: dataset.backgroundColor,
                strokeStyle: dataset.strokeColor,
                lineWidth: 1,
                hidden: !chart.isDatasetVisible(i),
                datasetIndex: i,
              }));
            },
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: {
          display: showTimeAxis,
          ticks: {
            maxRotation: 45,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: xAxisMaxTicks ?? 12,
          },
          grid: {
            display: showTimeAxis,
            color: "rgba(0,0,0,0.06)",
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
          grid: {
            color: "rgba(0,0,0,0.06)",
          },
        },
      },
    }),
    [showTimeAxis, xAxisMaxTicks],
  );

  return (
    <div className="chart-container line-chart">
      <div className="chart-host">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

// Mapa de calor por provincia (votos agregados). Usa `votesByProvinceName` del bundle de métricas
function HeatChartComponent({ votesByProvinceName = {}, suppressEmptyMessage = false }) {
  const mapRef = useRef(null);

  const byProvince = useMemo(() => {
    if (
      votesByProvinceName &&
      typeof votesByProvinceName === "object" &&
      Object.keys(votesByProvinceName).length > 0
    ) {
      return votesByProvinceName;
    }
    return {};
  }, [votesByProvinceName]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      mapRef.current?.redraw?.();
    });
    return () => cancelAnimationFrame(id);
  }, [byProvince]);

  const maxVotes = useMemo(() => {
    let m = 1;
    for (const v of Object.values(byProvince)) {
      m = Math.max(m, Number(v) || 0);
    }
    const mergeSums = [
      ["La Coruña", "A Coruña"],
      ["Gerona", "Girona"],
      ["Lérida", "Lleida"],
      ["Orense", "Ourense"],
    ];
    for (const keys of mergeSums) {
      const s = keys.reduce((acc, k) => acc + (Number(byProvince[k]) || 0), 0);
      m = Math.max(m, s);
    }
    return m;
  }, [byProvince]);

  const totalVotes = useMemo(() => {
    return Object.values(byProvince).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [byProvince]);

  const hasData = totalVotes > 0;

  const legendLabels = useMemo(() => {
    if (maxVotes <= 0) {
      return ["0"];
    }
    const steps = [0, 0.2, 0.4, 0.6, 0.8, 1].map((f) => Math.round(f * maxVotes));
    return [...new Set(steps)].sort((a, b) => a - b).map((n) => n.toLocaleString("es-ES"));
  }, [maxVotes]);

  const getFeatureStyle = useCallback(
    (feature) => {
      const name = feature.properties?.name ?? "";
      if (
        name === "Africa Norte" ||
        name === "Portugal" ||
        name === "Francia Sur"
      ) {
        return { fill: "#D1D1D1", pointerEvents: "none" };
      }
      const n = votesForMapProvince(name, byProvince);
      const logMax = Math.log1p(maxVotes);
      const t = logMax > 0 ? Math.min(1, Math.log1p(n) / logMax) : 0;
      const r = Math.round(230 - t * 180);
      const g = Math.round(240 - t * 200);
      const b = Math.round(255 - t * 100);
      const color = `rgb(${r},${g},${b})`;
      return { fill: color };
    },
    [byProvince, maxVotes],
  );

  return (
    <div className="chart-container heat-chart">
      {!suppressEmptyMessage && !hasData && (
        <p className="heat-chart-empty">
          Sin datos por provincia para esta votación (espera a que existan votos).
        </p>
      )}
      <div className="heat-chart-content">
        <div className="heat-chart-legend-vertical">
          <div className="legend-labels">
            {legendLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="heat-chart-legend-bar" aria-hidden />
        </div>
        <div className="heat-chart-map-wrap">
          <SpainMap
            ref={mapRef}
            level="province"
            getFeatureStyle={getFeatureStyle}
          />
        </div>
      </div>
    </div>
  );
}

export const HeatChart = memo(HeatChartComponent);

function formatLivePointLabel(timestamp, index) {
  const n = Date.parse(String(timestamp ?? ""));
  if (Number.isNaN(n)) {
    return `Voto ${index}`;
  }
  return new Date(n).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function normalizeSeries(values, len, cumulativeInput) {
  const out = Array(len).fill(0);
  let running = 0;
  let previous = 0;
  for (let i = 0; i < len; i++) {
    const raw = Number(Array.isArray(values) ? values[i] : 0);
    const value = Number.isFinite(raw) ? raw : 0;
    if (cumulativeInput) {
      previous = Math.max(previous, value);
      out[i] = previous;
    } else {
      running += Math.max(0, value);
      out[i] = running;
    }
  }
  return out;
}

function buildSeedFromTimeseries(partidos, timeseries) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return null;
  }
  const labelsIso = timeseries?.labels;
  if (!Array.isArray(labelsIso) || labelsIso.length < 2) {
    return null;
  }
  const cumulativeInput = timeseries.cumulative !== false;
  const windowStart = timeseries.startDate ?? null;
  const windowEnd = timeseries.endDate ?? null;
  const bucketHint = timeseries.bucketSeconds;
  const labels = labelsIso.map((iso, i) =>
    windowStart && windowEnd
      ? formatBucketLabel(iso, windowStart, windowEnd, bucketHint)
      : formatLivePointLabel(iso, i + 1),
  );
  const series = {};
  partidos.forEach((p) => {
    series[p.nombre] = normalizeSeries(
      timeseries.byParty?.[String(p.id)],
      labelsIso.length,
      cumulativeInput,
    );
  });
  return { labels, series };
}

export default function ChartSection({ voteMetrics, timeseries }) {
  // Catálogo completo (activos + inactivos): los gráficos representan datos históricos
  const { partidos, loading } = usePartiesCatalog();
  const deferredProvinceVotes = useDeferredValue(voteMetrics?.votesByProvinceName);
  const [liveLine, setLiveLine] = useState({
    votationId: null,
    labels: [],
    series: {},
    source: "none",
  });

  // Mapear votesByParty (que usa partyId) a los nombres de partidos
  const votesByPartyForCharts = voteMetrics?.votesByParty || {};

  const partyData = (partidos || []).map((p) => {
    const votosRaw = votesByPartyForCharts[p.id];
    const votos = Number(votosRaw) || 0;
    return {
      id: p.id,
      nombre: p.nombre,
      colorFondo: p.colores?.fondo || "#ccc",
      colorTitulo: p.colores?.titulo || "#000",
      votos,
    };
  });

  // Filtrar partidos con votos para los graficos
  const partidosConVotos = partyData.filter((p) => p.votos > 0);

  // Datos para Pie y Bar (solo partidos con votos, o todos si no hay ninguno)
  const chartData = partidosConVotos.length > 0 ? partidosConVotos : partyData;

  const aggregatedData = {
    labels: chartData.map((p) => p.nombre),
    datasets: [
      {
        label: "Votos",
        data: chartData.map((p) => p.votos),
        backgroundColor: chartData.map((p) => p.colorFondo),
        borderColor: chartData.map((p) => p.colorTitulo),
        borderWidth: 1,
      },
    ],
  };

  const fallbackLineLabels = ["Inicio", "Actual"];
  const fallbackSeries = {};
  partyData.forEach((p) => {
    fallbackSeries[p.nombre] = [0, p.votos];
  });

  useEffect(() => {
    if (!voteMetrics?.votationId || !Array.isArray(partidos) || partidos.length === 0) {
      return;
    }
    const currentTotals = {};
    partidos.forEach((p) => {
      currentTotals[p.nombre] = Number(voteMetrics.votesByParty?.[p.id]) || 0;
    });
    const seed = buildSeedFromTimeseries(partidos, timeseries);

    setLiveLine((prev) => {
      const sameVotation = prev.votationId === voteMetrics.votationId;

      // Si arranco en fallback (2 puntos) y luego llega la serie API, rehidrato
      // para conservar el eje temporal real tras recarga (no funciona del todo bien)
      if (
        sameVotation &&
        seed &&
        Array.isArray(prev.labels) &&
        prev.labels.length <= 2
      ) {
        return {
          votationId: voteMetrics.votationId,
          labels: seed.labels,
          series: seed.series,
          source: "seed",
        };
      }

      if (sameVotation) {
        return prev;
      }
      if (seed) {
        return {
          votationId: voteMetrics.votationId,
          labels: seed.labels,
          series: seed.series,
          source: "seed",
        };
      }
      const baseSeries = {};
      partidos.forEach((p) => {
        baseSeries[p.nombre] = [0, currentTotals[p.nombre]];
      });
      return {
        votationId: voteMetrics.votationId,
        labels: ["Inicio", formatLivePointLabel(voteMetrics.timestamp, 1)],
        series: baseSeries,
        source: "fallback",
      };
    });
  }, [voteMetrics?.votationId, voteMetrics?.timestamp, voteMetrics?.votesByParty, partidos, timeseries]);

  useEffect(() => {
    if (!voteMetrics?.votationId || !Array.isArray(partidos) || partidos.length === 0) {
      return;
    }

    setLiveLine((prev) => {
      if (prev.votationId !== voteMetrics.votationId) {
        return prev;
      }
      const currentTotals = {};
      partidos.forEach((p) => {
        currentTotals[p.nombre] = Number(voteMetrics.votesByParty?.[p.id]) || 0;
      });

      if (!Array.isArray(prev.labels) || prev.labels.length === 0) {
        return prev;
      }

      const currentLength = prev.labels.length;
      let changed = false;
      partidos.forEach((p) => {
        const arr = prev.series[p.nombre] ?? [];
        const last = Number(arr[arr.length - 1]) || 0;
        if (last !== currentTotals[p.nombre]) {
          changed = true;
        }
      });
      if (!changed) {
        return prev;
      }

      const nextSeries = {};
      partidos.forEach((p) => {
        const prevArr = prev.series[p.nombre] ?? Array(currentLength).fill(0);
        const arr = prevArr.slice(0, currentLength);
        while (arr.length < currentLength) {
          arr.push(arr.length > 0 ? arr[arr.length - 1] : 0);
        }
        arr.push(currentTotals[p.nombre]);
        nextSeries[p.nombre] = arr;
      });

      return {
        votationId: prev.votationId,
        labels: [
          ...prev.labels,
          formatLivePointLabel(voteMetrics.timestamp, currentLength),
        ],
        series: nextSeries,
        source: prev.source,
      };
    });
  }, [voteMetrics, partidos]);

  if (loading) {
    return <div className="charts">Cargando datos...</div>;
  }

  if (!voteMetrics) {
    return <div className="charts">Selecciona una votación para ver métricas</div>;
  }

  if (!partidos || partidos.length === 0) {
    return <div className="charts">Cargando datos de partidos...</div>;
  }

  const lineLabels =
    liveLine.votationId === voteMetrics.votationId && liveLine.labels.length >= 2
      ? liveLine.labels
      : fallbackLineLabels;
  const lineSeries =
    liveLine.votationId === voteMetrics.votationId && liveLine.labels.length >= 2
      ? liveLine.series
      : fallbackSeries;
  const showTimeAxis = lineLabels.length > 2;

  const totalVotos = voteMetrics.totalVotes || 0;
  const hasVotes = totalVotos > 0;

  return (
    <section className={`charts ${hasVotes ? "" : "charts--disabled"}`}>
      {!hasVotes ? (
        <div className="charts-disabled-overlay" aria-hidden>
          <span className="charts-disabled-overlay__pill">
            Esperando votos para habilitar las gráficas
          </span>
        </div>
      ) : null}
      <PieChart data={aggregatedData} />
      <BarChart data={aggregatedData} />

      <div className="line-chart-stack">
        <LineChart
          labels={lineLabels}
          partidos={partidos}
          series={lineSeries}
          showTimeAxis={showTimeAxis}
          xAxisMaxTicks={6}
        />
      </div>

      <HeatChart
        votesByProvinceName={deferredProvinceVotes}
        suppressEmptyMessage={!hasVotes}
      />
    </section>
  );
}