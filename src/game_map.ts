interface UnitPositions {
    [index: string]: SpecificUnitStatic[];
}

interface HexStruct {
    cube: Cube;
    key: string;
    node: D3.Selection;
    tileType: TileType;
}

class GameMap {
    width: number;
    height: number;
    bytecode: string;
    initialUnits: UnitPositions;
    townReinforcements: UnitPositions;

    static drawMap(map: GameMap): D3.Selection {
        var shape = Grid.trapezoidalShape(0, map.width, 0, map.height, Grid.oddQToCube)
        var diagram = new Diagram(d3.select('#map'), shape).update(40, 0);

        diagram.tiles
            .append('image')
            .attr('y', '-32px')
            .attr('x', '-24px')
            .attr('width', '48px')
            .attr('height', '48px')
        ;

        diagram.tiles
            .append('rect')
            .attr('y', '0px')
            .attr('x', '-3px')
            .attr('width', '18px')
            .attr('height', '18px')
            .style('fill', 'black')
        ;

        diagram.tiles
            .append('text')
            .attr('y', '14px')
            .attr('x', '6px')
        ;

        var tilesByCube = {};
        diagram.tiles.each(function(tile){
            tilesByCube[tile.cube.toString()] = tile;
        });

        var x = 0, y = 0, z = map.height + 1;
        for(var index = 0; index < map.bytecode.length; index++) {
            if(map.bytecode[index] == "\n"){
                x++;
                if(x%2 == 0) {
                    z = map.height + (-x/2 + 1);
                } else {
                    z = map.height + (-x+3)/2;
                }
            } else {
                z--;
            }
            y = 0-x-z;

            var cube = new Cube(x, y, z);
            var tile: HexStruct = tilesByCube[cube.toString()];
            if(tile == null) { continue; };

            switch(map.bytecode[index]){
                case "1": tile.tileType = TileType.Forest; break;
                case "2": tile.tileType = TileType.Port; break;
                case "3": tile.tileType = TileType.Road; break;
                case "4": tile.tileType = TileType.Town; break;
                case "5": tile.tileType = TileType.RebelCamp; break;
                case "6": tile.tileType = TileType.Castle; break;
                case "7": tile.tileType = TileType.Water; break;
                default: tile.tileType = TileType.None;
            }
        }

        diagram.tiles
           .classed('forest', function(d) { return d.tileType == TileType.Forest; })
           .classed('rebel-camp', function(d) { return d.tileType == TileType.RebelCamp; })
           .classed('road', function(d) { return d.tileType == TileType.Road; })
           .classed('town', function(d) { return d.tileType == TileType.Town; })
           .classed('port', function(d) { return d.tileType == TileType.Port; })
           .classed('castle', function(d) { return d.tileType == TileType.Castle; })
           .classed('water', function(d) { return d.tileType == TileType.Water; })
        ;

        return diagram.tiles;
    }
}
