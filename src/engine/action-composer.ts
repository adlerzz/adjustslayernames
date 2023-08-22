import { Mapper } from "./mapper";
import { Pointer } from "./pointer";
import { Reader } from "./reader";
import { WritePointer } from "./write-pointer";
import * as utils from "./utils";

export class ActionComposer {
    private _filemap: Mapper;
    private _pLayerAndMaskDataLength: Pointer<number>;
    private _pLayerDataLength: Pointer<number>;
    private _layerNames = new Map<string, number>;
    private _layerPointers: Array<[Pointer<number>, Pointer<string>, Pointer<Buffer>]> = [];
    private _layerWPointers: Array<WritePointer<number|Buffer|string>> = [];
    private _wpLayerAndMaskDataLength: WritePointer<number>;
    private _wpLayerDataLength: WritePointer<number>;

    private static readonly DUPLICATE_SUFFIX = "_DUP_";
    private static readonly VALID_LAYER_SIGNATURES = ["8BIM", "8B64"];

    public doRead(filename: string): void {
        console.info(`start reading with "${filename}"`);
        this._filemap = new Mapper(filename);
        const reader = new Reader(this._filemap);
        reader.readFileHeader();
        reader.readColorModeData();
        reader.readImageResources();

        this._pLayerAndMaskDataLength = this._filemap.markUInt32();
        this._pLayerDataLength = this._filemap.markUInt32();
        const layerCount = Math.abs(this._filemap.readInt16());

        for(let i=0; i<layerCount; i++){
            const [extraFieldsLen, delta] = reader.readLayerPre();
            const layerName = this._filemap.markStr();
            
            let shift = extraFieldsLen.value - delta - layerName.size;

            while(shift > 8){
                const aSignature = this._filemap.readBytes(4).toString();
                if(!ActionComposer.VALID_LAYER_SIGNATURES.includes(aSignature)){
                    throw new Error("File is corrupted");
                }

                const aKey = this._filemap.readBytes(4).toString();
                const aValue = this._filemap.markUTF16();
                if(aKey === "luni"){
                    const uLayerName = aValue.value
                        .subarray(4)
                        .swap16()
                        .toString("utf16le")
                        .replace(/\x00+$/, "");
                    const newLayerName = utils.transliterate(uLayerName);
                    if(!newLayerName.startsWith("</")){
                        if(this._layerNames.has(newLayerName)){
                            this._layerNames.set(newLayerName, this._layerNames.get(newLayerName)! + 1);
                        } else {
                            this._layerNames.set(newLayerName, 1);
                        }
                        this._layerPointers.push([extraFieldsLen, layerName, aValue]);
                    }
                }

                shift -= 8 + aValue.size;

            }
        }

    }

    public doTranslate(){
        this._layerPointers.forEach( (ptrs) => {
            const [extra, layer, uLayer] = ptrs;
            let newLayerName = utils.transliterate(layer.value);
            const repeats = this._layerNames.get(newLayerName)!;
            this._layerNames.set(newLayerName, repeats - 1);
            if(repeats > 1){
                newLayerName += ActionComposer.DUPLICATE_SUFFIX + repeats;
            }

            const wpLayerName = new WritePointer(layer, newLayerName, utils.getPaddedLength(newLayerName));

            const ubl = Buffer.alloc(4);
            ubl.writeInt32BE(newLayerName.length);
            const ubb = Buffer.alloc(newLayerName.length*2);

            ubb.write(newLayerName, "utf16le");
            ubb.swap16();
            const ube = Buffer.alloc(2, 0);
            const ub = Buffer.concat([ubl, ubb, ube]);
            const ul = Buffer.alloc(4);
            ul.writeInt16BE( ul.byteLength );

            const wpUName = new WritePointer(uLayer, Buffer.concat([ul, ub]), ub.byteLength + 4);
            const wpExtra = new WritePointer(extra, extra.value + wpLayerName.offset() + wpUName.offset(), extra.size);

            this._layerWPointers.push(wpExtra, wpLayerName, wpUName);

        });
    }

    public doShifts(){
        const sum = this._layerWPointers.reduce( (sh, p) => {
            p.shift(sh);
            return sh + p.offset();
        }, 0);

        console.log(`Summary size shift : ${sum}`);

        this._wpLayerAndMaskDataLength = new WritePointer(this._pLayerAndMaskDataLength, this._pLayerAndMaskDataLength.value + sum, this._pLayerAndMaskDataLength.size)
        this._wpLayerDataLength = new WritePointer(this._pLayerDataLength, this._pLayerDataLength.value + sum, this._pLayerDataLength.size);
    }

    public doWrite(filename: string){
        this._filemap.writePointer(this._wpLayerAndMaskDataLength);
        this._filemap.writePointer(this._wpLayerDataLength);

        let counter = 1;
        const allOf = this._layerWPointers.length;

        this._layerWPointers.forEach( (p) => {
            this._filemap.writePointer(p);
            console.log(`${counter} of ${allOf}`);
            counter++;
        });
        this._filemap.save(filename);
    }
}