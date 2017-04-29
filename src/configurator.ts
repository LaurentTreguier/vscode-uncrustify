import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as vsc from 'vscode';
import * as req from 'request';
import * as ext from './extension';
import * as util from './util';

export default class Configurator implements vsc.TextDocumentContentProvider {
    provideTextDocumentContent(uri: vsc.Uri, token: vsc.CancellationToken) {
        let configPath = path.join(vsc.workspace.rootPath, util.CONFIG_FILE_NAME);

        return new Promise<string>((resolve) =>
            fs.readFile(configPath, (err, data) => resolve(data.toString())))
            .then((config) => {
                let resourcepath = path.join(ext.extContext.extensionPath, 'src', 'editor');
                let html = new Node('html');
                let head = new Node('head');
                let style = new Node('link', { rel: 'stylesheet', href: path.join(resourcepath, 'uncrustify.css') }, true);
                let script = new Node('script', { src: path.join(resourcepath, 'uncrustify.js') });
                let body = new Node('body');
                let save = new Node('h3', { _: 'SAVE', id: 'save', onclick: 'save()' });
                let form = new Node('form');
                let a = new Node('a', { id: 'a', display: 'none' });

                html.children.push(head, body);
                head.children.push(style, script);
                body.children.push(save, form, a);
                form.children = parseConfig(config);

                return '<!DOCTYPE html>' + html.toString();
            });
    }
}

class Node {
    children: Node[] = [];

    get tag() {
        return this._tag;
    }

    constructor(private _tag: string, private _data = null, private _autoclose = false) { }

    toString() {
        let props = '';
        let value: String = '';

        if (typeof this._data === 'string' || this._data instanceof String) {
            value = this._data;
        } else if (this._data) {
            if (this._data._) {
                value = this._data._;
                delete this._data._;
            }

            for (let key in this._data) {
                props += ` ${key}="${this._data[key]}"`;
            }
        }

        return `<${this._tag}${props}>${value}${this.children.map((n) => n.toString()).join('')}${this._autoclose ? '' : ('</' + this._tag + '>')}`;
    }
}

function parseConfig(config: string) {
    let nodes: Node[] = [];
    let table = new Node('table');
    let commentAccumulator = '';
    let instructionAccumulator;

    config.split(/\r?\n/).forEach((line) => {
        if (line.length <= 1) {
            if (line.length === 0) {
                if (commentAccumulator.length !== 0 && !instructionAccumulator) {
                    if (table.children.length) {
                        nodes.push(table);
                    } else {
                        nodes.pop();
                    }

                    nodes.push(new Node('h2', commentAccumulator));
                    table = new Node('table');
                }

                if (instructionAccumulator) {
                    let tr = new Node('tr');
                    let td = new Node('td');

                    instructionAccumulator.title = commentAccumulator;
                    td.children.push(new Node('p', instructionAccumulator.name));
                    tr.children.push(td);
                    td = new Node('td');
                    td.children.push(new Node('input', instructionAccumulator));
                    tr.children.push(td);
                    table.children.push(tr);
                }

                commentAccumulator = '';
                instructionAccumulator = null;
            }

            return;
        }

        let comment = line.match(/^#\s*(.*)/);
        let instruction = line.match(/^(\w+)\s*=\s*(\S+)\s*#\s*(.*)/);

        if (comment) {
            commentAccumulator += os.EOL + comment[1];
        } else if (instruction) {
            instructionAccumulator = {
                type: 'text',
                name: instruction[1],
                value: instruction[2],
                placeholder: instruction[3]
            };
        }
    });

    if (nodes[nodes.length - 1].tag !== 'table') {
        nodes.pop();
    }

    return nodes;
}
