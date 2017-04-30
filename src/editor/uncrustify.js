function save() {
    var config = {};

    for (var input of document.getElementsByTagName('input')) {
        switch (input.type) {
            case 'number':
                config[input.name] = Number.parseInt(input.value);
                break;
            case 'checkbox':
                config[input.name] = input.checked;
                break;
            default:
                config[input.name] = '"' + input.value + '"';
                break;
        }
    }

    for (var input of document.getElementsByTagName('select')) {
        config[input.name] = input.value;
    }

    var a = document.getElementById('a');

    a.href = encodeURI('command:uncrustify.save?' + JSON.stringify(config));
    a.click();
}

function toggle(event) {
    var titles = document.getElementsByTagName('h2');
    var tables = document.getElementsByTagName('table');
    var table = tables[Array.from(titles).indexOf(event.srcElement)];

    table.style.display = table.style.display !== 'initial' ? 'initial' : 'none';
}