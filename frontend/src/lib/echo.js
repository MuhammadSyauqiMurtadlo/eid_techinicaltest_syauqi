import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { API_URL } from "./api";

window.Pusher = Pusher;

export function createEcho(token) {
  const scheme = import.meta.env.VITE_REVERB_SCHEME ?? "http";
  const port = Number(import.meta.env.VITE_REVERB_PORT ?? 8080);

  return new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST ?? "localhost",
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],
    // private channel diautentikasi lewat Bearer token Sanctum
    authEndpoint: `${API_URL}/broadcasting/auth`,
    auth: {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    },
  });
}
