import React from "react";
import PartidoCard from "./Main";
import "./Main.css";
import Particles from "../../components/Particles/Particles";

const partidos = [
  {
    nombre: "PP",
    value: "PP",
    colorFondo: "#5eadf8",
    colorTitulo: "#1d5ea8",
    imagen: "img/PP.jpg",
  },
  {
    nombre: "PSOE",
    value: "PSOE",
    colorFondo: "#fd7671",
    colorTitulo: "#b3201e",
    imagen: "img/PSOE.png",
  },
  {
    nombre: "PODEMOS",
    value: "PODEMOS",
    colorFondo: "#d57bfc",
    colorTitulo: "#6d2d8e",
    imagen: "img/Podemos.png",
  },
  {
    nombre: "C’s",
    value: "CS",
    colorFondo: "#ffb347",
    colorTitulo: "#d97900",
    imagen: "img/Ciudadanos.png",
  },
  {
    nombre: "VOX",
    value: "VOX",
    colorFondo: "#8cfa80",
    colorTitulo: "#4aa63b",
    imagen: "img/VOX.png",
  },
  {
    nombre: "ehbildu",
    value: "ehbildu",
    colorFondo: "#00d0b3",
    colorTitulo: "#008b79ff",
    imagen: "img/ehbildu.png",
  },
  {
    nombre: "compromís",
    value: "compromis",
    colorFondo: "#ef8518",
    colorTitulo: "#ad5700ff",
    imagen: "img/Compromís.png",
  },
  {
    nombre: "CC",
    value: "cc",
    colorFondo: "#f3ff52ff",
    colorTitulo: "#a2aa33ff",
    imagen: "img/coalicionCanaria.png",
  },
  {
    nombre: "junts",
    value: "junst",
    colorFondo: "#20c0b2",
    colorTitulo: "#158b82ff",
    imagen: "img/junts.png",
  },
  {
    nombre: "Más Madrid",
    value: "madrid",
    colorFondo: "#54efa5",
    colorTitulo: "#3aac75ff",
    imagen: "img/masMadrid.png",
  },
]; //Si quisiera meter mas partidos los meto aqui

function Partidos() {
  return (
    <main className="background">
      {/* FONDO DE PARTICULAS */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
          zIndex: -1,
        }}
      >
        <Particles
          particleColors={["#d4a0ff", "#a066ff", "#6a00d4"]}
          particleCount={20000}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles={true}
          disableRotation={true}
        />
      </div>
      <div className="grid-partidos">
        {partidos.map((partido) => (
          <PartidoCard key={partido.value} {...partido} />
        ))}
      </div>
      <div className="submit">
        <button className="enviar">Enviar</button>
      </div>
    </main>
  );
}

export default Partidos;
