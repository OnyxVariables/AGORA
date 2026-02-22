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

      meta.data.forEach((element, index) => {
        if (element.hidden) {
          return;
        }

        const partyVotes = dataset.data[index];
        const percentage = ((partyVotes / totalVotes) * 100).toFixed(0);
        if (percentage < 5) {
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
        data: series[p.value] ?? [],
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

export default function ChartSection() {
  const { partidos, loading } = useParties();

  if (loading) {
    return <div className="charts">Cargando datos...</div>;
  }

  // NOTE(srvariable): Fake data for testing purposes
  const aggregatedData = {
    labels: partidos.map((p) => p.nombre),
    datasets: [
      {
        label: "Votos",
        data: partidos.map(() => Math.floor(40000 + Math.random() * 20000)),
        backgroundColor: partidos.map((p) => p.colores.fondo),
        borderColor: partidos.map((p) => p.colores.titulo),
        borderWidth: 1,
      },
    ],
  };

  // For the line chart
  const timeLabels = ["01-01-2026", "02-01-2026", "03-01-2026", "04-01-2026"];
  const timeSeriesData = {
    PP: [12000, 24000, 36000, aggregatedData.datasets[0].data[0]],
    PSOE: [10000, 18000, 26000, aggregatedData.datasets[0].data[1]],
    PODEMOS: [15000, 19000, 24000, aggregatedData.datasets[0].data[2]],
    CS: [14000, 18000, 22000, aggregatedData.datasets[0].data[3]],
    VOX: [7000, 14000, 21000, aggregatedData.datasets[0].data[4]],
    ehbildu: [12000, 14000, 26000, aggregatedData.datasets[0].data[5]],
    compromis: [13000, 16000, 29000, aggregatedData.datasets[0].data[6]],
    cc: [11000, 12000, 23000, aggregatedData.datasets[0].data[7]],
    junst: [12500, 15000, 27500, aggregatedData.datasets[0].data[8]],
    madrid: [16000, 18000, 24000, aggregatedData.datasets[0].data[9]],
  };

  return (
    <section className="charts">
      <PieChart data={aggregatedData} />
      <BarChart data={aggregatedData} />

      <LineChart
        labels={timeLabels}
        partidos={partidos}
        series={timeSeriesData}
      />

      <HeatChart data={null} />
    </section>
  );
}
