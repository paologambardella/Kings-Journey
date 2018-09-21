class UnitGroup {
    private unsortedUnits: Unit[];
    private _hex: Hex;

    get units(): Unit[] {
        return this.unsortedUnits.sort((a: Unit, b: Unit): number => {
            // sort by threat DESC and the by id ASC
            return b.threat - a.threat || a.id - b.id;
        })
    }
    set units(value: Unit[]) {
        this.unsortedUnits = value;
    }

    get hex(): Hex {
        return this._hex;
    }
    set hex(value: Hex) {
        this._hex = value;
        _.each(this.unsortedUnits, (unit: Unit) => {
            unit.hex = this._hex;
        })
    }

    get minMovementPoints(): number {
        return _.min(
            _.map(this.unsortedUnits, (unit: Unit) => {
                return unit.movementPoints
            })
        )
    }

    private static idAllocator = new IdAllocator();
    private static index: {[id: number]: UnitGroup} = {};

    id: number;

    static register(group: UnitGroup) {
        if(!group.id) {
            group.id = this.idAllocator.nextId();
        }
        this.index[group.id] = group;
    }

    static fetch(id: number): UnitGroup {
        return this.index[id];
    }

    constructor(hex: Hex) {
        console.debug("Creating new UnitGroup...");
        this.unsortedUnits = [];
        this._hex = hex;
    }

    isEmpty(): boolean {
        return this.unsortedUnits.length == 0;
    }

    onlyHasKing(): boolean {
        return this.unsortedUnits.length == 1 && this.hasKing();
    }

    hasKing(): boolean {
        return _.any(this.unsortedUnits, (unit: Unit) => {
            return unit.type == UnitType.King;
        });
    }

    consumeMovementPoints(movementPoints: number) {
        _.each(this.unsortedUnits, (unit: Unit) => {
            unit.movementPoints -= movementPoints;

            if(unit.movementPoints < 0) {
                console.error("Movement points for unit#"+ unit.id +" dropped below zero!");
            }
        });
    }

    depleteMovementPoints() {
        _.each(this.unsortedUnits, (unit: Unit) => {
            unit.movementPoints = 0;
        });
    }

    side(): Side {
        if (this.isEmpty()) {
            return Side.None;
        } else {
            // Assuming that all units are on the same side.
            return this.unsortedUnits[0].side;
        }
    }

    totalDamage(attackPhase: string): number {
        var _sumAttack = function(total, unit) {
            return total + unit[attackPhase]
        };

        return _.reduce(this.unsortedUnits, _sumAttack, 0);
    }

    removeUnit(unit: Unit) {
        this.unsortedUnits.splice(this.unsortedUnits.indexOf(unit), 1);

        // Garbage collection
        unit.hex = null;
        // TODO remove unit from `Game.unitsById` dictionary
    }

    addUnit(unit: Unit) {
        this.unsortedUnits.push(unit);
        unit.hex = this._hex;
    }

    moveUnitsTo(otherGroup: UnitGroup) {
        while(!this.isEmpty()) {
            var unit = this.unsortedUnits[0];
            this.removeUnit(unit);
            otherGroup.addUnit(unit);
        }
    }

    // Returns a UnitGroup that is "floating". This means that while the UnitGroup belongs to a Hex,
    // that Hex does not have a link to the UnitGroup.
    splitSubGroup(units: Unit[], exclusive = true): UnitGroup {
        if(this.unsortedUnits.length == units.length) {
            if(exclusive) {
                this.hex.unitsGroup = null;
            }
            return this;
        }

        var subGroup = new UnitGroup(this.hex);

        _.each(units, (unit: Unit) => {
            if(exclusive) {
                this.removeUnit(unit);
            }
            subGroup.addUnit(unit);
        });

        return subGroup;
    }

    static merge(groupA: UnitGroup, groupB: UnitGroup): UnitGroup {
        if(groupA.hex != groupB.hex) {
            console.error("Can't merge groups from different hexes: "+ groupA.id +" & "+ groupB.id);
            return;
        }

        var hex = groupA.hex;
        var newGroup = new UnitGroup(hex);

        hex.unitsGroup = newGroup;

        groupA.moveUnitsTo(newGroup);
        groupB.moveUnitsTo(newGroup);

        return newGroup;
    }

    canReachHex(targetHex): boolean {
        return _.every(this.unsortedUnits, (unit: Unit) => {
            return unit.canReachHex(targetHex);
        })
    }

    canTraverseHex(targetHex): boolean {
        return _.every(this.unsortedUnits, (unit: Unit) => {
            return unit.canTraverseHex(targetHex);
        })
    }

    canMoveToHex(targetHex): boolean {
        return _.every(this.unsortedUnits, (unit: Unit) => {
            return unit.canMoveToHex(targetHex);
        })
    }

    canAttackHex(targetHex): boolean {
        return _.every(this.unsortedUnits, (unit: Unit) => {
            return unit.canAttackHex(targetHex);
        })
    }
}
