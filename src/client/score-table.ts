import { Score, mapExits, sumLakes, sum } from "../score.js";

import * as html from "./html.js";


function buildTable() {
	const table = html.node("table", {className:"score"});
	table.appendChild(html.node("thead"));
	table.appendChild(html.node("tbody"));

	table.tHead!.insertRow().insertCell();

	const body = table.tBodies[0];
	["Connected exits", "Longest road", "Longest rail", "Center tiles", "Dead ends", "Smallest lake", "Forest views"].forEach(label => {
		body.insertRow().insertCell().textContent = label;
	});

	body.rows[body.rows.length-1].hidden = true;
	body.rows[body.rows.length-2].hidden = true;

	table.appendChild(html.node("tfoot"));
	table.tFoot!.insertRow().insertCell().textContent = "Score";

	return table;
}

function addColumn(table: HTMLTableElement, score: Score, name="", active=false) {
	let result = {onClick() {}};
	if (name) {
		const row = table.tHead!.rows[0];
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

	let exits = mapExits(score);
	let exitScore = exits.reduce((a, b) => a+b, 0);
	body.rows[0].insertCell().textContent = (exitScore ? `${score.exits.join("+")} = ${exitScore}` : "0");
	body.rows[1].insertCell().textContent = score.road.length.toString();
	body.rows[2].insertCell().textContent = score.rail.length.toString();
	body.rows[3].insertCell().textContent = score.center.toString();
	body.rows[4].insertCell().textContent = (-score.deadends.length).toString();

	let lakeRow = body.rows[5];
	let lakeScore = sumLakes(score);
	if (lakeScore) {
		lakeRow.insertCell().textContent = lakeScore.toString();
		lakeRow.hidden = false;
	} else {
		lakeRow.insertCell();
	}

	let forestRow = body.rows[6];
	if (score.forests) {
		forestRow.insertCell().textContent = score.forests.toString();
		forestRow.hidden = false;
	} else {
		forestRow.insertCell();
	}

	let total = sum(score);

	const totalRow = table.tFoot!.rows[0];
	totalRow.insertCell().textContent = total.toString();

	Array.from<HTMLTableRowElement>(table.querySelectorAll("tbody tr, tfoot tr")).forEach(row => {
		let cells = Array.from(row.cells).slice(1);
		let numbers = cells.map(extractCellValue);
		let best = Math.max(...numbers);
		cells.forEach(c => c.classList.toggle("best", extractCellValue(c) == best));
	});

	return result;
}

function extractCellValue(cell: HTMLElement) {
	let match = (cell.textContent || "").match(/[-\d]+$/);
	return (match ? Number(match[0]) : 0);
}

export function renderSingle(score: Score) {
	const table = buildTable();
	addColumn(table, score);
	return table;
}

type NameClickCallback = (index: number) => void;

export function renderMulti(names: string[], scores: Score[], onClick: NameClickCallback, activeName: string) {
	const table = buildTable();
	names.forEach((name, i) => {
		let active = (name == activeName);
		addColumn(table, scores[i], name, active).onClick = () => onClick(i);
		if (active) { onClick(i); }
	});
	return table;
}
