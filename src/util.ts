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

export function configUri(local = true, name = CONFIG_FILE_NAME) {
    return vsc.Uri.parse(`uncrustify://${local ? 'local' : 'global'}/` + name);
};
