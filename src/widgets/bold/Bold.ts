import Editor from '../../Editor';
import Editable from '../../Editable';
import Tools from '../../Tools';

import IWidget from '../IWidget';

/**
 * bold
 */
class Bold extends IWidget {
    public button: any;
    public editor: any;

    constructor(button: any, editor: any) {
        super(editor);

        this.button = button;
        this.editor = editor;
    }

    /**
     * @inheritdoc
     */
    onClick(editor: any) {
        let range = Editable.getCurrentRange();
        
        if(null === range) {
            return;
        }
        
        // 如果没有选中文本 那么不做处理
        if(range.collapsed) {
            return;
        }
        
        Editable.execCommand('bold', false, null);
        
        this.editor.fire('selectionchange');
    }

    /**
     * @inheritdoc
     */
    statusReflect() {
        let ret = Editable.queryCommandState('bold');
        if(true === ret) {
            Tools.addClass(this.button, 'active');
            
            return;
        }
        
        Tools.removeClass(this.button, 'active');
    }
}
Editor.registerWidgetController('bold', Bold);
