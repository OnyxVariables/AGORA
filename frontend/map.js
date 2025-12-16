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

//Función tocha, es la que dibuja el mapa
function drawMap() {
    map.innerHTML = '';
    if (geoData.length === 0) return;
  
    let defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    map.appendChild(defs);


    //gradiente para fill (Marruecos)
    const gradientId = "africa-fill-gradient";
    let fillGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    fillGradient.setAttribute("id", gradientId);
    
    fillGradient.setAttribute("x1", "0");
    fillGradient.setAttribute("y1", "0");
    fillGradient.setAttribute("x2", "0");
    fillGradient.setAttribute("y2", "1"); 

    //Como va a ser el difumigado
    const fillStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    fillStop1.setAttribute("offset", "0%");
    fillStop1.setAttribute("stop-color", "#D1D1D1");
    fillStop1.setAttribute("stop-opacity", "1");

    const fillStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    fillStop2.setAttribute("offset", "50%"); 
    fillStop2.setAttribute("stop-color", "#D1D1D1");
    fillStop2.setAttribute("stop-opacity", "0.5"); 

    const fillStop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    fillStop3.setAttribute("offset", "85%"); 
    fillStop3.setAttribute("stop-color", "white");
    fillStop3.setAttribute("stop-opacity", "0"); 

    fillGradient.appendChild(fillStop1);
    fillGradient.appendChild(fillStop2);
    fillGradient.appendChild(fillStop3);
    defs.appendChild(fillGradient);


    // 2. GRADIENTE PARA EL BORDE (si quería darle diferentes colores tengo que duplicar codigo pero para stroke)(Marruecos)
    const strokeGradientId = "africa-stroke-gradient";
    const strokeGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    strokeGradient.setAttribute("id", strokeGradientId);
    strokeGradient.setAttribute("x1", "0");
    strokeGradient.setAttribute("y1", "0");
    strokeGradient.setAttribute("x2", "0");
    strokeGradient.setAttribute("y2", "1");

    const strokeStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    strokeStop1.setAttribute("offset", "0%");
    strokeStop1.setAttribute("stop-color", "black");
    strokeStop1.setAttribute("stop-opacity", "1");
    
    const strokeStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    strokeStop2.setAttribute("offset", "50%");
    strokeStop2.setAttribute("stop-color", "black");
    strokeStop2.setAttribute("stop-opacity", "1");

    const strokeStop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    strokeStop3.setAttribute("offset", "80%");
    strokeStop3.setAttribute("stop-color", "white");
    strokeStop3.setAttribute("stop-opacity", "0");

    strokeGradient.appendChild(strokeStop1);
    strokeGradient.appendChild(strokeStop2);
    strokeGradient.appendChild(strokeStop3);
    defs.appendChild(strokeGradient);



    //gradiente para fill (France)
    const gradientIdFrance = "france-fill-gradient";
    let fillGradientFrance = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    fillGradientFrance.setAttribute("id", gradientIdFrance);
    
    fillGradientFrance.setAttribute("x1", "0");
    fillGradientFrance.setAttribute("y1", "1");
    fillGradientFrance.setAttribute("x2", "0");
    fillGradientFrance.setAttribute("y2", "0"); 
    fillGradientFrance.setAttribute("gradientTransform", "rotate(40)");

    //Como va a ser el difumigado
    const fillStop4 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    fillStop4.setAttribute("offset", "70%");
    fillStop4.setAttribute("stop-color", "#D1D1D1");
    fillStop4.setAttribute("stop-opacity", "1");

    const fillStop5 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    fillStop5.setAttribute("offset", "85%"); 
    fillStop5.setAttribute("stop-color", "#D1D1D1");
    fillStop5.setAttribute("stop-opacity", "0.5"); 

    const fillStop6 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    fillStop6.setAttribute("offset", "100%"); 
    fillStop6.setAttribute("stop-color", "#D1D1D1");
    fillStop6.setAttribute("stop-opacity", "0"); 

    fillGradientFrance.appendChild(fillStop4);
    fillGradientFrance.appendChild(fillStop5);
    fillGradientFrance.appendChild(fillStop6);
    defs.appendChild(fillGradientFrance);


    // 2. GRADIENTE PARA EL BORDE (si quería darle diferentes colores tengo que duplicar codigo pero para stroke)(France)
    const strokeGradientIdFrance = "france-stroke-gradient";
    const strokeGradientFrance = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    strokeGradientFrance.setAttribute("id", strokeGradientIdFrance);
    strokeGradientFrance.setAttribute("x1", "0");
    strokeGradientFrance.setAttribute("y1", "1");
    strokeGradientFrance.setAttribute("x2", "0");
    strokeGradientFrance.setAttribute("y2", "0");
    strokeGradientFrance.setAttribute("gradientTransform", "rotate(40)");

    const strokeStop4 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    strokeStop4.setAttribute("offset", "70%");
    strokeStop4.setAttribute("stop-color", "black");
    strokeStop4.setAttribute("stop-opacity", "1");
    
    const strokeStop5 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    strokeStop5.setAttribute("offset", "95%");
    strokeStop5.setAttribute("stop-color", "black");
    strokeStop5.setAttribute("stop-opacity", "0.5");

    const strokeStop6 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    strokeStop6.setAttribute("offset", "100%");
    strokeStop6.setAttribute("stop-color", "white");
    strokeStop6.setAttribute("stop-opacity", "0");

    strokeGradientFrance.appendChild(strokeStop4);
    strokeGradientFrance.appendChild(strokeStop5);
    strokeGradientFrance.appendChild(strokeStop6);
    defs.appendChild(strokeGradientFrance);




    const bbox = getBBox(geoData);

    // Grupo especial para Canarias para mover posiciones (SOLO ccaa, province y nation)
    const canariasGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");


    let hasCanarias = false;

    geoData.forEach(feature => {
        const pathData = convertToSVGPath(feature.geometry, bbox);
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute('d', pathData);

        //Esto lo utilizo para que cada provincia tenga su propio color que le corresponde y no el de la ccaa para todas
        path.setAttribute('data-name', feature.properties.name);

        // Colores por nivel
        if (feature.properties.name === "Africa Norte") {
            path.style.pointerEvents = "none";
            path.style.fill = `url(#${gradientId})`; //Aplico gradiente a fill
            path.style.stroke = `url(#${strokeGradientId})`; //Aplico gradiente a stroke
            path.style.strokeWidth="1";
        }
        else if (feature.properties.name === "Portugal") {
            path.style.fill = "#D1D1D1";
            path.style.pointerEvents = "none"
            path.style.stroke= "black";
            path.style.strokeWidth="1";
        }
        else if (feature.properties.name === "Francia Sur") {
            path.style.pointerEvents = "none"
            path.style.fill = `url(#${gradientIdFrance})`; //Aplico gradiente a fill
            path.style.stroke = `url(#${strokeGradientIdFrance})`; //Aplico gradiente a stroke
            path.style.strokeWidth="1";
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
        else if (currentLevel === "nation"){
            path.style.fill = "#ff4141ff";
            if(feature.properties.name === "SpainLand" && feature.properties.name === "Canarias"){
                path.dataset.nation = "Spain"; //Es lo que cojo en hover filtrado por nation
            }
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

    map.style.transform = "translate(-50px, -150px)";

    //Mover según nivel
    if (currentLevel === "nation") {
        canariasGroup.setAttribute("transform", "translate(100, -650)"); //Esta mierda si funciona
    } else {
        // Posición cuando es ccaa o province
        canariasGroup.setAttribute("transform", "translate(100,-650)");
    }
}

function hoverFeature(path) {
    if (currentLevel === "nation") {
        const nation = path.dataset.nation; //Spain
        const name = path.getAttribute("data-name"); //SpainLand y Canarias

        map.querySelectorAll('path').forEach(p => {
            const pNation = p.dataset.nation;
            const pName = p.getAttribute("data-name");

            if (pNation === nation && pName === name) {
                p.style.filter = "brightness(1.4)";
            } else if (pNation === nation && (pName === "Spain" || pName === "Canarias")) {
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
            if(p === path) p.style.filter = "brightness(1.2)";
            else p.style.filter = "brightness(0.5)";
        });
    }
}

function resetHover() {
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


async function changeLevel(level){
    currentLevel = level;
    await loadGeoData(level);
    drawMap();
}

document.querySelectorAll('input[name="level"]').forEach(radio=>{
    radio.addEventListener('change',e=>changeLevel(e.target.value));
});


changeLevel(currentLevel);