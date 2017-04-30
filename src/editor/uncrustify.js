function save() {
    var config = {};

    for (var input of document.getElementsByTagName('input')) {
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