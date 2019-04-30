/**
 * XEditor
 *
 * rich text editor for IE9+
 *
 * @author afu
 *
 * eg.
 *
 * 1. prepare a element to render editor
 * <div id="wrapper"></div>
 *
 * 2. init editor
 * new XEditor('wrapper', {
 *     widgets: ['blockquote', 'bold', '-', 'emotion', 'image', 'link'],
 *     minHeight: '200'
 * });
 *
 */
'use strict';

function XEditor(options) {
    this.doc = document;
    
    /**
     * 定时器延时
     * 假设同一时间只会有同一个类型的动作发生 所以所有动作共用一个定时器
     */
    this.reactionTimer = 0;
    
    /**
     * 发布器容器
     */
    this.wrapper = null;
    /**
     * 挂件容器
     */
    this.widgetsWrapper = null;
    /**
     * 内容容器
     */
    this.contentWrapper = null;
    /**
     * 可编辑区引用
     */
    this.root = null;
    /**
     * fragment
     */
    this.fragment = null;
    
    /**
     * 挂件缓存
     */
    this.widgetControllerInstances = {};
    /**
     * 事件映射表
     */
    this.eventBinMap = {};
    
    /**
     * 原内容
     */
    this.originContent = '';
    /**
     * 内容为空时的默认 html
     */
    this.emptyContent = '<p><br /></p>';
    
    /**
     * 配置
     */
    this.configs = {
        reactionTime: 200,
        plugins: [],
        widgets: ['code', '-', 'blockquote', 'bold', 'italic', 'align', 'separator', '-', 'emotion', 'image', 'link'],
        placeholder: '',
        minHeight: '200',
        contentClassName: '',
        
        // upload url
        server: ''
    };
    
    this.init(options);
}
XEditor.prototype = {
    constructor: XEditor,
    extend: function(origin, configs) {
        if(undefined === configs) {
            return origin;
        }
        
        for(var k in configs) {
            origin[k] = configs[k];
        }
        
        return origin;
    },
    clearElementContent: function(element) {
        while(null !== element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },
    init: function(options) {
        this.extend(this.configs, options);
        
        this.fragment = this.doc.createDocumentFragment();
    },
    initWidgetsStructure: function() {
        this.widgetsWrapper = this.doc.createElement('div');
        this.widgetsWrapper.className = 'xeditor-widgets-wrapper';
        
        var item = null;
        for(var i=0, len=this.configs.widgets.length; i<len; i++) {
            if('-' === this.configs.widgets[i]) {
                item = this.doc.createElement('i');
                item.className = 'xeditor-widgets-separator';
                
            } else {
                item = this.doc.createElement('span');
                item.setAttribute('data-action', this.configs.widgets[i]);
                item.className = 'xeditor-widgets-item xeditor-icon xeditor-icon-' + this.configs.widgets[i];
            
                this.widgetControllerInstances[this.configs.widgets[i]] =
                    new XEditor.widgetControllers[this.configs.widgets[i]](item, this);
            }
            
            this.widgetsWrapper.appendChild(item);
        }
        
        this.fragment.appendChild(this.widgetsWrapper);
    },
    initContentStructure: function() {
        this.contentWrapper = this.doc.createElement('div');
        this.root = this.doc.createElement('div');
        
        this.contentWrapper.className = 'xeditor-content-wrapper';
        this.root.className = 'xeditor-content-root' + ('' === this.configs.contentClassName ? '' : ' ' + this.configs.contentClassName);
        this.root.contentEditable = true;
        this.root.setAttribute('spellcheck', false);
        this.root.setAttribute('data-role', 'xeditor-root');
        this.root.style.minHeight = this.configs.minHeight + 'px';
        
        this.contentWrapper.appendChild(this.root);
        this.fragment.appendChild(this.contentWrapper);
    },
    initEvent: function() {
        var _self = this;
        
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
        this.root.onclick = function(e) {
            _self.handlerContentClickEvent(e);
        };
        
        // 在 PC 端 onclick 事件同时处理了 selectionchange
        // this.doc.onselectionchange = function(e) {};
    },
    deleteEvent: function() {
        this.widgetsWrapper.onmousedown = null;
        this.widgetsWrapper.onclick = null;
        this.root.onkeyup = null;
        this.root.onclick = null;
    },
    handlerWidgetClickEvent: function(e) {
        var target = e.target;
        
        var action = target.getAttribute('data-action');
        
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
    },
    handlerKeydownEvent: function(e) {
        this.fire('keydown');
    },
    handlerKeyupEvent: function(e) {
        if(0 === this.root.innerHTML.length) {
            // setContent 会调用 backupCurrentRange
            // 但是每次按键弹起时不一定 innerHTML.length === 0
            // 所以下面手动多调用了一次 backupCurrentRange 保证按键后场景更新
            this.setContent('');
        }
        
        XEditor.editable.backupCurrentRange();
        
        this.widgetsStatusReflect();
        
        this.fire('keyup', null);
    },
    handlerContentClickEvent: function(e) {
        /*
        var _self = this;
        
        clearTimeout(this.reactionTimer);
        this.reactionTimer = setTimeout(function(){
            XEditor.editable.backupCurrentRange();
            
            _self.widgetsStatusReflect();
            
        }, this.configs.reactionTime);
        */
        
        XEditor.editable.backupCurrentRange();
        
        this.widgetsStatusReflect();
        
        this.fire('contentFocus', null);
    },
    widgetsStatusReflect: function() {
        for(var widget in this.widgetControllerInstances) {
            this.widgetControllerInstances[widget].statusReflect
                && this.widgetControllerInstances[widget].statusReflect(this);
        }
    },
    runPlugins: function() {
        // 直接执行
        for(var i=0, len=this.configs.plugins.length; i<len; i++) {
            new this.configs.plugins[i](this);
        }
    },
    
    
    
    /**
     * render
     */
    render: function(id) {
        // 编辑器区域
        this.wrapper = this.doc.getElementById(id);
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
            this.root.innerHTML = this.emptyContent;
            
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
    },
    
    /**
     * 定位光标到内容最后一个节点
     *
     * @param {Boolean} toEnd 是否将光标定位到末尾
     */
    resetRangeAtEndElement: function(toEnd) {
        if(undefined === toEnd) {
            toEnd = false;
        }
        
        XEditor.editable.resetRangeAt(this.root.lastChild, toEnd);
    },
    
    /**
     * 获取内容
     */
    getContent: function() {
        return this.root.innerHTML.replace(/&#8203;/g, '');
    },
    
    /**
     * 设置内容
     *
     * @param {String} data
     */
    setContent: function(data) {
        this.root.innerHTML = '' === data
            ? this.emptyContent
            : data;
        
        this.resetRangeAtEndElement();
    },
    
    /**
     * 获取纯文本内容
     */
    getPlainText: function() {
        return XEditor.tools.string
            .filterTags(this.root.innerHTML)
            .replace(/&#8203;/g, '');
    },
    
    /**
     * 获取 ubb 内容
     *
     * @param {Object} mergeTags
     */
    getUbb: function(mergeTags) {
        var tag = /<(\/)?([a-z][a-z0-9]*\b[^>]*)>/gi;
        var mt = undefined === mergeTags ? {
            'div': 'p',
            'code': 'pre',
            'strong': 'b',
            'em': 'i'
        } : mergeTags;
        
        var content = this.getContent();
        
        // 替换标签
        for(var k in mt) {
            content = content.replace(new RegExp('<(\\/)?' + k, 'gi'), function(m, p){
                return undefined === p ? '<' + mt[k] : '</' + mt[k];
            });
        }
        
        return content.replace(tag, function(match, p1, p2){
            return undefined === p1
                ? '[' + p2 + ']'
                : '[/' + p2 + ']';
        });
    },
    
    /**
     * 销毁
     */
    destroy: function() {
        // 先删除 widgets
        for(var widget in this.widgetControllerInstances) {
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
    },
    
    /**
     * 添加事件监听
     *
     * @param {String} eventName
     * @param {Function} handler
     * @param {Object} thisObject
     */
    on: function(eventName, handler, thisObject) {
        if(undefined === thisObject) {
            thisObject = null;
        }
        
        var map = this.eventBinMap;
        
        if(undefined === map[eventName]) {
            map[eventName] = [];
        }
        
        var eventBin = {
            target: this,
            type: eventName,
            handler: handler,
            thisObject: thisObject
        };
        
        map[eventName].push(eventBin);
    },
    
    /**
     * 移除事件处理器
     *
     * @param {String} eventName
     * @param {Function} handler
     * @param {Object} thisObject
     */
    off: function(eventName, handler, thisObject) {
        var map = this.eventBinMap;
        
        if(undefined === map[eventName]) {
            return;
        }
        
        if(undefined === thisObject) {
            thisObject = null;
        }
        
        for(var i=0, len=map[eventName].length, bin=null; i<len; i++) {
            bin = map[eventName][i];
            
            if(thisObject === bin.thisObject && handler === bin.handler) {
                map[eventName].splice(i, 1);
                
                break;
            }
        }
    },
    
    /**
     * 触发事件
     *
     * @param {String} eventName
     * @param {any} data
     */
    fire: function(eventName, data) {
        var map = this.eventBinMap;
        
        if(undefined === map[eventName]) {
            return;
        }
        
        for(var i=0, len=map[eventName].length, bin=null; i<len; i++) {
            bin = map[eventName][i];
            
            bin.handler.call(bin.thisObject, data);
        }
    }
};


/**
 * 块级元素
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Block-level_elements
 */
XEditor.blockLevelElements = {
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


/**
 * 具有 UI 的部件
 *
 * {name: Function ...}
 *
 */
XEditor.widgetControllers = {};
XEditor.registerWidgetController = function(name, processer) {
    XEditor.widgetControllers[name] = processer;
};


/**
 * 选区
 */
XEditor.Range = function(nativeRange) {
    this.nativeRange = nativeRange;
    
    this.collapsed = nativeRange.collapsed;
    this.startContainer = nativeRange.startContainer;
    this.endContainer = nativeRange.endContainer;
    this.startOffset = nativeRange.startOffset;
    this.endOffset = nativeRange.endOffset;
    this.commonAncestorContainer  = nativeRange.commonAncestorContainer;
};
XEditor.Range.prototype = {
    constructor: XEditor.Range
    
    /**
     * 获取距离选区最近的标签元素
     *
     * 光标在 b 会得到 b 元素
     * <div contenteditable="true">
     *      <p>
     *          <b>aabb|ccdd</b>
     *      </p>
     * </div>
     */
    ,getClosestContainerElement: function() {
        var node = this.commonAncestorContainer;
        
        return 1 === node.nodeType ? node : node.parentNode;
    }
    
    /**
     * 获取距离可编辑容器最近的最外层元素
     *
     * 光标在 b 会得到 p 元素
     * <div contenteditable="true">
     *      <p>
     *          <b>aabb|ccdd</b>
     *      </p>
     * </div>
     *
     */
    ,getOutermostElement: function() {
        var role = 'xeditor-root';
        
        var node = this.commonAncestorContainer;
        
        // 文本或者选区 直接在可编辑容器下面 这个情况很少
        if(3 === node.nodeType && role === node.parentNode.getAttribute('data-role')) {
            return null;
        }
        if(1 === node.nodeType && role === node.getAttribute('data-role')) {
            return null;
        }
        
        while( role !== node.parentNode.getAttribute('data-role') ) {
            node = node.parentNode;
        }
        
        return node;
    }
    
    /**
     * 当前选区是否在某个元素中
     *
     * @param {String} nodeName 小写标签名
     */
    ,currentInNode: function(nodeName) {
        var ret = false;
        var role = 'xeditor-root';
        var node = this.commonAncestorContainer;
        
        // 文本或者选区 直接在可编辑容器下面 这个情况很少
        if(3 === node.nodeType && role === node.parentNode.getAttribute('data-role')) {
            return false;
        }
        if(1 === node.nodeType && role === node.getAttribute('data-role')) {
            return false;
        }
        
        while( null !== node ) {
            if(1 === node.nodeType && role === node.getAttribute('data-role')) {
                break;
            }
            
            if(nodeName === node.nodeName.toLowerCase()) {
                ret = true;
                
                break;
            }
            
            node = node.parentNode;
        }
        
        return ret;
    }
    
    /* ,setStart: function(startNode, startOffset) {
        this.nativeRange.setStart(startNode, startOffset);
        
        this.startContainer = startNode;
        this.startOffset = startOffset;
    } */
    
    /* ,setEnd: function(endNode, endOffset) {
        this.nativeRange.setEnd(endNode, endOffset);
        
        this.endContainer = endNode;
        this.endOffset = endOffset;
    } */
    
    /* ,insertNode: function(newNode) {
        this.nativeRange.insertNode(newNode);
    } */
    
    /* ,collapse: function(toStart) {
        this.nativeRange.collapse(toStart);
        
        this.collapsed = true;
    } */
    
    /* ,selectNode: function(referenceNode) {
        this.nativeRange.selectNode(referenceNode);
        
        // 选中节点 属性会变更
        this.collapsed = false;
        this.startContainer = referenceNode.parentNode;
        this.endContainer = referenceNode.parentNode;
        this.commonAncestorContainer = referenceNode.parentNode;
        
        var i = 0;
        for(var len=referenceNode.parentNode.childNodes.length; i<len; i++) {
            if(referenceNode === referenceNode.parentNode.childNodes[i]) {
                break;
            }
        }
        this.startOffset = i;
        this.endOffset = i + 1;
    } */
    
    /* ,selectNodeContents: function(referenceNode) {
        this.nativeRange.selectNodeContents(referenceNode);
        
        this.collapsed = false;
        this.startContainer = referenceNode;
        this.endContainer = referenceNode;
        this.commonAncestorContainer = referenceNode;
        
        this.startOffset = 0;
        // If the nodeType of referenceNode is one of Text, Comment, or CDATASection
        // then the endOffset is the number of characters contained in the reference node.
        // For other Node types
        // endOffset is the number of child nodes.
        if(3 === referenceNode.nodeType || 4 === referenceNode.nodeType
            || 8 === referenceNode.nodeType) {
            
            this.endOffset = referenceNode.nodeValue.length;
            
        } else {
            this.endOffset = referenceNode.childNodes.length;
        }
    } */
    
    /* ,deleteContents: function() {
        this.nativeRange.deleteContents();
    } */
};
XEditor.Range.getSingleRangeFromNativeSelection = function() {
    var selection = null;
    
    if( null !== (selection = XEditor.Range.getSelectionFromNative()) ) {        
        if(0 === selection.rangeCount) {
            return null;
        }
        
        return new XEditor.Range(selection.getRangeAt(0));
    }
    
    return null;
};
XEditor.Range.createNativeRange = function() {
    if('function' === typeof document.createRange) {
        return document.createRange();
    }
    
    return null;
};
XEditor.Range.getSelectionFromNative = function() {
    if('function' === typeof window.getSelection) {
        return window.getSelection();
    }
    
    return null;
};


/**
 * 对外 API - Selection & Range & execCommand
 */
XEditor.editable = function() {};
XEditor.editable.TYPE_HTML = 1;
XEditor.editable.TYPE_TEXT = 2;
// 记录光标位置
XEditor.editable._currentRange = null;
XEditor.editable.getCurrentRange = function() {
    return XEditor.editable._currentRange;
};
/**
 * 备份当前 range
 *
 * @param {XEditor.Range} range
 */
XEditor.editable.backupCurrentRange = function(range) {
    if(undefined !== range) {
        XEditor.editable._currentRange = range;
        
        return;
    }
    
    var gettedRange = XEditor.Range.getSingleRangeFromNativeSelection();
    
    if(null !== gettedRange) {
        XEditor.editable._currentRange = gettedRange;
    }
};
/**
 * 重新设置 selection 中的 range
 */
XEditor.editable.resumeSelection = function() {
    if(null === XEditor.editable._currentRange) {
        return;
    }
    
    var selection = XEditor.Range.getSelectionFromNative();
    
    if(null === selection) {
        return;
    }
    
    if(selection.rangeCount > 0) {
        selection.removeAllRanges();
    }
    
    selection.addRange(XEditor.editable._currentRange.nativeRange);
};
/**
 * 设置 range 到某个节点
 *
 * @param {Node} node
 * @param {Boolean} toEnd 默认为 false
 */
XEditor.editable.resetRangeAt = function(node, toEnd) {
    var range = XEditor.Range.createNativeRange();

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

    XEditor.editable.backupCurrentRange(new XEditor.Range(range));
    XEditor.editable.resumeSelection();
};
/**
 * 插入内容
 */
XEditor.editable.insertHtml = function(type, data) {
    var range = XEditor.editable._currentRange;
    if(null === range) {
        return;
    }
    
    // 执行命令前 需要知道光标的位置
    XEditor.editable.resumeSelection();
    
    var doc = document;
    var fragement = null;
    
    // 插入文本
    if(XEditor.editable.TYPE_TEXT === type) {
        fragement = doc.createTextNode(data);
        
        range.nativeRange.insertNode(fragement);
        range.nativeRange.collapse(false);
        
        XEditor.editable.backupCurrentRange();
        return;
    }
    
    // html
    fragement = doc.createElement('div');
    fragement.innerHTML = data;
    
    // 如果插入的是块级元素 那么需要将其作为可编辑元素的直接子元素
    var match = data.match(/^<(\w+)[^>]*/);
    var ele = null;
    
    // block level element
    if(null !== match && 1 === XEditor.blockLevelElements[ match[1].toLowerCase() ]) {
        ele = range.getOutermostElement();
        range.nativeRange.setStartAfter(ele);
    }
    
    // inline block level element
    while(fragement.childNodes.length > 0) {
        range.nativeRange.insertNode(fragement.firstChild);
        
        range.nativeRange.collapse(false);
    }
    
    XEditor.editable.backupCurrentRange();
};
// https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
XEditor.editable.execCommand = function(aCommandName, aShowDefaultUI, aValueArgument) {
    // 执行命令前 需要知道光标的位置
    XEditor.editable.resumeSelection();
        
    document.execCommand(aCommandName, aShowDefaultUI, aValueArgument);
};
XEditor.editable.queryCommandState = function(command) {
    return document.queryCommandState(command);
};


/**
 * 工具
 */
XEditor.tools = {
    string: {
        trimChar: function(str, character) {
            if(character === str.charAt(0)) {
                str = str.substring(1);
            }
            if(character === str.charAt(str.length - 1)) {
                str = str.substring(0, str.length - 1);
            }
            
            return str;
        },
        ucFirst: function(str) {
            var ret = str.charAt(0).toUpperCase();
            
            return ret + str.substring(1);
        },
        filterTags: function(str, allowed) {
            var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
            var comments = /<!--[\s\S]*?-->/gi;
            
            str = str.replace(comments, '');
            
            if(undefined === allowed) {
                return str.replace(tags, '');
            }
            
            allowed = allowed.toLowerCase();
            
            return str.replace(tags, function(match, p) {
                return allowed.indexOf('<' + p.toLowerCase() + '>') !== -1 ? match : '';
            });
        }
    },
    dom: {
        addClass: function(element, className) {
            if(-1 !== element.className.indexOf(className)) {
                return;
            }
            
            element.className = element.className + ' ' + className;
        },
        removeClass: function(element, className) {
            var newClassName =  ' ' + element.className + ' ';
            var replaced = newClassName.replace(' ' + className + ' ', ' ');
            
            element.className = XEditor.tools.string.trimChar(replaced, ' ');
        },
        preventDefault: function(event) {
            if(event.preventDefault) {
                event.preventDefault();
            
            } else {
                event.returnValue = false;
            }
        },
        setStyle: function(element, styles) {
            for(var s in styles) {
                element.style[s] = styles[s];
            }
        },
        getOffset: function(elem) {
            if ( !elem.getClientRects().length ) {
                return { top: 0, left: 0 };
            }
        
            var rect = elem.getBoundingClientRect();
            var doc = elem.ownerDocument;
            var docElem = doc.documentElement;
            var win = doc.defaultView;

            return {
                top: rect.top + win.pageYOffset - docElem.clientTop,
                left: rect.left + win.pageXOffset - docElem.clientLeft
            };
        }
    }
};


/**
 * Dialog
 */
XEditor.Lock = function() {
    this.doc = document;
    this.zIndex = 1100;
    this.inited = false;
    this.mask = null;
    this.id = 'xeditor-dialog-mask';
};
XEditor.Lock.getInstance = function() {
    if(undefined === XEditor.Lock.instance) {
        XEditor.Lock.instance = new XEditor.Lock();
    }
    
    return XEditor.Lock.instance;
};
XEditor.Lock.prototype = {
    constructor : XEditor.Lock
    ,init : function(opacity) {
        if(this.inited) return;
        
        var _self = this;
        
        if(undefined === opacity) {
            opacity = 0.6;
        }
        
        this.mask = this.doc.createElement('div');
        this.mask.setAttribute('id', this.id);
        
        XEditor.tools.dom.setStyle(this.mask, {
            position: 'fixed',
            zIndex: this.zIndex,
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            backgroundColor: '#000',
            filter: 'alpha(opacity='+ (opacity * 100) +')',
            opacity: opacity
        });
        
        // close
        this.mask.onclick = function(e) {
            XEditor.Dialog.getInstance().close();
            _self.unLock();
        };
        
        this.inited = true;
    }
    
    ,unLock : function() {
        if(null !== this.doc.getElementById(this.id)) {
            this.doc.body.removeChild(this.mask);
        }
    }
    ,lock : function(opacity) {
        this.init(opacity);
        
        if(null === this.doc.getElementById(this.id)) {
            this.doc.body.appendChild(this.mask);
        }
    }
};
XEditor.Dialog = function() {
    this.doc = document;
    this.wrapper = null;
    this.closeButton = null;
    this.afterCloseCallback = null;
    this.timer = 0;
    this.zIndex = 1120;
    this.id = 'xeditor-dialog-dialog';
};
XEditor.Dialog.getInstance = function() {
    if(undefined === XEditor.Dialog.instance) {
        XEditor.Dialog.instance = new XEditor.Dialog();
    }
    
    return XEditor.Dialog.instance;
};
XEditor.Dialog.prototype = {
    constructor: XEditor.Dialog,
    init : function() {
        var _self = this;
                    
        this.wrapper = this.doc.createElement('div');
        this.wrapper.setAttribute('id', this.id);
        this.setStyle(this.wrapper, {
            position: 'fixed',
            zIndex: this.zIndex,
            top: '15%',
            width: '500px',
            fontSize: '14px',
            backgroundColor: '#fff',
            wordWrap: 'break-word',
            wordBreak: 'break-all',
            borderRadius: '4px',
            transition: 'top .2s linear'
        });
        
        this.closeButton = this.doc.createElement('span');
        this.closeButton.className = 'xeditor-dialog-close';
        this.setStyle(this.closeButton, {
            zIndex: this.zIndex
        });
        this.closeButton.onclick = function(e) {
            _self.close();
            XEditor.Lock.getInstance().unLock();
        };
    },
    resetPosition: function() {
        var _self = this;
        
        var width = this.wrapper.clientWidth;
        var winWidth = this.doc.body.clientWidth;
        
        this.wrapper.style.left = Math.floor((winWidth - width) / 2) + 'px';
        
        setTimeout(function(){
            _self.wrapper.style.top = '20%';
        }, 20);
    },
    setStyle: function(element, styles) {
        XEditor.tools.dom.setStyle(element, styles);
    },
    render: function() {
        XEditor.Lock.getInstance().lock();
        
        if(null === this.doc.getElementById(this.id)) {
            this.doc.body.appendChild(this.wrapper);
        }      
    },
    close: function() {
        if(null !== this.doc.getElementById(this.id)) {
            this.doc.body.removeChild(this.wrapper);
        }
        
        this.closeButton.onclick = null;
        this.closeButton = null;
        this.wrapper = null;
        
        if(null !== this.afterCloseCallback) {
            this.afterCloseCallback();
        }
    },
    show: function(content, afterCloseCallback) {
        this.afterCloseCallback = null;
        
        if(undefined !== afterCloseCallback) {
            this.afterCloseCallback = afterCloseCallback
        }
        
        this.init();        
        this.wrapper.innerHTML = content;
        this.wrapper.appendChild(this.closeButton);
        
        this.render();
        this.resetPosition();
    }
};

