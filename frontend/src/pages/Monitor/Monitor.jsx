import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Particles from "../../components/Particles/Particles";
import Main from "./Main";

export default function Monitor() {
  return (
    <div className="monitor-layout">
      <div
        style={{
          width: "100%",
          height: "100vh",
          position: "fixed",
          inset: 0,
          zIndex: -1,
        }}
      >
        <Particles
          particleColors={["#d4a0ff", "#a066ff", "#6a00d4"]}
          particleCount={5000}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles={true}
          disableRotation={true}
        />
      </div>
      <Header menu="monitor" />
      <Main />
      <Footer />
    </div>
  );
}