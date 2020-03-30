"use strict";
const PIXELFLUT_BINARY_ALG_RGBA_BASE64 = "rgba64";


export class PixelflutClient {
    constructor(url, canvas, autoConnect = true, updateFrequency = 5) {
        /** @type CanvasRenderingContext2D */
        this.canvas_ctx = canvas.getContext("2d");
        /** @type string */
        this.url = url;
        /** @type number */
        this.width = -1;
        /** @type number */
        this.height = -1;
        /** @type number */
        this.updateFrequency = updateFrequency;

        /** @type WebSocket */
        this._socket = null;
        /** @type number */
        this._intervalId = -1;
        /** @type ImageData */
        this._imageData = null;
        /** @type boolean */
        this._currentylReceiving = false;

        if (autoConnect)
            this.connect()
    }

    /**
     * Connect to the url which was specified during object construction
     *
     * @throws If already connected
     */
    connect() {
        if (this.isConnected())
            throw new Error(`This client is already connected to ${this.url}}`);

        this._socket = new WebSocket(this.url, "pixelflut");
        this._socket.onmessage = (e) => this._onMessage(e);
        this._socket.onopen = (e) => this._onOpen(e);
        this._socket.onclose = (e) => this._onClose(e);
    }

    /**
     * Disconnect from the current server
     *
     * @throws If not currently connected
     */
    disconnect() {
        this._socket.close();
    }

    /**
     * Whether or not the client is currently connected to a pixelflut server
     *
     * @returns {boolean}
     */
    isConnected() {
        return this._socket != null;
    }

    /** @param e {MessageEvent} */
    _onClose(e) {
        clearInterval(this._intervalId);
        this._socket = null;
        this.width = -1;
        this.height = -1;
        this._currentylReceiving = false;
    }

    /** @param e {MessageEvent} */
    _onOpen(e) {
        this._socket.send("SIZE");
        this._currentylReceiving = true;
        this._intervalId = setInterval(() => {
            if (!this._currentylReceiving) {
                this._socket.send(`STATE ${PIXELFLUT_BINARY_ALG_RGBA_BASE64}`);
                this._currentylReceiving = true;
            }
        }, 1000 / this.updateFrequency)
    }

    /** @param e {MessageEvent} */
    _onMessage(e) {
        const parts = e.data.replace("\n", "").split(" ");

        if (parts[0].toLowerCase() === "size") {
            this.width = +parts[1];
            this.height = +parts[2];
            this.canvas_ctx.canvas.width = this.width;
            this.canvas_ctx.canvas.height = this.height;
        } else if (parts[0].toLowerCase() === "state") {
            if (parts[1].toLowerCase() === PIXELFLUT_BINARY_ALG_RGBA_BASE64) {
                this._handleBinaryAlgRgba64(parts[2]);
            } else {
                console.error(`Cannot display pixelflut canvas because algorithm ${parts[1]} is not supported.`)
            }
        } else {
            console.warn(`Cannot handle pixelflut servers response: ${message}`)
        }

        this._currentylReceiving = false;
    }

    /** @param content {string} */
    _handleBinaryAlgRgba64(content) {
        const arr = Uint8ClampedArray.from(atob(content), c => c.charCodeAt(0));
        this._imageData = new ImageData(arr, this.width, this.height);
        this.canvas_ctx.putImageData(this._imageData, 0, 0);
    };
}
