import Editable from '../../Editable';
import Tools from '../../Tools';

import IWidget from '../IWidget';
import Pop from '../../com/Pop';

/**
 * font
 *
 * widgetsOptions: {
 *      font: {
 *          list: [
 *              {title: '标题1', tag: 'h1'}
 *          ]
 *      }
 * }
 */
export default class Font extends IWidget {
    public button: any;
    public editor: any;

    private pop: any;
    private nowFont: string;

    constructor(button: any, editor: any) {
        super(editor);

        this.button = button;
        this.editor = editor;

        this.nowFont = '';

        this.pop = null;
    }

    private getHtml(): string {
        let lineMode = this.editor.configs.lineMode
        let options = this.editor.configs.widgetsOptions.font;
        let list = [{ title: '标题', tag: 'h2' }];

        if(options && options.list) {
            list = options.list;
        }

        let str = '';
        for(let i=0; i<list.length; i++) {
            str += `<${list[i].tag} data-role="${list[i].tag}" class="${this.nowFont === list[i].tag ? 'active' : ''}">${list[i].title}</${list[i].tag}>`;
        }

        let html = [
            '<div class="xeditor-font-wrapper">',
                str,
                `<${lineMode} data-role="${lineMode}">正文</${lineMode}>`,
            '</div>'
        ].join('');

        return html;
    }

    private bindEvent(): void {
        let _self = this;

        this.pop.getWrapperDom().onclick = (e) => {
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

            // 点击按钮要执行打开操作
            if('font' === t.getAttribute('data-internalwidgetaction')) {
                return;
            }

            _self.close();
        });
    }

    private close() {
        if(null !== this.pop) {
            this.pop.getWrapperDom().style.display = 'none';
        }

        this.pop = null;
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
        if('h1' === nodeName || 'h2' === nodeName || 'h3' === nodeName || 'h4' === nodeName || 'h5' === nodeName || 'h6' === nodeName) {
            if(role === this.nowFont) {
                return;
            }
        }
        tag = role;

        // 替换元素
        let newNode = this.button.ownerDocument.createElement(tag);
        newNode.innerHTML = outer.innerHTML;
        outer.parentNode.replaceChild(newNode, outer);

        this.nowFont = role;
        Editable.resetRangeAt(newNode, true);

        this.editor.fire('selectionchange');
    }

    /**
     * @inheritdoc
     */
    onClick() {
        if(null === this.pop) {
            this.pop = Pop.getInstance();

            this.button.parentNode.appendChild(this.pop.getWrapperDom());
            this.pop.getWrapperDom().style.left = this.button.offsetLeft + 'px';

            this.bindEvent();
        }

        // 由于要设置标题文字 active 状态 所以这里每次都重新加载 html
        this.pop.getContentDom().innerHTML = this.getHtml();

        this.pop.getWrapperDom().style.display = 'block';
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
        } else if(range.currentInNode('h3')) {
            font = 'h3';
        } else if(range.currentInNode('h4')) {
            font = 'h4';
        } else if(range.currentInNode('h5')) {
            font = 'h5';
        } else if(range.currentInNode('h6')) {
            font = 'h6';
        }

        this.nowFont = font;

        if('' === font) {
            Tools.removeClass(this.button, 'active');

        } else {
            Tools.addClass(this.button, 'active');
        }
    }
}
