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

    if (!path.isAbsolute(p)) {
        p = path.join(folder.uri.fsPath, p);
    }

    return p;
}

export function configUri() {
    return vsc.Uri.parse('uncrustify://configuration');
};
