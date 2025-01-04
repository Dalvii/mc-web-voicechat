// websocket.ts
import { store } from "./store";
import {
  handlePosition
} from "./positions";
import {
  handleJoin,
  handleOffer,
  handleAnswer,
  handleCandidate
} from "./webrtc";
import { WsMessage } from "./types";

/**
 * Connexion au serveur WebSocket
 */
export function connectWebSocket(url: string): void {
  // Établit la connexion
  store.ws = new WebSocket(url);

  store.ws.onopen = () => {
    console.log("Connecté au serveur WebSocket.");
    store.connected = true;

    // Active le bouton "Activer mon micro"
    const startAudioBtn = document.getElementById("startAudioBtn") as HTMLButtonElement;
    if (startAudioBtn) {
      startAudioBtn.disabled = false;
    }
  };

  store.ws.onmessage = async (event: MessageEvent<string>) => {
    let data: WsMessage;
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      console.warn("Message non JSON :", event.data);
      return;
    }

    const { type, from, to } = data;

    // Gestion position "pos"
    if (type === "pos") {
      handlePosition(data);
      return;
    }

    // Les autres messages WebRTC : on ignore si ce n’est pas pour nous
    if (to && to !== store.localPseudo) return;

    switch (type) {
      case "join":
        if (from) handleJoin(from);
        break;
      case "offer":
        if (from && data.payload) handleOffer(from, data.payload);
        break;
      case "answer":
        if (from && data.payload) handleAnswer(from, data.payload);
        break;
      case "candidate":
        if (from && data.payload) handleCandidate(from, data.payload);
        break;
      default:
        console.warn("Type de message inconnu :", type);
    }
  };

  store.ws.onclose = () => {
    console.log("Déconnecté du serveur WebSocket.");
    store.connected = false;
  };

  store.ws.onerror = (err) => {
    console.error("Erreur WebSocket :", err);
  };
}

/**
 * Envoi d'un message JSON via WebSocket
 */
export function sendMessage(msg: WsMessage): void {
  if (store.ws && store.connected) {
    store.ws.send(JSON.stringify(msg));
  }
}
