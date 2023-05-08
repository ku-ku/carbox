const NULL_ID = "00000000-0000-0000-0000-000000000000";
import $moment from "moment";
$moment.locale("ru");


const MODES = {
    "none":     0,
    "default":  1,
    "loading":  2,
    "saving":   3,
    "success":  4,
    "search":   5,
    "error":    9
};

const SORT_MODES = {
    "modified": 0,
    "permit":   1,
    "govnum":   2
};


const MONTH_NAMES = [
    {id: 0, name: 'январь'},
    {id: 1, name: 'февраль'},
    {id: 2, name: 'март'},
    {id: 3, name: 'апрель'},
    {id: 4, name: 'май'},
    {id: 5, name: 'июнь'},
    {id: 6, name: 'июль'},
    {id: 7, name: 'август'},
    {id: 8, name: 'сентябрь'},
    {id: 9, name: 'октябрь'},
    {id: 10, name: 'ноябрь'},
    {id: 11, name: 'декабрь'}
];


/**
 * @param {String} val
 * @return {Boolean}
 */
const empty = val => {
    if (!!val){
        return /^$/.test(val);
    }
    return true;
};

const lookup = async addr => {
    const _addr = 'Россия, ' + addr.replace(/((\s|\,)+ул\.?)+/gi, ' ').replace(/(г\.)+/gi, '').split(" ").join(', ');
    console.log('addr', _addr);
    return $.getJSON({
                url: `https://nominatim.openstreetmap.org/search/?q=${ _addr }&accept-language=ru&limit=1&format=json`,
                crossDomain: true,
                timeout:5000
    });
};   //lookup


const shorting = name => {
    if ( empty(name) ){
        return "";
    }
    var s;
    try {
        const a = name.trim().split(/\s{1,}/g);
        a.forEach( (w, n) => {
            s = (n===0) ? w + " " : s + w.charAt(0) + ".";
        });
    } catch(e){
        s = name;
    }
    return s;
};


export {
    NULL_ID,
    MODES,
    SORT_MODES,
    MONTH_NAMES,
    empty,
    lookup,
    shorting
};
