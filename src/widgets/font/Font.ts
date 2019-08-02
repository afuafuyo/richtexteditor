import Editor from '../../Editor';
import Editable from '../../Editable';
import Tools from '../../Tools';

import IWidget from '../IWidget';

/**
 * font
 */
class Font extends IWidget {
    public button: any;
    public editor: any;

    private popWrapper: any;
    private nowFont: string; 

    constructor(button: any, editor: any) {
        super(editor);

        this.button = button;
        this.editor = editor;

        this.nowFont = '';

        this.init();
        this.bindEvent();
    }

    private getHtml(): string {
        let html = [
            '<div class="xeditor-font-wrapper">',
                '<h1 data-role="h1" class="'+ (this.nowFont === 'h1' ? 'active' : '') +'">标题1</h1>',
                '<h2 data-role="h2" class="'+ (this.nowFont === 'h2' ? 'active' : '') +'">标题2</h2>',
                '<p data-role="normal">正文</p>',
            '</div>'
        ].join('');

        return html;
    }

    private init(): void {
        let doc = this.button.ownerDocument;
        
        this.popWrapper = doc.createElement('div');
        this.popWrapper.className = 'xeditor-pop-wrapper';
        
        this.button.appendChild(this.popWrapper);
    }

    private bindEvent(): void {
        let _self = this;
        
        this.popWrapper.onclick = (e) => {
            // 阻止冒泡
            if(e.stopPropagation) {
                e.stopPropagation();
            }
            
            let target = e.target;
            let role = target.getAttribute('data-role');
            
            if(null !== role) {
                _self.setFont(role);

                _self.close();
            }
        };
        
        // 点击空白关闭
        this.button.ownerDocument.addEventListener('click', (e) => {
            var t = e.target;
            
            // 点击表情按钮要执行打开操作
            if('font' === t.getAttribute('data-action')) {
                return;
            }
            
            _self.close();
        });
    }

    private close() {
        this.button.lastChild.style.display = 'none';
    }

    public setFont(role: string): void {
        let range = Editable.getCurrentRange();
        if(null === range) {
            return;
        }

        let outer = range.getOutermostElement();
        if(null === outer) {
            return;
        }

        let tag = this.editor.configs.lineMode;
        let nodeName = outer.nodeName.toLowerCase();
        
        if('blockquote' === nodeName) {
            outer = range.pathInfo()[1];
            nodeName = outer.nodeName.toLowerCase();
        }

        // 点击相同不做处理
        if('h1' === nodeName || 'h2' === nodeName) {
            if(role === this.nowFont) {
                return;
            }
        }

        if('h1' === role) {
            tag = 'h1';
        }
        if('h2' === role) {
            tag = 'h2';
        }

        switch(role) {
            case 'h1':
            case 'h2':
            case 'normal':
                let newNode = this.button.ownerDocument.createElement(tag);
                newNode.innerHTML = outer.innerHTML;

                outer.parentNode.replaceChild(newNode, outer);

                this.nowFont = role;

                Editable.resetRangeAt(newNode, true);

                break;
            default:
                break;
        }

        this.editor.fire('selectionchange');
    }

    /**
     * @inheritdoc
     */
    onClick() {
        this.popWrapper.innerHTML = this.getHtml();
        this.button.lastChild.style.display = 'block';
    }

    /**
     * @inheritdoc
     */
    statusReflect() {
        let range = Editable.getCurrentRange();
        if(null === range) {
            return;
        }

        let font = '';
        if(range.currentInNode('h1')) {
            font = 'h1';

        } else if(range.currentInNode('h2')) {
            font = 'h2';
        }

        this.nowFont = font;

        if('' === font) {
            Tools.removeClass(this.button, 'active');

        } else {
            Tools.addClass(this.button, 'active');
        }
    }
}
Editor.registerWidgetController('font', Font);
