class Server {
    private sendQueue: GameCommand[];
    private sending = false;

    constructor(private gameId: number) {
        console.debug("Join game #" + gameId);

        this.sendQueue = [];
    }

    get commandsUrl(): string {
        return "/games/"+ this.gameId +"/commands";
    }

    sendCommand(commandObject: GameCommand) {
        this.sendQueue.push(commandObject);
        this.sendCommandFromQueue();
    }

    private sendCommandFromQueue() {
        if(this.sending) {
            // Busy, try again later...
            setTimeout(() => {
                console.debug("Waiting to send command...");
                this.sendCommandFromQueue();
            }, 100);
            return;
        }

        this.sending = true;
        var commandObject = this.sendQueue.shift();
        var json = JSON.stringify(commandObject);
        console.debug(json);

        $.post(this.commandsUrl, {command: json}, (data) => {
            console.debug(data);
            this.sending = false;
        });
    }

    getCommands(turn: number, callback: (data: GameCommand[]) => void): void {
        $.getJSON(this.commandsUrl +"/"+ turn, callback);
    }
}
