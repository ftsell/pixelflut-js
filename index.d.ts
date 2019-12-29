export declare class PixelflutClient {
    public canvas_ctx: CanvasRenderingContext2D;
    public url: string;
    public width: number;
    public height: number;

    private _socket: WebSocket;
    private _intervalId: number;
    private _imageData: ImageData;
    private _currentlyReceiving: boolean;

    constructor(url: string, canvas: HTMLCanvasElement, autoConnect?: boolean, updateFrequency?: number);
    public connect(): void;
    public disconnect(): void;
    public isConnected(): boolean;

    private _parseAndHandleMessage(message: string): void;
    private _onMessage(e: Event): void;
    private _onConnect(e: Event): void;
    private _onClose(e: Event): void;
    private _handleBinaryAlgRgba64(content: string);
}
