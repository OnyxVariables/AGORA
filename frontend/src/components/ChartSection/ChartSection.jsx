import {
  useCallback,
  useMemo,
  useEffect,
  memo,
  useDeferredValue,
  useRef,
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
import { useParties } from "../../data/partidos";
import SpainMap from "../SpainMap/SpainMap";
import { votesForMapProvince } from "../../utils/spainNames";

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
      <Pie data={data} options={options} plugins={[customPieLabels]} />
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
      <Bar data={data} options={options} />
    </div>
  );
}

export const BarChart = memo(BarChartComponent);

export function LineChart({ labels, partidos, series }) {
  const data = {
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
        strokeColor, // Custom property for legend
        lineWidth: 1,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      };
    }),
  };

  const options = {
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
        display: false,
      },
    },
  };

  return (
    <div className="chart-container line-chart">
      <Line data={data} options={options} />
    </div>
  );
}

// Mapa de calor por provincia (votos agregados). Usa `votesByProvinceName` del bundle de métricas
function HeatChartComponent({ votesByProvinceName = {} }) {
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
      {!hasData && (
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
          <div 
            className="legend-bar" 
            style={{
              background: 'linear-gradient(to bottom, rgb(230,240,255) 0%, rgb(210,200,235) 20%, rgb(180,170,220) 40%, rgb(150,140,205) 60%, rgb(100,90,180) 80%, rgb(50,40,155) 100%)',
              width: '24px',
              height: '320px',
              borderRadius: '4px',
              border: '1px solid #999'
            }}
          />
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

export default function ChartSection({ voteMetrics }) {
  const { partidos, loading } = useParties();
  const deferredProvinceVotes = useDeferredValue(voteMetrics?.votesByProvinceName);

  if (loading) {
    return <div className="charts">Cargando datos...</div>;
  }

  if (!voteMetrics) {
    return <div className="charts">Selecciona una votación para ver métricas</div>;
  }

  if (!partidos || partidos.length === 0) {
    return <div className="charts">Cargando datos de partidos...</div>;
  }

  // Mapear votesByParty (que usa partyId) a los nombres de partidos
  const votesByPartyId = voteMetrics.votesByParty || {};

  const partyData = partidos.map(p => {
    const votosRaw = votesByPartyId[p.id];
    const votos = Number(votosRaw) || 0;
    return {
      id: p.id,
      nombre: p.nombre,
      colorFondo: p.colores?.fondo || '#ccc',
      colorTitulo: p.colores?.titulo || '#000',
      votos: votos,
    };
  });

  // Filtrar partidos con votos para los graficos
  const partidosConVotos = partyData.filter(p => p.votos > 0);
  
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
  // Para el line chart - historial simplificado (placeholder, se mejorara en futura version)
  const timeLabels = ["Inicio", "Actual"];
  const timeSeriesData = {};
  partyData.forEach(p => {
    timeSeriesData[p.nombre] = [0, p.votos];
  });

  // Info adicional para mostrar
  const totalVotos = voteMetrics.totalVotes || 0;

  return (
    <section className={`charts ${totalVotos > 0 ? "" : "charts-empty"}`}>
      {totalVotos > 0 ? (
        <>
          <PieChart data={aggregatedData} />
          <BarChart data={aggregatedData} />

          <LineChart
            labels={timeLabels}
            partidos={partidos}
            series={timeSeriesData}
          />

          <HeatChart votesByProvinceName={deferredProvinceVotes} />
        </>
      ) : (
        <div className="no-votes">
          <p>Aún no hay votos registrados para esta votación.</p>
          <p>Los gráficos aparecerán cuando lleguen los primeros votos.</p>
        </div>
      )}
    </section>
  );
}
