var titles = document.getElementsByTagName('h2');
var tables = document.getElementsByTagName('table');
var actions = document.getElementById('actions');
var searchForm = document.getElementById('searchForm');

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
    var table = tables[Array.from(titles).indexOf(event.srcElement)];
    table.style.display = table.style.display !== 'initial' ? 'initial' : 'none';
}

if (tables.length === 1) {
    tables[0].style.display = '';
}

actions.style.opacity = 1;
setTimeout(function () {
    actions.style.opacity = '';
}, 1500);

searchForm.addEventListener('submit', function (event) {
    var searchWords = search.value;

    for (var table of tables) {
        var trs = table.getElementsByTagName('tr');
        var numItems = trs.length;

        for (var tr of trs) {
            function searchMatcher(word) {
                return tr.children[0].children[0].textContent.match(new RegExp(word, 'i'));
            }

            if (searchWords.split(/\s/g).some(searchMatcher)) {
                tr.style.display = '';
            } else {
                tr.style.display = 'none';
                --numItems;
            }
        }

        if (titles.length) {
            var title = titles[Array.from(tables).indexOf(table)];
            title.style.display = numItems ? '' : 'none';
            table.style.display = numItems ? 'initial' : 'none';
        }
    }
});
