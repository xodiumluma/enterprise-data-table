var LINUX_DISTROS = [
    'Manjaro',
    'MX Linux',
    'Mint',
    'elementary',
    'Ubuntu',
    'Debian',
    'Fedora',
    'Solus',
    'openSUSE',
    'Zorin',
    'ReactOS',
    'CentOS',
    'Arch',
    'KDE neon',
    'deepin',
    'antiX',
    'Antergos',
    'Kali',
    'Parrot',
    'Lite',
    'ArcoLinux',
    'FreeBSD',
    'Ubuntu Kylin',
    'Lubuntu',
    'SparkyLinux',
    'Peppermint',
    'SmartOS',
    'PCLinuxOS',
    'Mageia',
    'Endless',
]

var CITIES = [
    'Tokyo',
    'Jakarta',
    'Delhi',
    'Manila',
    'Seoul',
    'Shanghai',
    'Mumbai',
    'New York',
    'Beijing',
    'Sao Paulo',
    'Mexico City',
    'Guangzhou',
    'Dhaka',
    'Osaka-Kobe-Kyoto',
    'Moscow',
    'Cairo',
    'Bangkok',
    'Los Angeles',
    'Buenos Aires',
]

var LAPTOPS = [
    'Hewlett Packard',
    'Lenovo',
    'Dell',
    'Asus',
    'Apple',
    'Acer',
    'Microsoft',
    'Razer',
]

var idCounter = 0

function letter(i) {
    return 'abcdefghijklmnopqrstuvwxyz'.substring(i, i + 1)
}

function randomLetter() {
    return letter(Math.floor(Math.random() * 26 + 1))
}

function createDataItem(name, distro, laptop, city, value, idToUse = undefined) {

    const id = idToUse != null ? idToUse : idCounter++;
    return {
        id: id,
        name: name,
        city: city,
        distro: distro,
        laptop: laptop,
        value: value,
    }
}

function getData() {
    var myRowData = []
    for (var i = 0; i < 10000; i++) {
        var name =
            'Mr ' +
            randomLetter().toUpperCase() +
            ' ' +
            randomLetter().toUpperCase() +
            randomLetter() +
            randomLetter() +
            randomLetter() +
            randomLetter()
        var city = CITIES[i % CITIES.length]
        var distro =
            LINUX_DISTROS[i % LINUX_DISTROS.length] +
            ' v' +
            Math.floor(Math.random() * 100 + 1) / 10
        var university = LAPTOPS[i % LAPTOPS.length]
        var value = Math.floor(Math.random() * 100) + 10 // between 10 and 110        
        myRowData.push(
            createDataItem(name, distro, university, city, value)
        )
    }
    return myRowData;
}