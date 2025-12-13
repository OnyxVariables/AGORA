// In the future, this will retrieve the data from the DB
function getVotations() {
    return [
        { "participants": 10521, "votes": 10000, "participantPercentage": 97, "blocks": 500, "validVotes": 9500 },
        { "participants": 20456, "votes": 15000, "participantPercentage": 84, "blocks": 1000, "validVotes": 19852 },
        { "participants": 15890, "votes": 7000, "participantPercentage": 45, "blocks": 750, "validVotes": 14999 },
        { "participants": 83456, "votes": 42897, "participantPercentage": 53, "blocks": 3056, "validVotes": 83400 },
        { "participants": 53675, "votes": 25678, "participantPercentage": 48, "blocks": 2500, "validVotes": 53000 },
    ]
}

// In the future, this will retrieve the data from the DB
function getBlocks() {
    return [
        { "id": 1, "hash": Math.random().toString(36).substring(2), "nVotes": 412, "createdAt": "12/05/2025 9:00", "previousHash": Math.random().toString(36).substring(2), "status": "Válido" },
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

function createThead(blobs) {
    const theadEl = document.createElement("thead");

    const trEl = document.createElement("tr");

    // Get the key of the objects which will be the title (id, title, startDate...)
    const ths = Object.keys(blobs[0]);
    ths.forEach(th => {
        trEl.appendChild(createCell("th", th.toUpperCase()));
    })
    
    theadEl.appendChild(trEl);
    
    return theadEl;
}

function createTbody(blobs) {
    const tbodyEl = document.createElement("tbody");
    
    // Iterate blobs
    blobs.forEach(blob => {
        const trEl = document.createElement("tr");

        // Get the keys of the blob (id, title, startDate...)
        const keys = Object.keys(blobs[0]);
        keys.forEach(key => {
            if (key === "id") {
                trEl.dataset.id = blob[key];
            }
            trEl.appendChild(createCell("td", blob[key]));
        })

        tbodyEl.appendChild(trEl);
    })

    return tbodyEl;
}

const votations = getVotations();
const votationsEl = document.getElementById("votations");
votationsEl.appendChild(createThead(votations));
votationsEl.appendChild(createTbody(votations));

const blocks = getBlocks();
const blocksEl = document.getElementById("blocks");
blocksEl.appendChild(createThead(blocks));
blocksEl.appendChild(createTbody(blocks));
