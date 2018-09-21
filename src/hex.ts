enum TileType {
    None,
    Port,
    Road,
    Town,
    RebelCamp,
    Castle,
    Water,
    Forest,
}

class Hex implements HexStruct {
    cube: Cube;
    node: D3.Selection;
    key: string;
    tileType: TileType;

    distance: number;
    unitsGroup: UnitGroup; // optional

    private _neighboringHexes: Hex[];

    private static idAllocator = new IdAllocator();
    private static index: {[cube: string]: Hex} = {};

    static register(hex: Hex) {
        this.index[hex.cube.toString()] = hex;
    }

    static fetch(cubeString: string): Hex {
        return this.index[cubeString];
    }

    private static neighborOffsetCubes: Cube[] = [
        new Cube(+1, -1,  0), new Cube(+1,  0, -1), new Cube( 0, +1, -1),
        new Cube(-1, +1,  0), new Cube(-1,  0, +1), new Cube( 0, -1, +1)
    ];

    static neighboringCubes(cube: Cube): Cube[] {
        return _.map(Hex.neighborOffsetCubes, function(offsetCube: Cube){
            return cube.add(offsetCube);
        });
    }

    static connectedHexes(hexA: Hex, hexB: Hex): boolean {
        if(hexA.tileType == TileType.Port && hexB.tileType == TileType.Port) {
            return true;
        } else {
            return false;
        }
    }

    private static neighboringHexes(hex: Hex, previousNeighbors?: Hex[]): Hex[] {
        var neighboringHexes = previousNeighbors || [];

        _.each(Hex.neighboringCubes(hex.cube), function(cube: Cube){
            var neighboringHex: Hex = Hex.fetch(cube.toString());

            // Might be a null at edge of map.
            if(neighboringHex) {
                if(_.contains(neighboringHexes, neighboringHex)) {
                    // No need to add it again.
                } else if(Hex.connectedHexes(neighboringHex, hex)) {
                    // Neighboring Port tiles are connected with each other.
                    neighboringHexes = Hex.neighboringHexes(
                        neighboringHex,
                        neighboringHexes.concat(hex)
                    );
                    neighboringHexes = _.uniq(neighboringHexes);
                    neighboringHexes = _.without(neighboringHexes, hex);
                } else {
                    neighboringHexes.push(neighboringHex);
                }
            }
        });

        return neighboringHexes;
    }

    // `neighborDistance` function assumes that `hexA` and `hexB` are neighbors.
    // TODO add pre-condition to code
    static neighborDistance(hexA: Hex, hexB: Hex): number {
        var hexTypes = d3.set([hexA.tileType, hexB.tileType]);

        if(hexTypes.size() == 1 && hexTypes.has(TileType.Road)){
            return ShortcutCost;
        } else if(hexTypes.has(TileType.Road) && hexTypes.has(TileType.Town)){
            return ShortcutCost;
        } else if(hexTypes.has(TileType.Road) && hexTypes.has(TileType.Port)){
            return ShortcutCost;
        } else if(hexTypes.has(TileType.Forest)){
            return DoubleMoveCost;
        } else {
            return FullMoveCost;
        }
    }

    constructor(struct: HexStruct) {
        this.cube = struct.cube;
        this.node = struct.node;
        this.key = struct.key;
        this.tileType = struct.tileType;
    }

    get neighboringHexes(): Hex[] {
        if(this._neighboringHexes == null) {
            this._neighboringHexes = Hex.neighboringHexes(this);
        }

        return this._neighboringHexes;
    }

    side(): Side {
        return this.unitsGroup != null ? this.unitsGroup.side() : Side.None;
    }

    unitsCount(): number {
        return this.unitsGroup != null ? this.unitsGroup.units.length : 0;
    }

    isEmpty(): boolean {
        return this.unitsGroup != null ? this.unitsGroup.isEmpty() : true;
    }

    canProduceReinforcements(): boolean {
        // TODO check some property instead of node's class.
        return this.tileType == TileType.Town && !this.node.classed('depleted');
    }
}
