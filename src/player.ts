enum Side {
    None,
    Rebel,
    Imperial,
}

interface Player {
    name: string;
    side: Side;
    canInspectOpponent: boolean;
}
