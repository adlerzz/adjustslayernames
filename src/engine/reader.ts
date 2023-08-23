import { HEADER_SIGNATURE } from "../utils/consts";
import { Mapper } from "./mapper";
import { Pointer } from "./pointer";

export class Reader {
    private f: Mapper;

    constructor(fileMap: Mapper){
        this.f = fileMap;
    }

    public readFileHeader(): void {
        const signature = this.f.readBytes(4).toString();
        if(signature !== HEADER_SIGNATURE) {
            throw new Error("Bad format");
        }
        const version = this.f.readUInt16();
        if(version === 1){

        }
        else if(version === 2) {
            throw new Error("Unsupported file format (PSB)");
        } else {
            throw new Error("Bad version");
        }
        this.f.moveOn(20);
    }

    public readColorModeData(): void {
        const colorDataLength = this.f.readUInt32();
        this.f.moveOn(colorDataLength);
    }

    public readImageResources(): void {
        const imgResLength = this.f.readUInt32();
        this.f.moveOn(imgResLength);
    }

    public readLayerPre(): [Pointer<number>, number] {
        this.f.moveOn(16);
        const channelCount = this.f.readUInt16();
        this.f.moveOn(channelCount * 6 + 12);
        const extraFieldsLen = this.f.markUInt32();
        const maskDataLength = this.f.readUInt32();
        this.f.moveOn(maskDataLength);
        const brDataLength = this.f.readUInt32();
        this.f.moveOn(brDataLength);
        const delta = 4 + maskDataLength + 4 + brDataLength;
        return [extraFieldsLen, delta];
    }
}