function action(which) {
    var config = {};

    for (var select of document.getElementsByTagName('select')) {
        config[select.name] = select.value;
    }

    for (var input of document.getElementsByTagName('input')) {
        switch (input.type) {
            case 'number':
                config[input.name] = Number.parseInt(input.value);
                break;
            case 'checkbox':
                config[input.name] = input.checked;
                break;
            default:
                if (input.title) {
                    if (input.value) {
                        config[input.name] = input.value;
                    }
                } else {
                    config[input.name] = `"${input.value}"`;
                }

                break;
        }
    }

    var a = document.getElementById('a');
    a.href = encodeURI(`command:uncrustify.${which}?` + JSON.stringify(config));
    a.click();
}

function toggle(event) {
    var titles = document.getElementsByTagName('h2');
    var tables = document.getElementsByTagName('table');
    var table = tables[Array.from(titles).indexOf(event.srcElement)];

    table.style.display = table.style.display !== 'initial' ? 'initial' : 'none';
}

let tables = document.getElementsByTagName('table');

if (tables.length === 1) {
    tables[0].style.display = 'initial';
}
