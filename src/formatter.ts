import * as fs from 'fs'
import * as cp from 'child_process'
import * as vsc from 'vscode';
import * as logger from './logger';
import * as util from './util';

export default class Formatter implements vsc.DocumentFormattingEditProvider,
    vsc.DocumentRangeFormattingEditProvider,
    vsc.OnTypeFormattingEditProvider {
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
        if (util.useReplaceOption(document.uri)) {
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
            let output = '';
            let error = '';

            if (range) {
                args.push('--frag');
            }

            // This option helps you if the document saved as UTF8 with BOM, though not able to format it partially.
            if (util.useReplaceOption(document.uri)) {
                args.push('--replace');
                args.push('--no-backup');
                args.push(document.fileName);
            }

            let uncrustify = cp.spawn(util.executablePath(), args);
            logger.dbg(`launched: ${util.executablePath()} ${args.join(' ')}`);

            uncrustify.on('error', reject);
            uncrustify.on('exit', code => {
                logger.dbg('uncrustify exited with status: ' + code);
                if (code < 0) {
                    vsc.window.showErrorMessage('Uncrustify exited with error code: ' + code);
                    reject(code);
                }
            });

            uncrustify.stdout.on('data', data => output += data.toString());
            uncrustify.stdout.on('close', () => {
                if (output.length) {
                    let lastLine = document.lineCount - 1;
                    let lastCol = document.lineAt(lastLine).text.length;
                    resolve([new vsc.TextEdit(range || new vsc.Range(0, 0, lastLine, lastCol), output)]);
                }
                else {
                    reject();
                }
            });

            uncrustify.stderr.on('data', data => error += data.toString());
            uncrustify.stderr.on('close', () => logger.dbg('uncrustify exited with error: ' + error));

            if (!util.useReplaceOption(document.uri)) {
                uncrustify.stdin.end(document.getText(range));
            }
        });
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
