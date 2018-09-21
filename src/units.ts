enum UnitType {
    None,
    Rebel,
    TrainedRebel,
    Archer,
    Knight,
    Guard,
    King,
}

class Unit {
    node: D3.Selection;
    movementPoints = MaxMovementPoints;
    hex = null;

    private static idAllocator = new IdAllocator();
    private static index: {[id: number]: Unit} = {};

    id: number;

    static register(unit: Unit) {
        if(!unit.id) {
            unit.id = this.idAllocator.nextId();
        }
        this.index[unit.id] = unit;
    }

    static fetch(id: number): Unit {
        return this.index[id];
    }

    static each(f: (u: Unit) => void) {
        _.each(_.values(this.index), f);
    }

    constructor(
        public side = Side.None,
        public type = UnitType.None,
        public name = "Nothing",
        public firstAttack = 0,
        public secondAttack = 0,
        public defense = 0,
        public threat = 0
    ) {
        console.debug("Creating new Unit...");
        this.id = Unit.idAllocator.nextId();
    }

    canReachHex(targetHex: Hex): boolean {
        if(this.movementPoints < targetHex.distance){
            // Assumes that the hex.distance has been calculated.
            return false;
        } else {
            return this.canTraverseHex(targetHex);
        }
    }

    canTraverseHex(targetHex: Hex): boolean {
        if(targetHex.tileType == TileType.Water){
            return false;
        } else if(this.side == Side.Imperial && targetHex.tileType == TileType.RebelCamp){
            return false;
        } else if(this.side == Side.Rebel && targetHex.tileType == TileType.Town){
            return false;
        } else if(this.side == Side.Rebel && targetHex.tileType == TileType.Castle){
            return false;
        } else {
            return true;
        }
    }

    canMoveToHex(targetHex: Hex): boolean {
        if(!this.canReachHex(targetHex)){
            return false;
        } else if(targetHex.side() != Side.None && targetHex.side() != this.side){
            return false;
        } else {
            return true;
        }
    }

    canAttackHex(targetHex: Hex): boolean {
        if(!this.canReachHex(targetHex)){
            return false;
        } else if(targetHex.side() != Side.None && targetHex.side() != this.side){
            return true;
        } else {
            return false;
        }
    }
}

interface SpecificUnitStatic {
    new (): Unit;
}

class Rebel extends Unit {
    constructor() {
        super(Side.Rebel, UnitType.Rebel, "Rebel", 0, 1, 2, 1);
    }
}

class TrainedRebel extends Unit {
    constructor() {
        super(Side.Rebel, UnitType.TrainedRebel, "Trained Rebel", 0, 3, 2, 2);
    }
}

class Archer extends Unit {
    constructor() {
        super(Side.Imperial, UnitType.Archer, "Archer", 2, 0, 1, 3);
    }
}

class Knight extends Unit {
    constructor() {
        super(Side.Imperial, UnitType.Knight, "Knight", 0, 4, 3, 2);
    }
}

class Guard extends Unit {
    constructor() {
        super(Side.Imperial, UnitType.Guard, "Guard", 0, 1, 3, 1);
    }
}

class King extends Unit {
    constructor() {
        super(Side.Imperial, UnitType.King, "King", 0, 0, 0, 0);
    }
}
