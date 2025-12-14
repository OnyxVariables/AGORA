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
    "La Rioja": "#607D8B",
    "Comunidad de Madrid": "#FFC107",
    "Melilla": "#00BCD4",
    "Murcia": "#CDDC39",
    "Navarra, Comunidad Foral de": "#FFEB3B",
    "País Vasco": "#8E24AA"
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


//Funciones para colores
function hexToRgb(hex){
    hex = hex.replace('#','');
    return {r:parseInt(hex.substring(0,2),16), g:parseInt(hex.substring(2,4),16), b:parseInt(hex.substring(4,6),16)};
}

function rgbToHex(r,g,b){ //padStart es parecido a trim () pero no modifica la cadena original y lo hace hasta alcanzar la lngitud especificada
    return "#" + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0'); 
}

function generateProvinceColor(baseHex,index,total){
    const rgb = hexToRgb(baseHex);
    const factor = 1 - 0.5*index/total;
    return rgbToHex(Math.round(rgb.r*factor), Math.round(rgb.g*factor), Math.round(rgb.b*factor));
}


//Logica
const map = document.getElementById("map");
const svgWidth = map.clientWidth;
const svgHeight = map.clientHeight;
let currentLevel = 'nation';
let geoData = [];

async function loadGeoData(level){
    let file='';
    switch(level){
        case 'nation': file='data/spain_nation.json'; break;
        case 'ccaa': file='data/spain_ccaa.json'; break;
        case 'province': file='data/spain_provinces.json'; break;
        // case 'municipality': file='data/spain_municipalities.json'; break;
    }

    const res = await fetch(file);
    const data = await res.json();
    geoData = data.features;
}

//Escalo los polígonos para que se vean bien o sino no sabría que tamaño tendría cada uno ni en que posicion ponerlos
function getBBox(features){
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    features.forEach(f=>{
        let coords = f.geometry.type==="Polygon"?f.geometry.coordinates:f.geometry.coordinates.flat();
        coords.forEach(ring=>{
            ring.forEach(([lon,lat])=>{
                if(lon<minX) minX=lon;
                if(lat<minY) minY=lat;
                if(lon>maxX) maxX=lon;
                if(lat>maxY) maxY=lat;
            });
        });
    });
    return [minX,minY,maxX,maxY];
}

function project([lon,lat],bbox){
    const [minX,minY,maxX,maxY]=bbox;
    const scaleX=svgWidth/(maxX-minX), scaleY=svgHeight/(maxY-minY);
    const scale=Math.min(scaleX,scaleY)*0.9;
    const x=(lon-minX)*scale + (svgWidth-(maxX-minX)*scale)/2;
    const y=svgHeight-((lat-minY)*scale + (svgHeight-(maxY-minY)*scale)/2);
    return [x,y];
}

function convertToSVGPath(geometry,bbox){
    if(geometry.type==="Polygon"){
        return geometry.coordinates.map(ring=>"M"+ring.map(c=>project(c,bbox).join(",")).join(" L")+" Z").join(" ");
    }else{
        return geometry.coordinates.map(polygon=>polygon.map(ring=>"M"+ring.map(c=>project(c,bbox).join(",")).join(" L")+" Z").join(" ")).join(" ");
    }
}


function drawMap() {
    map.innerHTML = '';
    if (geoData.length === 0) return;

    const bbox = getBBox(geoData);

    // Grupo especial para Canarias para mover posiciones (SOLO ccaa, province y nation)
    const canariasGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    //Mover según nivel
    if (currentLevel === "nation") {
        canariasGroup.setAttribute("transform", "translate(150,-650)"); //Esta mierda si funciona
    } else {
        // Posición cuando es ccaa o province
        canariasGroup.setAttribute("transform", "translate(150,-650)");
    }

    let hasCanarias = false;

    geoData.forEach(feature => {
        const pathData = convertToSVGPath(feature.geometry, bbox);
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute('d', pathData);

        // Colores por nivel
        if (currentLevel === "ccaa") {
            path.style.fill = ccaaColors[feature.properties.name] || "#ccc";
        }
        else if (currentLevel === "province") {
            const province = feature.properties.name;
            const ccaa = provinceToCCAA[province];
            const baseColor = ccaaColors[ccaa] || "#ccc";

            const provinces = geoData.filter(
                f => provinceToCCAA[f.properties.name] === ccaa
            );
            const index = provinces.indexOf(feature);

            path.style.fill = generateProvinceColor(baseColor, index, provinces.length);
        }
        else {
            // Nivel nation
            path.style.fill = "#ff4141ff";
        }

        // Hover / seleccion
        path.addEventListener('mouseenter', () => hoverFeature(path));
        path.addEventListener('mouseleave', () => resetHover());
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

    // Marco solo para ccaa y province y nation
    if (hasCanarias && (currentLevel === "nation" || currentLevel === "ccaa" || currentLevel === "province")) {
        const PADDING = 20;
        const bboxCanarias = canariasGroup.getBBox();

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", bboxCanarias.x - PADDING);
        rect.setAttribute("y", bboxCanarias.y - PADDING);
        rect.setAttribute("width", bboxCanarias.width + PADDING * 2);
        rect.setAttribute("height", bboxCanarias.height + PADDING * 2);
        rect.setAttribute("fill", "none");
        rect.setAttribute("stroke", "black");
        rect.setAttribute("stroke-width", "2");
        rect.setAttribute("rx", 16);
        rect.setAttribute("ry", 16);

        canariasGroup.insertBefore(rect, canariasGroup.firstChild);
    }

    // Ajuste viewbox
    const finalBBox = map.getBBox();
    map.setAttribute('viewBox', `${finalBBox.x} ${finalBBox.y} ${finalBBox.width} ${finalBBox.height}`);

    map.style.transform = "translate(0px, -180px)";
}


function hoverFeature(path){
    map.querySelectorAll('path').forEach(p => {
        if(p === path) {
            p.style.filter = "brightness(1.2)";
        } else {
            p.style.filter = "brightness(0.5)";
        }
    });
}


function resetHover(){
    map.querySelectorAll('path').forEach(p => p.style.filter = "brightness(1)");
}


async function changeLevel(level){
    currentLevel = level;
    await loadGeoData(level);
    drawMap();
}

document.querySelectorAll('input[name="level"]').forEach(radio=>{
    radio.addEventListener('change',e=>changeLevel(e.target.value));
});


changeLevel(currentLevel);