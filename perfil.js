document.addEventListener("DOMContentLoaded", () => {
    // FORMULARIO DE NICKNAME
    const form = document.getElementById("formNickname");
    const nicknameInput = document.getElementById("nicknameInput");
    const nicknameMostrado = document.getElementById("nicknameMostrado");

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        nicknameMostrado.textContent = nicknameInput.value;
        // aquí se envía el nickname al servidor y verficamos si existe porque debe ser unique, además solo se va a poder cambiar una vez el nickname
        form.reset();
    });

    // MODAL DE PRIVACIDAD
    const modal = document.getElementById("modal-privacidad");
    const enlace = document.querySelector("footer .boton");
    const cerrar = document.querySelector(".modal .cerrar");

    // Abrir modal
    enlace.addEventListener("click", (e) => {
        e.preventDefault();
        modal.style.display = "block";
    });

    // Cerrar modal con la X
    cerrar.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Cerrar modal si clicas fuera
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
});