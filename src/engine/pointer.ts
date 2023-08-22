import { DataType } from "./utils";

export class Pointer<T> {
    private _value: T;
    private _position: number;
    private _size: number;
    private _type: string;

    constructor(position: number, size: number, type: DataType){
        this._position = position;
        this._size = size;
        this._type = type;
    }

    public get position(): number {
        return this._position;
    }

    public shift(offset: number) {
        this._position += offset;
    }

    public get size(): number {
        return this._size;
    }

    public set size(value: number) {
        this._size = value;
    }

    public get type(): string {
        return this._type;
    }

    public get value(): T {
        return this._value;
    }

    public set value(value: T) {
        this._value = value;
    }

    public toString(): string {
        return `{pos: ${this._position}, type: ${this._type}, size: ${this._size}, value: ${this._value}}`;
    }

}