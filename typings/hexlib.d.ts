declare class Cube {
    constructor(x: number, y: number, z: number);
    add(other: Cube): Cube;
}

declare class Grid {
    constructor(scale: number, orientation: number, cubes: Cube[]);
    bounds();
    hexToCenter(cube: Cube);
    static trapezoidalShape(x: number, width: number, y: number, height: number, orientation: any)
    static oddQToCube;
}

declare class ScreenCoordinate {
    constructor(x: number, y: number);
}
