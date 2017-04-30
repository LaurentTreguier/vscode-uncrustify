import * as path from 'path';
import * as vsc from 'vscode';

export const ADDRESS = 'https://raw.githubusercontent.com/uncrustify/uncrustify/uncrustify-%VERSION%/documentation/htdocs/default.cfg';
export const CONFIG_FILE_NAME = 'uncrustify.cfg';
export const MODES = [
    'apex',
    'c',
    'cpp',
    'csharp',
    'd',
    'java',
    'objective-c',
    'pawn',
    'vala'
];

export function configPath() {
    return vsc.workspace.getConfiguration('uncrustify')
        .get<string>('configPath') || path.join(vsc.workspace.rootPath, CONFIG_FILE_NAME);
}

export function configUri(name = CONFIG_FILE_NAME, local = true) {
    return vsc.Uri.parse(`uncrustify://${local ? 'local' : 'global'}/` + name);
};
