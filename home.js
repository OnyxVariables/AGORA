const check = document.getElementById('check');
const sidebar = document.getElementById('sidebar');
const bar = document.querySelector('.bar');

check.addEventListener('change', () => {
    sidebar.classList.toggle('open', check.checked);
});

document.querySelectorAll('.sidebar a').forEach(a => {
    a.addEventListener('click', () => {
        sidebar.classList.remove('open');
        check.checked = false;
    });
});

document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !bar.contains(e.target)) {
        sidebar.classList.remove('open');
        check.checked = false;
    }
});

window.addEventListener('resize', () => {
    if(window.innerWidth >= 780){
        sidebar.classList.remove('open');
        check.checked = false;
    }
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