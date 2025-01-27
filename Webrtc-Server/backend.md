# WebSocket Real-Time Communication Backend

This repository provides the backend implementation of a real-time communication server using WebSockets with the help of `Socket.io`. It supports user connections, joining/leaving rooms, and broadcasting WebRTC signaling events (offers, answers, ICE candidates, and hangups) for peer-to-peer communications.

## Features

- **Real-time communication** using WebSockets.
- **User room management**: users can join and leave rooms.
- **WebRTC signaling**: Broadcast WebRTC offers, answers, ICE candidates, and handle hangups.
- **Connection management**: Logging when users connect or disconnect from the server.

## Socket Events

The server listens for and broadcasts the following events:

### `JoinSocket`
- **Purpose**: Allows a user to join a socket room identified by their `userID`.
- **Example**:
  ```javascript
  socket.emit('JoinSocket', userID);
  ```

### `LeaveSocket`
- **Purpose**: Allows a user to leave a socket room identified by their `userID`.
- **Example**:
  ```javascript
  socket.emit('LeaveSocket', userID);
  ```

### `offer`
- **Purpose**: Broadcasts a WebRTC offer to a peer.
- **Example**:
  ```javascript
  socket.emit('offer', { to: peerID, offer: offerDetails, from: userID });
  ```

### `answer`
- **Purpose**: Broadcasts a WebRTC answer to a peer.
- **Example**:
  ```javascript
  socket.emit('answer', { to: peerID, answer: answerDetails, from: userID });
  ```

### `hangup`
- **Purpose**: Sends a hangup signal to a peer, indicating the call has ended.
- **Example**:
  ```javascript
  socket.emit('hangup', { to: peerID, from: userID });
  ```

### `candidate`
- **Purpose**: Broadcasts an ICE candidate to a peer during WebRTC negotiations.
- **Example**:
  ```javascript
  socket.emit('candidate', { to: peerID, candidate: candidateDetails, from: userID });
  ```

## Code Explanation

### `initializeSocket(server)`
- **Purpose**: Initializes the WebSocket server with the provided HTTP server and sets up event listeners.
- **Parameters**: 
  - `server`: The HTTP server instance (e.g., from `express` or `http`).
- **Returns**: The `io` instance of the WebSocket server.

### Event Handlers
1. **`connection`**: 
   - Logs when a user connects and listens for various events like `JoinSocket`, `LeaveSocket`, `offer`, `answer`, `hangup`, and `candidate`.
   
2. **`JoinSocket`**:
   - Adds the user to a room identified by their `userID`.

3. **`LeaveSocket`**:
   - Removes the user from their specific room.

4. **`offer`**:
   - Broadcasts a WebRTC offer to the target peer.

5. **`answer`**:
   - Broadcasts a WebRTC answer to the originating peer.

6. **`hangup`**:
   - Sends a hangup event to notify the peer the call has ended.

7. **`candidate`**:
   - Sends ICE candidates to the peer for WebRTC negotiation.

8. **`disconnect`**:
   - Logs when a user disconnects from the WebSocket server.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
