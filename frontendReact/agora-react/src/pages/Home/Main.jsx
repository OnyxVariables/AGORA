import Particles from "../../components/Particles/Particles";
import Partido from "./Partido";
import "./Main.css";

const partidos = [
  { nombre: "PP", descripcion: "Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt.", img: "img/PartidoPopular.jpg", clase: "pp" },
  { nombre: "PSOE", descripcion: "Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt.", img: "img/PSOE.png", clase: "psoe" },
  { nombre: "VOX", descripcion: "Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt.", img: "img/VOX.png", clase: "vox" },
  { nombre: "PODEMOS", descripcion: "Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt.", img: "img/Podemos.png", clase: "podemos" },
  { nombre: "SUMAR", descripcion: "Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. A praesentium maxime in? Veritatis repudiandae esse assumenda similique, aut ullam unde facere repellendus totam reiciendis nulla quae voluptatum, amet, veniam deserunt.", img: "img/SUMAR.png", clase: "sumar" },
]; //Si quisiera poner más partidos los pongo aquí

function Main() {
  return (
    <main className="main-partidos">

      {/* FONDO PARTICLES */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', inset:0, zIndex:-1 }}>
        <Particles
        particleColors={['#d4a0ff', '#a066ff', '#6a00d4']}
        particleCount={50000} //Queda bonito asi pero tarda un poco más en cargar
        particleSpread={10}
        speed={0.1}
        particleBaseSize={100}
        moveParticlesOnHover={false}
        alphaParticles={true}
        disableRotation={true}
        />
      </div>

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