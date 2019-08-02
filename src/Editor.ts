import Editable from './Editable';
import Tools from './Tools';

/**
 * Editor
 *
 * rich text editor for IE9+
 *
 * @author afu
 *
 * eg.
 *
 * 1. prepare a element to render editor
 *
 * <div id="wrapper"></div>
 *
 * 2. init editor
 *
 * var editor = new Editor({
 *     widgets: ['blockquote', 'bold', '-', 'emotion', 'image', 'link'],
 *     minHeight: '200'
 * });
 *
 * editor.render(document.getElementById('wrapper'));
 */
export default class Editor {

    /**
     * 具有 UI 的部件
     *
     * {name: Function ...}
     *
     */
    public static widgetControllers: any = {};

    /**
     * 注册部件
     *
     * @param {String} name
     * @param {any} processer
     */
    public static registerWidgetController(name: string, processer: any): void {
        Editor.widgetControllers[name] = processer;
    }

    public static Tools = Tools;


    public doc: Document;

    /**
     * 定时器延时
     * 假设同一时间只会有同一个类型的动作发生 所以所有动作共用一个定时器
     */
    public reactionTimer: number;

    /**
     * 发布器容器
     */
    public wrapper: any;

    /**
     * 挂件容器
     */
    public widgetsWrapper: any;

    /**
     * 内容容器
     */
    public contentWrapper: any;

    /**
     * 可编辑区引用
     */
    public root: any;

    /**
     * fragment
     */
    public fragment: any;
    
    /**
     * 挂件缓存
     */
    public widgetControllerInstances: any;

    /**
     * 事件映射表
     */
    public eventBinMap: any;
    
    /**
     * 原内容
     */
    public originContent: string;
    
    /**
     * 配置
     */
    public configs: any;

    constructor(options: any) {
        this.doc = document;

        this.reactionTimer = 0;
        this.wrapper = null;
        this.widgetsWrapper = null;
        this.contentWrapper = null;
        this.root = null;
        this.fragment = null;

        this.widgetControllerInstances = {};
        this.eventBinMap = {};

        this.originContent = '';

        this.configs = {
            reactionTime: 200,
            plugins: [],
            widgets: [],
            minHeight: '200',
            contentClassName: '',
            lineMode: 'p',
            
            // upload url
            server: ''
        };

        this.init(options);
    }

    public extend(origin: any, configs?: any): any {
        if(undefined === configs) {
            return origin;
        }
        
        for(let k in configs) {
            origin[k] = configs[k];
        }
        
        return origin;
    }

    public clearElementContent(element: any): void {
        while(null !== element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    public init(options: any): void {
        this.extend(this.configs, options);
    }

    public initEmptyContent(): string {
        let html = '<' + this.configs.lineMode + '><br />' + '</' + this.configs.lineMode + '>';

        return html;
    }

    public initWidgetsStructure(): void {
        this.widgetsWrapper = this.doc.createElement('div');
        this.widgetsWrapper.className = 'xeditor-widgets-wrapper';
        
        let item = null;
        for(let i=0, len=this.configs.widgets.length; i<len; i++) {
            if('-' === this.configs.widgets[i]) {
                item = this.doc.createElement('i');
                item.className = 'xeditor-widgets-separator';
                
            } else {
                item = this.doc.createElement('span');
                item.setAttribute('data-action', this.configs.widgets[i]);
                item.className = 'xeditor-widgets-item xeditor-icon xeditor-icon-' + this.configs.widgets[i];
            
                this.widgetControllerInstances[this.configs.widgets[i]] =
                    new Editor.widgetControllers[this.configs.widgets[i]](item, this);
            }
            
            this.widgetsWrapper.appendChild(item);
        }
        
        this.fragment.appendChild(this.widgetsWrapper);
    }

    public initContentStructure(): void {
        this.contentWrapper = this.doc.createElement('div');
        this.root = this.doc.createElement('div');
        
        this.contentWrapper.className = 'xeditor-content-wrapper';
        this.root.className = 'xeditor-content-root'
            + ('' === this.configs.contentClassName ? '' : ' ' + this.configs.contentClassName);
        this.root.contentEditable = true;
        this.root.setAttribute('spellcheck', false);
        this.root.setAttribute('data-role', 'xeditor-root');
        this.root.style.minHeight = this.configs.minHeight + 'px';
        
        this.contentWrapper.appendChild(this.root);
        this.fragment.appendChild(this.contentWrapper);
    }

    public initEvent(): void {
        let _self = this;
        
        // widgets
        this.widgetsWrapper.onmousedown = function() {
            return false;
        };
        this.widgetsWrapper.onclick = function(e) {
            _self.handlerWidgetClickEvent(e);
        };
        
        // content
        this.root.onkeydown = function(e) {
            _self.handlerKeydownEvent(e);
        };
        this.root.onkeyup = function(e) {
            _self.handlerKeyupEvent(e);
        };
        // this.root.onclick = function(e) {
        //     _self.handlerContentClickEvent(e);
        // };
        // onmouseup 范围比 onclick 广 所以统一使用 mouseup 事件
        this.root.onmouseup = function(e) {
            _self.handlerContentClickEvent(e);
        };
    }

    public deleteEvent(): void {
        this.widgetsWrapper.onmousedown = null;
        this.widgetsWrapper.onclick = null;
        this.root.onkeyup = null;
        this.root.onclick = null;
        this.root.onmouseup = null;
    }

    public handlerWidgetClickEvent(e: any): void {
        let target = e.target;
        
        let action = target.getAttribute('data-action');
        
        // 只有触发事件的对象才处理
        if(null === action) {
            return;
        }
        
        if(undefined === this.widgetControllerInstances[action]) {
            return;
        }
        
        if(undefined === this.widgetControllerInstances[action].onClick) {
            throw new Error('The widget: '+ action +' has no onClick method');
        }
        
        this.widgetControllerInstances[action].onClick(this);
    }

    public handlerKeydownEvent(e: any): void {
        this.fire('keydown');
    }

    public handlerKeyupEvent(e: any): void {
        if(0 === this.root.innerHTML.length) {
            // setContent 会调用 backupCurrentRange
            // 但是每次按键弹起时不一定 innerHTML.length === 0
            // 所以下面手动多调用了一次 backupCurrentRange 保证按键后场景更新
            this.setContent('');
        }
        
        Editable.backupCurrentRange();
        
        this.fire('keyup', null);
        this.fire('selectionchange');
    }

    public handlerContentClickEvent(e: any): void {
        Editable.backupCurrentRange();
        
        this.fire('contentFocus', null);
        this.fire('selectionchange');
    }

    public runPlugins(): void {
        // 直接执行
        for(let i=0, len=this.configs.plugins.length; i<len; i++) {
            new this.configs.plugins[i](this);
        }
    }


    /**
     * render
     */
    public render(mountNode: any): void {
        this.fragment = this.doc.createDocumentFragment();

        // 编辑器区域
        this.wrapper = mountNode;
        this.wrapper.className = 'xeditor-wrapper';
        this.originContent = this.wrapper.innerHTML;
        
        // 清空内容
        this.clearElementContent(this.wrapper);
        
        // 初始化插件区
        this.initWidgetsStructure();
        
        // 初始化内容区
        this.initContentStructure();        
        
        // 还原原始内容
        if('' === this.originContent) {
            this.root.innerHTML = this.initEmptyContent();
            
        } else {
            this.root.innerHTML = this.originContent;
        }
        
        // dom 渲染
        this.wrapper.appendChild(this.fragment);
        
        // event
        this.initEvent();
        
        this.resetRangeAtEndElement();
        
        // 初始化插件
        this.runPlugins();
        
        this.fire('ready');
    }

    /**
     * 定位光标到内容最后一个节点
     *
     * @param {Boolean} toEnd 是否将光标定位到末尾
     */
    public resetRangeAtEndElement(toEnd?: boolean): void {
        if(undefined === toEnd) {
            toEnd = false;
        }
        
        Editable.resetRangeAt(this.root.lastChild, toEnd);
    }

    /**
     * 获取内容
     */
    public getContent(): string {
        let tmp = this.root.innerHTML;
        
        // 去除多余空白
        return tmp.replace(/\u200B/g, '');
    }

    /**
     * 设置内容
     *
     * @param {String} data
     */
    public setContent(data: string): void {
        this.root.innerHTML = '' === data
            ? this.initEmptyContent()
            : data;
        
        this.resetRangeAtEndElement();
    }

    /**
     * 获取纯文本内容
     */
    public getPlainText(): string {
        let ret = this.getContent();

        return Tools.filterTags(ret);
    }

    /**
     * 销毁
     */
    public destroy(): void {
        // 先删除 widgets
        for(let widget in this.widgetControllerInstances) {
            if(undefined !== this.widgetControllerInstances[widget].destroy) {
                this.widgetControllerInstances[widget].destroy();
            }
        }
        this.widgetControllerInstances = null;
        
        this.deleteEvent();
        // 清空 dom
        this.clearElementContent(this.wrapper);
        
        this.root = null;
        this.contentWrapper = null;
        this.widgetsWrapper = null;
        this.wrapper = null;
        
        this.fragment = null;
        
        // 清空事件
        this.eventBinMap = {};
    }

    /**
     * 添加事件监听
     *
     * @param {String} eventName
     * @param {Function} handler
     * @param {any} thisObject
     */
    public on(eventName: string, handler: any, thisObject?: any): void {
        if(undefined === thisObject) {
            thisObject = null;
        }
        
        let map = this.eventBinMap;
        
        if(undefined === map[eventName]) {
            map[eventName] = [];
        }
        
        let eventBin = {
            target: this,
            type: eventName,
            handler: handler,
            thisObject: thisObject
        };
        
        map[eventName].push(eventBin);
    }

    /**
     * 移除事件处理器
     *
     * @param {String} eventName
     * @param {Function} handler
     * @param {any} thisObject
     */
    public off(eventName: string, handler: any, thisObject: any): void {
        let map = this.eventBinMap;
        
        if(undefined === map[eventName]) {
            return;
        }
        
        if(undefined === thisObject) {
            thisObject = null;
        }
        
        for(let i=0, len=map[eventName].length, bin=null; i<len; i++) {
            bin = map[eventName][i];
            
            if(thisObject === bin.thisObject && handler === bin.handler) {
                map[eventName].splice(i, 1);
                
                break;
            }
        }
    }

    /**
     * 触发事件
     *
     * @param {String} eventName
     * @param {any} data
     */
    public fire(eventName: string, data?: any): void {
        let map = this.eventBinMap;
        
        if(undefined === map[eventName]) {
            return;
        }
        
        for(let i=0, len=map[eventName].length, bin=null; i<len; i++) {
            bin = map[eventName][i];
            
            bin.handler.call(bin.thisObject, data);
        }
    }

}
