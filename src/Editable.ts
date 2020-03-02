import Range from './Range';

/**
 * 对外 API - Selection & Range & execCommand
 */
export default class Editable {

    public static TYPE_HTML: number = 1;
    public static TYPE_TEXT: number = 2;
    public static blockLevelElements: any = {
        address: 1,
        fieldset: 1,
        article: 1,
        figcaption: 1,
        main: 1,
        aside: 1,
        figure: 1,
        nav: 1,
        blockquote: 1,
        footer: 1,
        ol: 1,
        ul: 1,
        li: 1,
        details: 1,
        form: 1,
        p: 1,
        dialog: 1,
        pre: 1,
        h1: 1,
        h2: 1,
        h3: 1,
        h4: 1,
        h5: 1,
        h6: 1,
        dd: 1,
        dl: 1,
        dt: 1,
        header: 1,
        section: 1,
        div: 1,
        hgroup: 1,
        table: 1,
        hr: 1
    };

    private static _currentRange: Range = null;

    public static getCurrentRange(): Range {
        return Editable._currentRange;
    }

    public static backupCurrentRange(range?: any): void {
        if(undefined !== range) {
            Editable._currentRange = range;

            return;
        }

        let gettedRange = Range.getSingleRangeFromNativeSelection();

        if(null !== gettedRange) {
            Editable._currentRange = gettedRange;
        }
    }

    public static resumeSelection(): void {
        if(null === Editable._currentRange) {
            return;
        }

        let selection = Range.getSelectionFromNative();

        if(null === selection) {
            return;
        }

        if(selection.rangeCount > 0) {
            selection.removeAllRanges();
        }

        selection.addRange(Editable._currentRange.nativeRange);
    }

    public static resetRangeAt(node: any, toEnd?: boolean): void {
        var range = Range.createNativeRange();

        if(null === range) {
            return;
        }

        if(true === toEnd) {
            // If the nodeType of node is one of Text, Comment, or CDATASection
            // then the offset is the number of characters contained in the node.
            // Others offset is the number of child nodes.
            var position = (3 === node.nodeType || 4 === node.nodeType || 8 === node.nodeType)
                ? node.nodeValue.length
                : node.childNodes.length;
            range.setStart(node, position);
            range.setEnd(node, position);

        } else {
            range.setStart(node, 0);
            range.setEnd(node, 0);
        }

        Editable.backupCurrentRange(new Range(range));
        Editable.resumeSelection();
    }

    public static insertHtml(type: any, data: string): void {
        let range = Editable._currentRange;
        if(null === range) {
            return;
        }

        // 执行命令前 需要知道光标的位置
        Editable.resumeSelection();

        let doc = document;
        let fragement = null;

        // 插入文本
        if(Editable.TYPE_TEXT === type) {
            fragement = doc.createTextNode(data);

            range.insertNode(fragement);
            range.collapse(false);

            Editable.backupCurrentRange();
            return;
        }

        Editable.execCommand('insertHTML', false, data);

        Editable.backupCurrentRange();
    }

    public static execCommand(aCommandName: string, aShowDefaultUI: boolean, aValueArgument: string): boolean {
        // 执行命令前 需要知道光标的位置
        Editable.resumeSelection();

        return document.execCommand(aCommandName, aShowDefaultUI, aValueArgument);
    }

    public static queryCommandState(command: string): boolean {
        return document.queryCommandState(command);
    }

}
