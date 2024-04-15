import fs from "fs";
import { spliceBuffer, win1251BufferToString } from "../helpers/utils";

export class ByteSet {
    private buffer: Buffer;

    constructor(filename: string){
        this.buffer = fs.readFileSync(filename);
    }

    public readUInt8(position: number): number {
        return this.buffer.readUInt8(position);
    }
    
    public readUInt32(position: number): number {
        return this.buffer.readUInt32BE(position);
    }

    public writeUInt32(position: number, value: number): void {
        this.buffer.writeUInt32BE(value, position);
    }

    public readString(position: number, length: number): string {
        return win1251BufferToString(this.buffer.subarray(position, position + length));
    }

    public readBytes(position: number, length: number): Buffer {
        return this.buffer.subarray(position, position + length);
    }

    public writeBytes(value: Buffer, position: number): void {
        this.buffer = spliceBuffer(this.buffer, position, position + value.length, value);
    }

    public save(filename: string): void {
        fs.writeFileSync(filename, this.buffer);
    }

}