import PromptSync from "prompt-sync";
import path from "path";
import { Flow } from "./engine/flow";
import { DEFAULT_OUTPUT_SUFFIX } from "./utils/consts";
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

    const parsedPath = path.parse(inputFile);

    const outputFile = (args.length > 3)
        ? args[3] 
        : parsedPath.dir + parsedPath.name + DEFAULT_OUTPUT_SUFFIX + parsedPath.ext
    ;

    const flow = new Flow();
    flow.doRead(inputFile);
    flow.doTranslate();
    flow.doShifts();
    flow.doWrite(outputFile);
    
}

main();

prompt("Enter to exit");