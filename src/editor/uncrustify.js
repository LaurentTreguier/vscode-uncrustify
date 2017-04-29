function save() {
    var config = {};

    for (var input of document.getElementsByTagName('input')) {
        config[input.name] = input.value;
    }

    var a = document.getElementById('a');

    a.href = encodeURI('command:uncrustify.save?' + JSON.stringify(config));
    a.click();
}