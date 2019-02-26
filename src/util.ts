import * as path from 'path';
import * as vsc from 'vscode';

export const CONFIG_FILE_NAME = 'uncrustify.cfg';
export const MODES = [
    'apex',
    'apex-anon',
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
    let folderPath: string;
    const textEditors = [vsc.window.activeTextEditor];
    textEditors.push(...vsc.window.visibleTextEditors);

    for (let textEditor of textEditors.filter(e => e)) {
        let workspace: vsc.WorkspaceFolder;

        if (workspace = vsc.workspace.getWorkspaceFolder(textEditor.document.uri)) {
            folderPath = workspace.uri.fsPath;
            break;
        }
    }

    if (!folderPath && vsc.workspace.workspaceFolders.length > 0) {
        folderPath = vsc.workspace.workspaceFolders[0].uri.fsPath;
    }

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
