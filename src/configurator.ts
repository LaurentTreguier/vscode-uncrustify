import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as vsc from 'vscode';
import * as ext from './extension';
import * as logger from './logger';
import * as util from './util';

const typesMap = {
    string: ['text', /".*"/],
    number: ['number', /\d+/],
    'unsigned number': ['number', /\d+/],
    'false/true': ['checkbox', /false|true/],
    get: (key: string) => typesMap[key] || typesMap.string
};

export default class Configurator implements vsc.TextDocumentContentProvider {
    static oldConfig: any;

    provideTextDocumentContent(uri: vsc.Uri, token: vsc.CancellationToken) {
        return new Promise<string>((resolve) =>
            fs.readFile(util.configPath(), (err, data) => resolve(data.toString())))
            .then((config) => checkVersion(config)
                .then((rightVersion) => ({ config: config, rightVersion: rightVersion })))
            .then((result) => {
                logger.dbg('generating HTML');

                let resourcepath = path.join(ext.extContext.extensionPath, 'editor');
                let html = new Node('html');

                let head = new Node('head');
                let style = new Node('link', { rel: 'stylesheet', href: path.join(resourcepath, 'uncrustify.css') }, true);

                let body = new Node('body');
                let actions = new Node('div', { id: 'actions' });

                let searchForm = new Node('form', { id: 'searchForm' });
                let search = new Node('input', { id: 'search', type: 'text', placeholder: 'Search...' }, true);

                let save = new Node('h3', { _: 'SAVE', onclick: `action('save')` });
                let savePreset = new Node('h3', { _: 'SAVE PRESET', onclick: `action('savePreset')` });
                let upgrade = new Node('h3', { _: 'UPGRADE CONFIG', onclick: `action('upgrade')` });
                let form = new Node('form');
                let a = new Node('a', { id: 'a', display: 'none' });
                let script = new Node('script', { src: path.join(resourcepath, 'uncrustify.js') });

                html.children.push(head, body);
                head.children.push(style);
                body.children.push(actions, form, a, script);
                actions.children.push(searchForm, save, savePreset);
                searchForm.children.push(search);
                form.children = parseConfig(result.config);

                if (!result.rightVersion) {
                    actions.children.push(upgrade);
                }

                return '<!DOCTYPE html>' + html.toString();
            });
    }
}

class Node {
    children: Node[] = [];

    get tag() {
        return this._tag;
    }

    get data() {
        return this._data;
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
                props += ' ' + key;

                if (this._data[key] !== null && this._data[key] !== undefined) {
                    props += `="${this._data[key]}"`;
                }
            }
        }

        return `<${this._tag}${props}>${value}${this.children.map((n) => n.toString()).join('')}${this._autoclose ? '' : ('</' + this._tag + '>')}`;
    }
}

function extractVersion(line: string) {
    let match = line.match(/\buncrustify(?:\s+|-)(\S+)/i);
    return match ? match[1] : '0';
}

function checkVersion(config: string) {
    let version: string = null;
    let output = '';

    for (let line of config.split(/\r?\n/)) {
        if (line.match(/^#\s*uncrustify/i)) {
            version = extractVersion(line);
            break;
        } else if (line.length === 0) {
            break;
        }
    }

    if (!version) {
        return Promise.resolve(false);
    }

    return new Promise((resolve) => cp.spawn(util.executablePath(), ['--version'])
        .stdout
        .on('data', (data) => output += data.toString())
        .on('close', () => resolve(extractVersion(output))))
        .then((ver) => ver === version);
}

function parseConfig(config: string) {
    logger.dbg('parsing config');

    let nodes: Node[] = [];
    let table = new Node('table');
    let commentAccumulator = '';
    let instructionNode: Node;
    let customValue: any;

    config.split(/\r?\n/).forEach((line) => {
        if (line.length === 1) {
            return;
        }

        if (line.length === 0) {
            if (commentAccumulator.length && !instructionNode) {
                if (table.children.length) {
                    nodes.push(table);
                } else {
                    nodes.pop();
                }

                nodes.push(new Node('h2', { _: commentAccumulator, onclick: 'toggle(event)' }));
                table = new Node('table');
                commentAccumulator = '';
            }
        }

        if (instructionNode) {
            let tr = new Node('tr');
            let td: Node;
            let customNode = new Node('input', {
                type: 'text',
                name: instructionNode.data.name,
                placeholder: 'custom value',
                title: 'This raw value will override the normal one in the file'
            });

            if (Configurator.oldConfig) {
                td = new Node('td', {
                    _: Configurator.oldConfig[instructionNode.data.name] === undefined
                        ? 'NEW'
                        : '',
                    class: 'new-item'
                });
                tr.children.push(td);
            }

            if (customValue) {
                customNode.data.value = customValue;
            }

            td = new Node('td');
            td.children.push(new Node('p', instructionNode.data.name));
            tr.children.push(td);

            td = new Node('td');
            td.children.push(instructionNode);
            tr.children.push(td);

            td = new Node('td');
            td.children.push(customNode);
            tr.children.push(td);

            tr.children.push(new Node('td', commentAccumulator));
            table.children.push(tr);
            commentAccumulator = '';
            instructionNode = null;
        }

        let comment = line.match(/^#\s*(.*)/);
        let instruction = line.match(/^(\w+)\s*=\s*(\S+)(?:\s*#\s*(.*))?/);

        if (comment) {
            commentAccumulator += os.EOL + comment[1];
        } else if (instruction) {
            let instName = instruction[1];
            let instValue = instruction[2];
            let instComment = instruction[3];

            instructionNode = new Node('input', {
                type: typesMap[instComment] && typesMap[instComment][0],
                name: instName,
                placeholder: instComment
            });

            if (instructionNode.data.type === 'checkbox') {
                if (instValue === 'true') {
                    instructionNode.data.checked = null;
                }
            } else if (instructionNode.data.type && instValue.match(typesMap.get(instComment)[1])) {
                instructionNode.data.value = instValue.replace(/^"(.*)"$/, '$1');
            }

            customValue = instValue;

            if (!instructionNode.data.type) {
                let answers = instComment ? instComment.split('/') : [];

                if (answers.length > 1) {
                    instructionNode = new Node('select', { name: instName });
                    answers.forEach((answer) => {
                        let data: any = { _: answer, value: answer };

                        if (answer === instValue) {
                            data.selected = null;
                            customValue = null;
                        }

                        instructionNode.children.push(new Node('option', data));
                    });
                } else {
                    instructionNode.data.type = 'text';
                }
            } else if (instValue.match(typesMap.get(instruction[3])[1])) {
                customValue = null;
            }

            instructionNode.data['data-initial-value'] = instructionNode.data.value !== undefined ? instructionNode.data.value : instruction[2];
            instructionNode.data.onchange = 'inputChanged(this)';
            instructionNode.data.title = 'Current saved value: ' + instructionNode.data['data-initial-value'];
        }
    });

    if (table.children.length) {
        nodes.push(table);
    }

    if (nodes.length && nodes[nodes.length - 1].tag !== 'table') {
        nodes.pop();
    }

    return nodes;
}
