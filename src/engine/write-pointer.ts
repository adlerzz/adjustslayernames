import {Pointer} from "./pointer";

export class WritePointer<T>{
    private _origin: Pointer<T>;
    private _newPosition: number;
    private _newValue: T;
    private _newSize: number;

    constructor(origin: Pointer<T>, newValue: T, newSize: number){
        this._origin = origin;
        this._newPosition = origin.position;
        this._newValue = newValue;
        this._newSize = newSize;
    }

    public get origin(): Pointer<T> {
        return this._origin;
    }

    public get newPosition(): number {
        return this._newPosition;
    }

    public get newValue(): T {
        return this._newValue;
    }

    public get newSize(): number {
        return this._newSize;
    }

    public get type(): string {
        return this._origin.type;
    }

    public shift(offset: number): void {
        this._newPosition += offset;
    }

    public offset(): number {
        return this.newSize - this.origin.size;
    }

    public toString(): string {
        return `{npos: ${this.newPosition}, orig: ${this.origin}, nsize: ${this.newSize}, nvalue: ${this.newValue}}`;
    }

}