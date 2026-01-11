// In the future, this will retrieve the data from the DB
function getVotations() {
    return [
        { "id": 1, "title": "Elecciones 2026", "startDate": "2025-05-12", "endDate": "2025-05-12", "hash": Math.random().toString(36).substring(2) },
        { "id": 2, "title": "Elecciones 2029", "startDate": "2029-05-12", "endDate": "2029-05-12", "hash": Math.random().toString(36).substring(2) },
        { "id": 3, "title": "Elecciones 2033", "startDate": "2033-05-12", "endDate": "2033-05-12", "hash": Math.random().toString(36).substring(2) },
        { "id": 4, "title": "Elecciones 2037", "startDate": "2037-05-12", "endDate": "2037-05-12", "hash": Math.random().toString(36).substring(2) },
        { "id": 5, "title": "Elecciones 2041", "startDate": "2041-05-12", "endDate": "2041-05-12", "hash": Math.random().toString(36).substring(2) },
    ]
}

// Util function to create either th/td (cell)
function createCell(type, content) {
    const cellEl = document.createElement(type);
    cellEl.textContent = content;
    cellEl.classList.add("cell");
    if (type === "th") {
        cellEl.classList.add("cell-header");
    }

    return cellEl;
}

// Util function to create either edit/delete button
function createBtn(type, content) {
    const btnEl = document.createElement("button");
    btnEl.textContent = content;
    btnEl.classList.add("btn");
    btnEl.classList.add(type);
    
    return btnEl;
}

function createThead(votations) {
    const theadEl = document.createElement("thead");

    const trEl = document.createElement("tr");

    // Get the key of the objects which will be the title (id, title, startDate...)
    const ths = Object.keys(votations[0]);
    ths.forEach(th => {
        trEl.appendChild(createCell("th", th.toUpperCase()));
    })
    
    // The `action` column that won't be on the data
    trEl.appendChild(createCell("th", "Action"));

    theadEl.appendChild(trEl);
    
    return theadEl;
}

function createTbody(votations) {
    const tbodyEl = document.createElement("tbody");
    
    // Iterate votations
    votations.forEach(votation => {
        const trEl = document.createElement("tr");

        // Get the keys of the votation (id, title, startDate...)
        const keys = Object.keys(votations[0]);
        keys.forEach(key => {
            if (key === "id") {
                trEl.dataset.id = votation[key];
            }
            trEl.appendChild(createCell("td", votation[key]));
        })

        // Cell for the action column
        const tdEl = createCell("td", "");
        const divEl = document.createElement("div");
        divEl.classList.add("action-container")

        // TODO(srvariable): The buttons will redirect to either edit/delete endpoint when clicked.
        divEl.appendChild(createBtn("edit", "Edit"));
        divEl.appendChild(createBtn("delete", "Delete"));
        
        tdEl.appendChild(divEl);
        trEl.appendChild(tdEl);
        tbodyEl.appendChild(trEl);
    })

    return tbodyEl;
}

const votations = getVotations();
const votationsEl = document.getElementById("votations");
votationsEl.appendChild(createThead(votations));
votationsEl.appendChild(createTbody(votations));
