import PromptSync from "prompt-sync";
import fs from "fs";
import path from "path";
import * as utils from "./engine/utils";
import { ActionComposer } from "./engine/action-composer";
const prompt = PromptSync({sigint: true});

function main(): void {
    const args = process.argv;
    console.log(args);
    if(args.length < 3){
        console.error("No input file")
        return;
    }

    const inputFile = args[2];
    console.log({inputFile});

    //let fileContent = fs.readFileSync(inputFile);
    const parsedPath = path.parse(inputFile);

    //fileContent = testingTest(fileContent);
    //fileContent = anotherTest(fileContent);

    const outputFile = (args.length > 3)
        ? args[3] 
        : parsedPath.dir + parsedPath.name + "_handled" + parsedPath.ext
    ;

    const flow = new ActionComposer();
    flow.doRead(inputFile);
    flow.doTranslate();
    flow.doShifts();
    flow.doWrite(outputFile);


    //fs.writeFileSync(outputFile, fileContent);
    
}

function testingTest(content: Buffer): Buffer {
    const offset = 9;
    const step = 4;
    const sizeRaw = content.subarray(offset, offset + step).readIntBE(0, step);
    console.log({sizeRaw});
    const sizeTyped = content.subarray(offset, offset + step).readInt32BE();
    console.log({sizeTyped});
    content.writeInt32BE(4, offset);
    const newContent = utils.spliceBuffer(content, offset + step, offset + step * 4, Buffer.from("eee!", "utf16le"))
    return newContent;
}

function anotherTest() {
    const b = fs.readFileSync(process.argv[2]);
    const t = utils.win1251BufferToString(b);
    console.log({b, t});
}

//anotherTest();

main();

prompt("Enter to exit");