import { GameStateManager } from "./GameStateManager";
import { Player } from "./Player";

export class GuiManager {

    div: HTMLDivElement;

    constructor(div: HTMLDivElement) {
        this.div = div
    }

    async start() {
    }

    async update() {
    }

    async displayPopUpToLocalPlayer(target: Player, message: string) {
        const node = document.createElement("div");
        node.className = "ant-modal-content";

        const button = document.createElement("button");
        button.setAttribute("aria-label", "close");
        button.className = "ant-modal-close";
        node.appendChild(button);

        const x = document.createElement("span");
        x.className = "ant-modal-close-x";
        button.appendChild(x);

        this.div.appendChild(node);
    }

}
