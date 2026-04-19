import { useCallback, useMemo, useEffect, useState } from "react";
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

// Suma votos del backend (nombres INE/BD) al nombre de provincia del GeoJSON
function votesForMapProvince(mapProvinceName, byProvince) {
  if (!byProvince || typeof byProvince !== "object") return 0;
  
  const aliasGroups = {
    "La Coruña": ["La Coruña", "A Coruña", "Coruña", "A Coruña, A", "Coruña, A"],
    "Lugo": ["Lugo"],
    "Orense": ["Orense", "Ourense"],
    "Pontevedra": ["Pontevedra"],
    "Barcelona": ["Barcelona"],
    "Gerona": ["Gerona", "Girona"],
    "Lérida": ["Lérida", "Lleida"],
    "Tarragona": ["Tarragona"],
    "Álava": ["Álava", "Araba/Álava", "Araba"],
    "Vizcaya": ["Vizcaya", "Bizkaia"],
    "Gipuzkoa": ["Gipuzkoa", "Guipúzcoa"],
    "Navarra": ["Navarra", "Navarra / Nafarroa", "Nafarroa", "Navarra, Comunidad Foral de"],
    "La Rioja": ["La Rioja", "Rioja, La"],
    "Ávila": ["Ávila", "Avila"],
    "Burgos": ["Burgos"],
    "León": ["León", "Leon"],
    "Palencia": ["Palencia"],
    "Salamanca": ["Salamanca"],
    "Segovia": ["Segovia"],
    "Soria": ["Soria"],
    "Valladolid": ["Valladolid"],
    "Zamora": ["Zamora"],
    "Asturias": ["Asturias", "Asturias, Principado de"],
    "Cantabria": ["Cantabria"],
    "Madrid": ["Madrid", "Comunidad de Madrid"],
    "Albacete": ["Albacete"],
    "Ciudad Real": ["Ciudad Real"],
    "Cuenca": ["Cuenca"],
    "Guadalajara": ["Guadalajara"],
    "Toledo": ["Toledo"],
    "Badajoz": ["Badajoz"],
    "Cáceres": ["Cáceres", "Caceres"],
    "Huesca": ["Huesca"],
    "Teruel": ["Teruel"],
    "Zaragoza": ["Zaragoza"],
    "Cataluña": ["Cataluña"],
    "Valencia": ["Valencia", "València", "Valencia/València", "Valencia/Valencia"],
    "Alicante": ["Alicante", "Alacant", "Alicante/Alacant"],
    "Castellón": ["Castellón", "Castelló", "Castellon", "Castello", "Castellón/Castelló", "Castellon/Castello"],
    "Valencia/València": ["Valencia/València"],
    "Alicante/Alacant": ["Alicante/Alacant"],
    "Castellón/Castelló": ["Castellón/Castelló"],
    "Araba/Álava": ["Araba/Álava"],
    "Bizkaia/Vizcaya": ["Bizkaia/Vizcaya"],
    "Gipuzkoa/Guipúzcoa": ["Gipuzkoa/Guipúzcoa"],
    "Gerona/Girona": ["Gerona/Girona"],
    "Lérida/Lleida": ["Lérida/Lleida"],
    "Orense/Ourense": ["Orense/Ourense"],
    "La Coruña/A Coruña": ["La Coruña/A Coruña"],
    "Baleares": ["Baleares", "Islas Baleares", "Illes Balears", "Balears, Illes"],
    "Almería": ["Almería", "Almeria"],
    "Cádiz": ["Cádiz", "Cadiz"],
    "Córdoba": ["Córdoba", "Cordoba"],
    "Granada": ["Granada"],
    "Huelva": ["Huelva"],
    "Jaén": ["Jaén", "Jaen"],
    "Málaga": ["Málaga", "Malaga"],
    "Sevilla": ["Sevilla"],
    "Murcia": ["Murcia"],
    "Las Palmas": ["Las Palmas", "Las Palmas de Gran Canaria", "Palmas, Las"],
    "Santa Cruz de Tenerife": ["Santa Cruz de Tenerife"],
    "Ceuta": ["Ceuta"],
    "Melilla": ["Melilla"],
  };
  
  // Busco primero en grupos de alias
  const keys = aliasGroups[mapProvinceName];
  if (keys) {
    return keys.reduce((s, k) => s + (Number(byProvince[k]) || 0), 0);
  }
  
  // Si no hay alias definido, busco coincidencia exacta
  const directValue = Number(byProvince[mapProvinceName]) || 0;
  if (directValue > 0) return directValue;
  
  // Búsqueda case-insensitive como último recurso
  const lowerName = mapProvinceName.toLowerCase();
  for (const [key, value] of Object.entries(byProvince)) {
    if (key.toLowerCase() === lowerName) {
      return Number(value) || 0;
    }
  }
  
  return 0;
}

// Mapa de calor por provincia (votos agregados). Usa `votesByProvinceName` del bundle de métricas
export function HeatChart({ votesByProvinceName = {} }) {
  const [mapKey, setMapKey] = useState(0);
  
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

  // Actualización en tiempo real sin recargar el mapa
  // useEffect(() => {
  //   setMapKey(prev => prev + 1);
  // }, [byProvince]);

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

  // Debug: datos del heatmap
  // useEffect(() => {
  //   console.log("HeatChart - votesByProvinceName:", votesByProvinceName);
  //   console.log("HeatChart - votesByProvinceName keys:", Object.keys(votesByProvinceName || {}));
  //   console.log("HeatChart - votesByProvinceName type:", typeof votesByProvinceName);
  //   console.log("HeatChart - votesByProvinceName isArray:", Array.isArray(votesByProvinceName));
  //   console.log("HeatChart - byProvince keys:", Object.keys(byProvince));
  //   console.log("HeatChart - byProvince data:", byProvince);
  //   console.log("HeatChart - totalVotes:", totalVotes);
  // }, [votesByProvinceName, byProvince, totalVotes]);

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
      // Escala fija: cambiar para pruebas
      const FIXED_MAX_VOTES = 500000;
      const t = Math.min(n / FIXED_MAX_VOTES, 1);
      const r = Math.round(230 - t * 180);
      const g = Math.round(240 - t * 200);
      const b = Math.round(255 - t * 100);
      const color = `rgb(${r},${g},${b})`;
      // Debug: log cada provincia procesada
      // console.log(`HeatChart - Provincia: "${name}" -> ${n} votos -> color ${color}`);
      return { fill: color };
    },
    [byProvince],
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
            <span>0</span>
            <span>1.000</span>
            <span>10.000</span>
            <span>50.000</span>
            <span>100.000</span>
            <span>500.000</span>
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
            key={mapKey}
            level="province" 
            getFeatureStyle={getFeatureStyle}
          />
        </div>
      </div>
    </div>
  );
}

export default function ChartSection({ voteMetrics }) {
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

          <HeatChart votesByProvinceName={voteMetrics.votesByProvinceName} />
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
