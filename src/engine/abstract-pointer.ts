import { getPaddedLength } from "../helpers/utils";
import { ByteSet } from "./byte-set";

export type DataType = "uint8" | "uint32" | "str" | "utf16";

export abstract class AbstractPointer<T> {
    origValue: T;
    newValue?: T;
    position: number;
    origSize: number;
    newSize?: number;
    type: DataType;

    constructor(position: number, type: DataType){
        this.position = position;
        this.type = type;
    }

    public abstract read(byteSet: ByteSet): number;

    public abstract write(byteSet: ByteSet): void;

    public replace(value: T, size?: number): void{
        this.newValue = value;
        this.newSize = size ?? this.origSize;
    }

    public shift(offset: number): void {
        this.position += offset;
    }

    public offset(): number {
        return this.newSize! - this.origSize;
    }
    
}

export class UInt8Pointer extends AbstractPointer<number>{

    constructor(position: number, value: number){
        super(position, "uint8");
        this.origValue = value;
    }

    public read(byteSet: ByteSet): number {
        this.origValue = byteSet.readUInt8(this.position);
        return 1;
    }

    public write(byteSet: ByteSet): void {
        // not used
    }
}

export class UInt32Pointer extends AbstractPointer<number>{
    constructor(position: number, value: number){
        super(position, "uint32");
        this.origValue = value;
    }

    public read(byteSet: ByteSet): number {
        this.origValue = byteSet.readUInt32(this.position);
        return 4;
    }

    public write(byteSet: ByteSet): void {
        byteSet.writeUInt32(this.newValue!, this.position);
    }   
}

export class StringPointer extends AbstractPointer<string>{
    constructor(position: number, value: string){
        super(position, "str");
        this.origValue = value;
    }

    public read(byteSet: ByteSet): number {
        const length = byteSet.readUInt8(this.position);
        const value = byteSet.readString(this.position, length);
        this.origValue = value;
        this.origSize = getPaddedLength(value);
        return this.origSize;
    }

    public write(byteSet: ByteSet): void {
        const newLength = Buffer.alloc(1);
        newLength.writeUInt8(this.newValue!.length);
        const newStr = this.newValue!.padEnd(this.newSize! - 1, '\x00');
        byteSet.writeBytes(Buffer.concat([newLength, Buffer.from(newStr) ]), this.position);
    }   
}

export class UTF16Pointer extends AbstractPointer<Buffer>{
    constructor(position: number, value: Buffer){
        super(position, "utf16");
        this.origValue = value;
    }

    public read(byteSet: ByteSet): number {
        this.origValue = byteSet.readBytes(this.position, this.origSize);
        return this.origSize;
    }

    public write(byteSet: ByteSet): void {
        const newLength = Buffer.alloc(4);
        newLength.writeInt32BE( this.newSize! - 4);
        const newStr = this.newValue!.subarray(4);
        byteSet.writeBytes(Buffer.concat([ newLength, newStr ]), this.position);
    }
}