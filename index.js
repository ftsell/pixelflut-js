const PIXELFLUT_BINARY_ALG_RGBA_BASE64 = "rgba64";


function PixelflutClient(url, canvas, autoConnect = true, updateFrequency = 5) {
    /** @type CanvasRenderingContext2D */
    this.canvas_ctx = canvas.getContext("2d");
    /** @type string */
    this.url = url;
    /** @type number */
    this.width = -1;
    /** @type number */
    this.height = -1;

    /** @type WebSocket */
    this._socket = null;
    /** @type number */
    this._intervalId = -1;
    /** @type ImageData */
    this._imageData = null;
    /** @type boolean */
    this._currentlyReceiving = false;

    /**
     * Connect to the configured pixelflut server at `this.hostname` on port `this.port`
     *
     * @throws If already connected
     */
    this.connect = function () {
        if (this.isConnected())
            throw `This client is already connected to ${this.hostname}:${this.port}`;

        this._socket = new WebSocket(url, "pixelflut");
        this._socket.onmessage = (e) => this._onMessage(e);
        this._socket.onopen = (e) => this._onConnect(e);
        this._socket.onclose = (e) => this._onClose(e);
    };

    /**
     * Disconnect from the current server
     *
     * @throws If not currently connected
     */
    this.disconnect = function () {
        this._socket.close();
    };

    /**
     * Whether or not the client is currently connected to a pixelflut server
     *
     * @returns boolean
     */
    this.isConnected = () => this._socket != null;

    this._parseAndHandleMessage = function (message) {
        let parts = message.replace("\n", "").split(" ");

        if (parts[0].toLowerCase() === "size") {
            this.width = +parts[1];
            this.height = +parts[2];
            this.canvas_ctx.canvas.width = this.width;
            this.canvas_ctx.canvas.height = this.height;
        } else if (parts[0].toLowerCase() === "state") {
            if (parts[1].toLowerCase() === PIXELFLUT_BINARY_ALG_RGBA_BASE64) {
                this._handleBinaryAlgRgba64(parts[2]);
            } else {
                console.error(`Cannot display pixelflut canvas because algorithm ${parts[1]} is not known.`)
            }
        } else {
            console.warn(`Cannot handle pixelflut servers response: ${message}`)
        }
    };

    this._onMessage = function (e) {
        this._parseAndHandleMessage(e.data)
    };

    this._onConnect = function (e) {
        this._socket.send("SIZE");
        this._intervalId = setInterval(() => {
                if (this._currentlyReceiving === false) {
                    this._socket.send(`STATE ${PIXELFLUT_BINARY_ALG_RGBA_BASE64}`);
                    this._currentlyReceiving = true;
                }
            },
            1000 / updateFrequency);
    };

    this._onClose = function (e) {
        clearInterval(this._intervalId);
        this._socket = null;
        this.width = -1;
        this.height = -1;
        this._currentlyReceiving = false;
    };

    this._handleBinaryAlgRgba64 = function (content) {
        var arr = Uint8ClampedArray.from(atob(content), c => c.charCodeAt(0));
        this._imageData = new ImageData(arr, this.width, this.height);
        this.canvas_ctx.putImageData(this._imageData, 0, 0);
        this._currentlyReceiving = false;
    };

    if (autoConnect)
        this.connect();
}


/*
 * Export client in all formats known to me
 */
if (window.exports !== undefined) {
    exports.PixelflutClient = PixelflutClient;
}
