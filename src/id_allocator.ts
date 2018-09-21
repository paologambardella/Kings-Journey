class IdAllocator {
    private _nextId = 1;

    constructor() {}

    nextId() {
        this._nextId++
        console.debug("Incremented id to: "+ this._nextId);

        return this._nextId;
    }
}
