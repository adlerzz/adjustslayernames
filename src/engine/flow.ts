import { Mapper } from "./mapper";
import { Pointer } from "./pointer";
import { Reader } from "./reader";
import { WritePointer } from "./write-pointer";
import * as utils from "../helpers/utils";
import * as consts from "../helpers/consts";

export class Flow {
    private _filemap: Mapper;
    private _pLayerAndMaskDataLength: Pointer<number>;
    private _pLayerDataLength: Pointer<number>;
    private _layerNames = new Map<string, number>;
    private _layerPointers: Array<[Pointer<number>, Pointer<string>, Pointer<number>, Pointer<Buffer>]> = [];
    private _layerWPointers: Array<WritePointer<number|Buffer|string>> = [];
    private _wpLayerAndMaskDataLength: WritePointer<number>;
    private _wpLayerDataLength: WritePointer<number>;

    public doRead(filename: string): void {
        console.info(`reading with "${filename}"`);
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
            
            const shift = extraFieldsLen.value - delta - layerName.size;

            reader.readLayerData(this._layerNames, shift, (layerUNameSize, layerUName) => {
                this._layerPointers.push([extraFieldsLen, layerName, layerUNameSize, layerUName]);
            });
        }
    }

    public doTranslate(){
        console.info(`translating...`);
        this._layerPointers.forEach( (ptrs) => {
            const [extraFieldsLen, layerName, layerUNameSize, layerUName] = ptrs;
            let newLayerName = utils.transliterate(layerName.value);
            const repeats = this._layerNames.get(newLayerName) ?? 0;
            this._layerNames.set(newLayerName, repeats - 1);
            if(repeats > 1){
                newLayerName += consts.DUPLICATE_SUFFIX + repeats;
                console.log( `$'${newLayerName}'`);
            }

            const wpLayerName = new WritePointer(layerName, newLayerName, utils.getPaddedLength(newLayerName));

            const [uNameSize, bUName] = utils.uNameToBytes(newLayerName);
            const wpLayerUNameSize = new WritePointer(layerUNameSize, uNameSize, layerUNameSize.size);
            const wpLayerUName = new WritePointer(layerUName, bUName, bUName.byteLength);
            const wpExtra = new WritePointer(extraFieldsLen, extraFieldsLen.value + wpLayerName.offset() + wpLayerUName.offset(), extraFieldsLen.size);

            this._layerWPointers.push(wpExtra, wpLayerName, wpLayerUNameSize, wpLayerUName);
        });
    }

    public doShifts(){
        console.info(`changes calculating...`);
        const sum = this._layerWPointers.reduce( (sh, ptr) => {
            ptr.shift(sh);
            return sh + ptr.offset();
        }, 0);

        console.log(`summary size shift : ${sum}`);

        this._wpLayerAndMaskDataLength = new WritePointer(this._pLayerAndMaskDataLength, this._pLayerAndMaskDataLength.value + sum, this._pLayerAndMaskDataLength.size)
        this._wpLayerDataLength = new WritePointer(this._pLayerDataLength, this._pLayerDataLength.value + sum, this._pLayerDataLength.size);
    }

    public doWrite(filename: string){
        console.info(`changes applying...`);
        this._filemap.writePointer(this._wpLayerAndMaskDataLength);
        this._filemap.writePointer(this._wpLayerDataLength);

        let counter = 1;
        const allOf = this._layerWPointers.length;

        this._layerWPointers.forEach( (pointer) => {
            this._filemap.writePointer(pointer);
            console.log(`${counter} of ${allOf}`);
            counter++;
        });
        console.info(`writing to "${filename}"`);
        this._filemap.save(filename);
    }
}