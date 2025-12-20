import { useState } from "react";
import "./Main.css";
import { TarjetIcon, AddressIcon, FingerIcon } from "../../icons";
import Particles from "../../components/Particles/Particles";

function Main() {
  const [nickname, setNickname] = useState("Sin nickname");
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setNickname(input);
    setInput("");
  };

  return (
    <div className="layout-usuario">
      
      <div style={{ width: '100%', height: '100%', position: 'fixed', inset:0, zIndex:-1 }}>
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

      <main className="contenedorUsuario">

        <section className="tarjeta">
          <h2>Datos del Usuario</h2>
          <div className="info">
            <p><span>Nombre:</span> Oliver</p>
            <p><span>Apellidos:</span> Gamboa Mesa</p>
            <p><span>DNI:</span> 123456789Y</p>
            <p><span>Nickname: </span><span id="nicknameMostrado">{nickname}</span></p>
            <TarjetIcon />
          </div>
        </section>

        <section className="tarjeta">
          <h2>Datos de Empadronamiento</h2>
          <div className="info">
            <p><span>Municipio:</span> Marbella</p>
            <p><span>Provincia:</span> Málaga</p>
            <p><span>Comunidad autónoma: </span>Andalucía</p>
            <p><span>Nación: </span>España</p>
            <AddressIcon />
          </div>
        </section>

        <section className="tarjeta">
          <h2>Ponte un nickname</h2>
          <form className="formulario" onSubmit={handleSubmit}>
            <input type="text" placeholder=" xxxxxxxx" value={input} onChange={(e) => setInput(e.target.value)}/>
            <button type="submit">Enviar</button>
            <FingerIcon />
          </form>
        </section>

      </main>
    </div>
  );
}

export default Main;