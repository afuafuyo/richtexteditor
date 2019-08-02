/**
 * 工具
 */
export default class Tools {
    
    public static trimChar(str: string, character: string): string {
        if(character === str.charAt(0)) {
            str = str.substring(1);
        }
        if(character === str.charAt(str.length - 1)) {
            str = str.substring(0, str.length - 1);
        }
        
        return str;
    }

    public static ucFirst(str): string {
        let ret = str.charAt(0).toUpperCase();
        
        return ret + str.substring(1);
    }

    public static filterTags(str: string, allowed?: string): string {
        let tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
        let comments = /<!--[\s\S]*?-->/gi;
        
        str = str.replace(comments, '');
        
        if(undefined === allowed) {
            return str.replace(tags, '');
        }
        
        allowed = allowed.toLowerCase();
        
        return str.replace(tags, (match, p) => {
            return allowed.indexOf('<' + p.toLowerCase() + '>') !== -1 ? match : '';
        });
    }


    public static addClass(element: any, className: string): void {
        if(-1 !== element.className.indexOf(className)) {
            return;
        }
        
        element.className = element.className + ' ' + className;
    }

    public static removeClass(element: any, className: string): void {
        let newClassName =  ' ' + element.className + ' ';
        let replaced = newClassName.replace(' ' + className + ' ', ' ');
        
        element.className = Tools.trimChar(replaced, ' ');
    }

    public static getOffset(elem: any): any {
        if ( !elem.getClientRects().length ) {
            return { top: 0, left: 0 };
        }
    
        let rect = elem.getBoundingClientRect();
        let doc = elem.ownerDocument;
        let docElem = doc.documentElement;
        let win = doc.defaultView;

        return {
            top: rect.top + win.pageYOffset - docElem.clientTop,
            left: rect.left + win.pageXOffset - docElem.clientLeft
        };
    }

}