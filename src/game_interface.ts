enum GameState {
    InProgress,
    ImperialsWon,
    RebelsWon,
}

interface GameInterface {
    turnNumber: number;
    currentPlayer: Player;
    tiles: D3.Selection;
    gameState: GameState;

    // Queries
    nextPlayer(): Player;
    possibleMoves(group: UnitGroup): Hex[];

    // Commands
    moveGroupToHex(group: UnitGroup, targetHex: Hex): void;
    resolveCombat(combat: Combat): CombatResultType;
    nextTurn(): void;
    splitGroup(originalGroup: UnitGroup, units: Unit[]): UnitGroup;

    // Utility
    waitForControl(endCallback: () => void, eachCallback: () => void): void;
}
