import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as u from 'util';
import * as temp from 'temp';
import * as vsc from 'vscode';
import * as logger from './logger';
import * as util from './util';

temp.track();

export default class Formatter implements vsc.DocumentFormattingEditProvider,
    vsc.DocumentRangeFormattingEditProvider,
    vsc.OnTypeFormattingEditProvider {
    private tempDir: string = null
    private tempFileName: string = null

    public provideDocumentFormattingEdits(
        document: vsc.TextDocument,
        options: vsc.FormattingOptions,
        token: vsc.CancellationToken
    ) {
        return this.format(document, null, options, token);
    }

    public provideDocumentRangeFormattingEdits(
        document: vsc.TextDocument,
        range: vsc.Range,
        options: vsc.FormattingOptions,
        token: vsc.CancellationToken
    ) {
        return this.format(document, range, options, token);
    }

    public provideOnTypeFormattingEdits(document: vsc.TextDocument,
        position: vsc.Position,
        ch: string,
        options: vsc.FormattingOptions,
        token: vsc.CancellationToken
    ) {
        return this.format(document, new vsc.Range(new vsc.Position(0, 0), position), options, token);
    }

    private async format(
        document: vsc.TextDocument,
        range: vsc.Range,
        options: vsc.FormattingOptions,
        token: vsc.CancellationToken
    ): Promise<vsc.TextEdit[]> {
        const configuration = vsc.workspace.getConfiguration("uncrustify", document.uri);
        const useTempFile = configuration.get('useTempFile');
        const useReplaceOption = configuration.get('useReplaceOption');
        const useDirectFile = useTempFile || useReplaceOption;

        if (useTempFile) {
            if (this.tempDir == null) {
                this.tempDir = await u.promisify(temp.mkdir)(vsc.env.appName + '.' + "uncrustify");
                logger.dbg('temporary directory: ' + this.tempDir);
            }

            this.tempFileName = path.join(this.tempDir, path.basename(document.fileName));
            logger.dbg('temporary file: ' + this.tempFileName);
            await u.promisify(fs.writeFile)(this.tempFileName, document.getText());
        } else if (useReplaceOption) {
            await document.save();
        }

        return await new Promise((resolve, reject) => {
            token.onCancellationRequested(reject);
            let configPath = util.configPath();
            logger.dbg('config file: ' + configPath);

            try {
                fs.accessSync(configPath);
            }
            catch (err) {
                logger.dbg('error accessing config file: ' + err);
                vsc.window.showErrorMessage('The uncrustify config file path is incorrect: ' + configPath);
                reject(err);
                return;
            }

            let args = ['-l', languageMap[document.languageId], '-c', configPath];
            let output = Buffer.alloc(0);
            let error = '';

            if (range) {
                args.push('--frag');
            }

            // This option helps you if the document saved as UTF8 with BOM, though not able to format it partially.
            if (useDirectFile) {
                args.push('--replace');
                args.push('--no-backup');
                args.push(useTempFile ? this.tempFileName : document.fileName);
            }

            const uncrustify = cp.spawn(util.executablePath(), args);
            const text = document.getText(range);
            logger.dbg(`launched: ${util.executablePath()} ${args.join(' ')}`);

            uncrustify.on('error', reject);
            uncrustify.on('exit', async code => {
                logger.dbg('uncrustify exited with status: ' + code);

                if (code < 0) {
                    vsc.window.showErrorMessage('Uncrustify exited with error code: ' + code);
                    reject(code);
                } else if (useTempFile) {
                    const result = await u.promisify(fs.readFile)(this.tempFileName);
                    resolve([new vsc.TextEdit(this.getRange(document, range), result.toString())]);
                } else if (useReplaceOption) {
                    resolve();
                }
            });

            uncrustify.stdout.on('data', data => output = Buffer.concat([output, Buffer.from(data)]));
            uncrustify.stdout.on('close', () => {
                const result = output.toString();

                if (result.length == 0 && text.length > 0) {
                    reject();
                } else if (!useDirectFile) {
                    resolve([new vsc.TextEdit(this.getRange(document, range), result)]);
                }
            });

            uncrustify.stderr.on('data', data => error += data.toString());
            uncrustify.stderr.on('close', () => logger.dbg('uncrustify exited with error: ' + error));

            if (!useDirectFile) {
                uncrustify.stdin.end(text);
            }
        });
    }

    private getRange(document: vsc.TextDocument, range: vsc.Range): vsc.Range {
        let lastLine = document.lineCount - 1;
        let lastCol = document.lineAt(lastLine).text.length;
        return range || new vsc.Range(0, 0, lastLine, lastCol);
    }
};

const langOverrides = vsc.workspace.getConfiguration('uncrustify').get('langOverrides');

const languageMap = Object.assign(
    {
        c: 'C',
        cpp: 'CPP',
        csharp: 'CS',
        d: 'D',
        java: 'JAVA',
        'objective-c': 'OC',
        pawn: 'PAWN',
        pde: 'JAVA',
        vala: 'VALA'
    },
    langOverrides
);
