class View {
    private selectedHex: Hex = null;
    private activeCombat: Combat = null;
    private inControl: boolean = true;

    constructor(private game: GameInterface) {
        this.game = game;
        var self = this;

        d3.select('#next-turn')
            .on('click', function(){
                if(!self.inControl) return;

                self.selectedHex = null;
                self.game.nextTurn();
                self.waitForOtherPlayer();
                self.update();
            })
        ;

        d3.select('#resolve-combat')
            .on('click', function(){
                if(!self.inControl) return;

                self.hideBattleScreen();
                self.resolveActiveCombat();
                self.update();
            })
        ;

        this.game.tiles
            .on('click', function(hex: Hex) {
                if(!self.inControl) return;

                self.selectHex(hex);
                self.update();
            })
            .on('contextmenu', function(hex: Hex) {
                if(!self.inControl) return;

                d3.event.preventDefault();
                self.moveSelectedUnitsToHex(hex);
                self.update();
            })
        ;
    };

    waitForOtherPlayer(): void {
        this.inControl = false;
        this.update();

        this.game.waitForControl(() => {
            this.inControl = true;
            this.update();
        }, () => {
            this.update();
        });
    }

    private selectHex(hex: Hex) {
        if (this.selectedHex == hex) {
            // Deselect if already selected.
            this.selectedHex = null;
        } else {
            this.selectedHex = hex;
            console.debug("Selected: "+ hex.cube.toString());
        }
    };

    private highlightPossibleMoves() {
        var possibleMoves = this.possibleMoves();

        this.game.tiles.classed('possible-move', (hex: Hex) => {
            return _.contains(possibleMoves, hex);
        });
    };

    private possibleMoves(): Hex[] {
        // Nothing to highlight if no hex is selected.
        if(this.selectedHex == null) return [];

        // Nothing to highlight if enemy hex is selected.
        if(this.selectedHex.side() != this.game.currentPlayer.side) return [];

        // Nothing to highlight if hex is empty.
        if(this.selectedHex.isEmpty()) return [];

        return this.game.possibleMoves(this.selectedGroup());
    }

    // TODO offload logic to Game
    private moveSelectedUnitsToHex(targetHex: Hex) {
        // No-op if no hex is selected.
        if(this.selectedHex == null) return;

        // No-op if enemy hex is selected.
        if(this.selectedHex.side() != this.game.currentPlayer.side) return;

        // No-op if trying to move to the same hex.
        if(targetHex == this.selectedHex) return;

        // No-op if no units on the selected hex.
        if(this.selectedHex.isEmpty()) return;

        // No-op if group cannot move to the targetHex.
        if(!_.contains(this.possibleMoves(), targetHex)) return;

        // TODO Game should decide whether to move or attack.
        // If the targetHex is occupied by the opposing player, attack that hex instead of moving.
        if(targetHex.side() != Side.None && targetHex.side() != this.selectedHex.side()) {
            this.activeCombat = new Combat(this.selectedGroup(true), targetHex.unitsGroup);
            this.displayActiveCombat();

            return;
        };

        // OK, time to move.
        var selectedSubGroup = this.game.splitGroup(
            this.selectedHex.unitsGroup,
            this.selectedUnits()
        );

        this.game.moveGroupToHex(selectedSubGroup, targetHex);

        this.selectHex(targetHex);
    };

    private maybeShowVerdict() {
        switch(this.game.gameState) {
            case GameState.ImperialsWon:
                this.showVerdict("Imperials won the game!");
                break;
            case GameState.RebelsWon:
                this.showVerdict("Rebels won the game!");
                break;
        }
    }

    private selectedUnits(): Unit[] {
        var units: Unit[] = [];
        d3.select('#selected-units ul').selectAll('li')
            .each(function(unit: Unit){
                var checkbox = <HTMLInputElement>unit.node.select('input').node();
                if(checkbox.checked) {
                    units.push(unit);
                };
            })
        ;
        return units;
    }

    private selectedGroup(exclusive = false): UnitGroup {
        var group = this.selectedHex.unitsGroup;
        if(group) {
            var units = this.selectedUnits();
            if(exclusive) {
                // Calling Game makes sure we send this command to the server. Too much knowledge
                // for a simple View.
                // TODO reduce View's knowledge of splitting groups.
                return this.game.splitGroup(group, units);
            } else {
                return group.splitSubGroup(units, false);
            }
        } else {
            return new UnitGroup(this.selectedHex);
        }
    }

    private combatantTextFn: (unit: Unit) => string = _.template("\
        <%= name %> (<%= firstAttack %> / <%= secondAttack %> / <%= defense %>)\
    ");

    private displayBattleUnits(units: Unit[], ul: D3.Selection) {
        var li = ul.selectAll('li')
            .data(units);

        li.html(this.combatantTextFn);

        li.enter().append('li')
            .html(this.combatantTextFn);

        li.exit().remove();
    }

    // TODO turn this into a template
    private displayActiveCombat() {
        var result: CombatResult = this.activeCombat.simulate();

        this.displayBattleUnits(
            result.initial.attackers,
            d3.select("#battle-screen .initial .you ul")
        );
        this.displayBattleUnits(
            result.initial.defenders,
            d3.select("#battle-screen .initial .opponent ul")
        );

        d3.select("#battle-screen .first-attack-damage .you")
            .text(result.firstPhase.attackDamage);
        d3.select("#battle-screen .first-attack-damage .opponent")
            .text(result.firstPhase.defendDamage);

        this.displayBattleUnits(
            result.firstPhase.attackSurvivors,
            d3.select("#battle-screen .first-attack-survivors .you ul")
        );
        this.displayBattleUnits(
            result.firstPhase.defendSurvivors,
            d3.select("#battle-screen .first-attack-survivors .opponent ul")
        );

        d3.select("#battle-screen .second-attack-damage .you")
            .text(result.secondPhase.attackDamage);
        d3.select("#battle-screen .second-attack-damage .opponent")
            .text(result.secondPhase.defendDamage);

        this.displayBattleUnits(
            result.secondPhase.attackSurvivors,
            d3.select("#battle-screen .second-attack-survivors .you ul")
        );
        this.displayBattleUnits(
            result.secondPhase.defendSurvivors,
            d3.select("#battle-screen .second-attack-survivors .opponent ul")
        );

        this.showBattleScreen();
    }

    private showBattleScreen() {
        d3.select("#battle-screen").style('display', 'block');
    }

    private hideBattleScreen() {
        d3.select("#battle-screen").style('display', 'none');
    }

    private showVerdict(verdict: string) {
        d3.select("#verdict").text(verdict);
        d3.select("#end-screen").style('display', 'block');
    }

    private resolveActiveCombat() {
        var combatResult = this.game.resolveCombat(this.activeCombat);

        if(combatResult == CombatResultType.AttackerSuccess) {
            // The attackers have been moved to the defending hex.
            this.selectHex(this.activeCombat.defendHex);
        };

        this.activeCombat = null;
    };

    private updateNumbersInHexes() {
        this.game.tiles.select('image')
            .attr('xlink:href', function(hex: Hex) {
                switch(hex.side()) {
                    case Side.Rebel: return RebelsAvatarUrl;
                    case Side.Imperial: return ImperialsAvatarUrl;
                    default: return '';
                }
            })
        ;

        this.game.tiles.select('text')
            .text(function(hex: Hex): string {
                switch(hex.unitsCount()) {
                    case 0:  return '';
                    case 1:  return '';
                    default: return hex.unitsCount().toString();
                }
            })
        ;

        this.game.tiles.select('rect')
            .style('fill', function(hex: Hex): string {
                switch(hex.unitsCount()) {
                    case 0:  return 'rgba(0,0,0,0)';
                    case 1:  return 'rgba(0,0,0,0)';
                    default: return 'black';
                }
            })
        ;
    };

    private ownUnitTextFn: (unit: Unit) => string = _.template("\
        <label><input type=\"checkbox\" checked=\"checked\"/> <%= name %> (<%= movementPoints %>)</label>\
    ");

    private otherUnitTextFn: (unit: Unit) => string = _.template("\
        <%= name %>\
    ");

    private displaySelectedUnits() {
        var textFn: (unit: Unit) => string;
        var units: Unit[] = [];

        if(this.selectedHex != null){
            var selectedGroup = this.selectedHex.unitsGroup;

            if(selectedGroup) {
                units = selectedGroup.units;

                if(this.selectedHex.side() == this.game.currentPlayer.side) {
                    textFn = this.ownUnitTextFn;
                } else if(this.game.currentPlayer.canInspectOpponent) {
                    textFn = this.otherUnitTextFn;
                } else {
                    units = [];
                    // `textFn` doesn't matter, it's not going to be called since `units` is empty.
                }
            }
        }

        var li = d3.select('#selected-units ul').selectAll('li')
            .data(units);

        li.each(function(unit) { unit.node = d3.select(this); })
            .html(textFn);

        li.enter().append('li')
            .each(function(unit) { unit.node = d3.select(this); })
            .html(textFn);

        li.exit().remove();

        li.selectAll('input').on('change', () => {
            // TODO figure out a way to replace this with `this.update()`
            this.highlightPossibleMoves();
        });
    }

    private toggleNextTurnButton(): void {
        var nextTurnButton = d3.select('#next-turn').node();
        if(this.inControl) {
            nextTurnButton.removeAttribute('disabled');
        } else {
            nextTurnButton.setAttribute('disabled', 'disabled');
        }
    }

    private displayCurrentPlayer() {
        d3.select('#current-player').text(this.game.currentPlayer.name);
    }

    private displayTurnNumber() {
        d3.select('#turn-number').text(this.game.turnNumber);
    }

    private changeHexClasses() {
        this.game.tiles
            .classed('selected', (hex: Hex) => {
                return this.selectedHex == hex;
            })
            .classed('has-imperials', (hex: Hex) => {
                return hex.side() == Side.Imperial;
            })
            .classed('has-rebels', (hex: Hex) => {
                return hex.side() == Side.Rebel;
            })
        ;
    }

    private toggleWaitingOverlay() {
        var overlay = d3.select("#waiting");

        if(this.inControl) {
            overlay.style("display", "none");
        } else {
            overlay.style("display", "block");
        }
    }

    private hideLoadingOverlay() {
        d3.select("#loading").style("display", "none");
    }

    update() {
        this.changeHexClasses();
        this.updateNumbersInHexes();
        this.displaySelectedUnits();
        this.highlightPossibleMoves();
        this.toggleNextTurnButton();
        this.displayCurrentPlayer();
        this.displayTurnNumber();
        this.toggleWaitingOverlay();
        this.maybeShowVerdict();
        this.hideLoadingOverlay();
    }
}
