import { Buffer } from "buffer";
import {Pointer} from "./pointer";
import * as utils from "../helpers/utils";
import fs from "fs";
import { WritePointer } from "./write-pointer";

export class Mapper {
    private _filename: string;
    private _content: Buffer;
    private _position: number;

    constructor(filename: string){
        this._filename = filename;
        this._content = fs.readFileSync(filename);
        this._position = 0;
    }

    public readPointer<T>(pointer: Pointer<T>): void{
        const pos = pointer.position;
        let size = pointer.size;
        const raw = this._content.subarray(pos, pos + size);
        if(pointer.type === "uint"){
            (pointer as Pointer<number>).value = raw.readUIntBE(0, size);
        } else if(pointer.type === "int"){
            (pointer as Pointer<number>).value = raw.readIntBE(0, size);
        } else if(pointer.type === "str"){
            const length = this._content.readUInt8(pos);
            const rawstr = utils.win1251BufferToString(this._content.subarray(pos+1, pos + length + 1));
            (pointer as Pointer<string>).value = rawstr;
            size = utils.getPaddedLength(rawstr);
            pointer.size = size;
        } else if(pointer.type === "utf16"){
            (pointer as Pointer<Buffer>).value = this._content.subarray(pos, pos + size);
        }
        this._position += size;
    }

    public readBytes(size: number): Buffer {
        const res = this._content.subarray(this._position, this._position + size);
        this._position += size;
        return res;
    }

    public readUInt16(): number {
        return this.readBytes(2).readUInt16BE();
    }

    public readInt16(): number {
        return this.readBytes(2).readInt16BE();
    }

    public readUInt32(): number {
        return this.readBytes(4).readUInt32BE();
    }

    public markUInt8(): Pointer<number> {
        const p = new Pointer<number>(this._position, 1, "uint");
        this.readPointer(p);
        return p;
    }

    public markUInt32(): Pointer<number> {
        const p = new Pointer<number>(this._position, 4, "uint");
        this.readPointer(p);
        return p;
    }

    public markStr(): Pointer<string> {
        const p = new Pointer<string>(this._position, 1, "str");
        this.readPointer(p);
        return p;
    }

    public markUTF16(size: number): Pointer<Buffer> {
        const p = new Pointer<Buffer>(this._position, size, "utf16");
        this.readPointer(p);
        return p;
    }

    public writePointer<T>(wpointer: WritePointer<T>): void {
        const pos = wpointer.newPosition;
       
        if(wpointer.type === "uint") {
            if(wpointer.origin.size === 4) {
                this._content.writeInt32BE(wpointer.newValue as number, pos);
            }
        } else if (wpointer.type === "str") {
            const newValue = wpointer.newValue as string;
            const newLength = Buffer.alloc(1);
            newLength.writeUInt8(newValue.length);
            const newStr = newValue.padEnd(wpointer.newSize - 1, '\x00');
            this._content = utils.spliceBuffer(
                this._content, 
                pos,
                pos + wpointer.origin.size,
                Buffer.concat([newLength, Buffer.from(newStr) ]),
            );
        } else if (wpointer.type === "utf16") {
            const newLength = Buffer.alloc(4);
            newLength.writeInt32BE( wpointer.newSize - 4);
            const newStr = (wpointer.newValue as Buffer).subarray(4);
            this._content = utils.spliceBuffer(
                this._content,
                pos,
                pos + wpointer.origin.size,
                Buffer.concat([ newLength, newStr ])
            );
        }
    }

    public moveOn(offset: number): void {
        this._position += offset;
    }

    public moveTo(position: number): void {
        this._position = position;
    }

    public where(): number {
        return this._position;
    }

    public save(saveAs?: string): void {
        fs.writeFileSync(saveAs ?? this._filename, this._content);
    }
    
}