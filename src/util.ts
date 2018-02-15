import * as path from 'path';
import * as vsc from 'vscode';

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
    'pde',
    'vala'
];

export function configPath() {
    let folder = vsc.window.activeTextEditor
        ? vsc.workspace.getWorkspaceFolder(vsc.window.activeTextEditor.document.uri)
        : vsc.workspace.workspaceFolders && vsc.workspace.workspaceFolders[0];
    let p = vsc.workspace.getConfiguration('uncrustify')
        .get<string>('configPath') || path.join(folder.uri.fsPath, CONFIG_FILE_NAME);

    p = p.replace(/(%\w+%)|(\$\w+)/, (variable) => {
        let end = variable.startsWith('%') ? 2 : 1;
        return process.env[variable.substr(1, variable.length - end)];
    });

    if (!path.isAbsolute(p)) {
        p = path.join(folder.uri.fsPath, p);
    }

    return p;
}

export function executablePath() {
    return vsc.workspace.getConfiguration('uncrustify').get('executablePath', 'uncrustify') || 'uncrustify';
}

export function configUri() {
    return vsc.Uri.parse('uncrustify://configuration');
};
