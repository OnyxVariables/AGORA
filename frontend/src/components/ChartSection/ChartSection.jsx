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

export function PieChart({ data }) {
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

export function BarChart({ data }) {
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

export function HeatChart({ data }) {
  return (
    <div className="chart-container heat-chart">
      TODO
      {/* TODO(srvariable): Think about a heatmap implementation, an option could be to
      reuse the map from /resultados and color the regions based on the data provided.
      But the map has to be componentized first, and it is out of scope right now. */}
    </div>
  );
}

export default function ChartSection({ voteMetrics, selectedVotation }) {
  const { partidos, loading } = useParties();

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
  console.log("DEBUG votesByPartyId:", votesByPartyId);
  console.log("DEBUG partidos:", partidos.map(p => ({ value: p.value, nombre: p.nombre })));
  
  const partyData = partidos.map(p => {
    const votosRaw = votesByPartyId[p.id];
    const votos = Number(votosRaw) || 0;
    console.log(`DEBUG partido ${p.nombre} (id=${p.id}): votosRaw=${votosRaw}, votos=${votos}`);
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
  console.log("DEBUG aggregatedData:", JSON.stringify(aggregatedData, null, 2));

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

          <HeatChart data={voteMetrics.votesByMunicipality} />
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
