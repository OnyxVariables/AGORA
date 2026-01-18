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

ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

function PieChart({ data }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="chart-container pie-chart">
      <Pie key="pie-chart" data={data} options={options} />
    </div>
  );
}

function BarChart({ data }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="chart-container bar-chart">
      <Bar key="bar-chart" data={data} options={options} />
    </div>
  );
}

function LineChart({ labels, partidos, series }) {
  const data = {
    labels,
    datasets: partidos.map(p => ({
      label: p.nombre,
      data: series[p.value] ?? [],
      borderColor: p.colorFondo,
      backgroundColor: p.colorFondo,
      strokeColor: p.colorTitulo, // Custom property for legend
      lineWidth: 1,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 6,
    })),
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
        title: {
          display: true,
          text: "Tiempo",
        },
      },
    },
  };

  return (
    <div className="chart-container line-chart">
      <Line data={data} options={options} />
    </div>
  );
}

function HeatChart({ data }) {
  return (
    <div className="chart-container heat-chart">
      TODO
      {/* TODO(srvariable): Think about a heatmap implementation, an option could be to
      reuse the map from /resultados and color the regions based on the data provided.
      But the map has to be componentized first, and it is out of scope right now. */}
    </div>
  )
}

export default function ChartSection() {
  // NOTE(srvariable): Fake data for testing purposes
  const partidos = [
    { nombre: "PP", value: "PP", colorFondo: "#5eadf8", colorTitulo: "#1d5ea8", imagen: "img/PP.jpg" },
    { nombre: "PSOE", value: "PSOE", colorFondo: "#fd7671", colorTitulo: "#b3201e", imagen: "img/PSOE.png" },
    { nombre: "PODEMOS", value: "PODEMOS", colorFondo: "#d57bfc", colorTitulo: "#6d2d8e", imagen: "img/Podemos.png" },
    { nombre: "C’s", value: "CS", colorFondo: "#ffb347", colorTitulo: "#d97900", imagen: "img/Ciudadanos.png" },
    { nombre: "VOX", value: "VOX", colorFondo: "#8cfa80", colorTitulo: "#4aa63b", imagen: "img/VOX.png" },
    { nombre: "ehbildu", value: "ehbildu", colorFondo: "#00d0b3", colorTitulo: "#008b79ff", imagen: "img/ehbildu.png" },
    { nombre: "compromís", value: "compromis", colorFondo: "#ef8518", colorTitulo: "#ad5700ff", imagen: "img/Compromís.png" },
    { nombre: "CC", value: "cc", colorFondo: "#f3ff52ff", colorTitulo: "#a2aa33ff", imagen: "img/coalicionCanaria.png" },
    { nombre: "junts", value: "junst", colorFondo: "#20c0b2", colorTitulo: "#158b82ff", imagen: "img/junts.png" },
    { nombre: "Más Madrid", value: "madrid", colorFondo: "#54efa5", colorTitulo: "#3aac75ff", imagen: "img/masMadrid.png" },
  ];

  const aggregatedData = {
    labels: partidos.map(p => p.nombre),
    datasets: [
      {
        label: "Votos",
        data: partidos.map(() => Math.floor(30000 + Math.random() * 20000)),
        backgroundColor: partidos.map(p => p.colorFondo),
        borderColor: partidos.map(p => p.colorTitulo),
        borderWidth: 1,
      },
    ],
  };

  // For the line chart
  const timeLabels = [
    "01-01-2026",
    "02-01-2026",
    "03-01-2026",
    "04-01-2026",
  ];
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
