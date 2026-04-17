import { useCallback, useEffect, useRef, useState } from "react";

export async function loadGeoFeatures(level) {
  let file = "";
  switch (level) {
    case "nation":
      file = "/data/spain_nation.json";
      break;
    case "ccaa":
      file = "/data/spain_ccaa.json";
      break;
    case "province":
      file = "/data/spain_provinces.json";
      break;
    default:
      return [];
  }
  const res = await fetch(file);
  const data = await res.json();
  return data.features ?? [];
}

export function getBBox(features) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  features.forEach((f) => {
    const coords =
      f.geometry.type === "Polygon"
        ? f.geometry.coordinates
        : f.geometry.coordinates.flat();
    coords.forEach((ring) => {
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

/**
 * Proyección equirectangular con escala y traslación precalculadas (evita recalcular en cada vértice).
 */
export function buildProjection(bbox, svgWidth, svgHeight) {
  const [minX, minY, maxX, maxY] = bbox;
  const w = maxX - minX;
  const h = maxY - minY;
  const scaleX = svgWidth / w;
  const scaleY = svgHeight / h;
  const scale = Math.min(scaleX, scaleY) * 0.9;
  const offsetX = (svgWidth - w * scale) / 2;
  const offsetY = (svgHeight - h * scale) / 2;

  return function project([lon, lat]) {
    const x = (lon - minX) * scale + offsetX;
    const y = svgHeight - ((lat - minY) * scale + offsetY);
    return [x, y];
  };
}

function convertToSVGPath(geometry, projectFn) {
  if (geometry.type === "Polygon") {
    return geometry.coordinates
      .map(
        (ring) =>
          "M" +
          ring.map((c) => projectFn(c).join(",")).join(" L") +
          " Z",
      )
      .join(" ");
  }
  return geometry.coordinates
    .map((polygon) =>
      polygon
        .map(
          (ring) =>
            "M" +
            ring.map((c) => projectFn(c).join(",")).join(" L") +
            " Z",
        )
        .join(" "),
    )
    .join(" ");
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
  stops.forEach((s) => {
    const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop.setAttribute("offset", s.offset);
    stop.setAttribute("stop-color", s.color);
    stop.setAttribute("stop-opacity", s.opacity);
    g.appendChild(stop);
  });
  defs.appendChild(g);
}

/**
 * Mapa SVG de España reutilizable.
 *
 * @param {object} props
 * @param {'nation'|'ccaa'|'province'} props.level
 * @param {(feature: object, geoData: object[]) => { fill: string, pointerEvents?: string, stroke?: string, strokeWidth?: string }} props.getFeatureStyle
 * @param {(name: string, feature: object) => void} [props.onFeatureClick]
 * @param {(mapSvg: SVGSVGElement, path: SVGPathElement, feature: object) => void} [props.onPathMouseEnter]
 * @param {(mapSvg: SVGSVGElement) => void} [props.onPathMouseLeave]
 * @param {string} [props.className]
 */
export default function SpainMap({
  level,
  getFeatureStyle,
  onFeatureClick,
  onPathMouseEnter,
  onPathMouseLeave,
  className = "",
}) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const [geoData, setGeoData] = useState([]);
  const getFeatureStyleRef = useRef(getFeatureStyle);
  getFeatureStyleRef.current = getFeatureStyle;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const features = await loadGeoFeatures(level);
      if (!cancelled) setGeoData(features);
    })();
    return () => {
      cancelled = true;
    };
  }, [level]);

  const redraw = useCallback(() => {
    const map = svgRef.current;
    const wrap = wrapRef.current;
    if (!map || !wrap || geoData.length === 0) return;

    const svgWidth = wrap.clientWidth;
    const svgHeight = wrap.clientHeight;
    if (svgWidth < 2 || svgHeight < 2) return;

    map.innerHTML = "";
    map.setAttribute("width", String(svgWidth));
    map.setAttribute("height", String(svgHeight));

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    map.appendChild(defs);

    createLinearGradient(defs, "africa-fill-gradient", [
      { offset: "0%", color: "#D1D1D1", opacity: 1 },
      { offset: "50%", color: "#D1D1D1", opacity: 0.5 },
      { offset: "85%", color: "white", opacity: 0 },
    ]);
    createLinearGradient(defs, "africa-stroke-gradient", [
      { offset: "0%", color: "black", opacity: 1 },
      { offset: "50%", color: "black", opacity: 1 },
      { offset: "80%", color: "white", opacity: 0 },
    ]);
    createLinearGradient(
      defs,
      "france-fill-gradient",
      [
        { offset: "70%", color: "#D1D1D1", opacity: 1 },
        { offset: "85%", color: "#D1D1D1", opacity: 0.5 },
        { offset: "100%", color: "#D1D1D1", opacity: 0 },
      ],
      { x1: "0", y1: "1", x2: "0", y2: "0", transform: "rotate(40)" },
    );
    createLinearGradient(
      defs,
      "france-stroke-gradient",
      [
        { offset: "70%", color: "black", opacity: 1 },
        { offset: "95%", color: "black", opacity: 0.5 },
        { offset: "100%", color: "white", opacity: 0 },
      ],
      { x1: "0", y1: "1", x2: "0", y2: "0", transform: "rotate(40)" },
    );

    const bbox = getBBox(geoData);
    const projectFn = buildProjection(bbox, svgWidth, svgHeight);

    const canariasGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    let hasCanarias = false;

    const styleFn = getFeatureStyleRef.current;

    geoData.forEach((feature) => {
      const pathData = convertToSVGPath(feature.geometry, projectFn);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      const name = feature.properties?.name ?? "";
      path.setAttribute("data-name", name);
      path.setAttribute("vector-effect", "non-scaling-stroke");

      const style = styleFn(feature, geoData);
      path.style.fill = style.fill;
      if (style.stroke) path.style.stroke = style.stroke;
      if (style.strokeWidth) path.style.strokeWidth = style.strokeWidth;
      path.style.pointerEvents = style.pointerEvents ?? "auto";

      if (name === "Africa Norte") {
        path.style.pointerEvents = "none";
        path.style.fill = "url(#africa-fill-gradient)";
        path.style.stroke = "url(#africa-stroke-gradient)";
        path.style.strokeWidth = "1";
      } else if (name === "Portugal") {
        path.style.fill = "#D1D1D1";
        path.style.pointerEvents = "none";
        path.style.stroke = "black";
        path.style.strokeWidth = "1";
      } else if (name === "Francia Sur") {
        path.style.pointerEvents = "none";
        path.style.fill = "url(#france-fill-gradient)";
        path.style.stroke = "url(#france-stroke-gradient)";
        path.style.strokeWidth = "1";
      }

      path.addEventListener("mouseenter", () => {
        if (onPathMouseEnter) onPathMouseEnter(map, path, feature);
      });
      path.addEventListener("mouseleave", () => {
        if (onPathMouseLeave) onPathMouseLeave(map);
      });
      path.addEventListener("click", () => {
        if (onFeatureClick && path.style.pointerEvents !== "none") {
          onFeatureClick(name, feature);
        }
      });

      const isCanariasFeature =
        name === "Islas Canarias" ||
        name === "Las Palmas" ||
        name === "Canarias" ||
        name === "Santa Cruz de Tenerife";

      if (isCanariasFeature) {
        canariasGroup.appendChild(path);
        hasCanarias = true;
      } else {
        map.appendChild(path);
      }
    });

    if (hasCanarias) {
      map.appendChild(canariasGroup);
    }

    const scaleFactor = svgWidth / 1000;

    if (
      hasCanarias &&
      (level === "nation" || level === "ccaa" || level === "province")
    ) {
      const BASE_PADDING = 20;
      const MIN_PADDING = 10;
      const MAX_PADDING = 50;
      let padding = BASE_PADDING * scaleFactor;
      padding = Math.max(MIN_PADDING, Math.min(MAX_PADDING, padding));
      const bboxCanarias = canariasGroup.getBBox();
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", bboxCanarias.x - padding);
      rect.setAttribute("y", bboxCanarias.y - padding);
      rect.setAttribute("width", bboxCanarias.width + padding * 2);
      rect.setAttribute("height", bboxCanarias.height + padding * 2);
      rect.setAttribute("fill", "none");
      rect.setAttribute("stroke", "black");
      rect.setAttribute("stroke-width", "2");
      rect.setAttribute("vector-effect", "non-scaling-stroke");
      rect.setAttribute("rx", "16");
      rect.setAttribute("ry", "16");
      canariasGroup.insertBefore(rect, canariasGroup.firstChild);
    }

    if (hasCanarias) {
      canariasGroup.setAttribute(
        "transform",
        `translate(${0 * scaleFactor}, ${-250 * scaleFactor})`,
      );
    }

    const vb = map.getBBox();
    map.setAttribute(
      "viewBox",
      `${vb.x - 20} ${vb.y - 20} ${vb.width + 40} ${vb.height + 40}`,
    );
  }, [geoData, level, onFeatureClick, onPathMouseEnter, onPathMouseLeave]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") {
      const id = requestAnimationFrame(redraw);
      return () => cancelAnimationFrame(id);
    }
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(redraw);
    });
    ro.observe(wrap);
    requestAnimationFrame(redraw);
    return () => ro.disconnect();
  }, [redraw]);

  return (
    <div ref={wrapRef} className={className} style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef} id="map" className="spain-map-svg" role="img" aria-label="Mapa">
        <title>Mapa</title>
      </svg>
    </div>
  );
}