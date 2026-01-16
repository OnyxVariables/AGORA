import { useEffect, useState } from "react";
import "./ElectionsMap.css";
import Particles from "../../components/Particles/Particles";

export default function ElectionsMap() {
  const [selectedName, setSelectedName] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [seatsAssigned, setSeatsAssigned] = useState(0);


  const levels = [
    { value: "nation", label: "Nación" },
    { value: "ccaa", label: "Comunidad" },
    { value: "province", label: "Provincia" },
    { value: "municipality", label: "Municipio" }
  ];

  useEffect(() => {
    // Colores por CCAA
    const ccaaColors = {
      "Andalucía": "#4CAF50",
      "Aragon": "#FF9800",
      "Asturias": "#2196F3",
      "Cantabria": "#c4cf5eff",
      "Castilla y León": "#E91E63",
      "Castilla la Mancha": "#795548",
      "Cataluña": "#3F51B5",
      "Ceuta": "#009688",
      "Comunidad Valenciana": "#F44336",
      "Extremadura": "#8BC34A",
      "Galicia": "#FF9800",
      "Islas Baleares": "#FF5722",
      "Islas Canarias": "#673AB7",
      "La Rioja": "#6f16ffff",
      "Comunidad de Madrid": "#FFC107",
      "Melilla": "#00BCD4",
      "Murcia": "#CDDC39",
      "Navarra, Comunidad Foral de": "#FFEB3B",
      "País Vasco": "#c800ffff"
    };

    // Relación provincia / CCAA
    const provinceToCCAA = {
      "Almería": "Andalucía",
      "Cádiz": "Andalucía",
      "Córdoba": "Andalucía",
      "Granada": "Andalucía",
      "Huelva": "Andalucía",
      "Jaén": "Andalucía",
      "Málaga": "Andalucía",
      "Sevilla": "Andalucía",
      "Huesca": "Aragon",
      "Teruel": "Aragon",
      "Zaragoza": "Aragon",
      "Asturias": "Asturias",
      "Cantabria": "Cantabria",
      "Ávila": "Castilla y León",
      "Burgos": "Castilla y León",
      "León": "Castilla y León",
      "Palencia": "Castilla y León",
      "Salamanca": "Castilla y León",
      "Segovia": "Castilla y León",
      "Soria": "Castilla y León",
      "Valladolid": "Castilla y León",
      "Zamora": "Castilla y León",
      "Albacete": "Castilla la Mancha",
      "Ciudad Real": "Castilla la Mancha",
      "Cuenca": "Castilla la Mancha",
      "Guadalajara": "Castilla la Mancha",
      "Toledo": "Castilla la Mancha",
      "Barcelona": "Cataluña",
      "Gerona": "Cataluña",
      "Lérida": "Cataluña",
      "Tarragona": "Cataluña",
      "Ceuta": "Ceuta",
      "Valencia": "Comunidad Valenciana",
      "Alicante": "Comunidad Valenciana",
      "Castellón": "Comunidad Valenciana",
      "Badajoz": "Extremadura",
      "Cáceres": "Extremadura",
      "La Coruña": "Galicia",
      "Lugo": "Galicia",
      "Orense": "Galicia",
      "Pontevedra": "Galicia",
      "Baleares": "Islas Baleares",
      "Las Palmas": "Islas Canarias",
      "Santa Cruz de Tenerife": "Islas Canarias",
      "La Rioja": "La Rioja",
      "Madrid": "Comunidad de Madrid",
      "Melilla": "Melilla",
      "Murcia": "Murcia",
      "Navarra": "Navarra, Comunidad Foral de",
      "Álava": "País Vasco",
      "Gipuzkoa": "País Vasco",
      "Bizkaia": "País Vasco"
    };

    let cachedViewBox = null; //Para calcular el viewbox solo una vez (como me dijiste Rojohn)


    //Funciones para colores
    function hexToRgb(hex) {
      hex = hex.replace('#', '');
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
      };
    }

    function rgbToHex(r, g, b) {
      return "#" + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
    }

    function generateProvinceColor(baseHex, index, total) {
      const rgb = hexToRgb(baseHex);
      const factor = 1 - 0.5 * index / total;
      return rgbToHex(Math.round(rgb.r * factor), Math.round(rgb.g * factor), Math.round(rgb.b * factor));
    }

    //Logica
    let currentLevel = "nation";

    async function loadGeoData(level) {
      let file = "";
      switch (level) {
        case "nation": file = "/data/spain_nation.json"; break;
        case "ccaa": file = "/data/spain_ccaa.json"; break;
        case "province": file = "/data/spain_provinces.json"; break;
        // case "municipality": file = "/data/spain_municipality.json"; break;
        default:
          return [];
      }

      const res = await fetch(file);
      const data = await res.json();
      return data.features;
    }

    //Escalo los polígonos para que se vean bien o sino no sabría que tamaño tendría cada uno ni en que posicion ponerlos
    function getBBox(features) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      features.forEach(f => {
        let coords = f.geometry.type === "Polygon" ? f.geometry.coordinates : f.geometry.coordinates.flat();
        coords.forEach(ring => {
          ring.forEach(([lon, lat]) => {
            if (lon < minX) minX = lon;
            if (lat < minY) minY = lat;
            if (lon > maxX) maxX = lon;
            if (lat > maxY) maxY = lat;
          });
        });
      });
      return [minX, minY, maxX, maxY];
    }

    function project([lon, lat], bbox, svgWidth, svgHeight) {
      const [minX, minY, maxX, maxY] = bbox;
      const scaleX = svgWidth / (maxX - minX);
      const scaleY = svgHeight / (maxY - minY);
      const scale = Math.min(scaleX, scaleY) * 0.9;

      const x = (lon - minX) * scale + (svgWidth - (maxX - minX) * scale) / 2;
      const y = svgHeight - ((lat - minY) * scale + (svgHeight - (maxY - minY) * scale) / 2);

      return [x, y];
    }

    function convertToSVGPath(geometry, bbox, svgWidth, svgHeight) {
      if (geometry.type === "Polygon") {
        return geometry.coordinates.map(ring => "M" + ring.map(c => project(c, bbox, svgWidth, svgHeight).join(",")).join(" L") + " Z").join(" ");
      } else {
        return geometry.coordinates.map(polygon => polygon.map(ring => "M" + ring.map(c => project(c, bbox, svgWidth, svgHeight).join(",")).join(" L") + " Z").join(" ")).join(" ");
      }
    }

    function createLinearGradient(defs, id, stops, options = {}) {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
      g.setAttribute("id", id);

      g.setAttribute("x1", options.x1 ?? "0");
      g.setAttribute("y1", options.y1 ?? "0");
      g.setAttribute("x2", options.x2 ?? "0");
      g.setAttribute("y2", options.y2 ?? "1");

      if (options.transform) {
        g.setAttribute("gradientTransform", options.transform);
      }

      stops.forEach(s => {
        const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop.setAttribute("offset", s.offset);
        stop.setAttribute("stop-color", s.color);
        stop.setAttribute("stop-opacity", s.opacity);
        g.appendChild(stop);
      });

      defs.appendChild(g);
    }

    //Función tocha, es la que dibuja el mapa
    function drawMap(geoData) {
      const map = document.getElementById("map");
      const svgWidth = map.clientWidth;
      const svgHeight = map.clientHeight;
      map.innerHTML = '';
      if (geoData.length === 0) return;

      let defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      map.appendChild(defs);

      // Gradiente fill para Marruecos
      createLinearGradient(defs, "africa-fill-gradient", [
        { offset: "0%", color: "#D1D1D1", opacity: 1 },
        { offset: "50%", color: "#D1D1D1", opacity: 0.5 },
        { offset: "85%", color: "white", opacity: 0 }
      ]);

      // Gradiente stroke para Marruecos
      createLinearGradient(defs, "africa-stroke-gradient", [
        { offset: "0%", color: "black", opacity: 1 },
        { offset: "50%", color: "black", opacity: 1 },
        { offset: "80%", color: "white", opacity: 0 }
      ]);

      // Gradiente fill para Francia
      createLinearGradient(defs, "france-fill-gradient", [
        { offset: "70%", color: "#D1D1D1", opacity: 1 },
        { offset: "85%", color: "#D1D1D1", opacity: 0.5 },
        { offset: "100%", color: "#D1D1D1", opacity: 0 }
      ], { x1: "0", y1: "1", x2: "0", y2: "0", transform: "rotate(40)" });

      // Gradiente stroke para Francia
      createLinearGradient(defs, "france-stroke-gradient", [
        { offset: "70%", color: "black", opacity: 1 },
        { offset: "95%", color: "black", opacity: 0.5 },
        { offset: "100%", color: "white", opacity: 0 }
      ], { x1: "0", y1: "1", x2: "0", y2: "0", transform: "rotate(40)" });


      const bbox = getBBox(geoData);

      // Grupo especial para Canarias para mover posiciones (SOLO ccaa, province y nation)
      const canariasGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");


      let hasCanarias = false;

      geoData.forEach(feature => {
        const pathData = convertToSVGPath(feature.geometry, bbox, svgWidth, svgHeight);
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute('d', pathData);

        //Esto lo utilizo para que cada provincia tenga su propio color que le corresponde y no el de la ccaa para todas
        path.setAttribute('data-name', feature.properties.name);
        path.setAttribute("vector-effect", "non-scaling-stroke"); //Se amplia porque reescala en base al tamaño del dispoitivo y por eso se ve más ancho

        // Colores por nivel
        if (feature.properties.name === "Africa Norte") {
          path.style.pointerEvents = "none";
          path.style.fill = `url(#africa-fill-gradient)`; //Aplico gradiente a fill
          path.style.stroke = `url(#africa-stroke-gradient)`; //Aplico gradiente a stroke
          path.style.strokeWidth = "1";
        }
        else if (feature.properties.name === "Portugal") {
          path.style.fill = "#D1D1D1";
          path.style.pointerEvents = "none"
          path.style.stroke = "black";
          path.style.strokeWidth = "1";
        }
        else if (feature.properties.name === "Francia Sur") {
          path.style.pointerEvents = "none"
          path.style.fill = `url(#france-fill-gradient)`; //Aplico gradiente a fill
          path.style.stroke = `url(#france-stroke-gradient)`; //Aplico gradiente a stroke
          path.style.strokeWidth = "1";
        }
        else if (currentLevel === "ccaa") {
          path.style.fill = ccaaColors[feature.properties.name] || "#ccc";
        }
        else if (currentLevel === "province") {
          const province = feature.properties.name;
          const ccaa = provinceToCCAA[province];
          const baseColor = ccaaColors[ccaa] || "#ccc";

          const provinces = geoData.filter(f => provinceToCCAA[f.properties.name] === ccaa);
          const index = provinces.indexOf(feature);

          const provinceColor = generateProvinceColor(baseColor, index, provinces.length);
          path.style.fill = provinceColor;

          //Guardo el color base / provincia para el hover
          path.dataset.provinceColor = provinceColor;
          path.dataset.ccaaColor = baseColor;
        }
        else {
          path.style.fill = "#ff4141ff";
        }

        // Hover / seleccion
        path.addEventListener('mouseenter', () => hoverFeature(map, path));
        path.addEventListener('mouseleave', () => resetHover(map));
        path.addEventListener('click', () => selectFeature(path));

        // Identificar Canarias
        const isCanariasFeature = feature.properties?.name === "Islas Canarias" ||
          feature.properties?.name === "Las Palmas" ||
          feature.properties?.name === "Canarias" || //Solucion
          feature.properties?.name === "Santa Cruz de Tenerife";

        // Mover Canarias al grupo
        if (isCanariasFeature) {
          canariasGroup.appendChild(path);
          hasCanarias = true;
        } else {
          map.appendChild(path);
        }
      });

      // Añadir grupo de Canarias al SVG
      if (hasCanarias) {
        map.appendChild(canariasGroup);
      }

      const scaleFactor = svgWidth / 1000; //Viene de porcentajes para hacerlo % en pantallas mas pequeñas

      // Marco solo para ccaa y province y nation
      if (hasCanarias && (currentLevel === "nation" || currentLevel === "ccaa" || currentLevel === "province")) {
        const BASE_PADDING = 20;
        const MIN_PADDING = 10;
        const MAX_PADDING = 50;

        // Lo hago de esta forma porque si solo utilizo una medida en pantallas pequeñas se pone diminuto y de esta forma le puedo decir hasta que medidas quiero que empequeñezca o engrandezca
        let PADDING = BASE_PADDING * scaleFactor;
        PADDING = Math.max(MIN_PADDING, Math.min(MAX_PADDING, PADDING));

        const bboxCanarias = canariasGroup.getBBox();

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", bboxCanarias.x - PADDING);
        rect.setAttribute("y", bboxCanarias.y - PADDING);
        rect.setAttribute("width", bboxCanarias.width + PADDING * 2);
        rect.setAttribute("height", bboxCanarias.height + PADDING * 2);
        rect.setAttribute("fill", "none");
        rect.setAttribute("stroke", "black");
        rect.setAttribute("stroke-width", "2");
        rect.setAttribute("vector-effect", "non-scaling-stroke"); //Se amplia porque reescala en base al tamaño del dispoitivo y por eso se ve más ancho
        rect.setAttribute("rx", 16);
        rect.setAttribute("ry", 16);

        canariasGroup.insertBefore(rect, canariasGroup.firstChild);
      }

      const canariasOffset = {
        x: 0 * scaleFactor,
        y: -250 * scaleFactor
      };

      canariasGroup.setAttribute("transform", `translate(${canariasOffset.x}, ${canariasOffset.y})`); //Le paso el translate a Canarias con la variable del principio

      // Ajuste viewbox
      if (!viewBoxInitialized) {
        const finalBBox = map.getBBox();
        cachedViewBox = `${finalBBox.x - 20} ${finalBBox.y - 20} ${finalBBox.width + 40} ${finalBBox.height + 40}`;
        viewBoxInitialized = true;
      }

      map.setAttribute("viewBox", cachedViewBox);
    }

    function hoverFeature(map, path) {
      if (currentLevel === "nation") {
        map.querySelectorAll('path').forEach(p => {
          const pName = p.getAttribute("data-name");

          if (pName === "Spain" || pName === "Canarias") {
            p.style.filter = "brightness(1.4)";
          } else {
            p.style.filter = "brightness(0.5)";
          }
        });
        return;
      }

      if (currentLevel === "province") {
        const hoveredProvince = path;
        const provinceName = hoveredProvince.getAttribute('data-name');
        const ccaa = provinceToCCAA[provinceName];

        map.querySelectorAll('path').forEach(p => {
          const pName = p.getAttribute('data-name');
          const pCCAA = provinceToCCAA[pName];

          if (p === hoveredProvince) {
            //la del cursor
            p.style.fill = p.dataset.ccaaColor;
            p.style.filter = "brightness(1.2)";
            p.style.strokeWidth = "2"; //Esto mola, como que resalta aun mas la provincia en la que estoy
          } else if (pCCAA === ccaa) {
            //En ccaa
            p.style.fill = p.dataset.ccaaColor;
            p.style.filter = "brightness(0.7)";
          } else {
            //Demas
            p.style.filter = "brightness(0.45)";
          }
        });
      } else {
        // Mantener comportamiento de otros niveles
        map.querySelectorAll('path').forEach(p => {
          if (p === path) p.style.filter = "brightness(1.2)";
          else p.style.filter = "brightness(0.5)";
        });
      }
    }

    function resetHover(map) {
      if (currentLevel === "province") {
        map.querySelectorAll('path').forEach(p => {
          p.style.fill = p.dataset.provinceColor;
          p.style.filter = "brightness(1)";
          p.style.strokeWidth = "1";
        });
      } else {
        map.querySelectorAll('path').forEach(p => p.style.filter = "brightness(1)");
      }
    }

    function selectFeature(path) {
      const name = path.getAttribute('data-name');

      setSelectedName(name);
      setShowDialog(true);

      // TODO(srvariable): Get data from database, instead of using random values
      const tempDataPerProvince = {
        "Almería": { "votes": 10000, "seats": 1 },
        "Cádiz": { "votes": 20000, "seats": 2 },
        "Córdoba": { "votes": 30000, "seats": 3 },
        "Granada": { "votes": 40000, "seats": 4 },
        "Huelva": { "votes": 50000, "seats": 5 },
        "Jaén": { "votes": 60000, "seats": 6 },
        "Málaga": { "votes": 70000, "seats": 7 },
        "Sevilla": { "votes": 80000, "seats": 8 },
        "Huesca": { "votes": 90000, "seats": 9 },
        "Teruel": { "votes": 100000, "seats": 10 },
        "Zaragoza": { "votes": 10000, "seats": 1 },
        "Asturias": { "votes": 20000, "seats": 2 },
        "Cantabria": { "votes": 30000, "seats": 3 },
        "Ávila": { "votes": 40000, "seats": 4 },
        "Burgos": { "votes": 50000, "seats": 5 },
        "León": { "votes": 60000, "seats": 6 },
        "Palencia": { "votes": 70000, "seats": 7 },
        "Salamanca": { "votes": 80000, "seats": 8 },
        "Segovia": { "votes": 90000, "seats": 9 },
        "Soria": { "votes": 100000, "seats": 10 },
        "Valladolid": { "votes": 10000, "seats": 1 },
        "Zamora": { "votes": 20000, "seats": 2 },
        "Albacete": { "votes": 30000, "seats": 3 },
        "Ciudad Real": { "votes": 40000, "seats": 4 },
        "Cuenca": { "votes": 50000, "seats": 5 },
        "Guadalajara": { "votes": 60000, "seats": 6 },
        "Toledo": { "votes": 70000, "seats": 7 },
        "Barcelona": { "votes": 80000, "seats": 8 },
        "Gerona": { "votes": 90000, "seats": 9 },
        "Lérida": { "votes": 100000, "seats": 10 },
        "Tarragona": { "votes": 10000, "seats": 1 },
        "Ceuta": { "votes": 20000, "seats": 2 },
        "Valencia": { "votes": 30000, "seats": 3 },
        "Alicante": { "votes": 40000, "seats": 4 },
        "Castellón": { "votes": 50000, "seats": 5 },
        "Badajoz": { "votes": 60000, "seats": 6 },
        "Cáceres": { "votes": 70000, "seats": 7 },
        "La Coruña": { "votes": 80000, "seats": 8 },
        "Lugo": { "votes": 90000, "seats": 9 },
        "Orense": { "votes": 100000, "seats": 10 },
        "Pontevedra": { "votes": 10000, "seats": 1 },
        "Baleares": { "votes": 20000, "seats": 2 },
        "Las Palmas": { "votes": 30000, "seats": 3 },
        "Santa Cruz de Tenerife": { "votes": 40000, "seats": 4 },
        "La Rioja": { "votes": 50000, "seats": 5 },
        "Madrid": { "votes": 60000, "seats": 6 },
        "Melilla": { "votes": 70000, "seats": 7 },
        "Murcia": { "votes": 80000, "seats": 8 },
        "Navarra": { "votes": 90000, "seats": 9 },
        "Álava": { "votes": 100000, "seats": 10 },
        "Gipuzkoa": { "votes": 10000, "seats": 1 },
        "Bizkaia": { "votes": 20000, "seats": 2 },
      };

      if (currentLevel === "nation" && name === "Spain") {
        setTotalVotes(Object.values(tempDataPerProvince).reduce((accumulator, data) => {
          return accumulator + data.votes;
        }, 0));

        setSeatsAssigned(Object.values(tempDataPerProvince).reduce((accumulator, data) => {
          return accumulator + data.seats;
        }, 0));
      } else if (currentLevel === "ccaa") {
        setTotalVotes(() => {
          let accumulator = 0;
          Object.entries(tempDataPerProvince).forEach(([province, data]) => {
            if (provinceToCCAA[province] === name) {
              accumulator += data.votes;
            }
          });
          return accumulator;
        });
        setSeatsAssigned(() => {
          let accumulator = 0;
          Object.entries(tempDataPerProvince).forEach(([province, data]) => {
            if (provinceToCCAA[province] === name) {
              accumulator += data.seats;
            }
          });
          return accumulator;
        });
      } else if (currentLevel === "province") {
        setTotalVotes(tempDataPerProvince[name]?.votes || 0);
        setSeatsAssigned(tempDataPerProvince[name]?.seats || 0);
      }


      // Scroll to the dialog
      const dialog = document.querySelector(".dialog");
      if (dialog) {
        const offset = 20;
        const scrollY = dialog.getBoundingClientRect().bottom + offset - window.innerHeight;
        window.scrollBy({ top: scrollY, behavior: 'smooth' });
      }
    }

    async function changeLevel(level) {
      currentLevel = level;
      const geoData = await loadGeoData(level);
      drawMap(geoData);
    }

    document
      .querySelectorAll('input[name="level"]')
      .forEach(radio =>
        radio.addEventListener("change", e =>
          changeLevel(e.target.value)
        )
      );

    let viewBoxInitialized = false;
    changeLevel(currentLevel);
  }, []);

  return (
    <main className="electionsMap">
      <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'fixed', inset: 0, zIndex: 0 }}>
        <Particles
          particleColors={['#d4a0ff', '#a066ff', '#6a00d4']}
          particleCount={20000}
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
          <select className="select" defaultValue="">
            <option value="" disabled>ID:</option>
            <option value="2026">2026</option>
            <option value="2030">2030</option>
            <option value="2034">2034</option>
          </select>
        </article>
        <article className="article2">
          <p>Pincha en el mapa para ver estadísticas</p>
        </article>
      </section>

      <section className="section2">
        <label>Buscar por nickname:</label>
        <input className="nickname" placeholder="  ..." />
      </section>


      <section className="section3">
        <form className="filtrado">
          {levels.map(({ value, label }) => (
            <div className="types" key={value}>
              <label>{label}</label>
              <input type="radio" name="level" value={value} defaultChecked={value === "nation"} />
            </div>
          ))}
        </form>
      </section>

      <section className="section4">
        <article className="map">
          <div id="map-container">
            <svg id="map">
              <path id="mapa" />
            </svg>
          </div>
          {/* <div className="ocean" style={{ top: "45%", left: "10%" }}>OCÉANO ATLÁNTICO</div>
                <div className="ocean" style={{ top: "70%", left: "80%" }}>MAR MEDITERRÁNEO</div>
                <div className="ocean" style={{ top: "8%", left: "55%" }}>MAR CANTÁBRICO</div> */}
        </article>
      </section>

      {showDialog && (
        <dialog className="dialog" open>
          <h3>Información de {selectedName}</h3>
          <p><span style={{ fontWeight: "bold" }}>Número de votos:</span> {totalVotes}</p>
          <p><span style={{ fontWeight: "bold" }}>Escaños asignados:</span> {seatsAssigned}</p>
          {/* TODO(srvariable): Add more info */}
          <button className="dialog__button" onClick={() => setShowDialog(false)}>Cerrar</button>
        </dialog>
      )}
    </main>
  );
}
