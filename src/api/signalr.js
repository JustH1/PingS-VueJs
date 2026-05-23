import * as signalR from '@microsoft/signalr'

let connection = null

/**
 * Create a new SignalR HubConnection. Must be called before start().
 * @param {string} token - JWT access token
 */
export function buildConnection(token) {
  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${import.meta.env.VITE_API_URL}/hubs/chat`, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  return connection
}

/** Start the connection (must be built first). */
export async function startConnection() {
  if (!connection) throw new Error('SignalR: connection not built')
  if (connection.state === signalR.HubConnectionState.Disconnected) {
    await connection.start()
  }
}

/** Gracefully stop and destroy the connection. */
export async function stopConnection() {
  if (connection) {
    await connection.stop()
    connection = null
  }
}

/** Get the current connection instance (may be null). */
export function getConnection() {
  return connection
}

/** HubConnectionState re-export for convenience. */
export const HubConnectionState = signalR.HubConnectionState
