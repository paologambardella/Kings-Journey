var PollingTimeout = 3000; // 3sec

class GameProxy implements GameInterface {
    private lastCommandId = 0; // assuming the ids start at 1

    constructor(private game: Game, private server: Server) {}

    get turnNumber(): number {
        return this.game.turnNumber;
    }

    get currentPlayer(): Player {
        return this.game.currentPlayer;
    }

    get tiles(): D3.Selection {
        return this.game.tiles;
    }

    get gameState(): GameState {
        return this.game.gameState;
    }

    // Queries
    nextPlayer(): Player {
        return this.game.nextPlayer();
    }

    possibleMoves(group: UnitGroup): Hex[] {
        return this.game.possibleMoves(group);
    }

    // Commands
    moveGroupToHex(group: UnitGroup, hex: Hex): void {
        var commandObject: GameCommand = {
            command: "moveGroupToHex",
            turn: this.turnNumber,
            args: [group.id, hex.cube.toString()],
        };

        this.server.sendCommand(commandObject);
        this.executeCommand(commandObject);
        this.maybeSendGameOver();
    }

    resolveCombat(combat: Combat): CombatResultType {
        var commandObject: GameCommand = {
            command: "resolveCombat",
            turn: this.turnNumber,
            args: [combat.attackGroup.id, combat.defendGroup.id],
        };

        this.server.sendCommand(commandObject);
        var result = this.executeCommand(commandObject);
        this.maybeSendGameOver();

        return result;
    }

    splitGroup(originalGroup: UnitGroup, units: Unit[]): UnitGroup {
        var commandObject: GameCommand = {
            command: "splitGroup",
            turn: this.turnNumber,
            args: [originalGroup.id, _.map(units, (unit: Unit) => { return unit.id; })],
        };

        this.server.sendCommand(commandObject);

        return this.executeCommand(commandObject);
    }

    nextTurn(): void {
        var commandObject: GameCommand = {
            command: "nextTurn",
            turn: this.turnNumber,
            args: [],
        };

        this.server.sendCommand(commandObject);

        return this.executeCommand(commandObject);
    }

    waitForControl(endCallback: () => void, eachCallback: () => void): void {
        this.waitForCompleteTurn(endCallback, eachCallback);
    }

    replay(endCallback: () => void, untilTurn: any): void {
        this.server.getCommands(this.turnNumber, (data: PersistedGameCommand[]) => {
            console.info("Replaying turn#"+ this.turnNumber +".");
            _.each(data, (command) => {
                this.executeNewCommand(command);
            });

            if(this.isCompleteTurn(data)) {
                var lastCommand = data[data.length - 1];

                if(lastCommand.command != "gameOver" && this.turnNumber != untilTurn) {
                    this.replay(endCallback, untilTurn);
                } else {
                    console.info("Done replaying.");
                    endCallback();
                }
            } else {
                console.info("Done replaying.");
                endCallback();
            }
        });
    }

    private isCompleteTurn(commands: GameCommand[]): boolean {
        var lastCommand = commands[commands.length-1];

        return lastCommand && _.contains(["nextTurn", "gameOver"], lastCommand.command);
    }

    private waitForCompleteTurn(endCallback: () => void, eachCallback: () => void): void {
        this.server.getCommands(this.turnNumber, (data: PersistedGameCommand[]) => {
            _.each(data, (command) => {
                this.executeNewCommand(command);
            })
            eachCallback();

            if(this.isCompleteTurn(data)) {
                endCallback();
            } else {
                setTimeout(() => {
                    this.waitForCompleteTurn(endCallback, eachCallback);
                }, PollingTimeout);
            }
        });
    }

    // Assumes that command ids are auto incrementing and that they are received in ascending order.
    // TODO find a better heuristic for this. Maybe a timestamp. Maybe implement a buffer.
    private executeNewCommand(command: PersistedGameCommand): void {
        if(command.id > this.lastCommandId) {
            this.executeCommand(command);
            this.lastCommandId = command.id;
        }
    }

    private executeCommand(command: GameCommand): any {
        var result;
        console.debug(
            "executing command: "+ command.command + "("+ JSON.stringify(command.args) +")"
        );

        switch(command.command) {
            case "moveGroupToHex":
                var group = UnitGroup.fetch(command.args[0]);
                var hex = Hex.fetch(command.args[1]);

                this.game.moveGroupToHex(group, hex);
                break;
            case "resolveCombat":
                var attackGroup = UnitGroup.fetch(command.args[0]);
                var defendGroup = UnitGroup.fetch(command.args[1]);
                var combat = new Combat(attackGroup, defendGroup);

                result = this.game.resolveCombat(combat);
                break;
            case "splitGroup":
                var originalGroup = UnitGroup.fetch(command.args[0]);
                var units: Unit[] = _.map(command.args[1], (id: number) => {
                    return Unit.fetch(id);
                });

                result = this.game.splitGroup(originalGroup, units);
                break;
            case "nextTurn":
                result = this.game.nextTurn();
                break;
            case "gameOver":
                break;
            default:
                console.error("Unknown command:");
                console.error(command);
        }

        return result
    }

    private maybeSendGameOver() {
        if(this.gameState != GameState.InProgress) {
            var gameOver: GameCommand = {
                command: "gameOver",
                turn: this.turnNumber,
                args: [],
            }

            this.server.sendCommand(gameOver);
        }
    }
}
