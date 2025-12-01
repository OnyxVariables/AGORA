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