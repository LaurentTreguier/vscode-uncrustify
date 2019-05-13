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

const DEFAULT_PATH = 'uncrustify';
const PLATFORM_NAMES = {
    'linux': '.linux',
    'darwin': '.osx',
    'win32': '.windows'
};

export function configPath() {
    let folderUri: vsc.Uri;
    const textEditors = [vsc.window.activeTextEditor];
    textEditors.push(...vsc.window.visibleTextEditors);

    for (let textEditor of textEditors.filter(e => e)) {
        let workspace: vsc.WorkspaceFolder;

        if (workspace = vsc.workspace.getWorkspaceFolder(textEditor.document.uri)) {
            folderUri = workspace.uri;
            break;
        }
    }

    if (!folderUri && vsc.workspace.workspaceFolders.length > 0) {
        folderUri = vsc.workspace.workspaceFolders[0].uri;
    }

    if (!folderUri) {
        return null;
    }

    let p = vsc.workspace.getConfiguration('uncrustify', folderUri)
        .get<string>('configPath') || path.join(folderUri.fsPath, CONFIG_FILE_NAME);

    p = p.replace(/(%\w+%)|(\$\w+)/g, variable => {
        let end = variable.startsWith('%') ? 2 : 1;
        return process.env[variable.substr(1, variable.length - end)];
    });

    if (!path.isAbsolute(p)) {
        p = path.join(folderUri.fsPath, p);
    }

    return p;
}

export function executablePath() {
    let platformSuffix = PLATFORM_NAMES[process.platform];
    const config = vsc.workspace.getConfiguration('uncrustify');
    return config.get('executablePath' + platformSuffix, DEFAULT_PATH)
        || config.get('executablePath', DEFAULT_PATH)
        || DEFAULT_PATH;
}

export function configUri() {
    return vsc.Uri.parse('uncrustify://configuration');
};

export function useReplaceOption() {
    return vsc.workspace.getConfiguration('uncrustify').get('useReplaceOption');
}
