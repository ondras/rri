function clamp(direction) {
    direction = direction % 4;
    return direction >= 0 ? direction : direction + 4;
}
const all = [
    0,
    1,
    2,
    3
];
const Vector = [
    [
        0,
        -1
    ],
    [
        1,
        0
    ],
    [
        0,
        1
    ],
    [
        -1,
        0
    ]
];
const repo = {
};
class Transform {
    _direction;
    _offset;
    constructor(direction, offset){
        this._direction = direction;
        this._offset = offset;
    }
    apply(direction) {
        return clamp(this._direction * (direction + this._offset));
    }
    invert(direction) {
        return clamp(this._direction * direction - this._offset);
    }
    getCSS() {
        let scale = "";
        if (this._direction == -1) {
            scale = "scale(-1, 1) ";
        }
        return `${scale}rotate(${this._offset * 90}deg)`;
    }
    applyToContext(ctx) {
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
        if (this._direction == -1) {
            ctx.scale(-1, 1);
        }
        const deg = this._offset * 90;
        const rad = deg * Math.PI / 180;
        ctx.rotate(rad);
        ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
    }
}
function create(id) {
    let offset = Math.abs(Number(id));
    let direction = id.startsWith("-") ? -1 : 1;
    repo[id] = new Transform(direction, offset);
    return get(id);
}
function get(id) {
    if (!(id in repo)) {
        throw new Error(`Transform ${id} not found`);
    }
    return repo[id];
}
const all1 = [
    "0",
    "1",
    "2",
    "3",
    "-0",
    "-1",
    "-2",
    "-3"
];
all1.forEach(create);
const repo1 = {
};
const partials = {
    "rail-half": {
        edges: [
            {
                type: 1,
                connects: []
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 0,
                connects: []
            }
        ],
        render (ctx) {
            ctx.rail(0, 0.35);
            ctx.redGlow(0);
        }
    },
    "road-half": {
        edges: [
            {
                type: 2,
                connects: []
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 0,
                connects: []
            }
        ],
        render (ctx) {
            ctx.road(0, 0.35);
            ctx.redGlow(0);
        }
    },
    "rail-i": {
        edges: [
            {
                type: 1,
                connects: [
                    2
                ]
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 1,
                connects: [
                    0
                ]
            },
            {
                type: 0,
                connects: []
            }
        ],
        render (ctx) {
            ctx.rail(0, 1);
        }
    },
    "road-i": {
        edges: [
            {
                type: 2,
                connects: [
                    2
                ]
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 2,
                connects: [
                    0
                ]
            },
            {
                type: 0,
                connects: []
            }
        ],
        render (ctx) {
            ctx.road(0, 0.5);
            ctx.road(2, 0.5);
        }
    },
    "rail-t": {
        edges: [
            {
                type: 1,
                connects: [
                    1,
                    3
                ]
            },
            {
                type: 1,
                connects: [
                    0,
                    3
                ]
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 1,
                connects: [
                    0,
                    1
                ]
            }
        ],
        render (ctx) {
            ctx.rail(0, 0.5);
            ctx.rail(1, 0.5);
            ctx.rail(3, 0.5);
            ctx.railCross();
        }
    },
    "road-t": {
        edges: [
            {
                type: 2,
                connects: [
                    1,
                    3
                ]
            },
            {
                type: 2,
                connects: [
                    0,
                    3
                ]
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 2,
                connects: [
                    0,
                    1
                ]
            }
        ],
        render (ctx) {
            ctx.arc(0, -1);
            ctx.arc(1, -1);
            ctx.roadTicks(0, 0.5);
            ctx.roadTicks(1, 0.5);
            ctx.roadTicks(3, 0.5);
            ctx.roadLine(1, 0.5, 1);
            ctx.roadLine(3, 0.5, 1);
        }
    },
    "rail-l": {
        edges: [
            {
                type: 1,
                connects: [
                    1
                ]
            },
            {
                type: 1,
                connects: [
                    0
                ]
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 0,
                connects: []
            }
        ],
        render (ctx) {
            ctx.arc(1, 0);
            ctx.styleRailTicks([
                1,
                7
            ], -3);
            ctx.arc(1, 0);
        }
    },
    "road-l": {
        edges: [
            {
                type: 2,
                connects: [
                    1
                ]
            },
            {
                type: 2,
                connects: [
                    0
                ]
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 0,
                connects: []
            }
        ],
        render (ctx) {
            ctx.arc(1, -1);
            ctx.arc(1, 1);
            ctx.styleRoadTicks([
                7,
                4
            ], -3);
            ctx.arc(1, 0);
        }
    },
    "rail-road-l": {
        edges: [
            {
                type: 1,
                connects: [
                    1
                ]
            },
            {
                type: 2,
                connects: [
                    0
                ]
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 0,
                connects: []
            }
        ],
        render (ctx) {
            ctx.rail(0, 0.5);
            ctx.road(1, 0.5);
            ctx.station();
        }
    },
    "rail-road-i": {
        edges: [
            {
                type: 1,
                connects: [
                    2
                ]
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 2,
                connects: [
                    0
                ]
            },
            {
                type: 0,
                connects: []
            }
        ],
        render (ctx) {
            ctx.rail(0, 0.5);
            ctx.road(2, 0.5);
            ctx.station();
        }
    },
    "bridge": {
        edges: [
            {
                type: 2,
                connects: [
                    2
                ]
            },
            {
                type: 1,
                connects: [
                    3
                ]
            },
            {
                type: 2,
                connects: [
                    0
                ]
            },
            {
                type: 1,
                connects: [
                    1
                ]
            }
        ],
        render (ctx) {
            ctx.rail(1, 0.5);
            ctx.rail(3, 0.5);
            ctx.road(0, 0.5);
            ctx.road(2, 0.5);
        }
    },
    "cross-road-road-rail-road": {
        edges: [
            {
                type: 2,
                connects: [
                    2,
                    1,
                    3
                ]
            },
            {
                type: 2,
                connects: [
                    0,
                    2,
                    3
                ]
            },
            {
                type: 1,
                connects: [
                    0,
                    1,
                    3
                ]
            },
            {
                type: 2,
                connects: [
                    0,
                    1,
                    2
                ]
            }
        ],
        render (ctx) {
            ctx.road(0, 0.5);
            ctx.road(1, 0.5);
            ctx.rail(2, 0.5);
            ctx.road(3, 0.5);
            ctx.station();
        }
    },
    "cross-road-rail-rail-rail": {
        edges: [
            {
                type: 2,
                connects: [
                    2,
                    1,
                    3
                ]
            },
            {
                type: 1,
                connects: [
                    0,
                    2,
                    3
                ]
            },
            {
                type: 1,
                connects: [
                    0,
                    1,
                    3
                ]
            },
            {
                type: 1,
                connects: [
                    0,
                    1,
                    2
                ]
            }
        ],
        render (ctx) {
            ctx.road(0, 0.5);
            ctx.rail(1, 0.5);
            ctx.rail(2, 0.5);
            ctx.rail(3, 0.5);
            ctx.station();
        }
    },
    "cross-road-rail-rail-road": {
        edges: [
            {
                type: 2,
                connects: [
                    2,
                    1,
                    3
                ]
            },
            {
                type: 1,
                connects: [
                    0,
                    2,
                    3
                ]
            },
            {
                type: 1,
                connects: [
                    0,
                    1,
                    3
                ]
            },
            {
                type: 2,
                connects: [
                    0,
                    1,
                    2
                ]
            }
        ],
        render (ctx) {
            ctx.road(0, 0.5);
            ctx.rail(1, 0.5);
            ctx.rail(2, 0.5);
            ctx.road(3, 0.5);
            ctx.station();
        }
    },
    "cross-road-rail-road-rail": {
        edges: [
            {
                type: 2,
                connects: [
                    2,
                    1,
                    3
                ]
            },
            {
                type: 1,
                connects: [
                    0,
                    2,
                    3
                ]
            },
            {
                type: 2,
                connects: [
                    0,
                    1,
                    3
                ]
            },
            {
                type: 1,
                connects: [
                    0,
                    1,
                    2
                ]
            }
        ],
        render (ctx) {
            ctx.road(0, 0.5);
            ctx.rail(1, 0.5);
            ctx.road(2, 0.5);
            ctx.rail(3, 0.5);
            ctx.station();
        }
    },
    "cross-rail": {
        edges: [
            {
                type: 1,
                connects: [
                    2,
                    1,
                    3
                ]
            },
            {
                type: 1,
                connects: [
                    0,
                    2,
                    3
                ]
            },
            {
                type: 1,
                connects: [
                    0,
                    1,
                    3
                ]
            },
            {
                type: 1,
                connects: [
                    0,
                    1,
                    2
                ]
            }
        ],
        render (ctx) {
            ctx.rail(0, 0.5);
            ctx.rail(1, 0.5);
            ctx.rail(2, 0.5);
            ctx.rail(3, 0.5);
            ctx.railCross();
        }
    },
    "cross-road": {
        edges: [
            {
                type: 2,
                connects: [
                    2,
                    1,
                    3
                ]
            },
            {
                type: 2,
                connects: [
                    0,
                    2,
                    3
                ]
            },
            {
                type: 2,
                connects: [
                    0,
                    1,
                    3
                ]
            },
            {
                type: 2,
                connects: [
                    0,
                    1,
                    2
                ]
            }
        ],
        render (ctx) {
            ctx.arc(0, -1);
            ctx.arc(1, -1);
            ctx.arc(2, -1);
            ctx.arc(3, -1);
            ctx.roadTicks(0, 0.5);
            ctx.roadTicks(1, 0.5);
            ctx.roadTicks(2, 0.5);
            ctx.roadTicks(3, 0.5);
        }
    },
    "lake-1": {
        edges: [
            {
                type: 3,
                connects: []
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 0,
                connects: []
            }
        ],
        render (ctx) {
            ctx.lake([
                [
                    0,
                    0
                ],
                [
                    1,
                    0
                ],
                [
                    0.5,
                    0.5
                ]
            ]);
        }
    },
    "lake-2": {
        edges: [
            {
                type: 3,
                connects: [
                    1
                ]
            },
            {
                type: 3,
                connects: [
                    0
                ]
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 0,
                connects: []
            }
        ],
        render (ctx) {
            ctx.lake([
                [
                    0,
                    0
                ],
                [
                    1,
                    0
                ],
                [
                    1,
                    1
                ]
            ]);
        }
    },
    "lake-3": {
        edges: [
            {
                type: 3,
                connects: [
                    1,
                    2
                ]
            },
            {
                type: 3,
                connects: [
                    0,
                    2
                ]
            },
            {
                type: 3,
                connects: [
                    0,
                    1
                ]
            },
            {
                type: 0,
                connects: []
            }
        ],
        render (ctx) {
            ctx.lake([
                [
                    0,
                    0
                ],
                [
                    1,
                    0
                ],
                [
                    1,
                    1
                ],
                [
                    0,
                    1
                ],
                [
                    0.5,
                    0.5
                ]
            ]);
        }
    },
    "lake-4": {
        edges: [
            {
                type: 3,
                connects: [
                    1,
                    2,
                    3
                ]
            },
            {
                type: 3,
                connects: [
                    0,
                    2,
                    3
                ]
            },
            {
                type: 3,
                connects: [
                    0,
                    1,
                    3
                ]
            },
            {
                type: 3,
                connects: [
                    0,
                    1,
                    2
                ]
            }
        ],
        render (ctx) {
            ctx.lake([
                [
                    0,
                    0
                ],
                [
                    1,
                    0
                ],
                [
                    1,
                    1
                ],
                [
                    0,
                    1
                ]
            ]);
        }
    },
    "lake-rail": {
        edges: [
            {
                type: 3,
                connects: [
                    2
                ]
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 1,
                connects: [
                    0
                ]
            },
            {
                type: 0,
                connects: []
            }
        ],
        render (ctx) {
            ctx.lake([
                [
                    0,
                    0
                ],
                [
                    1,
                    0
                ],
                [
                    0.5,
                    0.5
                ]
            ]);
            ctx.rail(2, 0.5);
            ctx.station();
        }
    },
    "lake-road": {
        edges: [
            {
                type: 3,
                connects: [
                    2
                ]
            },
            {
                type: 0,
                connects: []
            },
            {
                type: 2,
                connects: [
                    0
                ]
            },
            {
                type: 0,
                connects: []
            }
        ],
        render (ctx) {
            ctx.lake([
                [
                    0,
                    0
                ],
                [
                    1,
                    0
                ],
                [
                    0.5,
                    0.5
                ]
            ]);
            ctx.road(2, 0.5);
            ctx.station();
        }
    },
    "lake-rail-road": {
        edges: [
            {
                type: 3,
                connects: [
                    1,
                    2,
                    3
                ]
            },
            {
                type: 3,
                connects: [
                    0,
                    2,
                    3
                ]
            },
            {
                type: 2,
                connects: [
                    0,
                    1,
                    3
                ]
            },
            {
                type: 1,
                connects: [
                    0,
                    1,
                    2
                ]
            }
        ],
        render (ctx) {
            ctx.lake([
                [
                    0,
                    0
                ],
                [
                    1,
                    0
                ],
                [
                    1,
                    1
                ]
            ]);
            ctx.road(2, 0.5);
            ctx.rail(3, 0.5);
            ctx.station();
        }
    },
    "forest": {
        edges: [
            {
                type: 4,
                connects: []
            },
            {
                type: 4,
                connects: []
            },
            {
                type: 4,
                connects: []
            },
            {
                type: 4,
                connects: []
            }
        ],
        render (ctx) {
            ctx.forest();
        }
    }
};
function get1(id) {
    if (!(id in repo1)) {
        throw new Error(`Shape ${id} not found`);
    }
    return repo1[id];
}
function getTransforms(edges) {
    let cache = new Set();
    function filter(t) {
        let transform = get(t);
        let key = all.map((d)=>{
            d = transform.apply(d);
            return edges[d].type;
        }).join("/");
        if (cache.has(key)) {
            return false;
        }
        cache.add(key);
        return true;
    }
    return all1.filter(filter);
}
for(let key in partials){
    let shape = partials[key];
    let transforms = getTransforms(shape.edges);
    repo1[key] = Object.assign({
    }, shape, {
        transforms
    });
}
class Tile {
    _data;
    static fromJSON(data) {
        return new this(data.sid, data.tid);
    }
    constructor(sid, tid){
        this._data = {
            sid,
            tid
        };
    }
    get transform() {
        return this._data.tid;
    }
    set transform(transform) {
        this._data.tid = transform;
    }
    toJSON() {
        return this._data;
    }
    clone() {
        return Tile.fromJSON(this.toJSON());
    }
    getEdge(direction) {
        let transform = get(this.transform);
        direction = transform.invert(direction);
        let edge = get1(this._data.sid).edges[direction];
        return {
            type: edge.type,
            connects: edge.connects.map((d)=>transform.apply(d)
            )
        };
    }
    getTransforms() {
        return get1(this._data.sid).transforms;
    }
    fitsNeighbors(neighborEdges) {
        let connections = 0;
        let errors = 0;
        neighborEdges.forEach((nEdge, dir)=>{
            let ourEdge = this.getEdge(dir).type;
            if (ourEdge == 3 || ourEdge == 4) {
                connections++;
                return;
            }
            if (nEdge == 0 || ourEdge == 0 || nEdge == 4) {
                return;
            }
            if (nEdge == ourEdge) {
                connections++;
            } else {
                errors++;
            }
        });
        if (errors > 0) {
            return 0;
        }
        return connections;
    }
}
function getNeighbor(cell, direction, cells) {
    let x = cell.x + Vector[direction][0];
    let y = cell.y + Vector[direction][1];
    return cells.at(x, y);
}
function getCenterCount(cells) {
    return cells.filter((cell)=>cell.center && cell.tile
    ).length;
}
function getEdgeKey(a, b) {
    if (a.x > b.x || a.y > b.y) {
        [a, b] = [
            b,
            a
        ];
    }
    return [
        a.x,
        a.y,
        b.x,
        b.y
    ].join("/");
}
function getSubgraph(start, cells) {
    ;
    let subgraph = [];
    let queue = [
        {
            cell: start,
            from: null
        }
    ];
    let lockedEdges = new Set();
    while(queue.length){
        let current = queue.shift();
        let cell = current.cell;
        if (!cell.tile) {
            continue;
        }
        subgraph.push(cell);
        let tile = cell.tile;
        let outDirections = current.from === null ? all : tile.getEdge(current.from).connects;
        outDirections.forEach((d)=>{
            let edgeType = tile.getEdge(d).type;
            if (edgeType == 0) {
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
            queue.push({
                cell: neighbor,
                from: neighborEdge
            });
        });
    }
    return subgraph;
}
function getConnectedExits(start, cells) {
    return getSubgraph(start, cells).filter((cell)=>cell.border
    );
}
function getExits(cells) {
    let results = [];
    let exitsArr = cells.filter((cell)=>cell.border && cell.tile
    );
    let exits = new Set(exitsArr);
    while(exits.size > 0){
        let cell = exits.values().next().value;
        let connected = getConnectedExits(cell, cells);
        if (connected.length > 1) {
            results.push(connected.length);
        }
        connected.forEach((cell)=>exits.delete(cell)
        );
    }
    return results;
}
function getLongestFrom(cell, from, ctx) {
    if (!cell.tile) {
        return [];
    }
    let path = [];
    let tile = cell.tile;
    let outDirections = from === null ? all : tile.getEdge(from).connects;
    ctx.lockedCells.add(cell);
    outDirections.filter((d)=>tile.getEdge(d).type == ctx.edgeType
    ).forEach((d)=>{
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
        return all.some((d)=>tile.getEdge(d).type == edgeType
        );
    }
    let starts = cells.filter(contains);
    let bestPath = [];
    starts.forEach((cell)=>{
        let lockedCells = new Set();
        let ctx = {
            cells,
            edgeType,
            lockedCells
        };
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
    if (edge != 1 && edge != 2) {
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
    return neighbor.tile.getEdge(neighborEdge).type != edge;
}
function getDeadends(cells) {
    let deadends = [];
    cells.filter((cell)=>!cell.border
    ).forEach((cell)=>{
        all.forEach((direction)=>{
            let deadend = {
                cell,
                direction
            };
            isDeadend(deadend, cells) && deadends.push(deadend);
        });
    });
    return deadends;
}
function extractLake(lakeCells, allCells) {
    let pending = [
        lakeCells.shift()
    ];
    let processed = [];
    while(pending.length){
        const current = pending.shift();
        processed.push(current);
        const tile = current.tile;
        if (!tile) {
            continue;
        }
        all.filter((d)=>tile.getEdge(d).type == 3
        ).forEach((d)=>{
            let neighbor = getNeighbor(current, d, allCells);
            if (!neighbor.tile) {
                return;
            }
            let neighborEdge = clamp(d + 2);
            let neighborEdgeType = neighbor.tile.getEdge(neighborEdge).type;
            if (neighborEdgeType != 3) {
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
        return all.some((d)=>tile.getEdge(d).type == 3
        );
    }
    let lakeCells = cells.filter(isLake);
    let sizes = [];
    while(lakeCells.length){
        sizes.push(extractLake(lakeCells, cells).length);
    }
    return sizes;
}
function getForests(cells) {
    function isRailRoad(cell) {
        if (cell.border || !cell.tile) {
            return;
        }
        let tile = cell.tile;
        return all.every((d)=>tile.getEdge(d).type != 4
        );
    }
    function hasForestNeighbor(cell) {
        return all.some((d)=>{
            let neighbor = getNeighbor(cell, d, cells);
            if (!neighbor.tile) {
                return;
            }
            let neighborEdge = clamp(d + 2);
            return neighbor.tile.getEdge(neighborEdge).type == 4;
        });
    }
    return cells.filter(isRailRoad).filter(hasForestNeighbor);
}
function get2(cells) {
    return {
        exits: getExits(cells),
        center: getCenterCount(cells),
        rail: getLongest(1, cells),
        road: getLongest(2, cells),
        deadends: getDeadends(cells),
        lakes: getLakes(cells),
        forests: getForests(cells)
    };
}
function mapExits(score) {
    return score.exits.map((count)=>count == 12 ? 45 : (count - 1) * 4
    );
}
function sumLakes(score) {
    return score.lakes.length > 0 ? score.lakes.sort((a, b)=>a - b
    )[0] : 0;
}
function sum(score) {
    let exits = mapExits(score);
    let exitScore = exits.reduce((a, b)=>a + b
    , 0);
    let lakeScore = sumLakes(score);
    return exitScore + score.road.length + score.rail.length + score.center - score.deadends.length + lakeScore + score.forests.length;
}
const BOARD = 7;
function inBoard(x, y) {
    return x > 0 && y > 0 && x <= 7 && y <= 7;
}
class CellRepo {
    _cells = [];
    constructor(){
        const tile = null;
        const round = 0;
        for(let y = 0; y < 7 + 2; y++){
            let row = [];
            this._cells.push(row);
            for(let x = 0; x < 7 + 2; x++){
                let border = !inBoard(x, y);
                let center = x >= 3 && x <= 5 && y >= 3 && y <= 5;
                let cell = {
                    x,
                    y,
                    border,
                    center,
                    tile: null,
                    round: 0
                };
                row.push(cell);
            }
        }
    }
    forEach(cb) {
        this._cells.forEach((row)=>{
            row.forEach((cell)=>cb(cell)
            );
        });
    }
    filter(test) {
        let results = [];
        this._cells.forEach((row)=>{
            row.forEach((cell)=>{
                test(cell) && results.push(cell);
            });
        });
        return results;
    }
    at(x, y) {
        return this._cells[y][x];
    }
}
class Board {
    _tileCtor;
    blob = null;
    _cells = new CellRepo();
    constructor(_tileCtor1 = Tile){
        this._tileCtor = _tileCtor1;
    }
    signal(_cells) {
    }
    showScore(_score) {
    }
    onClick(_cell) {
    }
    getScore() {
        return get2(this._cells);
    }
    fromJSON(cells) {
        const Tile = this._tileCtor;
        this._cells.forEach((cell)=>{
            if (!cell.border) {
                cell.tile = null;
            }
        });
        cells.forEach((cell)=>{
            let tile = Tile.fromJSON(cell.tile);
            this.place(tile, cell.x, cell.y, cell.round);
        });
        this.commit(0);
        return this;
    }
    toJSON() {
        let result = [];
        this._cells.forEach((cell)=>{
            const tile = cell.tile;
            if (cell.border || !tile) {
                return;
            }
            result.push({
                x: cell.x,
                y: cell.y,
                round: cell.round,
                tile: tile.toJSON()
            });
        });
        return result;
    }
    commit(round) {
        round && this._surroundLakes(round);
    }
    cycleTransform(x, y) {
        let tile = this._cells.at(x, y).tile;
        if (!tile) {
            return;
        }
        let avail = this._getTransforms(tile, x, y);
        let index = avail.indexOf(tile.transform);
        if (index == -1 || avail.length <= 1) {
            return;
        }
        index = (index + 1) % avail.length;
        tile.transform = avail[index];
    }
    placeBest(tile, x, y, round) {
        let avail = this._getTransforms(tile, x, y);
        if (!avail.length) {
            return false;
        }
        tile.transform = avail[0];
        this.place(tile, x, y, round);
        return true;
    }
    place(tile, x, y, round) {
        let cell = this._cells.at(x, y);
        cell.tile = tile;
        cell.round = round;
    }
    getNeighborEdges(x, y) {
        return all.map((dir)=>{
            let vector = Vector[dir];
            let neighbor = this._cells.at(x + vector[0], y + vector[1]).tile;
            if (!neighbor) {
                return 0;
            }
            return neighbor.getEdge(clamp(dir + 2)).type;
        });
    }
    getAvailableCells(tile) {
        return this._cells.filter((cell)=>{
            if (cell.border || cell.tile) {
                return false;
            }
            let transforms = this._getTransforms(tile, cell.x, cell.y);
            return transforms.length > 0;
        });
    }
    _getTransforms(tile, x, y) {
        let neighborEdges = this.getNeighborEdges(x, y);
        let clone = tile.clone();
        function compare(t1, t2) {
            clone.transform = t1;
            let c1 = clone.fitsNeighbors(neighborEdges);
            clone.transform = t2;
            let c2 = clone.fitsNeighbors(neighborEdges);
            return c2 - c1;
        }
        return tile.getTransforms().filter((t)=>{
            clone.transform = t;
            return clone.fitsNeighbors(neighborEdges);
        }).sort(compare);
    }
    _placeInitialTiles() {
        const Tile = this._tileCtor;
        this._cells.forEach((cell)=>{
            const x = cell.x;
            const y = cell.y;
            let tile = null;
            switch(true){
                case x == 2 && y == 0:
                case x == 6 && y == 0:
                    tile = new Tile("road-half", "2");
                    break;
                case x == 2 && y == 8:
                case x == 6 && y == 8:
                    tile = new Tile("road-half", "0");
                    break;
                case x == 0 && y == 2:
                case x == 0 && y == 6:
                    tile = new Tile("rail-half", "1");
                    break;
                case x == 8 && y == 2:
                case x == 8 && y == 6:
                    tile = new Tile("rail-half", "-1");
                    break;
                case x == 4 && y == 0:
                    tile = new Tile("rail-half", "2");
                    break;
                case x == 4 && y == 8:
                    tile = new Tile("rail-half", "0");
                    break;
                case x == 0 && y == 4:
                    tile = new Tile("road-half", "1");
                    break;
                case x == 8 && y == 4:
                    tile = new Tile("road-half", "-1");
                    break;
            }
            this.place(tile, x, y, 0);
        });
        this.commit(0);
    }
    _surroundLakes(round) {
        const Tile = this._tileCtor;
        const isSurrounded = (cell)=>{
            if (cell.tile || cell.border) {
                return false;
            }
            let neighborEdges = this.getNeighborEdges(cell.x, cell.y);
            return neighborEdges.filter((e)=>e == 3
            ).length >= 3;
        };
        let surrounded = this._cells.filter(isSurrounded);
        surrounded.forEach((cell)=>{
            let tile = new Tile("lake-4", "0");
            this.place(tile, cell.x, cell.y, round);
        });
        surrounded.length && this.commit(round);
    }
}
function node1(name, attrs = {
}, content) {
    let node = document.createElement(name);
    Object.assign(node, attrs);
    content && (node.textContent = content);
    return node;
}
const TILE = Number(window.getComputedStyle(document.body).getPropertyValue("--tile-size"));
const DOWN_EVENT = "onpointerdown" in window ? "pointerdown" : "touchstart";
const SERVER = "wss://ws.toad.cz/";
const RAIL_TICK_WIDTH = 1;
const LINE_WIDTH = 2;
const RAIL_WIDTH = 12;
const ROAD_WIDTH = 14;
const RAIL_TICK_SMALL = [
    1,
    6
];
const RAIL_TICK_LARGE = [
    1,
    8
];
const ROAD_TICK = [
    6,
    4
];
const STARTS = [
    [
        0.5,
        0
    ],
    [
        1,
        0.5
    ],
    [
        0.5,
        1
    ],
    [
        0,
        0.5
    ]
];
const TO_CENTER = Vector.map((_, i, all)=>all[clamp(i + 2)]
);
function toAbs(p) {
    return p.map(($)=>$ * TILE
    );
}
function computeControlPoint(p1, p2) {
    if (p1[0] == p2[0]) {
        return [
            1 - p1[0],
            0.5
        ];
    } else {
        return [
            0.5,
            1 - p1[1]
        ];
    }
}
function createLakeCanvas() {
    const N = 4;
    const PX = 2;
    const canvas = node1("canvas");
    canvas.width = canvas.height = N * PX;
    const ctx = canvas.getContext("2d");
    for(let i = 0; i < 4; i++){
        for(let j = 0; j < 4; j++){
            const H = 200 + ~~(Math.random() * (240 - 200));
            const S = 100;
            const V = 70 + ~~(Math.random() * (90 - 70));
            ctx.fillStyle = `hsl(${H}, ${S}%, ${V}%)`;
            ctx.fillRect(i * 2, j * 2, 2, 2);
        }
    }
    return canvas;
}
const lakeCanvas = createLakeCanvas();
class CanvasDrawContext {
    _ctx;
    constructor(canvas){
        canvas.width = canvas.height = TILE * devicePixelRatio;
        this._ctx = canvas.getContext("2d");
        this._ctx.scale(devicePixelRatio, devicePixelRatio);
        this._ctx.lineWidth = LINE_WIDTH;
    }
    styleLine() {
        const ctx = this._ctx;
        ctx.lineWidth = LINE_WIDTH;
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
    }
    styleRoadTicks(dash, offset) {
        const ctx = this._ctx;
        ctx.lineWidth = LINE_WIDTH;
        ctx.setLineDash(dash);
        ctx.lineDashOffset = offset;
    }
    styleRailTicks(dash, offset) {
        const ctx = this._ctx;
        ctx.lineWidth = RAIL_WIDTH;
        ctx.setLineDash(dash);
        ctx.lineDashOffset = offset;
    }
    styleLake() {
        const ctx = this._ctx;
        ctx.fillStyle = ctx.createPattern(lakeCanvas, "repeat");
    }
    station() {
        const ctx = this._ctx;
        let size = [
            ctx.canvas.width,
            ctx.canvas.height
        ].map(($)=>$ / devicePixelRatio
        );
        ctx.fillStyle = "#000";
        ctx.fillRect(size[0] / 2 - 18 / 2, size[1] / 2 - 18 / 2, 18, 18);
    }
    railCross() {
        const ctx = this._ctx;
        this.styleLine();
        ctx.lineWidth = RAIL_TICK_WIDTH;
        ctx.beginPath();
        let c = [
            TILE / 2,
            TILE / 2
        ];
        let d = 12 / 2;
        ctx.moveTo(c[0] - d, c[1] - d);
        ctx.lineTo(c[0] + d, c[1] + d);
        ctx.moveTo(c[0] - d, c[1] + d);
        ctx.lineTo(c[0] + d, c[1] - d);
        ctx.stroke();
    }
    roadTicks(edge, length) {
        const ctx = this._ctx;
        let pxLength = length * TILE;
        let start = toAbs(STARTS[edge]);
        let vec = TO_CENTER[edge];
        let end = [
            start[0] + vec[0] * pxLength,
            start[1] + vec[1] * pxLength
        ];
        this.styleRoadTicks(ROAD_TICK, -3);
        ctx.beginPath();
        ctx.moveTo(...start);
        ctx.lineTo(...end);
        ctx.stroke();
    }
    railTicks(edge, length) {
        const ctx = this._ctx;
        let pxLength = length * TILE;
        let start = toAbs(STARTS[edge]);
        let vec = TO_CENTER[edge];
        let end = [
            start[0] + vec[0] * pxLength,
            start[1] + vec[1] * pxLength
        ];
        if (length > 0.5) {
            this.styleRailTicks(RAIL_TICK_LARGE, 5);
        } else {
            this.styleRailTicks(RAIL_TICK_SMALL, 3);
        }
        ctx.beginPath();
        ctx.moveTo(...start);
        ctx.lineTo(...end);
        ctx.stroke();
    }
    rail(edge, length) {
        const ctx = this._ctx;
        this.styleLine();
        let pxLength = length * TILE;
        let vec = TO_CENTER[edge];
        let start = toAbs(STARTS[edge]);
        let end = [
            start[0] + vec[0] * pxLength,
            start[1] + vec[1] * pxLength
        ];
        ctx.beginPath();
        ctx.moveTo(...start);
        ctx.lineTo(...end);
        ctx.stroke();
        let ticksLength = length;
        if (length <= 0.5) {
            ticksLength = Math.min(ticksLength, 0.35);
        }
        this.railTicks(edge, ticksLength);
    }
    roadLine(edge, length, diff) {
        const ctx = this._ctx;
        this.styleLine();
        let pxLength = length * TILE;
        diff *= ROAD_WIDTH / 2;
        let vec = TO_CENTER[edge];
        let start = toAbs(STARTS[edge]);
        let end = [
            start[0] + vec[0] * pxLength,
            start[1] + vec[1] * pxLength
        ];
        ctx.beginPath();
        switch(edge){
            case 0:
            case 2:
                ctx.moveTo(start[0] + diff, start[1]);
                ctx.lineTo(end[0] + diff, end[1]);
                break;
            case 3:
            case 1:
                ctx.moveTo(start[0], start[1] + diff);
                ctx.lineTo(end[0], end[1] + diff);
                break;
        }
        ctx.stroke();
    }
    road(edge, length) {
        const ctx = this._ctx;
        let pxLength = length * TILE;
        let vec = TO_CENTER[edge];
        let start = toAbs(STARTS[edge]);
        let end = [
            start[0] + vec[0] * pxLength,
            start[1] + vec[1] * pxLength
        ];
        switch(edge){
            case 0:
                ctx.clearRect(start[0] - 14 / 2, start[1], 14, pxLength);
                break;
            case 2:
                ctx.clearRect(end[0] - 14 / 2, end[1], 14, pxLength);
                break;
            case 3:
                ctx.clearRect(start[0], start[1] - 14 / 2, pxLength, 14);
                break;
            case 1:
                ctx.clearRect(end[0], end[1] - 14 / 2, pxLength, 14);
                break;
        }
        this.roadLine(edge, length, -1);
        this.roadLine(edge, length, +1);
        this.roadTicks(edge, length);
    }
    arc(quadrant, diff) {
        const ctx = this._ctx;
        diff *= ROAD_WIDTH / 2;
        let R = 16 + diff;
        ctx.beginPath();
        let start = [
            0,
            0
        ];
        let end = [
            0,
            0
        ];
        switch(quadrant){
            case 0:
                start[0] = end[1] = TILE / 2 + diff;
                break;
            case 1:
                start[0] = TILE / 2 - diff;
                end[0] = TILE;
                end[1] = TILE / 2 + diff;
                break;
            case 2:
                start[0] = TILE / 2 - diff;
                start[1] = TILE;
                end[0] = TILE;
                end[1] = TILE / 2 - diff;
                break;
            case 3:
                end[1] = TILE / 2 - diff;
                start[0] = TILE / 2 + diff;
                start[1] = TILE;
                break;
        }
        ctx.moveTo(...start);
        ctx.arcTo(start[0], end[1], end[0], end[1], R);
        ctx.lineTo(...end);
        ctx.stroke();
    }
    redGlow(direction) {
        const ctx = this._ctx;
        let point = toAbs(STARTS[direction]);
        const R = 12;
        ctx.beginPath();
        ctx.arc(point[0], point[1], 12, 0, Math.PI, false);
        ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
        ctx.fill();
    }
    lake(points) {
        points.push(points[0]);
        const ctx = this._ctx;
        const fillPath = new Path2D();
        const strokePath = new Path2D();
        for(let i = 0; i < points.length; i++){
            const point = points[i];
            const absPoint = toAbs(point);
            if (i == 0) {
                fillPath.moveTo(...absPoint);
                strokePath.moveTo(...absPoint);
                continue;
            }
            const prevPoint = points[i - 1];
            if (point[0] == 0.5) {
                let nextPoint = points[i + 1];
                let cp = computeControlPoint(prevPoint, nextPoint);
                cp = toAbs(cp);
                nextPoint = toAbs(nextPoint);
                fillPath.quadraticCurveTo(cp[0], cp[1], ...nextPoint);
                strokePath.quadraticCurveTo(cp[0], cp[1], ...nextPoint);
                i++;
            } else {
                fillPath.lineTo(...absPoint);
                if (point[0] == prevPoint[0] || point[1] == prevPoint[1]) {
                    strokePath.moveTo(...absPoint);
                } else {
                    strokePath.lineTo(...absPoint);
                }
            }
        }
        this.styleLake();
        ctx.fill(fillPath);
        this.styleLine();
        ctx.stroke(strokePath);
    }
    forest() {
        const ctx = this._ctx;
        ctx.lineWidth = LINE_WIDTH;
        for(let i = 0; i < 3; i++){
            let x = Math.round(TILE / 4 * (i + 1));
            let y = TILE * 3 / 4 + TILE / 6 * (i % 2 ? -1 : 1);
            ctx.beginPath();
            Math.random() < 0.5 ? tree1(ctx, x, y) : tree2(ctx, x, y);
            ctx.fill();
            ctx.stroke();
        }
    }
}
function tree1(ctx, x, y) {
    const R = TILE / 8;
    const cy = y - TILE / 3;
    ctx.fillStyle = "yellowgreen";
    ctx.moveTo(x, y);
    ctx.lineTo(x, cy + R);
    ctx.arc(x, cy, R, Math.PI / 2, -Math.PI / 2);
    ctx.arc(x, cy, R, -Math.PI / 2, Math.PI / 2);
}
function tree2(ctx, x, y) {
    ctx.fillStyle = "forestgreen";
    ctx.moveTo(x, y);
    const STEP_X = TILE / 10;
    const STEP_Y = TILE / 8;
    y -= TILE / 5;
    ctx.lineTo(x, y);
    ctx.lineTo(x - STEP_X, y);
    ctx.lineTo(x, y - STEP_Y);
    ctx.lineTo(x + STEP_X, y);
    ctx.lineTo(x, y);
    y -= STEP_Y;
    ctx.moveTo(x, y);
    ctx.lineTo(x - STEP_X, y);
    ctx.lineTo(x, y - STEP_Y);
    ctx.lineTo(x + STEP_X, y);
    ctx.lineTo(x, y);
}
let cache = new Map();
function createVisual(id) {
    let result;
    if (cache.has(id)) {
        result = cache.get(id);
    } else {
        let shape = get1(id);
        let canvas = node1("canvas");
        let ctx = new CanvasDrawContext(canvas);
        shape.render(ctx);
        let data = canvas.toDataURL("image/png");
        result = {
            canvas,
            data
        };
        if (id != "forest") {
            cache.set(id, result);
        }
    }
    return result;
}
class HTMLTile extends Tile {
    node;
    _visual;
    constructor(sid1, tid1, visual = null){
        super(sid1, tid1);
        this._visual = visual || createVisual(this._data.sid);
        this.node = node1("img", {
            className: "tile",
            alt: "tile",
            src: this._visual.data
        });
        this._applyTransform();
    }
    get transform() {
        return super.transform;
    }
    set transform(transform) {
        super.transform = transform;
        this._applyTransform();
    }
    clone() {
        return new HTMLTile(this._data.sid, this._data.tid, this._visual);
    }
    createCanvas() {
        const source = this._visual.canvas;
        const canvas = node1("canvas", {
            width: source.width,
            height: source.height
        });
        const ctx = canvas.getContext("2d");
        get(this._data.tid).applyToContext(ctx);
        ctx.drawImage(source, 0, 0);
        return canvas;
    }
    _applyTransform() {
        this.node.style.transform = get(this._data.tid).getCSS();
    }
}
const DPR = devicePixelRatio;
const BTILE = TILE / 2;
const bodyStyle = getComputedStyle(document.body);
const BORDER = Number(bodyStyle.getPropertyValue("--border-thick"));
const THIN = Number(bodyStyle.getPropertyValue("--border-thin"));
function pxToCell(px) {
    for(let i = 0; i < 7 + 2; i++){
        let cellPx = cellToPx(i);
        if (px >= cellPx && px < cellPx + TILE) {
            return i;
        }
    }
    return null;
}
function cellToPx(cell) {
    if (cell == 0) {
        return BTILE - TILE;
    }
    let offset = BTILE + BORDER;
    if (cell <= 7) {
        return offset + (cell - 1) * (TILE + THIN);
    }
    return offset + 7 * TILE + (7 - 1) * THIN + BORDER;
}
class BoardCanvas extends Board {
    _ctx;
    _pendingCells = [];
    _signals = [];
    node;
    constructor(){
        super(HTMLTile);
        this.node = this._build();
        this._placeInitialTiles();
        this.node.addEventListener(DOWN_EVENT, this);
    }
    handleEvent(e) {
        switch(e.type){
            case DOWN_EVENT:
                let pxx = null;
                let pxy = null;
                if ("touches" in e) {
                    pxx = e.touches[0].clientX;
                    pxy = e.touches[0].clientY;
                } else {
                    pxx = e.clientX;
                    pxy = e.clientY;
                }
                const rect = this.node.getBoundingClientRect();
                pxx -= rect.left;
                pxy -= rect.top;
                let x = pxToCell(pxx);
                let y = pxToCell(pxy);
                if (x === null || y === null) {
                    return;
                }
                let cell = this._cells.at(x, y);
                this.onClick(cell);
                break;
        }
    }
    place(tile, x, y, round) {
        super.place(tile, x, y, round);
        let index = this._pendingCells.findIndex((cell)=>cell.x == x && cell.y == y
        );
        if (index > -1) {
            this._pendingCells[index].node.remove();
            this._pendingCells.splice(index, 1);
        }
        if (!tile) {
            return;
        }
        let node = node1("div", {
            className: "cell"
        });
        node.style.left = `${cellToPx(x)}px`;
        node.style.top = `${cellToPx(y)}px`;
        node.appendChild(tile.node);
        round && node.appendChild(node1("div", {
            className: "round"
        }, round.toString()));
        this.node.appendChild(node);
        this._pendingCells.push({
            x,
            y,
            node,
            tile,
            round
        });
    }
    commit(round) {
        super.commit(round);
        const ctx = this._ctx;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        this._pendingCells.forEach((cell)=>{
            let pxx = cellToPx(cell.x) * DPR;
            let pxy = cellToPx(cell.y) * DPR;
            ctx.drawImage(cell.tile.createCanvas(), pxx, pxy);
            cell.node.remove();
        });
        ctx.restore();
        ctx.font = bodyStyle.getPropertyValue("--round-font");
        const size = Number(bodyStyle.getPropertyValue("--round-size"));
        const bg = bodyStyle.getPropertyValue("--round-bg");
        this._pendingCells.forEach((cell)=>{
            if (!cell.round) {
                return;
            }
            const pxx = cellToPx(cell.x) + TILE;
            const pxy = cellToPx(cell.y);
            ctx.fillStyle = bg;
            ctx.fillRect(pxx - size, pxy, size, size);
            ctx.fillStyle = "#000";
            ctx.fillText(cell.round.toString(), pxx - size / 2, pxy + size / 2);
        });
        this._pendingCells = [];
    }
    signal(cells) {
        this._signals.forEach((signal)=>signal.remove()
        );
        this._signals = cells.map((cell)=>{
            let signal = node1("div", {
                className: "signal"
            });
            let pxx = cellToPx(cell.x);
            let pxy = cellToPx(cell.y);
            signal.style.left = `${pxx}px`;
            signal.style.top = `${pxy}px`;
            this.node.appendChild(signal);
            return signal;
        });
    }
    showScore(score) {
        const ctx = this._ctx;
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
        this._drawPolyline(score.rail);
        ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
        this._drawPolyline(score.road);
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "red";
        score.deadends.forEach((deadend)=>{
            let pxx = cellToPx(deadend.cell.x) + TILE / 2;
            let pxy = cellToPx(deadend.cell.y) + TILE / 2;
            const offset = TILE / 2 + 10;
            let vec = Vector[deadend.direction];
            pxx += vec[0] * offset;
            pxy += vec[1] * offset;
            ctx.fillText("✘", pxx, pxy);
        });
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = "rgba(200, 255, 100, 0.2)";
        score.forests.forEach((cell)=>{
            let pxx = cellToPx(cell.x);
            let pxy = cellToPx(cell.y);
            ctx.fillRect(pxx, pxy, TILE, TILE);
        });
        if (ctx.canvas.toBlob) {
            ctx.canvas.toBlob((blob)=>this.blob = blob
            );
        } else if ("msToBlob" in ctx.canvas) {
            this.blob = ctx.canvas.msToBlob();
        }
    }
    _build() {
        let node = node1("div", {
            className: "board"
        });
        let canvas = node1("canvas");
        node.appendChild(canvas);
        const SIZE = 2 * (BTILE + BORDER) + 7 * TILE + (7 - 1) * THIN;
        canvas.width = canvas.height = SIZE * DPR;
        const PX = `${SIZE}px`;
        canvas.style.width = canvas.style.height = PX;
        document.body.style.setProperty("--board-width", PX);
        const ctx = canvas.getContext("2d");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.scale(DPR, DPR);
        this._ctx = ctx;
        this._drawGrid();
        return node;
    }
    _drawGrid() {
        const ctx = this._ctx;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = bodyStyle.getPropertyValue("--center-bg");
        let start = cellToPx(3) - THIN / 2;
        let length = 3 * (TILE + THIN);
        ctx.fillRect(start, start, length, length);
        ctx.beginPath();
        let offsetOdd = 0, offsetEven = 0, lineWidth = THIN;
        switch(DPR){
            case 1:
                offsetOdd = offsetEven = 0.5;
                break;
            case 1.5:
                offsetOdd = 2 / 3;
                offsetEven = 1 / 3;
                lineWidth /= DPR;
                break;
        }
        ctx.lineWidth = lineWidth;
        start = BTILE + BORDER;
        length = BOARD * TILE + (BOARD - 1) * THIN;
        for(let i = 0; i < 7 - 1; i++){
            let x = start + TILE + i * (TILE + THIN);
            let y = start + TILE + i * (TILE + THIN);
            x += x % 2 ? offsetOdd : offsetEven;
            y += y % 2 ? offsetOdd : offsetEven;
            ctx.moveTo(start, y);
            ctx.lineTo(start + length, y);
            ctx.moveTo(x, start);
            ctx.lineTo(x, start + length);
        }
        ctx.stroke();
        start = BTILE + BORDER / 2;
        length = length + BORDER;
        ctx.lineWidth = BORDER;
        ctx.strokeRect(start, start, length, length);
        ctx.strokeStyle = "red";
        ctx.lineWidth = BORDER;
        start = cellToPx(3) - THIN / 2;
        length = 3 * (TILE + THIN);
        ctx.strokeRect(start, start, length, length);
    }
    _drawPolyline(cells) {
        if (cells.length < 2) {
            return;
        }
        const ctx = this._ctx;
        ctx.beginPath();
        cells.forEach((cell, i, all)=>{
            let cx = cellToPx(cell.x) + TILE / 2;
            let cy = cellToPx(cell.y) + TILE / 2;
            if (i == 0) {
                ctx.moveTo(cx, cy);
            } else if (i == all.length - 1) {
                ctx.lineTo(cx, cy);
            } else {
                let inDir = this._getDirectionBetweenCells(all[i - 1], cell);
                let outDir = this._getDirectionBetweenCells(cell, all[i + 1]);
                if (inDir == outDir) {
                    ctx.lineTo(cx, cy);
                } else if (outDir !== null) {
                    let vec = Vector[outDir];
                    let endpoint = [
                        cx + TILE / 2 * vec[0],
                        cy + TILE / 2 * vec[1]
                    ];
                    ctx.arcTo(cx, cy, endpoint[0], endpoint[1], 12);
                }
            }
        });
        ctx.stroke();
    }
    _getDirectionBetweenCells(c1, c2) {
        if (c1.y > c2.y) {
            return 0;
        }
        if (c1.x > c2.x) {
            return 3;
        }
        if (c1.y < c2.y) {
            return 2;
        }
        if (c1.x < c2.x) {
            return 1;
        }
        return null;
    }
}
let current = null;
function showBoard(board) {
    if (!board.node) {
        return;
    }
    if (current) {
        current.node && current.node.replaceWith(board.node);
    } else {
        const next = document.querySelector("#score");
        next.parentNode.insertBefore(board.node, next);
    }
    current = board;
}
const ROUNDS = {
    "normal": 7,
    "lake": 6,
    "forest": 7,
    "demo": 1
};
function randomType(types) {
    return types[Math.floor(Math.random() * types.length)];
}
function createDice(Ctor, type, round) {
    switch(type){
        case "demo":
            return DEMO.map((type)=>new Ctor("plain", type)
            );
            break;
        case "lake":
            return [
                ...createDice(Ctor, "normal", round),
                new Ctor("lake", randomType(DICE_LAKE)),
                new Ctor("lake", randomType(DICE_LAKE))
            ];
            break;
        case "forest":
            if (round == 1) {
                let result = [];
                for(let i = 0; i < 4; i++){
                    result.push(new Ctor("forest", "forest"));
                }
                return result;
            } else {
                return createDice(Ctor, "normal", round);
            }
            break;
        default:
            let result = [];
            let templates = [
                DICE_REGULAR_1,
                DICE_REGULAR_1,
                DICE_REGULAR_1,
                DICE_REGULAR_2
            ];
            while(templates.length){
                let index = Math.floor(Math.random() * templates.length);
                let template = templates.splice(index, 1)[0];
                let sid = randomType(template);
                result.push(new Ctor("plain", sid));
            }
            return result;
            break;
    }
}
const DEMO = [
    "bridge",
    "rail-i",
    "road-i",
    "rail-road-l",
    "rail-road-i",
    "rail-t",
    "road-l",
    "rail-l",
    "road-t",
    "lake-1",
    "lake-2",
    "lake-3",
    "lake-4",
    "lake-rail",
    "lake-road",
    "lake-rail-road",
    "forest"
];
const DICE_REGULAR_1 = [
    "road-i",
    "rail-i",
    "road-l",
    "rail-l",
    "road-t",
    "rail-t"
];
const DICE_REGULAR_2 = [
    "bridge",
    "bridge",
    "rail-road-i",
    "rail-road-i",
    "rail-road-l",
    "rail-road-l"
];
const DICE_LAKE = [
    "lake-1",
    "lake-2",
    "lake-3",
    "lake-rail",
    "lake-road",
    "lake-rail-road"
];
class Dice {
    _type;
    _sid;
    static fromJSON(data) {
        return new this(data.type, data.sid);
    }
    constructor(_type1, _sid1){
        this._type = _type1;
        this._sid = _sid1;
    }
    toJSON() {
        return {
            type: this._type,
            sid: this._sid
        };
    }
}
class HTMLDice extends Dice {
    _type;
    _sid;
    _tile;
    node = node1("div", {
        className: "dice"
    });
    constructor(_type2, _sid2){
        super(_type2, _sid2);
        this._type = _type2;
        this._sid = _sid2;
        if (this._type == "lake") {
            this.node.classList.add("lake");
        }
        if (this._type == "forest") {
            this.node.classList.add("forest");
        }
        this._tile = new HTMLTile(this._sid, "0");
        this.node.appendChild(this._tile.node);
    }
    get classList() {
        return this.node.classList;
    }
    get tile() {
        return this._tile;
    }
    get mandatory() {
        return this._type == "plain" || this._type == "forest";
    }
    get blocked() {
        return this.classList.contains("blocked");
    }
    set blocked(value) {
        this.classList.toggle("blocked", value);
    }
    get pending() {
        return this.classList.contains("pending");
    }
    set pending(value) {
        this.classList.toggle("pending", value);
    }
    get disabled() {
        return this.classList.contains("disabled");
    }
    set disabled(value) {
        this.classList.toggle("disabled", value);
    }
}
class Pool {
    node = node1("div", {
        className: "pool"
    });
    _dices = [];
    get remaining() {
        return this._dices.filter((d)=>d.mandatory && !d.disabled && !d.blocked
        );
    }
    handleEvent(e) {
        let target = e.currentTarget;
        let dice = this._dices.filter((dice)=>dice.node == target
        )[0];
        if (!dice || dice.disabled || dice.blocked) {
            return;
        }
        this.onClick(dice);
    }
    add(dice) {
        this.node.appendChild(dice.node);
        dice.node.addEventListener(DOWN_EVENT, this);
        this._dices.push(dice);
    }
    enable(dice) {
        if (!this._dices.includes(dice)) {
            return false;
        }
        dice.disabled = false;
        return true;
    }
    disable(dice) {
        if (!this._dices.includes(dice)) {
            return false;
        }
        dice.disabled = true;
        return true;
    }
    pending(dice) {
        this._dices.forEach((d)=>d.pending = dice == d
        );
    }
    onClick(_dice) {
    }
    sync(board) {
        this._dices.filter((dice)=>!dice.disabled
        ).forEach((dice)=>{
            let cells = board.getAvailableCells(dice.tile);
            dice.blocked = cells.length == 0;
        });
    }
}
class BonusPool extends Pool {
    _used = 0;
    _locked = false;
    constructor(){
        super();
        this.node.classList.add("bonus");
        [
            "cross-road-road-rail-road",
            "cross-road-rail-rail-rail",
            "cross-road",
            "cross-rail",
            "cross-road-rail-rail-road",
            "cross-road-rail-road-rail"
        ].forEach((sid)=>{
            this.add(new HTMLDice("plain", sid));
        });
    }
    handleEvent(e) {
        if (this._locked || this._used == 3) {
            return;
        }
        super.handleEvent(e);
    }
    disable(dice) {
        let disabled = super.disable(dice);
        if (disabled) {
            this._used++;
            this._locked = true;
        }
        return disabled;
    }
    enable(dice) {
        let enabled = super.enable(dice);
        if (enabled) {
            this._used--;
            this.unlock();
        }
        return enabled;
    }
    unlock() {
        this._locked = false;
    }
    toJSON() {
        return this._dices.filter((d)=>d.disabled
        ).map((d)=>this._dices.indexOf(d)
        );
    }
    fromJSON(indices) {
        this._locked = false;
        indices.forEach((i)=>this.disable(this._dices[i])
        );
    }
}
const dataset = document.body.dataset;
class Game {
    _board;
    _node = document.querySelector("#game");
    _bonusPool = new BonusPool();
    constructor(_board1){
        this._board = _board1;
    }
    async play() {
        dataset.stage = "game";
        return true;
    }
    _outro() {
        dataset.stage = "outro";
    }
}
class Round {
    number;
    _board;
    _bonusPool;
    node;
    _pending = null;
    _pool;
    _endButton = node1("button");
    _placedDice = new Map();
    _lastClickTs = 0;
    constructor(number1, _board2, _bonusPool1){
        this.number = number1;
        this._board = _board2;
        this._bonusPool = _bonusPool1;
        this._pool = new Pool();
        this.node = this._pool.node;
        this._endButton.textContent = `End round #${this.number}`;
    }
    play(dice) {
        dice.forEach((dice)=>this._pool.add(dice)
        );
        this.node.appendChild(this._endButton);
        this._pool.onClick = (dice)=>this._onPoolClick(dice)
        ;
        this._bonusPool.onClick = (dice)=>this._onPoolClick(dice)
        ;
        this._board.onClick = (cell)=>this._onBoardClick(cell)
        ;
        this._syncEnd();
        this._bonusPool.unlock();
        return new Promise((resolve)=>{
            this._endButton.addEventListener("click", (_)=>{
                let valid = this._validatePlacement();
                if (!valid) {
                    alert("Some of your dice were not placed according to the rules. Please re-place them correctly.");
                    return;
                }
                this._end();
                resolve();
            });
        });
    }
    _end() {
        this._board.commit(this.number);
        function noop() {
        }
        this._pool.onClick = noop;
        this._bonusPool.onClick = noop;
        this._board.onClick = noop;
    }
    _onPoolClick(dice) {
        if (this._pending == dice) {
            this._pending = null;
            this._board.signal([]);
            this._pool.pending(null);
            this._bonusPool.pending(null);
        } else {
            this._pending = dice;
            let available = this._board.getAvailableCells(dice.tile);
            this._board.signal(available);
            this._pool.pending(dice);
            this._bonusPool.pending(dice);
        }
    }
    _onBoardClick(cell) {
        const ts = Date.now();
        if (ts - this._lastClickTs < 400) {
            this._tryToRemove(cell);
        } else if (this._pending) {
            this._tryToAdd(cell);
        } else {
            this._tryToCycle(cell);
            this._lastClickTs = ts;
        }
    }
    _tryToRemove(cell) {
        let dice = this._placedDice.get(cell);
        if (!dice) {
            return;
        }
        this._placedDice.delete(cell);
        this._board.place(null, cell.x, cell.y, 0);
        this._pool.enable(dice);
        this._bonusPool.enable(dice);
        this._syncEnd();
    }
    _tryToAdd(cell) {
        if (!this._pending) {
            return;
        }
        let tile = this._pending.tile;
        let available = this._board.getAvailableCells(tile);
        if (!available.includes(cell)) {
            return false;
        }
        const x = cell.x;
        const y = cell.y;
        this._board.placeBest(tile.clone(), x, y, this.number);
        this._board.signal([]);
        this._pool.pending(null);
        this._bonusPool.pending(null);
        this._pool.disable(this._pending);
        this._bonusPool.disable(this._pending);
        this._placedDice.set(cell, this._pending);
        this._pending = null;
        this._syncEnd();
    }
    _tryToCycle(cell) {
        if (!this._placedDice.has(cell)) {
            return;
        }
        this._board.cycleTransform(cell.x, cell.y);
        this._syncEnd();
    }
    _syncEnd() {
        this._pool.sync(this._board);
        this._endButton.disabled = this._pool.remaining.length > 0;
    }
    _validatePlacement() {
        let todo = [];
        for (let cell of this._placedDice.keys()){
            todo.push({
                cell,
                tile: cell.tile
            });
            this._board.place(null, cell.x, cell.y, 0);
        }
        while(todo.length){
            let placed = todo.some((item, index)=>{
                let cell = item.cell;
                let neighbors = this._board.getNeighborEdges(cell.x, cell.y);
                if (item.tile.fitsNeighbors(neighbors)) {
                    this._board.place(item.tile, cell.x, cell.y, this.number);
                    todo.splice(index, 1);
                    return true;
                } else {
                    return false;
                }
            });
            if (!placed) {
                todo.forEach((item)=>this._tryToRemove(item.cell)
                );
                return false;
            }
        }
        return true;
    }
}
function buildTable() {
    const table = node1("table", {
        className: "score"
    });
    table.appendChild(node1("thead"));
    table.appendChild(node1("tbody"));
    table.tHead.insertRow().insertCell();
    const body = table.tBodies[0];
    [
        "Connected exits",
        "Longest road",
        "Longest rail",
        "Center tiles",
        "Dead ends",
        "Smallest lake",
        "Forest views"
    ].forEach((label)=>{
        body.insertRow().insertCell().textContent = label;
    });
    body.rows[body.rows.length - 1].hidden = true;
    body.rows[body.rows.length - 2].hidden = true;
    table.appendChild(node1("tfoot"));
    table.tFoot.insertRow().insertCell().textContent = "Score";
    return table;
}
function addColumn(table, score, name = "", active = false) {
    let result = {
        onClick () {
        }
    };
    if (name) {
        const row = table.tHead.rows[0];
        const cell = row.insertCell();
        cell.textContent = name;
        function activate() {
            Array.from(row.cells).forEach((c)=>c.classList.toggle("active", c == cell)
            );
            result.onClick();
        }
        cell.addEventListener("click", activate);
        active && activate();
    }
    const body = table.tBodies[0];
    let exits = mapExits(score);
    let exitScore = exits.reduce((a, b)=>a + b
    , 0);
    body.rows[0].insertCell().textContent = exitScore ? `${score.exits.join("+")} = ${exitScore}` : "0";
    body.rows[1].insertCell().textContent = score.road.length.toString();
    body.rows[2].insertCell().textContent = score.rail.length.toString();
    body.rows[3].insertCell().textContent = score.center.toString();
    body.rows[4].insertCell().textContent = (-score.deadends.length).toString();
    let lakeRow = body.rows[5];
    let lakeScore = sumLakes(score);
    if (lakeScore > 0) {
        lakeRow.insertCell().textContent = lakeScore.toString();
        lakeRow.hidden = false;
    } else {
        lakeRow.insertCell();
    }
    let forestRow = body.rows[6];
    if (score.forests.length > 0) {
        forestRow.insertCell().textContent = score.forests.length.toString();
        forestRow.hidden = false;
    } else {
        forestRow.insertCell();
    }
    let total = sum(score);
    const totalRow = table.tFoot.rows[0];
    totalRow.insertCell().textContent = total.toString();
    Array.from(table.querySelectorAll("tbody tr, tfoot tr")).forEach((row)=>{
        let cells = Array.from(row.cells).slice(1);
        let numbers = cells.map(extractCellValue);
        let best = Math.max(...numbers);
        cells.forEach((c)=>c.classList.toggle("best", extractCellValue(c) == best)
        );
    });
    return result;
}
function extractCellValue(cell) {
    let match = (cell.textContent || "").match(/[-\d]+$/);
    return match ? Number(match[0]) : 0;
}
function renderSingle(score) {
    const table = buildTable();
    addColumn(table, score);
    return table;
}
function renderMulti(names, scores, onClick, activeName) {
    const table = buildTable();
    names.forEach((name, i)=>{
        let active = name == activeName;
        addColumn(table, scores[i], name, active).onClick = ()=>onClick(i)
        ;
        if (active) {
            onClick(i);
        }
    });
    return table;
}
class SingleGame extends Game {
    _type;
    constructor(_board3, _type3){
        super(_board3);
        this._type = _type3;
    }
    async play() {
        super.play();
        this._node.innerHTML = "";
        this._node.appendChild(this._bonusPool.node);
        let num = 1;
        while(num <= ROUNDS[this._type]){
            let round = new Round(num, this._board, this._bonusPool);
            this._node.appendChild(round.node);
            let dice = createDice(HTMLDice, this._type, num);
            await round.play(dice);
            round.node.remove();
            num++;
        }
        this._outro();
        return true;
    }
    _outro() {
        super._outro();
        let s = this._board.getScore();
        this._board.showScore(s);
        const parent = document.querySelector("#score");
        parent.innerHTML = "";
        parent.appendChild(renderSingle(s));
    }
}
const V = "2.0";
function debug(msg, ...args) {
    console.debug(`[jsonrpc] ${msg}`, ...args);
}
function warn(msg, ...args) {
    console.warn(`[jsonrpc] ${msg}`, ...args);
}
function createErrorMessage(id, code, message, data) {
    let error = {
        code,
        message
    };
    if (data) {
        error.data = data;
    }
    return {
        id,
        error,
        jsonrpc: V
    };
}
function createResultMessage(id, result) {
    return {
        id,
        result,
        jsonrpc: V
    };
}
function createCallMessage(method, params, id) {
    let message = {
        method,
        params,
        jsonrpc: V
    };
    if (id) {
        message.id = id;
    }
    return message;
}
class JsonRpc {
    _io;
    _interface = new Map();
    _pendingPromises = new Map();
    _options = {
        log: false
    };
    constructor(_io1, options = {
    }){
        this._io = _io1;
        Object.assign(this._options, options);
        _io1.onData = (m)=>this._onData(m)
        ;
    }
    expose(name, method) {
        this._interface.set(name, method);
    }
    async call(method, params) {
        let id = Math.random().toString();
        let message = createCallMessage(method, params, id);
        return new Promise((resolve, reject)=>{
            this._pendingPromises.set(id, {
                resolve,
                reject
            });
            this._send(message);
        });
    }
    notify(method, params) {
        let message = createCallMessage(method, params);
        this._send(message);
    }
    _send(message) {
        const str = JSON.stringify(message);
        this._options.log && debug("sending", str);
        this._io.sendData(str);
    }
    _onData(str) {
        this._options.log && debug("received", str);
        let message;
        try {
            message = JSON.parse(str);
        } catch (e) {
            let reply = createErrorMessage(null, -32700, e.message);
            this._send(reply);
            return;
        }
        let reply;
        if (message instanceof Array) {
            let mapped = message.map((m)=>this._processMessage(m)
            ).filter((m)=>m
            );
            reply = mapped.length ? mapped : null;
        } else {
            reply = this._processMessage(message);
        }
        reply && this._send(reply);
    }
    _processMessage(message) {
        if ("method" in message) {
            const method = this._interface.get(message.method);
            if (!method) {
                return message.id ? createErrorMessage(message.id, -32601, "method not found") : null;
            }
            try {
                const result = message.params instanceof Array ? method(...message.params) : method(message.params);
                return message.id ? createResultMessage(message.id, result) : null;
            } catch (e) {
                this._options.log && warn("caught", e);
                return message.id ? createErrorMessage(message.id, -32000, e.message) : null;
            }
        } else if (message.id) {
            let promise = this._pendingPromises.get(message.id);
            if (!promise) {
                throw new Error(`Received a non-matching response id "${message.id}"`);
            }
            this._pendingPromises.delete(message.id);
            "error" in message ? promise.reject(message.error) : promise.resolve(message.result);
        } else {
            throw new Error("Received a non-call non-id JSON-RPC message");
        }
        return null;
    }
}
class MultiGame extends Game {
    _nodes = {
    };
    _rpc;
    _resolve;
    _progress = {
        key: "",
        game: "",
        player: ""
    };
    _wait = node1("p", {
        className: "wait",
        hidden: true
    });
    _currentScore = node1("span");
    constructor(board){
        super(board);
        const template = document.querySelector("template");
        [
            "setup",
            "lobby"
        ].forEach((id)=>{
            let node = template.content.querySelector(`#multi-${id}`);
            this._nodes[id] = node.cloneNode(true);
        });
        const setup = this._nodes["setup"];
        setup.querySelector("[name=join]").addEventListener("click", (_)=>this._joinOrCreate()
        );
        setup.querySelector("[name=continue]").addEventListener("click", (_)=>this._continue()
        );
        setup.querySelector("[name=create-normal]").addEventListener("click", (_)=>this._joinOrCreate("normal")
        );
        setup.querySelector("[name=create-lake]").addEventListener("click", (_)=>this._joinOrCreate("lake")
        );
        setup.querySelector("[name=create-forest]").addEventListener("click", (_)=>this._joinOrCreate("forest")
        );
        const lobby = this._nodes["lobby"];
        lobby.querySelector("button").addEventListener("click", (_)=>this._rpc.call("start-game", [])
        );
    }
    async play() {
        super.play();
        return new Promise((resolve)=>{
            this._resolve = resolve;
            this._setup();
        });
    }
    _setup() {
        const setup = this._nodes["setup"];
        this._node.innerHTML = "";
        this._node.appendChild(setup);
        [
            "player",
            "game"
        ].forEach((key)=>{
            let value = load(key);
            if (value === null) {
                return;
            }
            let input = setup.querySelector(`[name=${key}-name]`);
            input.value = value;
        });
        let cont = setup.querySelector(`[name=continue]`);
        cont.parentNode.hidden = load("progress") === null;
    }
    _onClose(e) {
        if (e.code != 0 && e.code != 1000 && e.code != 1001) {
            alert("Network connection closed");
        }
        this._resolve(false);
    }
    async _connectRPC() {
        const url = new URL(location.href).searchParams.get("url") || SERVER;
        const ws = await openWebSocket(url);
        const rpc = createRpc(ws);
        ws.addEventListener("close", (e)=>this._onClose(e)
        );
        rpc.expose("game-change", ()=>this._sync()
        );
        rpc.expose("game-destroy", ()=>{
            alert("The game has been cancelled");
            ws.close();
            this._resolve(false);
        });
        rpc.expose("game-over", (...players)=>{
            save("progress", null);
            this._outro();
            this._showScore(players);
            ws.close();
            this._resolve(true);
        });
        let quit = node1("button", {
        }, "Quit game");
        quit.addEventListener("click", async (_)=>{
            if (!confirm("Really quit the game?")) {
                return;
            }
            save("progress", null);
            await rpc.call("quit-game", []);
            ws.close();
            this._resolve(false);
        });
        this._bonusPool.node.appendChild(quit);
        this._rpc = rpc;
        return rpc;
    }
    async _joinOrCreate(type) {
        const setup = this._nodes["setup"];
        const buttons = setup.querySelectorAll("button");
        let playerName = setup.querySelector("[name=player-name]").value;
        if (!playerName) {
            return alert("Please provide your name");
        }
        let gameName = setup.querySelector("[name=game-name]").value;
        if (!gameName) {
            return alert("Please provide a game name");
        }
        save("player", playerName);
        save("game", gameName);
        buttons.forEach((b)=>b.disabled = true
        );
        try {
            const rpc = await this._connectRPC();
            let args = [
                gameName,
                playerName
            ];
            if (type) {
                args.unshift(type);
            }
            const key = await rpc.call(type ? "create-game" : "join-game", args);
            this._progress.player = playerName;
            this._progress.game = gameName;
            this._progress.key = key;
            this._enterLobby(type);
        } catch (e) {
            alert(e.message);
            this._resolve(false);
        } finally{
            buttons.forEach((b)=>b.disabled = false
            );
        }
    }
    async _continue() {
        const saved = JSON.parse(load("progress") || "");
        try {
            this._progress.player = saved.player;
            this._progress.game = saved.game;
            this._progress.key = saved.key;
            let rpc = await this._connectRPC();
            let state = await rpc.call("continue-game", [
                saved.game,
                saved.key
            ]);
            state.board && this._board.fromJSON(state.board);
            state.bonusPool && this._bonusPool.fromJSON(state.bonusPool);
            this._sync();
        } catch (e) {
            save("progress", null);
            alert(e.message);
            this._resolve(false);
        }
    }
    async _sync() {
        const response = await this._rpc.call("game-info", []);
        switch(response.state){
            case "starting":
                this._updateLobby(response.players);
                break;
            case "playing":
                this._updateRound(response);
                break;
        }
    }
    _enterLobby(type) {
        const lobby = this._nodes["lobby"];
        lobby.querySelector("button").disabled = !type;
        this._node.innerHTML = "";
        this._node.appendChild(lobby);
    }
    _updateLobby(players) {
        const lobby = this._nodes["lobby"];
        const list = lobby.querySelector("ul");
        list.innerHTML = "";
        players.forEach((p)=>{
            let item = node1("li", {
            }, p.name);
            list.appendChild(item);
        });
        const button = lobby.querySelector("button");
        button.textContent = button.disabled ? `Wait for ${players[0].name} to start the game` : "Start the game";
    }
    _updateRound(response) {
        let waiting = response.players.filter((p)=>!p.roundEnded
        ).length;
        let suffix = waiting > 1 ? "s" : "";
        this._wait.textContent = `Waiting for ${waiting} player${suffix} to end round. `;
        this._wait.appendChild(this._currentScore);
        const ended = response.players.filter((p)=>p.name == this._progress.player
        )[0].roundEnded;
        this._wait.hidden = !ended;
        const round = this._progress.round;
        if (round && round.number == response.round) {
            ended && round.end();
        } else {
            this._newRound(response, ended);
        }
        this._saveProgress();
    }
    async _newRound(response, ended) {
        const round = new MultiplayerRound(response.round, this._board, this._bonusPool);
        this._progress.round = round;
        this._node.innerHTML = "";
        this._node.appendChild(this._bonusPool.node);
        this._node.appendChild(round.node);
        this._node.appendChild(this._wait);
        let dice = response.dice.map((data)=>HTMLDice.fromJSON(data)
        );
        let promise = round.play(dice);
        if (ended) {
            round.end();
        } else {
            await promise;
            const state = {
                board: this._board.toJSON(),
                bonusPool: this._bonusPool.toJSON()
            };
            this._rpc.call("end-round", state);
            let button = node1("button", {
            }, "Show my current score");
            button.addEventListener("click", (_)=>{
                let s = this._board.getScore();
                this._currentScore.innerHTML = `My current score is <strong>${sum(s)}<strong>.`;
            });
            this._currentScore.innerHTML = "";
            this._currentScore.appendChild(button);
        }
    }
    _showScore(players) {
        let s = this._board.getScore();
        this._board.showScore(s);
        const parent = document.querySelector("#score");
        parent.innerHTML = "";
        let names = players.map((p)=>p.name
        );
        let boards = players.map((p)=>new BoardCanvas().fromJSON(p.board)
        );
        let scores = boards.map((b)=>b.getScore()
        );
        boards.forEach((b, i)=>b.showScore(scores[i])
        );
        const player = this._progress.player;
        function showByIndex(i) {
            showBoard(boards[i]);
        }
        parent.appendChild(renderMulti(names, scores, showByIndex, player));
    }
    _saveProgress() {
        const progress = {
            key: this._progress.key,
            game: this._progress.game,
            player: this._progress.player
        };
        save("progress", JSON.stringify(progress));
    }
}
class MultiplayerRound extends Round {
    play(dice) {
        try {
            navigator.vibrate(200);
        } catch (e) {
        }
        return super.play(dice);
    }
    end() {
        this._endButton.disabled = true;
        this._pool.remaining.forEach((d)=>this._pool.disable(d)
        );
    }
    _end() {
        super._end();
        this.end();
    }
}
function createRpc(ws) {
    let io = {
        onData (_s) {
        },
        sendData (s) {
            ws.send(s);
        }
    };
    ws.addEventListener("message", (e)=>io.onData(e.data)
    );
    return new JsonRpc(io);
}
function openWebSocket(url) {
    const ws = new WebSocket(url);
    return new Promise((resolve, reject)=>{
        ws.addEventListener("open", (e)=>resolve(e.target)
        );
        ws.addEventListener("error", (_)=>reject(new Error("Cannot connect to server"))
        );
    });
}
function save(key, value) {
    key = `rri-${key}`;
    try {
        value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value);
    } catch (e) {
        console.warn(e);
    }
}
function load(key) {
    try {
        return localStorage.getItem(`rri-${key}`);
    } catch (e) {
        console.warn(e);
        return null;
    }
}
const dataset1 = document.body.dataset;
let board1;
function download() {
    if (!board1.blob) {
        return;
    }
    const href = URL.createObjectURL(board1.blob);
    let a = node1("a", {
        href,
        download: "railroad-ink.png"
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
}
function goIntro() {
    dataset1.stage = "intro";
    board1 = new BoardCanvas();
    showBoard(board1);
}
async function goGame(type) {
    const game = type == "multi" ? new MultiGame(board1) : new SingleGame(board1, type);
    let played = await game.play();
    if (!played) {
        goIntro();
    }
}
function onClick(name, cb) {
    document.querySelector(`[name=${name}]`).addEventListener("click", cb);
}
function init() {
    onClick("start-normal", ()=>goGame("normal")
    );
    onClick("start-lake", ()=>goGame("lake")
    );
    onClick("start-forest", ()=>goGame("forest")
    );
    onClick("start-multi", ()=>goGame("multi")
    );
    onClick("again", ()=>goIntro()
    );
    onClick("download", ()=>download()
    );
    goIntro();
}
init();

