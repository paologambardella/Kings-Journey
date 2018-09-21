enum CombatResultType {
    AttackerSuccess,
    AttackerFailure,
    KingCaptured,
}

interface CombatPhaseResult {
    attackDamage: number,
    defendDamage: number,
    attackSurvivors: Unit[],
    defendSurvivors: Unit[],
}

interface CombatResult {
    initial: {
        attackers: Unit[],
        defenders: Unit[],
    },
    firstPhase: CombatPhaseResult,
    secondPhase: CombatPhaseResult,
}

class Combat {
    private result: CombatResult;

    constructor(public attackGroup: UnitGroup, public defendGroup: UnitGroup) {
    }

    get defendHex(): Hex {
        return this.defendGroup.hex;
    }

    // TODO use simulate to get the results.
    resolve(): CombatResultType {
        this.resolveCombatPhase("firstAttack");
        this.resolveCombatPhase("secondAttack");

        if(this.defendGroup.isEmpty()) {
            this.defendHex.unitsGroup = null;
            return CombatResultType.AttackerSuccess;
        } else if(this.defendGroup.onlyHasKing()) {
            return CombatResultType.KingCaptured;
        } else {
            return CombatResultType.AttackerFailure;
        }
    }

    // TODO dry up repetition
    simulate(): CombatResult {
        this.result = {
            initial: {
                attackers: this.attackGroup.units,
                defenders: this.defendGroup.units,
            },
            firstPhase: {
                attackDamage: 0,
                defendDamage: 0,
                attackSurvivors: [],
                defendSurvivors: [],
            },
            secondPhase: {
                attackDamage: 0,
                defendDamage: 0,
                attackSurvivors: [],
                defendSurvivors: [],
            },
        };

        this.result.firstPhase.attackDamage = this.totalDamage(
            this.result.initial.attackers,
            "firstAttack"
        );
        this.result.firstPhase.defendSurvivors = this.simulateAttackPhase(
            "firstAttack",
            this.result.firstPhase.attackDamage,
            this.result.initial.defenders
        );

        this.result.firstPhase.defendDamage = this.totalDamage(
            this.result.initial.defenders,
            "firstAttack"
        );
        this.result.firstPhase.attackSurvivors = this.simulateAttackPhase(
            "firstAttack",
            this.result.firstPhase.defendDamage,
            this.result.initial.attackers
        );

        this.result.secondPhase.attackDamage = this.totalDamage(
            this.result.firstPhase.attackSurvivors,
            "secondAttack"
        );
        this.result.secondPhase.defendSurvivors = this.simulateAttackPhase(
            "secondAttack",
            this.result.secondPhase.attackDamage,
            this.result.firstPhase.defendSurvivors
        );

        this.result.secondPhase.defendDamage = this.totalDamage(
            this.result.firstPhase.defendSurvivors,
            "secondAttack"
        );
        this.result.secondPhase.attackSurvivors = this.simulateAttackPhase(
            "secondAttack",
            this.result.secondPhase.defendDamage,
            this.result.firstPhase.attackSurvivors
        );

        return this.result;
    }

    private simulateAttackPhase(attackPhase: string, attackDamage: number, defenders: Unit[]) {
        var deadDefendUnits = _.select(defenders, this.killUnitFn(attackDamage));

        return _.difference(defenders, deadDefendUnits);
    }

    private totalDamage(units: Unit[], attackPhase: string): number {
        var _sumAttack = function(total, unit) {
            return total + unit[attackPhase]
        };

        return _.reduce(units, _sumAttack, 0);
    }

    private resolveCombatPhase(attackPhase: string) {
        var attackDamage = this.attackGroup.totalDamage(attackPhase);
        var defendDamage = this.defendGroup.totalDamage(attackPhase);

        this.killUnits(this.defendGroup, attackDamage);
        this.killUnits(this.attackGroup, defendDamage);
    }

    // Removes elements from the `units` property.
    private killUnits(group: UnitGroup, damage: number): void {
        var deadUnits = _.select(group.units, this.killUnitFn(damage));

        _.each(deadUnits, function(deadUnit){
            console.debug(deadUnit.name + " died")
            group.removeUnit(deadUnit);
        });
    }

    // Returns a function that returns `true` if the unit should die, `false` if it survives.
    private killUnitFn(totalDamage: number): (Unit) => boolean {
        var damageLeft = totalDamage;

        return function(unit: Unit){
            if(unit.type == UnitType.King){
                // The King does not die, they get captured.
                return false;
            } else if(unit.defense > damageLeft){
                // Too much defense, the unit survives.
                return false;
            } else {
                // Consume the damage that was dealt.
                damageLeft -= unit.defense;
                return true;
            }
        }
    }
}
