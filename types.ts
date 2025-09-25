
export enum MissionType {
    RESCUE = "Hostage Rescue",
    ELIMINATION = "High-Value Target Elimination",
    SABOTAGE = "Sabotage Enemy Infrastructure",
    RECON = "Stealth Reconnaissance",
    DEFENSE = "Defend Key Position"
}

export enum Environment {
    DESERT = "Abandoned Desert Base",
    URBAN = "War-Torn Urban Warzone",
    FOREST = "Dense Forest Wilderness",
    ARCTIC = "Arctic Research Facility",
    JUNGLE = "Humid Jungle Outpost"
}

export enum Weapon {
    M4A1 = "M4A1 Carbine",
    AK74 = "AK-74",
    MK18 = "MK18",
    SCAR_H = "SCAR-H",
    M110_SASS = "M110 SASS",
    MP7 = "MP7A1"
}

export type View = 'MISSION_GENERATOR' | 'CONCEPT_ART' | 'SHOOTING_RANGE';

export interface MissionParams {
    type: MissionType;
    environment: Environment;
}
