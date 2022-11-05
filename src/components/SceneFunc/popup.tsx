import { useEffect, useRef } from "react";
import * as THREE from 'three'

import Entity from "./Entity";
import { GameStateManager } from "./GameStateManager";
import { TopDownCamera } from "./TopDownCamera";

function Popup (mainDiv) {
    return (<div className="scene" style={{ margin: 'auto', width: '50%'}}ref = {mainDiv}>{}</div>);
};