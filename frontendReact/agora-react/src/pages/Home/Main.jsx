import Particles from "../../components/Particles/Particles";
import Partido from "./Partido";
import "./Main.css";

const partidos = [
  {
    nombre: "PP",
    descripcion: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem?",
    img: "img/PartidoPopular.jpg",
    estilos: {
      fondo: "#5eadf8",
      titulo: "#1d5ea8",
    },
  },
  {
    nombre: "PSOE",
    descripcion: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem?",
    img: "img/PSOE.png",
    estilos: {
      fondo: "#fd7671",
      titulo: "#b3201e",
    },
  },
  {
    nombre: "VOX",
    descripcion: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem?",
    img: "img/VOX.png",
    estilos: {
      fondo: "#8cfa80",
      titulo: "#4aa63b",
    },
  },
  {
    nombre: "PODEMOS",
    descripcion: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem?",
    img: "img/Podemos.png",
    estilos: {
      fondo: "#d57bfc",
      titulo: "#6d2d8e",
    },
  },
  {
    nombre: "SUMAR",
    descripcion: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas nesciunt cum nam. Odit in unde voluptatum voluptas magnam sapiente cupiditate exercitationem ab accusamus, quam optio vitae! Atque voluptatem ex autem?",
    img: "img/SUMAR.png",
    estilos: {
      fondo: "#fa7aa3",
      titulo: "#c73765",
    },
  },
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
          estilos={p.estilos}
        />
      ))}
    </main>
  );
}

export default Main;