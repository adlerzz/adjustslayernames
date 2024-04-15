import * as consts  from "../helpers/consts";
import { Mapper } from "./mapper";
import { Pointer } from "./pointer";
import * as utils from "../helpers/utils";

export class Reader {
    private f: Mapper;

    constructor(fileMap: Mapper){
        this.f = fileMap;
    }

    public readFileHeader(): void {
        const signature = this.f.readBytes(4).toString();
        if(signature !== consts.HEADER_SIGNATURE) {
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
        const pExtraFieldsLength = this.f.markUInt32();
        const maskDataLength = this.f.readUInt32();
        this.f.moveOn(maskDataLength);
        const brDataLength = this.f.readUInt32();
        this.f.moveOn(brDataLength);
        const delta = 8 + maskDataLength + brDataLength;
        return [pExtraFieldsLength, delta];
    }

    public readLayerData(layerNamesMap: Map<string, number>, shift: number, callback: (pSize: Pointer<number>, pUName: Pointer<Buffer>) => void): void {

        while(shift > 12){
            const aSignature = this.f.readBytes(4).toString();
            
            if(!consts.VALID_LAYER_SIGNATURES.includes(aSignature)){
                throw new Error("File is corrupted");
            }

            const layerDataKey = this.f.readBytes(4).toString();
            const pLayerDataSize = this.f.markUInt32();

            if(layerDataKey === consts.UNICODE_LAYER_NAME){
                const pLayerUName = this.f.markUTF16(pLayerDataSize.value);
                const uLayerName = pLayerUName.value
                    .swap16()
                    .toString("utf16le")
                    .replace(/\x00+$/, "")
                    .slice(2);
                const newLayerName = utils.transliterate(uLayerName);
                if(!newLayerName.startsWith("</")){
                    utils.count(layerNamesMap, newLayerName);
                    callback(pLayerDataSize, pLayerUName);
                }
            } else {
                this.f.moveOn(pLayerDataSize.value);    
            }
            shift -= 12 + pLayerDataSize.value;
        }

    }
}