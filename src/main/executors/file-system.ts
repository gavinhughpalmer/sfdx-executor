import { fs } from '@salesforce/core';
import { NotYetSupportedError, Task } from '../task';
import { replaceAll } from '../utilities';

async function replace(lexer: Lexer): Promise<void> {
    const term = lexer.getNextToken();
    lexer.getNextToken(); // with
    const replacement = lexer.getNextToken();
    lexer.getNextToken(); // in
    const filePath = lexer.getNextToken();
    endInput(lexer);
    let fileContents = await fs.readFile(filePath.value, 'utf8');
    fileContents = replaceAll(fileContents, term.value, replacement.value);
    await fs.writeFile(filePath.value, fileContents);
}

async function move(lexer: Lexer): Promise<void> {
    const fromLocation = lexer.getNextToken();
    lexer.getNextToken(); // to
    const toLocation = lexer.getNextToken();
    endInput(lexer);
    const contents = await fs.readFile(fromLocation.value, 'utf8');
    await fs.writeFile(toLocation.value, contents);
    await fs.unlink(fromLocation.value);
}

async function deleteFile(lexer: Lexer): Promise<void> {
    const fileName = lexer.getNextToken(); // TODO do we need to validate the input type
    endInput(lexer);
    await fs.unlink(fileName.value);
}

async function append(lexer: Lexer): Promise<void> {
    const content = lexer.getNextToken();
    lexer.getNextToken(); // to
    const filePath = lexer.getNextToken();
    endInput(lexer);
    await fs.writeFile(filePath.value, content.value, { flag: 'a' });
}

async function write(lexer: Lexer): Promise<void> {
    const content = lexer.getNextToken();
    lexer.getNextToken(); // to
    const filePath = lexer.getNextToken();
    endInput(lexer);
    await fs.writeFile(filePath.value, content.value);
}

function endInput(lexer: Lexer) {
    const endOfInput = lexer.getNextToken();
    if (endOfInput.type !== TokenType.EoF) {
        throw new Error(`Expected end of input, recieved ${endOfInput.value}`);
    }
}

const functions = {
    replace,
    move,
    delete: deleteFile,
    append,
    write
};

export function resolveFsTask(task: Task): Promise<void> {
    if (!task.command) {
        return Promise.reject('The command must be specifid for a file system type task');
    }

    return excute(task.command);
}

async function excute(command: string): Promise<void> {
    const lexer = new Lexer(command);
    const functionToken = lexer.getNextToken();
    if (functionToken.type === TokenType.EoF) {
        throw new Error('Unexpected end of input');
    }
    if (!functions.hasOwnProperty(functionToken.value)) {
        throw new NotYetSupportedError(`The function ${functionToken.value} is not supported`);
    }
    const functionCall = functions[functionToken.value];

    return functionCall(lexer);
}

class Lexer {
    private static readonly quoteChar = "'";
    private static readonly splitChar = ' ';
    private readonly splitText: string[];
    private wordPosition: number;
    private currentWord: string;

    public constructor(text: string) {
        this.splitText = text.split(Lexer.splitChar);
        this.currentWord = this.getCurrentWord();
    }

    public getNextToken(): Token {
        this.advance();
        while (this.currentWord != undefined) {
            if (this.currentWord.startsWith(Lexer.quoteChar)) {
                return { type: TokenType.Term, value: this.findFullTerm() };
            }

            return { type: TokenType.Term, value: this.currentWord };
        }

        return { type: TokenType.EoF, value: null };
    }

    private getCurrentWord(): string {
        return this.splitText[this.wordPosition];
    }

    private findFullTerm(): string {
        let fullTerm = this.currentWord.substring(1, this.currentWord.length);
        while (this.currentWord !== null && !this.currentWord.endsWith(Lexer.quoteChar)) {
            this.advance();
            fullTerm += Lexer.splitChar + this.currentWord;
        }

        return fullTerm.substring(0, fullTerm.length - 1);
    }

    private advance() {
        this.wordPosition = this.wordPosition !== undefined ? this.wordPosition + 1 : 0;
        if (this.wordPosition >= this.splitText.length) {
            this.currentWord = null;
        } else {
            this.currentWord = this.getCurrentWord();
        }
    }
}

interface Token {
    type: TokenType;
    // tslint:disable-next-line:no-any
    value: any;
}
enum TokenType {
    Term,
    EoF
}
