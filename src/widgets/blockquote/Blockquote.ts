import Editor from '../../Editor';
import Editable from '../../Editable';
import Tools from '../../Tools';

import IWidget from '../IWidget';

/**
 * Blockquote
 */
class Blockquote extends IWidget {
    public button: any;
    public editor: any;

    constructor(button: any, editor: any) {
        super(editor);

        this.button = button;
        this.editor = editor;
    }

    private getTopSegment(container: any, range: any): any {
        let blockquote = this.editor.doc.createElement('blockquote');
        let info = range.pathInfo();
        let startContainer = info[1];

        for(let i=0, len=container.childNodes.length; i<len; i++) {
            if(container.childNodes[i] !== startContainer) {
                
                blockquote.appendChild( container.childNodes[i].cloneNode(true) );

                continue;
            }

            break;
        }

        return blockquote;
    }

    private getBottomSegment(container: any, range: any): any {
        let blockquote = this.editor.doc.createElement('blockquote');
        let info = range.pathInfo(true);
        let endContainer = info[1];

        for(let i=container.childNodes.length-1; i>=0; i--) {
            if(container.childNodes[i] !== endContainer) {
                if(null === blockquote.firstChild) {
                    blockquote.appendChild( container.childNodes[i].cloneNode(true) );

                } else {
                    blockquote.insertBefore( container.childNodes[i].cloneNode(true), blockquote.firstChild );
                }

                continue;
            }

            break;
        }

        return blockquote;
    }

    private getCenterSegment(range: any): any[] {
        let ret = [];
        let info = range.pathInfo();
        let startContainer = info[1];

        info = range.pathInfo(true);
        let endContainer = info[1];

        let node = null;
        while(null !== startContainer) {
            node = startContainer.cloneNode(true);

            // #Text
            if(3 === node.nodeType) {
                let tmp = this.editor.doc.createElement(this.editor.configs.lineMode);
                tmp.appendChild(node);

                node = tmp;
            }

            ret.push(node);

            if(startContainer === endContainer) {
                break;
            }

            startContainer = startContainer.nextSibling;
        }

        return ret;
    }

    /**
     * @inheritdoc
     */
    onClick(editor: any) {
        let range = Editable.getCurrentRange();
        if(null === range) {
            return;
        }

        var container = range.getOutermostElement();
        var node = null;
        if(null === container) {
            return;
        }

        // 删除引用是把节点分成三组
        // 选中部分的上面分为一个引用
        // 选中部分将引用去掉
        // 选中部分的下面分为一个引用
        // 删除原来的整个引用 重新插入以上三部分
        if('BLOCKQUOTE' === container.nodeName.toUpperCase()) {
            let topBlockquote = this.getTopSegment(container, range);
            let bottomBlockquote = this.getBottomSegment(container, range);
            let centers = this.getCenterSegment(range);

            range.selectNode(container);
            range.deleteContents();

            if(topBlockquote.childNodes.length > 0) {
                range.insertNode(topBlockquote);
                range.collapse();
            }
            if(centers.length > 0) {
                for(let i=0, len=centers.length; i<len; i++) {
                    range.insertNode(centers[i]);
                    range.collapse();
                }
            }
            if(bottomBlockquote.childNodes.length > 0) {
                range.insertNode(bottomBlockquote);
                range.collapse();
            }

            Editable.resetRangeAt(centers[0].firstChild, true);

        } else {
            // 添加引用是在段落最外层包裹 blockquote
            let cloneNode = container.cloneNode(true);
            node = editor.doc.createElement('blockquote');
            node.appendChild(cloneNode);

            container.parentNode.replaceChild(node, container);
            Editable.resetRangeAt(cloneNode.firstChild, true);
        }

        this.editor.fire('selectionchange');
    }

    /**
     * @inheritdoc
     */
    statusReflect() {
        let range = Editable.getCurrentRange();
        
        if(null === range) {
            return;
        }
        
        let blocked = range.currentInNode('blockquote');
        
        if(blocked) {
            Tools.addClass(this.button, 'active');
            
        } else {
            Tools.removeClass(this.button, 'active');
        }
    }
}
Editor.registerWidgetController('blockquote', Blockquote);
