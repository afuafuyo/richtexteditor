/**
 * 滚动定位
 */
function ScrollFix(editor, options) {
    this.editor = editor;
    this.options = options;

    editor.on('ready', this.handler, this);
}
ScrollFix.prototype = {
    constructor: ScrollFix,
    getOffset: function(elem) {
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
    },
    handler: function() {
        var _self = this;

        this.bar = this.editor.widgetsWrapper;
        this.barWidth = this.bar.clientWidth;
        this.barOffset = this.getOffset(this.bar.parentNode);

        window.addEventListener('resize', function() {
            _self.barOffset = _self.getOffset(_self.bar);
        });
        window.addEventListener("scroll", function () {
            _self.scrollHandler();
        });
    },
    scrollHandler: function() {
        var navHeight = this.options.top;

        var scrollTop = window.pageYOffset;
        var startFixPos = this.barOffset.top - navHeight;

        var htmlHeight = this.editor.root.scrollHeight;
        var contentBottomPos = this.barOffset.top + htmlHeight;

        // 内容滚动到屏幕上面 就隐藏工具栏
        if(scrollTop > contentBottomPos) {
            this.bar.removeAttribute('style');
            return;
        }

        if(document.documentElement) {
            if(document.documentElement.scrollTop > startFixPos) {
                this.bar.style.position = 'fixed';
                this.bar.style.zIndex = '100';
                this.bar.style.top = navHeight + 'px';
                this.bar.style.left = this.barOffset.left + 'px';
                this.bar.style.width = this.barWidth + 'px';

            } else {
                this.bar.removeAttribute('style');
            }
        }
    }
};

/**
 * myBold
 */
function MyWidget(button, editor) {
    this.button = button;
    this.editor = editor;

    this.onClick = (editor) => {
        console.log('my widget click');

        XEditor.Editable.insertHtml(1, ' my widget insert html ');
    };

    this.statusReflect = () => {
        console.log('selection changed');
    };

    XEditor.IWidget.call(this, editor);
}
XEditor.registerWidgetController('mywidget', MyWidget);
