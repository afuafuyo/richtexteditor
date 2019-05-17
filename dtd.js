(function() {

function DTD = function() {};
DTD.D = function(source, remove) {
    var ret = {};
    
    // clone
    for(var k in source) {
        ret[k] = source[k];
    }
    
    for(var k in remove) {
        delete ret[k];
    }
    
    return ret;
};
DTD.C = function(target, options) {
    var ret = {};
    
    for(var k in target) {
        ret[k] = target[k];
    }
    for(var k in options) {
        ret[k] = options[k];
    }
    
    return ret;
};
/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Block-level_elements
 */
DTD.$block = {
    address: 1, article: 1, aside: 1, blockquote: 1,
    details: 1, dialog: 1, dd: 1, div: 1, dl: 1, dt: 1,
    fieldset: 1, figcaption: 1, figure: 1, footer: 1, form: 1,
    h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1,
    header: 1, hgroup: 1, hr: 1,
    li: 1, main: 1, nav: 1, ol: 1, p: 1, pre: 1, section: 1, table: 1, ul: 1
};
DTD.$obsoleteBlock = {};
DTD.$inline = {
    a: 1, abbr: 1, audio: 1,
    b: 1, bdi: 1, bdo: 1, br: 1, button: 1, canvas: 1,
    cite: 1, code: 1, data: 1, datalist: 1, del: 1, dfn: 1,
    em: 1, embed: 1, i: 1, iframe: 1, img: 1, input: 1, ins: 1, kbd: 1, label: 1,
    map: 1, mark: 1, meter: 1, noscript: 1, object: 1, output: 1,
    picture: 1, progress: 1, q: 1, ruby: 1,
    s: 1, samp: 1, script: 1, select: 1, slot: 1, small: 1, span: 1,
        strong: 1, sub: 1, sup: 1, svg: 1,
    template: 1, textarea: 1, time: 1, u: 1, 'var': 1, video: 1, wbr: 1,
    '#': 1
};
DTD.$obsoleteInline = {
    acronym: 1, applet: 1, basefont: 1, big: 1, font: 1,
    isindex: 1, strike: 1, tt: 1
};

DTD.$allInline = DTD.C(DTD.$inline, DTD.$obsoleteInline);
DTD.dtd = {
    a: DTD.D(DTD.$allInline, {a: 1, button: 1}),
    abbr: DTD.$allInline,
    address: 
};


})();