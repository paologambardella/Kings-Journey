var map_1: GameMap = {
    width: 30,
    height: 20,

    // 0 - empty
    // 1 - forest
    // 2 - port
    // 3 - road
    // 4 - town
    // 5 - rebel camp
    // 6 - castle
    // 7 - water
    // NOTE that the map's bytecode is rotated 90 degrees
    bytecode:
        "77770000000000000000\n" +
        "77777000111000000000\n" +
        "77777000111000000000\n" +
        "77772000000000050000\n" +
        "77723333300000000000\n" +
        "77023000043330000000\n" +
        "00003000300030000000\n" +
        "00000300300003000000\n" +
        "00000303000003000000\n" +
        "00000433000010400000\n" +
        "00003030000103011000\n" +
        "00003003005103011100\n" +
        "00030113011030111000\n" +
        "00030111311103111000\n" +
        "05030110311103000500\n" +
        "00003010031100300000\n" +
        "00030000400000300000\n" +
        "00043333333333340000\n" +
        "00300000300110030000\n" +
        "00300005031110003000\n" +
        "00300000311100030000\n" +
        "00301110311100030000\n" +
        "00300113011000300000\n" +
        "00034013000000300000\n" +
        "00003003000003660000\n" +
        "00000333333333666000\n" +
        "05000000400000660000\n" +
        "00000000000000000000\n" +
        "00000000000000000000\n",

    initialUnits: {
        "4,-19,15": [King],
        "5,-20,15": [Guard],
        "3,-18,15": [Guard],
        "4,-18,14": [Archer],
        "5,-19,14": [Archer],
    },

    townReinforcements: {
        "5,-14,9": [Guard, Guard], // top 1 (near the port)
        "9,-11,2": [Guard, Guard], // top 2
        "17,-14,-3": [Archer, Archer], // top 3 (near the castle)
        "9,-20,11": [Guard, Guard], // bottom 1 (near the port)
        "17,-26,9": [Guard, Guard], // bottom 2
        "23,-28,5": [Archer, Archer], // bottom 3
        "26,-25,-1": [Knight, Knight], // bottom 4 (near the castle)
        "16,-20,4": [Guard, Guard], // center
    }
}

var tut_00: GameMap = {
    width: 30,
    height: 20,
    // 0 - empty
    // 1 - forest
    // 2 - port
    // 3 - road
    // 4 - town
    // 5 - rebel camp
    // 6 - castle
    // 7 - water
    // NOTE that the map's bytecode is rotated 90 degrees
    bytecode:
    "00000777777777000000\n" +
    "00000777777777700000\n" +
    "00077777777777000000\n" +
    "00007777777777700000\n" +
    "00077777777777000000\n" +
    "00000777777777700000\n" +
    "00007777777777700000\n" +
    "00007777777777770000\n" +
    "00007777777777777000\n" +
    "00000077777777777700\n" +
    "00000077777777777700\n" +
    "00000000000077777770\n" +
    "00000000000077777700\n" +
    "00000000000000777777\n" +
    "00000000000000077770\n" +
    "00000400000000000000\n" +
    "00000300000000000000\n" +
    "00000030000000000000\n" +
    "00000030000000000000\n" +
    "00000003000000000000\n" +
    "00000003000000000000\n" +
    "00000000300066000000\n" +
    "00000000333666000000\n" +
    "00000000000066000000\n" +
    "00000777077700000000\n" +
    "00000777777777000000\n" +
    "00077777777777070700\n" +
    "00007777777777777777\n" +
    "00077777777777777777\n" +
    "00007777777777777777\n",

    initialUnits: {
        "11,-23,12": [King],
        "18,-16,-2": [Rebel],
    },

    townReinforcements: {
        "15,-23,8": [Guard, Archer],
    }

}

var tut_01: GameMap = {
    width: 12,
    height: 12,

    // 0 - empty
    // 1 - forest
    // 2 - port
    // 3 - road
    // 4 - town
    // 5 - rebel camp
    // 6 - castle
    // 7 - water
    // NOTE that the map's bytecode is rotated 90 degrees
    bytecode:
    "000777777700\n" +
    "000077777700\n" +
    "000077777000\n" +
    "000007777000\n" +
    "000007770500\n" +
    "000000000000\n" +
    "000000000000\n" +
    "000000000000\n" +
    "000000000000\n" +
    "000000660000\n" +
    "000006660000\n" +
    "000000660000\n",

    initialUnits: {
        "2,-12,10": [King],
        "3,-13,10": [Guard],
        "2,-11,9": [Archer],
    },

    townReinforcements: {
    }
}

var test_01: GameMap = {
    width: 6,
    height: 8,

    bytecode:
        "77777011\n" +
        "77772350\n" +
        "77730000\n" +
        "77003066\n" +
        "00003000\n" +
        "00000300\n",

    initialUnits: {
        "1,-5,4": [King, Archer, Guard, Guard],
    },

    townReinforcements: {},
}

var test_02: GameMap = {
    width: 6,
    height: 8,

    bytecode:
        "77777011\n" +
        "77772350\n" +
        "77730000\n" +
        "77003066\n" +
        "00003000\n" +
        "00000300\n",

    initialUnits: {
        "1,-5,4": [King, Archer, Archer],
        "2,-6,4": [Guard, Guard],
        "2,-5,3": [Knight],
    },

    townReinforcements: {},
}

var test_03: GameMap = {
    width: 6,
    height: 8,

    bytecode:
        "77777011\n" +
        "77772350\n" +
        "77730000\n" +
        "77003066\n" +
        "00003000\n" +
        "00000300\n",

    initialUnits: {
        "1,-5,4": [King, Archer, Archer],
        "2,-6,4": [Guard, Guard],
        "2,-5,3": [Rebel, Rebel, Rebel],
    },

    townReinforcements: {},
}

var test_04: GameMap = {
    width: 6,
    height: 8,

    bytecode:
        "77777011\n" +
        "77072350\n" +
        "77730000\n" +
        "77003066\n" +
        "00003000\n" +
        "00000300\n",

    initialUnits: {
        "1,-5,4": [King, Archer, Archer],
        "2,-6,4": [Rebel, Rebel],
    },

    townReinforcements: {},
}
