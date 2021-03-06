import * as path from 'path';
import * as vsc from 'vscode';

export const CONFIG_FILE_NAME = 'uncrustify.cfg';

const DEFAULT_MODES = [
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
const PLATFORM_SUFFIX = PLATFORM_NAMES[process.platform];

export function modes() {
    const overrides = vsc.workspace.getConfiguration('uncrustify').get<Object>('langOverrides', {});
    return DEFAULT_MODES.concat(Object.getOwnPropertyNames(overrides));
}

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

    const workspaces = vsc.workspace.workspaceFolders || [];

    if (!folderUri && workspaces.length > 0) {
        folderUri = workspaces[0].uri;
    }

    let config = vsc.workspace.getConfiguration('uncrustify', folderUri);
    let p = config.get<string>('configPath' + PLATFORM_SUFFIX)
        || path.join(folderUri.fsPath, CONFIG_FILE_NAME);

    p = p
        .replace(/(%\w+%)|(\$\w+)/g, variable => {
            let end = variable.startsWith('%') ? 2 : 1;
            return process.env[variable.substr(1, variable.length - end)];
        })
        .replace(/\$\{workspaceFolder:(.*?)\}/, (_, name) =>
            vsc.workspace.workspaceFolders.find(wf => wf.name == name).uri.fsPath);

    if (!path.isAbsolute(p)) {
        p = path.join(folderUri.fsPath, p);
    }

    return p;
}

export function executablePath(useDefaultValue: boolean = true) {
    const config = vsc.workspace.getConfiguration('uncrustify');
    const defValue = useDefaultValue ? DEFAULT_PATH : null;
    return config.get('executablePath' + PLATFORM_SUFFIX, defValue) || defValue;
}

export function configUri() {
    return vsc.Uri.parse('uncrustify://configuration');
};
