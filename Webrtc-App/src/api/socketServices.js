import io from 'socket.io-client';

const SOCKET_URL = `https://formally-valid-mite.ngrok-free.app/`; // Local Server
// const SOCKET_URL = `https://webrtc-130h.onrender.com/`; // Live Server

class WSService {
    initializeSocket = async (url) => {
        try {
            this.socket = io(url ? url : SOCKET_URL, {
                transports: ['websocket']
            })

            this.socket?.on("connect", (data) => {
                console.log("Socket connected");
            })

            this.socket?.on("disconnect", (data) => {
                console.log("Socket disconnected");
            })

            this.socket?.on("error", (data) => {
                console.log("Socket error", data);
            })

        } catch (error) {
            console.log("Socket not initialized");
        }
    }

    emit(event, data = {}) {
        this.socket?.emit(event, data)
    }
    on(event, cb) {
        this.socket?.on(event, cb)
    }
    off(event, cb) {
        this.socket?.off(event, cb)
    }
    removeListener(listenerName) {
        this.socket?.removeListener(listenerName)
    }
}

const socketServices = new WSService()

export default socketServices;