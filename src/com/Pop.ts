export default class Pop {
    doc: any;
    wrapper: any;
    contentWrapper: any;

    static _instance = null;

    static getInstance() {
        if(null === Pop._instance) {
            Pop._instance = new Pop();
        }

        return Pop._instance;
    }

    constructor() {
        this.doc = document;
        this.wrapper = null;
        this.contentWrapper = null;

        this.init();
    }

    init() {
        this.wrapper = this.doc.createElement('div');
        this.wrapper.className = 'xeditor-pop-wrapper';

        this.contentWrapper = this.doc.createElement('div');
        this.contentWrapper.className = 'xeditor-pop-content';

        this.wrapper.appendChild(this.contentWrapper);
    }

    getWrapperDom() {
        return this.wrapper;
    }

    getContentDom() {
        return this.contentWrapper;
    }
}
