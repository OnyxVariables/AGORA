// Obtener todos los checkboxes
const checks = document.querySelectorAll('input[name="partido"]');
const btnEnviar = document.getElementById("enviarBtn");

// Asegurar voto único
checks.forEach(c => {
    c.addEventListener("change", () => {
        if (c.checked) {
            // Desmarcar todos excepto el seleccionado
            checks.forEach(x => {
                if (x !== c) x.checked = false;
            });
        }
    });
});

// Guardar voto
btnEnviar.addEventListener("click", () => {
    let seleccionado = null;

    checks.forEach(c => {
        if (c.checked) seleccionado = c.value;
    });

    if (!seleccionado) {
        alert("Debes seleccionar un partido antes de votar.");
        return;
    }

    // Guardar en localStorage (simulación backend)
    localStorage.setItem("voto", seleccionado);

    alert("Tu voto ha sido registrado correctamente.");

    // Redirigir al home
    window.location.href = "home.html";
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