function getPadLength(givenLength: number): number {
    return ( 4 - (givenLength + 1) % 4) % 4;
}

export function getPaddedLength(str: string): number {
    return 1 + str.length + getPadLength(str.length);
}

export function spliceBuffer(buffer: Buffer, from: number, to: number, newData: Buffer): Buffer {
    return Buffer.concat([
        buffer.slice(0, from),
        newData,
        buffer.slice(to, buffer.byteLength)
    ]);
}

const ANSI_TRANSLIT_MAP = {
    0xA8: "Ё", 0xB8: "ё",
    0xC0: "А", 0xC1: "Б", 0xC2: "В", 0xC3: "Г",
    0xC4: "Д", 0xC5: "Е", 0xC6: "Ж", 0xC7: "З",
    0xC8: "И", 0xC9: "Й", 0xCA: "К", 0xCB: "Л",
    0xCC: "М", 0xCD: "Н", 0xCE: "О", 0xCF: "П",
    0xD0: "Р", 0xD1: "С", 0xD2: "Т", 0xD3: "У",
    0xD4: "Ф", 0xD5: "Х", 0xD6: "Ц", 0xD7: "Ч",
    0xD8: "Ш", 0xD9: "Ш", 0xDA: "Ъ", 0xDB: "Ы",
    0xDC: "Ь", 0xDD: "Э", 0xDE: "Ю", 0xDF: "Я",
    0xE0: "а", 0xE1: "б", 0xE2: "в", 0xE3: "г",
    0xE4: "д", 0xE5: "е", 0xE6: "ж", 0xE7: "з",
    0xE8: "и", 0xE9: "й", 0xEA: "к", 0xEB: "л",
    0xEC: "м", 0xED: "н", 0xEE: "о", 0xEF: "п",
    0xF0: "р", 0xF1: "с", 0xF2: "т", 0xF3: "у",
    0xF4: "ф", 0xF5: "х", 0xF6: "ц", 0xF7: "ч",
    0xF8: "ш", 0xF9: "щ", 0xFA: "ъ", 0xFB: "ы",
    0xFC: "ь", 0xFD: "э", 0xFE: "ю", 0xFF: "я"};

const UTF16_TRANSLIT_MAP = {
    "Ё": "Yo", "ё": "yo",  " ": "_",
    "А": "A",  "Б": "B",   "В": "V",  "Г": "G",
    "Д": "D",  "Е": "Ye",  "Ж": "Zh", "З": "Z",
    "И": "I",  "Й": "Yy",  "К": "K",  "Л": "L",
    "М": "M",  "Н": "N",   "О": "O",  "П": "P",
    "Р": "R",  "С": "S",   "Т": "T",  "У": "U",
    "Ф": "F",  "Х": "Kh",  "Ц": "Ts", "Ч": "Ch",
    "Ш": "Sh", "Щ": "Sch", "Ъ": "",   "Ы": "Yi",
    "Ь": "",   "Э": "E",   "Ю": "Yu", "Я": "Ya",
    "а": "a",  "б": "b",   "в": "v",  "г": "g",
    "д": "d",  "е": "ye",  "ж": "zh", "з": "z",
    "и": "i",  "й": "yy",  "к": "k",  "л": "l",
    "м": "m",  "н": "n",   "о": "o",  "п": "p",
    "р": "r",  "с": "s",   "т": "t",  "у": "u",
    "ф": "f",  "х": "kh",  "ц": "ts", "ч": "ch",
    "ш": "sh", "щ": "sch", "ъ": "",   "ы": "yi",
    "ь": "",   "э": "e",   "ю": "yu", "я": "ya"};

export function transliterate(text: string) {
    return text.trim().split("").map( ch => UTF16_TRANSLIT_MAP[ch] ?? ch).join("");
}

export type DataType = "uint" | "int" | "str" | "utf16";

export function win1251BufferToString(buffer: Buffer): string {
    return [...buffer].map( t => t > 0x7F ? ANSI_TRANSLIT_MAP[t] ?? "_" : String.fromCodePoint(t)).join("");
}
