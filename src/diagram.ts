interface DiagramNode {
    cube: Cube;
    key: string;
}

/* A grid diagram will be an object with
   1. nodes = { cube: Cube object, key: string, node: d3 selection of <g> containing polygon }
   2. grid = Grid object
   3. root = d3 selection of root <g> of diagram
   4. polygons = d3 selection of the hexagons inside the <g> per tile
   5. update = function(scale, orientation) to call any time orientation changes, including initialization
   6. onLayout = callback function that will be called before an update (to assign new cube coordinates)
      - this will be called immediately on update
   7. onUpdate = callback function that will be called after an update
      - this will be called after a delay, and only if there hasn't been another update
      - since it may not be called, this function should only affect the visuals and not data
*/
class Diagram {
    nodes: DiagramNode[];
    root: D3.Selection;
    tiles: D3.UpdateSelection;
    polygons: D3.Selection;
    scale: number;
    orientation: number;
    grid: Grid;
    translate: ScreenCoordinate;

    private pre_callbacks = [];
    private post_callbacks = [];

    constructor(private svg: D3.Selection, cubes: Cube[]) {
        this.nodes = cubes.map(function(n) { return {cube: n, key: n.toString()}; });
        this.root = svg.append('g');
        this.tiles = this.root.selectAll("g.tile")
            .data(this.nodes, function(node: DiagramNode) { return node.key; });

        this.tiles.enter()
            .append('g').attr('class', "tile")
            .each(function(d) { d.node = d3.select(this); });

        this.polygons = this.tiles.append('polygon');
    }

    onLayout(callback) {
        this.pre_callbacks.push(callback);
    }

    onUpdate(callback) {
        this.post_callbacks.push(callback);
    }

    update(scale: number, orientation: number) {
        this.scale = scale;
        this.orientation = orientation;

        this.pre_callbacks.forEach(function (f) { f(); });
        var grid = new Grid(scale, orientation, this.nodes.map(function(node) { return node.cube; }));
        var bounds = grid.bounds();
        this.grid = grid;
        var hexagon_points = this.makeHexagonShape(scale, orientation);

        this.translate = new ScreenCoordinate(
            (parseFloat(this.svg.attr('width')) - bounds.minX - bounds.maxX)/2,
            (parseFloat(this.svg.attr('height')) - bounds.minY - bounds.maxY)/2
        );
        this.root
          .attr('transform', "translate(" + this.translate + ")")
          .transition().duration(200);

        this.tiles
          .attr('transform', function(node) {
              var center = grid.hexToCenter(node.cube);
              return "translate(" + center.x + "," + center.y + ")";
          })
          .transition().duration(200);

        this.polygons
          .attr('points', hexagon_points)
          .transition().duration(200);

        this.post_callbacks.forEach(function (f) { f(); });

        return this;
    }

    // (x, y) should be the center
    // scale should be the distance from corner to corner
    // orientation should be 0 (flat bottom hex) or 1 (flat side hex)
    private hexToPolygon(scale: number, x: number, y: number, orientation: number) {
        // NOTE: the article says to use angles 0..300 or 30..330 (e.g. I
        // add 30 degrees for pointy top) but I instead use -30..270
        // (e.g. I subtract 30 degrees for pointy top) because it better
        // matches the animations I needed for my diagrams. They're
        // equivalent.
        var points = [];
        for (var i = 0; i < 6; i++) {
            var angle = 2 * Math.PI * (2*i - orientation) / 12;
            points.push(new ScreenCoordinate(x + 0.5 * scale * Math.cos(angle),
                                             y + 0.5 * scale * Math.sin(angle)));
        }
        return points;
    }

    // The shape of a hexagon is fixed by the scale and orientation
    private makeHexagonShape(scale: number, orientation: number) {
        var points = this.hexToPolygon(scale, 0, 0, orientation);
        var svg_coord = "";
        points.forEach(function(p) {
            svg_coord += p + " ";
        });
        return svg_coord;
    }
}
