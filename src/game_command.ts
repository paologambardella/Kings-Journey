interface GameCommand {
    command: string;
    turn: number;
    args: any[];
}

// GameCommands are created without an `id` but they receive one from the server when they are
// persisted.
interface PersistedGameCommand extends GameCommand {
    id: number;
}
