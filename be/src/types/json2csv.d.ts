declare module 'json2csv' {
    export class Parser<T = any> {
        constructor(opts?: {
            fields?: string[];
            delimiter?: string;
            quote?: string;
            escapedQuote?: string;
            header?: boolean;
            eol?: string;
            excelStrings?: boolean;
            transforms?: any[];
            formatters?: any;
            defaultValue?: string;
        });
        parse(data: T | T[]): string;
    }
}
