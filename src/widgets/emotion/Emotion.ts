import Editor from '../../Editor';
import Editable from '../../Editable';
import Tools from '../../Tools';

import IWidget from '../IWidget';

/**
 * emotion
 */
class Emotion extends IWidget {
    public button: any;
    public editor: any;

    public popWrapper: any;

    constructor(button: any, editor: any) {
        super(editor);

        this.button = button;
        this.editor = editor;

        this.popWrapper = null;

        this.init();
        this.bindEvent();
    }

    private init(): void {
        let html =
            ['<div class="xeditor-emotion-wrapper">',
                '<div class="xeditor-pop-tabs">',
                    '<a class="active" href="javascript:;">精选</a>',
                '</div>',
                '<div class="xeditor-emotion-content">',
                    '<a class="xeditor-emotion-item" href="javascript:;" title="高兴" data-em="(^_^)">(^_^)</a>',
                    '<a class="xeditor-emotion-item" href="javascript:;" title="难过" data-em="(＞﹏＜)">(＞﹏＜)</a>',
                    '<a class="xeditor-emotion-item" href="javascript:;" title="哼" data-em="(￣ヘ￣o)">(￣ヘ￣o)</a>',
                    '<a class="xeditor-emotion-item" href="javascript:;" title="哭" data-em="(╥﹏╥)">(╥﹏╥)</a>',
                    '<a class="xeditor-emotion-item" href="javascript:;" title="害怕" data-em="o((⊙﹏⊙))o">o((⊙﹏⊙))o</a>',
                    '<a class="xeditor-emotion-item" href="javascript:;" title="赞" data-em="d===(￣▽￣*)b">d===(￣▽￣*)b</a>',
                    '<a class="xeditor-emotion-item" href="javascript:;" title="爱你" data-em="(づ￣3￣)づ╭❤">(づ￣3￣)づ╭❤</a>',
                    '<a class="xeditor-emotion-item" href="javascript:;" title="害羞" data-em="(✿◡‿◡)">(✿◡‿◡)</a>',
                    '<a class="xeditor-emotion-item" href="javascript:;" title="无奈" data-em="╮(╯＿╰)╭">╮(╯＿╰)╭</a>',
                    '<a class="xeditor-emotion-item" href="javascript:;" title="惊讶" data-em="(⊙ˍ⊙)">(⊙ˍ⊙)</a>',
                    '<a class="xeditor-emotion-item" href="javascript:;" title="汗" data-em="(-_-!)">(-_-!)</a>',
                    '<a class="xeditor-emotion-item" href="javascript:;" title="加油" data-em="ᕦ(ò_óˇ)ᕤ">ᕦ(ò_óˇ)ᕤ</a>',
                '</div>',
            '</div>'].join('');
       
        let doc = this.button.ownerDocument;
        
        this.popWrapper = doc.createElement('div');
        this.popWrapper.className = 'xeditor-pop-wrapper';
        this.popWrapper.innerHTML = html;
    }

    private bindEvent(): void {
        let _self = this;
        
        this.popWrapper.onclick = (e) => {
            // 阻止冒泡
            if(e.stopPropagation) {
                e.stopPropagation();
            }
            
            let target = e.target;
            let em = target.getAttribute('data-em');
            
            if(null !== em) {
                Editable.insertHtml(Editable.TYPE_TEXT, em);
                
                _self.close();
            }
        };
        
        // 点击空白关闭
        this.button.ownerDocument.addEventListener('click', (e) => {
            var t = e.target;
            
            // 点击按钮要执行打开操作
            if('emotion' === t.getAttribute('data-internalwidgetaction')) {
                return;
            }
            
            _self.close();
        });
    }

    private close() {
        this.popWrapper.style.display = 'none';
    }

    /**
     * @inheritdoc
     */
    onClick(editor: any) {
        if(!Tools.hasChild(this.button.parentNode, this.popWrapper)) {
            this.button.parentNode.appendChild(this.popWrapper);
            this.popWrapper.style.left = this.button.offsetLeft + 'px';
        }
        
        this.popWrapper.style.display = 'block';
    }

    /**
     * @inheritdoc
     */
    statusReflect() {}
}
Editor.registerWidgetController('emotion', Emotion);
