import * as html from "./html.js";
function buildTable() {
    const table = html.node("table", { className: "score" });
    table.appendChild(html.node("thead"));
    table.appendChild(html.node("tbody"));
    table.tHead.insertRow().insertCell();
    const body = table.tBodies[0];
    ["Connected exists", "Longest road", "Longest rail", "Center tiles", "Dead ends", "Smallest lake"].forEach(label => {
        body.insertRow().insertCell().textContent = label;
    });
    body.rows[body.rows.length - 1].hidden = true;
    table.appendChild(html.node("tfoot"));
    table.tFoot.insertRow().insertCell().textContent = "Score";
    return table;
}
function addColumn(table, score, name = "", active = false) {
    let result = { onClick() { } };
    if (name) {
        const row = table.tHead.rows[0];
        const cell = row.insertCell();
        cell.textContent = name;
        function activate() {
            Array.from(row.cells).forEach(c => c.classList.toggle("active", c == cell));
            result.onClick();
        }
        cell.addEventListener("click", activate);
        active && activate();
    }
    const body = table.tBodies[0];
    let exits = score.exits.map(count => count == 12 ? 45 : (count - 1) * 4);
    let exitScore = exits.reduce((a, b) => a + b, 0);
    body.rows[0].insertCell().textContent = (exitScore ? `${score.exits.join("+")} = ${exitScore}` : "0");
    body.rows[1].insertCell().textContent = score.road.length.toString();
    body.rows[2].insertCell().textContent = score.rail.length.toString();
    body.rows[3].insertCell().textContent = score.center.toString();
    body.rows[4].insertCell().textContent = (-score.deadends.length).toString();
    let lakeRow = body.rows[5];
    let lakeScore = 0;
    if (score.lakes.length > 0) {
        lakeScore = score.lakes.sort((a, b) => a - b)[0];
        lakeRow.insertCell().textContent = lakeScore.toString();
        lakeRow.hidden = false;
    }
    else {
        lakeRow.insertCell();
    }
    let total = exitScore
        + score.road.length
        + score.rail.length
        + score.center
        - score.deadends.length
        + lakeScore;
    const totalRow = table.tFoot.rows[0];
    totalRow.insertCell().textContent = total.toString();
    Array.from(table.querySelectorAll("tbody tr, tfoot tr")).forEach(row => {
        let cells = Array.from(row.cells).slice(1);
        let numbers = cells.map(extractCellValue);
        let best = Math.max(...numbers);
        cells.forEach(c => c.classList.toggle("best", extractCellValue(c) == best));
    });
    return result;
}
function extractCellValue(cell) {
    let match = (cell.textContent || "").match(/[-\d]+$/);
    return (match ? Number(match[0]) : 0);
}
export function renderSingle(score) {
    const table = buildTable();
    addColumn(table, score);
    return table;
}
export function renderMulti(names, scores, onClick, activeName) {
    const table = buildTable();
    names.forEach((name, i) => {
        let active = (name == activeName);
        addColumn(table, scores[i], name, active).onClick = () => onClick(i);
        if (active) {
            onClick(i);
        }
    });
    return table;
}
