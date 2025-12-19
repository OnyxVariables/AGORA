import Partido from "./Partido";
import "./Main.css";

const partidos = [
  { nombre: "PP", descripcion: "Lorem ipsum dolor sit amet...", img: "img/PP.jpg", clase: "pp" },
  { nombre: "PSOE", descripcion: "Lorem ipsum dolor sit amet...", img: "img/PSOE.png", clase: "psoe" },
  { nombre: "VOX", descripcion: "Lorem ipsum dolor sit amet...", img: "img/VOX.png", clase: "vox" },
  { nombre: "PODEMOS", descripcion: "Lorem ipsum dolor sit amet...", img: "img/Podemos.png", clase: "podemos" },
  { nombre: "SUMAR", descripcion: "Lorem ipsum dolor sit amet...", img: "img/SUMAR.png", clase: "sumar" },
]; //Si quisiera poner más partidos los pongo aquí

function Main() {
  return (
    <main>
      {partidos.map((p) => (
        <Partido
          key={p.nombre}
          nombre={p.nombre}
          descripcion={p.descripcion}
          img={p.img}
          clase={p.clase}
        />
      ))}
    </main>
  );
}

export default Main;