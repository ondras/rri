import { clamp, all as allDirections, Vector } from "./direction.js";
import { NONE, ROAD, RAIL, LAKE } from "./edge.js";
import * as html from "./html.js";
function getNeighbor(cell, direction, cells) {
    let x = cell.x + Vector[direction][0];
    let y = cell.y + Vector[direction][1];
    return cells.at(x, y);
}
function getCenterCount(cells) {
    return cells.filter(cell => cell.center && cell.tile).length;
}
function getEdgeKey(a, b) {
    if (a.x > b.x || a.y > b.y) {
        [a, b] = [b, a];
    }
    return [a.x, a.y, b.x, b.y].join("/");
}
function getSubgraph(start, cells) {
    let subgraph = [];
    let queue = [{ cell: start, from: null }];
    let lockedEdges = new Set();
    while (queue.length) {
        let current = queue.shift();
        let cell = current.cell;
        if (!cell.tile) {
            continue;
        }
        subgraph.push(cell);
        let tile = cell.tile;
        let outDirections = (current.from === null ? allDirections : tile.getEdge(current.from).connects);
        outDirections.forEach(d => {
            let edgeType = tile.getEdge(d).type;
            if (edgeType == NONE) {
                return;
            }
            let neighbor = getNeighbor(cell, d, cells);
            if (!neighbor.tile) {
                return;
            }
            let neighborEdge = clamp(d + 2);
            let neighborEdgeType = neighbor.tile.getEdge(neighborEdge).type;
            if (neighborEdgeType != edgeType) {
                return;
            }
            let edgeKey = getEdgeKey(cell, neighbor);
            if (lockedEdges.has(edgeKey)) {
                return;
            }
            lockedEdges.add(edgeKey);
            queue.push({ cell: neighbor, from: neighborEdge });
        });
    }
    return subgraph;
}
function getConnectedExits(start, cells) {
    return getSubgraph(start, cells).filter(cell => cell.border);
}
function getExits(cells) {
    let results = [];
    let exitsArr = cells.filter(cell => cell.border && cell.tile);
    let exits = new Set(exitsArr);
    while (exits.size > 0) {
        let cell = exits.values().next().value;
        let connected = getConnectedExits(cell, cells);
        if (connected.length > 1) {
            results.push(connected.length);
        }
        connected.forEach(cell => exits.delete(cell));
    }
    return results;
}
function getLongestFrom(cell, from, ctx) {
    if (!cell.tile) {
        return [];
    }
    let path = [];
    let tile = cell.tile;
    let outDirections = (from === null ? allDirections : tile.getEdge(from).connects);
    ctx.lockedCells.add(cell);
    outDirections
        .filter(d => tile.getEdge(d).type == ctx.edgeType)
        .forEach(d => {
        let neighbor = getNeighbor(cell, d, ctx.cells);
        if (neighbor.border || !neighbor.tile) {
            return;
        }
        if (ctx.lockedCells.has(neighbor)) {
            return;
        }
        let neighborEdge = clamp(d + 2);
        let neighborEdgeType = neighbor.tile.getEdge(neighborEdge).type;
        if (neighborEdgeType != ctx.edgeType) {
            return;
        }
        let subpath = getLongestFrom(neighbor, neighborEdge, ctx);
        if (subpath.length > path.length) {
            path = subpath;
        }
    });
    ctx.lockedCells.delete(cell);
    path.unshift(cell);
    return path;
}
function getLongest(edgeType, cells) {
    function contains(cell) {
        if (cell.border || !cell.tile) {
            return;
        }
        let tile = cell.tile;
        return allDirections.some(d => tile.getEdge(d).type == edgeType);
    }
    let starts = cells.filter(contains);
    let bestPath = [];
    starts.forEach(cell => {
        let lockedCells = new Set();
        let ctx = { cells, edgeType, lockedCells };
        let path = getLongestFrom(cell, null, ctx);
        if (path.length > bestPath.length) {
            bestPath = path;
        }
    });
    return bestPath;
}
function isDeadend(deadend, cells) {
    const cell = deadend.cell;
    const tile = cell.tile;
    if (!tile) {
        return false;
    }
    let edge = tile.getEdge(deadend.direction).type;
    if (edge != RAIL && edge != ROAD) {
        return false;
    }
    let neighbor = getNeighbor(cell, deadend.direction, cells);
    if (neighbor.border) {
        return false;
    }
    if (!neighbor.tile) {
        return true;
    }
    let neighborEdge = clamp(deadend.direction + 2);
    return (neighbor.tile.getEdge(neighborEdge).type != edge);
}
function getDeadends(cells) {
    let deadends = [];
    cells.filter(cell => !cell.border).forEach(cell => {
        allDirections.forEach(direction => {
            let deadend = { cell, direction };
            isDeadend(deadend, cells) && deadends.push(deadend);
        });
    });
    return deadends;
}
function extractLake(lakeCells, allCells) {
    let pending = [lakeCells.shift()];
    let processed = [];
    while (pending.length) {
        const current = pending.shift();
        processed.push(current);
        const tile = current.tile;
        if (!tile) {
            continue;
        }
        allDirections.filter(d => tile.getEdge(d).type == LAKE).forEach(d => {
            let neighbor = getNeighbor(current, d, allCells);
            if (!neighbor.tile) {
                return;
            }
            let neighborEdge = clamp(d + 2);
            let neighborEdgeType = neighbor.tile.getEdge(neighborEdge).type;
            if (neighborEdgeType != LAKE) {
                return;
            }
            let index = lakeCells.indexOf(neighbor);
            if (index == -1) {
                return;
            }
            lakeCells.splice(index, 1);
            pending.push(neighbor);
        });
    }
    return processed;
}
function getLakes(cells) {
    function isLake(cell) {
        if (!cell.tile) {
            return;
        }
        let tile = cell.tile;
        return allDirections.some(d => tile.getEdge(d).type == LAKE);
    }
    let lakeCells = cells.filter(isLake);
    let sizes = [];
    while (lakeCells.length) {
        sizes.push(extractLake(lakeCells, cells).length);
    }
    return sizes;
}
export function get(cells) {
    return {
        exits: getExits(cells),
        center: getCenterCount(cells),
        rail: getLongest(RAIL, cells),
        road: getLongest(ROAD, cells),
        deadends: getDeadends(cells),
        lakes: getLakes(cells)
    };
}
export function render(score) {
    let table = html.node("table", { className: "score" });
    let row;
    let exits = score.exits.map(count => count == 12 ? 45 : (count - 1) * 4);
    let exitScore = exits.reduce((a, b) => a + b, 0);
    row = table.insertRow();
    row.insertCell().textContent = "Connected exits";
    row.insertCell().textContent = (exitScore ? `${score.exits.join("+")} → ${exitScore}` : "0");
    row = table.insertRow();
    row.insertCell().textContent = "Longest road";
    row.insertCell().textContent = score.road.length.toString();
    row = table.insertRow();
    row.insertCell().textContent = "Longest rail";
    row.insertCell().textContent = score.rail.length.toString();
    row = table.insertRow();
    row.insertCell().textContent = "Center tiles";
    row.insertCell().textContent = score.center.toString();
    row = table.insertRow();
    row.insertCell().textContent = "Dead ends";
    row.insertCell().textContent = (-score.deadends.length).toString();
    let lakeScore = 0;
    if (score.lakes.length > 0) {
        lakeScore = score.lakes.sort((a, b) => a - b)[0];
        row = table.insertRow();
        row.insertCell().textContent = "Smallest lake";
        row.insertCell().textContent = lakeScore.toString();
    }
    let total = exitScore
        + score.road.length
        + score.rail.length
        + score.center
        - score.deadends.length
        + lakeScore;
    let tfoot = html.node("tfoot");
    table.appendChild(tfoot);
    row = tfoot.insertRow();
    row.insertCell().textContent = "Score";
    row.insertCell().textContent = total.toString();
    return table;
}
