import { SELECTION_ALL } from "antd/lib/table/hooks/useSelection";
import internal from "stream";
import { Scene, Vector3 } from "three";
import Entity from "./Entity";
import { PlayerProps } from "./GameUtils";
import { GuiManager } from "./GuiManager";
import { Level } from "./Level";
import { Player } from "./Player";
import Unit from "./Unit";

export enum ClientState {
    LOADING,
    READY
}

export enum ServerGameState {
    waiting = "WAITING_FOR_PLAYERS",
    pending = "PENDING_START",
    started = "STARTED",
    ended = "ENDED"
}

export class GameStateManager {
    clientState: Map<number, ClientState>;
    serverGameState: ServerGameState;
    currentLevel: Level|undefined;
    scene: Scene;
    entities: Entity[];
    playerProps: PlayerProps;
    currentPlayers: Player[];
    mainDiv: HTMLDivElement;
    guiManager: GuiManager;
    readonly MAX_PLAYERS = 1;

    constructor(scene, entities, playerProps, mainDiv) {
        this.clientState = new Map();
        this.serverGameState = ServerGameState.waiting;
        this.scene = scene;
        this.entities = entities;
        this.playerProps = playerProps;
        this.currentPlayers = [];
        this.mainDiv = mainDiv;
        this.guiManager = new GuiManager(mainDiv);
    }

    async start() {
        await this.generateLevel(this.scene, this.entities, this.playerProps)
        await this.goToNextState(); // go from waiting to pending
        await this.goToNextState(); // go from pening to started
        console.log(`${this.serverGameState}`);
        
        // if(this.serverGameState === ServerGameState.PENDING_START && this.currentPlayers.length === this.MAX_PLAYERS) {
        //     console.log("starting game");
        //     this.serverGameState = ServerGameState.STARTED;
        // }
    }

    async goToNextState() {
        switch(this.serverGameState!) {
            case ServerGameState.waiting:
                this.serverGameState = ServerGameState.pending;
                break;
            case ServerGameState.pending:
                this.serverGameState = ServerGameState.started;
                break;
            case ServerGameState.started:
                this.serverGameState = ServerGameState.ended;
                break;
            case ServerGameState.ended:
                this.serverGameState = ServerGameState.waiting;
                break;
        }
    }


    setPlayerLoading(id: number) {
        this.clientState.set(id, ClientState.LOADING);
    }
    setPlayerLoaded(id: number) {
        this.clientState.set(id, ClientState.READY);
    }

    async generateLevel(scene, entities, playerProps: PlayerProps): Promise<Level> {
        let clientPlayer = new Player(playerProps);
        entities.push(clientPlayer);
    
        let level = new Level(scene);
        await level.start();
        await this.addPlayer(clientPlayer, scene, level);
       
        let enemy1 = new Unit(null, scene, level, new Vector3(0,0,1), this);
        await enemy1.start();
        entities.push(enemy1);

        this.currentLevel = level;
    
        return level;
      }

      async addPlayer(client: Player, scene: Scene, level: Level) {
        if(level.playerStarts.length > 0 && this.currentPlayers.length <= level.playerStarts.length) {
            this.currentPlayers.push(client);
            let playerUnit = new Unit(client, scene, level, level.playerStarts[this.currentPlayers.length-1], this);
            await playerUnit.start();
            this.entities.push(playerUnit);
            client.selectUnit(playerUnit);
        } else {
            console.warn("cannot add player, not enough spawnPoints on level.");
        }

      }
}
