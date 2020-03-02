/**
 * 模态弹框
 */
export default class Dialog {
    doc: any;

    mask: any;
    wrapper: any;
    closeIcon: any;
    headerWrapper: any;
    contentWrapper: any;
    footerWrapper: any;
    okButton: any;
    cancelButton: any;
    onOk: any;

    static _instance = null;

    static getInstance() {
        if(null === Dialog._instance) {
            Dialog._instance = new Dialog();
        }

        return Dialog._instance;
    }

    constructor() {
        this.doc = document;

        this.mask = null;
        this.wrapper = null;
        this.closeIcon = null;
        this.headerWrapper = null;
        this.contentWrapper = null;
        this.footerWrapper = null;

        this.onOk = null;
    }

    initDom(content, title) {
        // mask
        this.mask = this.doc.createElement('div');
        this.mask.className = 'xeditor-modal-mask';

        this.wrapper = this.doc.createElement('div');
        this.wrapper.className = 'xeditor-modal-wrapper';

        this.closeIcon = this.doc.createElement('span');
        this.closeIcon.className = 'xeditor-modal-close';

        this.headerWrapper = this.doc.createElement('div');
        this.headerWrapper.className = 'xeditor-modal-header';
        this.headerWrapper.innerHTML = title;

        this.contentWrapper = this.doc.createElement('div');
        this.contentWrapper.innerHTML = content;

        this.footerWrapper = this.doc.createElement('div');
        this.footerWrapper.className = 'xeditor-modal-footer';

        this.okButton = this.doc.createElement('span');
        this.okButton.className = 'xeditor-btn active';
        this.okButton.innerHTML = '确定';
        this.cancelButton = this.doc.createElement('span');
        this.cancelButton.className = 'xeditor-btn';
        this.cancelButton.innerHTML = '取消';

        this.footerWrapper.appendChild(this.cancelButton);
        this.footerWrapper.appendChild(this.okButton);
        this.wrapper.appendChild(this.closeIcon);
        this.wrapper.appendChild(this.headerWrapper);
        this.wrapper.appendChild(this.contentWrapper);
        this.wrapper.appendChild(this.footerWrapper);
        this.mask.appendChild(this.wrapper);
    }

    initEvent() {
        let _self = this;
        this.closeIcon.onclick = () => {
            this.close();
        };
        this.cancelButton.onclick = () => {
            this.close();
        };
        this.okButton.onclick = () => {
            if(null !== _self.onOk) {
                _self.onOk();
            }
        };
    }

    deleteEvent() {
        this.closeIcon.onclick = null;
    }

    render() {
        this.doc.body.appendChild(this.mask);
    }

    getContentDom() {
        return this.contentWrapper;
    }

    /**
     * 关闭弹框
     */
    close() {
        this.deleteEvent();

        this.doc.body.removeChild(this.mask);
    }

    /**
     * 显示弹框
     *
     * @param content 内容
     */
    open(content, title = '') {
        this.initDom(content, title);
        this.initEvent();

        this.render();

        return this;
    }
}
