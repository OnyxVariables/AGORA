import React from "react";
import PartidoCard from "./Main";
import "./Main.css";
import Particles from "../../components/Particles/Particles";

const partidos = [
  { nombre: "PP", value: "PP", colorFondo: "#5eadf8", colorTitulo: "#1d5ea8", imagen: "img/PP.jpg" },
  { nombre: "PSOE", value: "PSOE", colorFondo: "#fd7671", colorTitulo: "#b3201e", imagen: "img/PSOE.png" },
  { nombre: "PODEMOS", value: "PODEMOS", colorFondo: "#d57bfc", colorTitulo: "#6d2d8e", imagen: "img/Podemos.png" },
  { nombre: "C’s", value: "CS", colorFondo: "#ffb347", colorTitulo: "#d97900", imagen: "img/Ciudadanos.png" },
  { nombre: "VOX", value: "VOX", colorFondo: "#8cfa80", colorTitulo: "#4aa63b", imagen: "img/VOX.png" },
  { nombre: "Sumar", value: "SUMAR", colorFondo: "#fa7aa3", colorTitulo: "#c73765", imagen: "img/SUMAR.png" },
  ]; //Si quisiera meter mas partidos los meto aqui

function Partidos() {
  return (
    <main className="background">
      {/* FONDO DE PARTICULAS */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: -1 }}>
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
      <div className="grid-partidos">
        {partidos.map((partido) => (
          <PartidoCard key={partido.value} {...partido} />
        ))}
      </div>
    </main>
  );
}

export default Partidos;