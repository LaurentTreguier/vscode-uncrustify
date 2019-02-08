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
    let folderPath = vsc.window.activeTextEditor
        ? vsc.workspace.getWorkspaceFolder(vsc.window.activeTextEditor.document.uri).uri.fsPath
        : (vsc.workspace.workspaceFolders && vsc.workspace.workspaceFolders.length > 0)
            ? vsc.workspace.workspaceFolders[0].uri.fsPath
            : vsc.workspace.rootPath;

    if (!folderPath) {
        return null;
    }

    let p = vsc.workspace.getConfiguration('uncrustify')
        .get<string>('configPath') || path.join(folderPath, CONFIG_FILE_NAME);

    p = p.replace(/(%\w+%)|(\$\w+)/g, variable => {
        let end = variable.startsWith('%') ? 2 : 1;
        return process.env[variable.substr(1, variable.length - end)];
    });

    if (!path.isAbsolute(p)) {
        p = path.join(folderPath, p);
    }

    return p;
}

export function executablePath() {
    return vsc.workspace.getConfiguration('uncrustify').get('executablePath', 'uncrustify') || 'uncrustify';
}

export function configUri() {
    return vsc.Uri.parse('uncrustify://configuration');
};

export function useReplaceOption() {
    return vsc.workspace.getConfiguration('uncrustify').get('useReplaceOption');
}
