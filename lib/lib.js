export let isDefined = x => !_.isUndefined(x);
export let noop = () => undefined;
export let msie = (function(){

    var undef,
        v = 3,
        div = document.createElement('div'),
        all = div.getElementsByTagName('i');

    while (
        div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
            all[0]
        );

    return v > 4 ? v : undef;

}());