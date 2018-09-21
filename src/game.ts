class Game implements GameInterface {
    private players: Player[] = [
        {name: "ImperialPlayer", side: Side.Imperial, canInspectOpponent: true},
        {name: "RebelPlayer",    side: Side.Rebel,    canInspectOpponent: false},
    ];

    private imperialUnitConstructors: SpecificUnitStatic[] = [
        Archer,
        Knight,
        Guard,
    ];

    private hexes: Hex[];
    private townReinforcements: UnitPositions;
    private _gameState = GameState.InProgress;

    get gameState(): GameState {
        return this._gameState;
    }

    turnNumber = 1;
    currentPlayer: Player;
    mySide: Side;
    tiles: D3.Selection;

    constructor(map: GameMap) {
        var self = this;

        // Imperials play first.
        this.currentPlayer = this.players[0];

        this.townReinforcements = map.townReinforcements;

        this.tiles = GameMap.drawMap(map);

        this.hexes = _.map(this.tiles.data(), (hexStruct: HexStruct) => {
            var hex = new Hex(hexStruct);
            Hex.register(hex);

            return hex;
        });
        this.tiles.data(this.hexes);

        this.produceInitialUnits(map.initialUnits);
        this.produceAndUpgradeRebels();
    }

    nextPlayer(): Player {
        var index = this.players.indexOf(this.currentPlayer);
        return this.players[index+1] || this.players[0];
    }

    nextTurn(): void {
        console.info("New turn!!!")

        if(this.currentPlayer.side == Side.Rebel) {
            // End of Rebels' turn
            this.produceAndUpgradeRebels();
        };
        this.currentPlayer = this.nextPlayer();

        // Replenish all units' movementPoints.
        Unit.each((unit: Unit) => {
            unit.movementPoints = MaxMovementPoints;
        });

        this.turnNumber++;
    }

    moveGroupToHex(subGroup: UnitGroup, targetHex: Hex): void {
        if(subGroup.side() != this.currentPlayer.side) {
            return;
        }

        var previousHex = subGroup.hex;
        this.calculateDistances(subGroup);

        if(!subGroup.canMoveToHex(targetHex)) {
            console.error("Can't move.");
            return;
        };

        // All ok, we can move
        subGroup.hex = targetHex;
        if(previousHex.unitsGroup == subGroup) {
            previousHex.unitsGroup = null;
        }

        subGroup.consumeMovementPoints(targetHex.distance);
        subGroup = this.placeGroupToHex(subGroup, targetHex);

        if(subGroup.hasKing() && targetHex.tileType == TileType.Castle) {
            this._gameState = GameState.ImperialsWon;
            return;
        }

        if(targetHex.canProduceReinforcements() && subGroup.side() == Side.Imperial){
            this.produceReinforcements(targetHex);
            return;
        };

        return;
    }

    private placeGroupToHex(group: UnitGroup, hex: Hex): UnitGroup {
        var placedGroup: UnitGroup;

        if(group.hex != hex && group.hex.unitsGroup == group) {
            hex.unitsGroup = null;
        }

        if(hex.unitsGroup) {
            placedGroup = UnitGroup.merge(group, hex.unitsGroup);
            UnitGroup.register(placedGroup);
        } else {
            placedGroup = group;
        }

        placedGroup.hex = hex;
        hex.unitsGroup = placedGroup;

        return placedGroup;
    }

    possibleMoves(group: UnitGroup): Hex[] {
        if(group.isEmpty()) { return []; }

        var hexesWithinDistance = this.calculateDistances(group);

        // Select the hexes that every unit can move to or attack.
        var self = this;
        return _.select(hexesWithinDistance, function(hex){
            return group.canReachHex(hex);
        });
    }

    splitGroup(originalGroup: UnitGroup, units: Unit[]): UnitGroup {
        var subGroup = originalGroup.splitSubGroup(units);
        UnitGroup.register(subGroup);

        return subGroup;
    }

    // TODO combat should only be possible between adjacent hexes
    resolveCombat(combat: Combat): CombatResultType {
        var targetHex = combat.defendHex;
        if(!_.contains(this.possibleMoves(combat.attackGroup), combat.defendHex)) {
            console.error("Can't attack a hex that you can't move to.")
            return;
        }

        console.debug("Combat at turn "+ this.turnNumber +":");
        var resolution = combat.resolve();

        combat.attackGroup.depleteMovementPoints();

        if(resolution == CombatResultType.AttackerSuccess) {
            // Occupy the target Hex.
            this.placeGroupToHex(combat.attackGroup, targetHex);
        } else {
            // Place attackGroup back to its Hex.
            this.placeGroupToHex(combat.attackGroup, combat.attackGroup.hex);
        }

        if(resolution == CombatResultType.KingCaptured) {
            this._gameState = GameState.RebelsWon;
        }

        return resolution;
    }

    // The local game never waits for control. This is handled by the GameProxy
    waitForControl(): void {
        console.error("The local game does not know about control.")
    }

    private produceInitialUnits(initialUnits: UnitPositions) {
        var self = this;

        _.each(initialUnits, function(unitConstructors, cubeString) {
            var hex: Hex = Hex.fetch(cubeString);

            _.each(_.values(unitConstructors), function(unitConstructor: SpecificUnitStatic) {
                self.createUnitInHex(unitConstructor, hex);
            })
        });
    }

    private produceAndUpgradeRebels(): void {
        var self = this;
        _.each(this.hexes, function(hex: Hex) {
            if(hex.tileType == TileType.RebelCamp) {
                var upgradableUnit;

                if(hex.unitsGroup) {
                    upgradableUnit = _.find(hex.unitsGroup.units, function(unit: Unit){
                        return unit.type == UnitType.Rebel;
                    });
                }

                if(upgradableUnit) {
                    // Upgrade to Trained Rebel
                    hex.unitsGroup.removeUnit(upgradableUnit);
                    self.createUnitInHex(TrainedRebel, hex);
                } else {
                    // Produce new Rebel
                    self.createUnitInHex(Rebel, hex);
                }
            };
        });
    }

    private produceReinforcements(hex: Hex): void {
        var reinforcements = this.townReinforcements[hex.cube.toString()];

        _.each(reinforcements, (unitConstructor) => {
            this.createUnitInHex(unitConstructor, hex);
        });

        // Newly created reinforcements & units that triggered them should be depleted.
        hex.unitsGroup.depleteMovementPoints();

        // The hex is now depleted. It cannot produce any more reinforcements.
        // TODO change to a hex property.
        hex.node.classed('depleted', true);
    };

    private createUnitInHex(unitConstructor: SpecificUnitStatic, hex: Hex): void {
        var newUnit = new unitConstructor();
        Unit.register(newUnit);

        if(!hex.unitsGroup) {
            // TODO extract to own method.
            var group = new UnitGroup(hex);
            UnitGroup.register(group);
            hex.unitsGroup = group;
        }

        hex.unitsGroup.addUnit(newUnit);
    }

    private enemySides(sideA: Side, sideB: Side): boolean {
        if(sideA == Side.None) {
            return false;
        } else if(sideB == Side.None) {
            return false;
        } else if(sideA == sideB) {
            return false;
        } else {
            return true;
        }
    }

    private calculateDistances(group: UnitGroup): Hex[] {
        var startHex = group.hex;
        var maxDistance = group.minMovementPoints;

        _.each(this.hexes, (hex: Hex) => {
            hex.distance = Infinity;
        });
        startHex.distance = 0;

        // `hexes` contains the hexes we have calculated AND fall within the `maxDistance`
        var hexes = [startHex];

        for(var i = 0; i < hexes.length; i++) {
            var tempStartHex = hexes[i];

            // Neighbors of a `maxDistance` Hex can only be further.
            if (tempStartHex.distance == maxDistance) continue;

            _.each(tempStartHex.neighboringHexes, (hex: Hex) => {
                if (!group.canTraverseHex(hex)) {
                    // Can't move here, the distance remains `Infinity`.
                } else if (this.enemySides(hex.side(), group.side())) {
                    // Enemy hexes are for combat and after combat there is no move.
                    // Also, no need to calculate the neighbors of these ones.
                    hex.distance = maxDistance;
                    hexes.push(hex);
                } else {
                    var newDistance = tempStartHex.distance + Hex.neighborDistance(tempStartHex, hex);

                    if(newDistance < hex.distance){
                        hex.distance = newDistance;
                    }

                    // We assume that backtracking is not cheaper than the straight path.
                    // TODO instead of checking if the `hex` is in the `hexes`, remove it and
                    // re-add it to recalculate its neighbors as well. Beware of infinite loops.
                    if(
                        hex.distance <= maxDistance &&
                        !_.contains(hexes, hex)
                    ){
                        // The neighbors of this hex will be calculated for distance.
                        hexes.push(hex);
                    }
                }
            });
        }

        return hexes;
    }
}
