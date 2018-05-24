/**
 * XEditor
 *
 * rich text editor for IE9+
 *
 * @author afu
 */
'use strict';

function XEditor(id, options) {
    this.id = id;
    this.doc = document;
    this.wrapper = null;
    this.widgetsWrapper = null;
    this.contentWrapper = null;
    this.root = null;
    this.events = {};
    this.fragment = this.doc.createDocumentFragment();
    
    this.defaultHtml = '<p><br></p>';
    
    this.widgetControllerInstances = {};
    // 假设同一时间只会有同一个类型的动作发生 所以所有动作共用一个定时器
    this.reactionTimer = 0;
    
    this.configs = {
        reactionTime: 200,
        widgets: ['code', '-', 'blockquote', 'bold', 'italic', 'align', 'separator', '-', 'emotion', 'image', 'link'],
        placeholder: '',
        minHeight: '120',
        maxHeight: '500',
        
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
    execCommand: function(aCommandName, aShowDefaultUI, aValueArgument) {
        XEditor.editing.execCommand(aCommandName, aShowDefaultUI, aValueArgument);
    },
    queryCommandState: function(command) {
        return XEditor.editing.queryCommandState(command);
    },
    clearElementContent: function(element) {
        while(null !== element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },
    init: function(options) {
        if(undefined !== options) {
            this.extend(this.configs, options);
        }
        
        this.wrapper = this.doc.getElementById(this.id);
        this.wrapper.className = 'xeditor-wrapper';
        this.clearElementContent(this.wrapper);
        
        this.initWidgetsStructure();
        this.initContentStructure();
        this.render();
        
        this.initEvent();
        this.runPlugins();
        this.resetRangeAtEndElement();
        
        this.fireEvent('ready');
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
                item.setAttribute('data-role', this.configs.widgets[i]);
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
        this.root.className = 'xeditor-content-root';
        this.root.contentEditable = true;
        this.root.setAttribute('spellcheck', false);
        this.root.style.minHeight = this.configs.minHeight + 'px';
        this.root.style.maxHeight = this.configs.maxHeight + 'px';
        
        this.root.innerHTML = this.defaultHtml;
        
        this.contentWrapper.appendChild(this.root);
        this.fragment.appendChild(this.contentWrapper);
    },
    render: function() {
        this.wrapper.appendChild(this.fragment);
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
        this.root.onkeyup = function(e) {
            _self.handlerKeyupEvent(e);
        };
        
        this.root.onclick = function(e) {
            _self.handlerContentClickEvent(e);
        };
    },
    deleteEvent: function() {
        this.widgetsWrapper.onmousedown = null;
        this.widgetsWrapper.onclick = null;
        this.root.onkeyup = null;
        this.root.onclick = null;
    },
    runPlugins: function() {
        for(var name in XEditor.plugins) {
            XEditor.plugins[name](this);
        }
    },
    handlerWidgetClickEvent: function(e) {
        e = e || window.event;
        var target = e.target || e.srcElement;
        
        var role = target.getAttribute('data-role');
        
        // 只有触发事件的对象才处理
        if(null === role) {
            return;
        }
        
        if(undefined === this.widgetControllerInstances[role]) {
            return;
        }
        
        if(undefined === this.widgetControllerInstances[role].onClick) {
            throw new Error('The widget: '+ role +' has no onClick method');
        }
        
        this.widgetControllerInstances[role].onClick(this);
    },
    handlerKeyupEvent: function(e) {
        if(0 === this.root.innerHTML.length) {
            // setContent 会调用 saveCurrentRange
            // 但是每次按键弹起时不一定走这个逻辑
            // 所以下面还有一个 saveCurrentRange
            this.setContent('');
        }
        
        XEditor.editing.saveCurrentRange();
        
        this.changeWidgetsStatus();
    },
    handlerContentClickEvent: function(e) {
        var _self = this;
        
        clearTimeout(this.reactionTimer);
        this.reactionTimer = setTimeout(function(){            
            XEditor.editing.saveCurrentRange();
            
            _self.changeWidgetsStatus();
            
        }, this.configs.reactionTime);
    },
    changeWidgetsStatus: function() {
        for(var widget in this.widgetControllerInstances) {
            this.widgetControllerInstances[widget].changeStatus
                && this.widgetControllerInstances[widget].changeStatus(this);
        }
    },
    
    /**
     * 定位光标到内容最后一个节点
     *
     * @param {Boolean} toEnd 是否将光标定位到末尾
     */
    resetRangeAtEndElement: function(toEnd) {
        XEditor.editing.resetRangeAt(this.root.lastChild, toEnd);
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
            ? this.defaultHtml
            : '<p>'+ data +'</p>';
        
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
        this.deleteEvent();
        
        this.clearElementContent(this.wrapper);
        
        this.wrapper = null;
        this.widgetsWrapper = null;
        this.contentWrapper = null;
        this.root = null;
    },
    fireEvent: function(eventName, data) {
        var handlersArray = this.events[eventName];
        
        if(undefined === handlersArray) {
            return;
        }
        
        for(var i=0, len=handlersArray.length; i<len; i++) {
            handlersArray[i](this, data);
        }
    },
    addEventListener: function(eventName, handler) {
        if(undefined === this.events[eventName]) {
            this.events[eventName] = [];
        }
        
        this.events[eventName].push(handler);
    },
    removeEventListener: function(eventName, handler) {
        if(undefined === this.events[eventName]) {
            return;
        }
        
        if(undefined === handler) {
            delete this.events[eventName];
            
        } else {
            for(let i=0,len=this.events[eventName].length; i<len; i++) {
                if(handler === this.events[eventName][i]) {
                    this.events[eventName].splice(i, 1);
                }
            }
        }
    }
};

/**
 * plugins 简单的插件
 *
 * {name: callback ...}
 *
 */
XEditor.plugins = {};

/**
 * 部件容器
 *
 * {name: Function ...}
 *
 */
XEditor.widgetControllers = {};
XEditor.registerWidgetController = function(name, processer) {
    XEditor.widgetControllers[name] = processer;
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
        }
    }
};

/**
 * 对外 API - Selection & Range & execCommand
 */
XEditor.editing = {
    // 记录光标位置
    currentRange: null,
    /**
     * 缓存当前 range
     *
     * @param {Range} range
     */
    saveCurrentRange: function(range) {
        if(undefined !== range) {
            XEditor.editing.currentRange = range;
            
            return;
        }
        
        var getRange = XEditor.Range.getSingleRangeFromNativeSelection();
        
        if(null !== getRange) {
            XEditor.editing.currentRange = getRange;
        }
    },
    /**
     * 设置 range 到某个节点
     *
     * @param {Node} node
     * @param {Boolean} toEnd
     */
    resetRangeAt: function(node, toEnd) {
        var range = XEditor.Range.createNativeRange();
        
        if(null === range) {
            return;
        }
        
        if(true === toEnd) {
            // 元素节点计算偏移量是算子元素数量 其他节点计算偏移量是算内容长度
            var position = node.nodeType === 1
                ? node.childNodes.length : node.nodeValue.length;
            range.setStart(node, position);
            
        } else {
            range.setStart(node, 0);
        }
        
        // range.insertNode(document.createTextNode('|'));
        
        XEditor.editing.saveCurrentRange(new XEditor.Range(range));
        XEditor.editing.resumeSelection();
    },
    /**
     * 重新设置 selection 中的 range
     */
    resumeSelection: function() {
        if(null === XEditor.editing.currentRange) {
            return;
        }
        
        var selection = window.getSelection();
        
        if(selection.rangeCount > 0) {
            selection.removeAllRanges();
        }
        
        selection.addRange(XEditor.editing.currentRange.nativeRange);
    },
    diffApi: {
        insertHTML: function(aShowDefaultUI, aValueArgument) {
            var doc = document;
            var range = XEditor.editing.currentRange;
            var tmpElement = null;
            
            if(null === range) {
                return;
            }
            
            if(doc.queryCommandSupported('insertHTML')) {
                doc.execCommand('insertHTML', aShowDefaultUI, aValueArgument);
            
                return;
            }
            
            // ie
            range.deleteContents();
            range.collapse();
            
            var p = range.getClosestContainerElement();
            p.innerHTML += aValueArgument;
        }
    },
    // https://w3c.github.io/editing/execCommand.html#methods-to-query-and-execute-commands
    execCommand: function(aCommandName, aShowDefaultUI, aValueArgument) {
        // 执行命令前 需要知道光标的位置
        XEditor.editing.resumeSelection();
        
        if(undefined !== XEditor.editing.diffApi[aCommandName]) {
            XEditor.editing.diffApi[aCommandName](
                aShowDefaultUI, aValueArgument);
            
            return;
        }
        
        document.execCommand(aCommandName, aShowDefaultUI, aValueArgument);
    },
    queryCommandState: function(command) {
        return document.queryCommandState(command);
    }
};
XEditor.Range = function(nativeRange) {
    this.nativeRange = nativeRange;
    
    this.collapsed = nativeRange.collapsed;
    this.startContainer = nativeRange.startContainer;
    this.endContainer = nativeRange.endContainer;
    this.startOffset = nativeRange.startOffset;
    this.endOffset = nativeRange.endOffset;
    this.commonAncestorContainer  = nativeRange.commonAncestorContainer ;
}
XEditor.Range.prototype = {
    constructor: XEditor.Range,
    getClosestContainerElement: function() {
        var ret = this.commonAncestorContainer;
        
        return 1 === ret.nodeType ? ret : ret.parentNode;
    },
    setStart: function(startNode, startOffset) {
        this.nativeRange.setStart(startNode, startOffset);
    },
    setEnd: function(endNode, endOffset) {
        this.nativeRange.setEnd(endNode, endOffset);
    },
    insertNode: function(newNode) {
        this.nativeRange.insertNode(newNode);
    },
    collapse: function(toStart) {
        this.nativeRange.collapse(toStart);
    },
    selectNode: function(referenceNode) {
        this.nativeRange.selectNode(referenceNode);
    },
    selectNodeContents: function(referenceNode) {
        this.nativeRange.selectNodeContents(referenceNode);
    },
    deleteContents: function() {
        this.nativeRange.deleteContents();
    }
};
XEditor.Range.getSingleRangeFromNativeSelection = function() {
    var selection = null;
    
    if('function' === typeof window.getSelection) {
        selection = window.getSelection();
        
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

