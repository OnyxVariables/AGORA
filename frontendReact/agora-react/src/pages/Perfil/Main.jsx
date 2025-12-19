import { useState } from "react";
import "./Main.css";
import { TarjetIcon, AddressIcon, FingerIcon } from "../../icons";

function Main() {
  const [nickname, setNickname] = useState("Sin nickname");
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setNickname(input);
    setInput("");
  };

  return (
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
  );
}

export default Main;