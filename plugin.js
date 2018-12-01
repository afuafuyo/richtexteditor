/**
 * bold
 */
function XEditorBold(button, editor) {
    this.button = button;
    // this.editor = editor;
}
XEditorBold.prototype = {
    constructor: XEditorBold,
    onClick: function(editor) {
        var range = XEditor.editing.currentRange;
        
        if(null === range) {
            return;
        }
        
        // 如果没有选中文本 那么不做处理
        if(range.collapsed) {
            return;
        }
        
        editor.execCommand('bold', false, null);
        
        this.statusReflect(editor);
    },
    statusReflect: function(editor) {
        var ret = editor.queryCommandState('bold');
        if(true === ret) {
            XEditor.tools.dom.addClass(this.button, 'active');
            
            return;
        }
        
        XEditor.tools.dom.removeClass(this.button, 'active');
    }
};
XEditor.registerWidgetController('bold', XEditorBold);

/**
 * emotion
 */
function XEditorEmotion(button, editor) {
    this.button = button;
    this.editor = editor;
    
    this.init();
    this.bindEvent();
}
XEditorEmotion.prototype = {
    constructor: XEditorEmotion,
    init: function() {
        var html =
            ['<div class="xeditor-emotion-wrapper">',
                '<div class="xeditor-dialog-tabs">',
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
       
        var doc = this.button.ownerDocument;
        
        var wrapper = doc.createElement('div');
        wrapper.className = 'xeditor-pop-wrapper';
        wrapper.innerHTML = html;
        
        this.button.appendChild(wrapper);
    },
    bindEvent: function() {
        var _self = this;
        var wrap = this.button.firstChild.querySelector('.xeditor-emotion-content');
        wrap.onclick = function(e) {
            var target = e.target;
            
            var em = target.getAttribute('data-em');
            
            if(null !== em) {
                _self.editor.execCommand('insertHTML', false, em);
                
                _self.close();
            }
        };
        wrap = null;
        
        // 点击空白关闭
        this.button.ownerDocument.body.addEventListener('click', function(e) {
            var canClose = true;
            var target = e.target;
            
            do {
                if(target.nodeName.toUpperCase() === 'BODY') {
                    break;
                }
                
                if(target.className.indexOf('xeditor-icon-emotion') >= 0
                    || target.className.indexOf('xeditor-emotion-wrapper') >= 0) {
                    canClose = false;
                    break;
                }
            } while(null !== (target = target.parentNode));
            
            if(canClose) {
                _self.close();
            }
        });
    },
    close: function() {
        this.button.firstChild.style.display = 'none';
    },
    onClick: function(editor) {
        this.button.firstChild.style.display = 'block';
    },
    destroy: function() {}
};
XEditor.registerWidgetController('emotion', XEditorEmotion);

/**
 * link
 */
function XEditorLink(button, editor) {
    this.button = button;
    this.editor = editor;
    this.html =
['<div class="xeditor-link-wrapper">',
    '<div class="xeditor-link-title">',
        '<strong>插入链接</strong>',
    '</div>',
    '<div class="xeditor-link-content">',
        '<div class="xeditor-inputtext-wrapper active"><input type="text" placeholder="输入链接地址"></div>',
        '<div class="xeditor-inputtext-wrapper"><input type="text" placeholder="输入链接文本 (可选)"></div>',
    '</div>',
    '<div class="xeditor-dialog-footer">',
        '<button type="button" class="xeditor-btn xeditor-btn-primary" data-role="ok">插入链接</button>',
        '<span>&nbsp;</span>',
        '<button type="button" class="xeditor-btn" data-role="cancel">取消</button>',
    '</div>',
'</div>'].join('');
}
XEditorLink.prototype = {
    constructor: XEditorLink,
    getRangeElement: function() {
        var range = XEditor.editing.currentRange;
        var ret = null;
        
        if(null === range) {
            return null;
        }
        
        return range.getClosestContainerElement();
    },
    isLink: function(link) {
        return true;
    },
    close: function() {
        XEditor.Lock.getInstance().unLock();
        XEditor.Dialog.getInstance().close();
    },
    bindEvent: function() {
        var _self = this;
        var wrap = this.editor.doc.querySelector('.xeditor-link-wrapper');
        var inputItems = wrap.querySelectorAll('.xeditor-inputtext-wrapper');
        var inputs = wrap.querySelectorAll('input[type="text"]');
        
        wrap.onclick = function(e) {
            var target = e.target;
            var nodeName = target.nodeName.toUpperCase();
            
            if('INPUT' === nodeName) {
                for(var i=0,len=inputItems.length; i<len; i++) {
                    XEditor.tools.dom.removeClass(inputItems[i], 'active');
                }
                
                XEditor.tools.dom.addClass(target.parentNode, 'active');
                
                return;
            }
            
            if('BUTTON' === nodeName) {
                if('cancel' === target.getAttribute('data-role')) {
                    _self.close();
                    
                    return;
                }
                
                if('ok' === target.getAttribute('data-role')) {
                    var link = inputs[0].value;
                    var text = inputs[1].value;
                    
                    if(!_self.isLink(link)) {
                        return;
                    }
                    
                    // 修改链接
                    if(_self.button.className.indexOf('active') > 0) {
                        var originA = _self.getRangeElement();
                        
                        originA.setAttribute('href', link);
                        originA.innerHTML = (text || link);
                        
                    } else {
                        _self.editor.execCommand('insertHTML', false,
                            '<a href="'+ link +'">'+ (text || link) +'</a>');
                        XEditor.editing.saveCurrentRange();
                    }
                    
                    _self.close();
                }
            }
        };
        wrap = null;
    },
    initContent: function() {
        if(this.button.className.indexOf('active') > 0) {
            var element = this.getRangeElement();
            var inputs = XEditor.Dialog.getInstance().wrapper.querySelectorAll('input[type="text"]');
            
            var link = element.getAttribute('href');
            var text = element.innerHTML;
            
            // link
            inputs[0].value = link;
            
            // text
            if(link !== text) {
                inputs[1].value = text;
            }
        }
    },
    autoFocus: function() {
        XEditor.Dialog.getInstance().wrapper.querySelectorAll('input[type="text"]')[0].focus();
    },
    onClick: function(editor) {
        var dialog = XEditor.Dialog.getInstance();
        dialog.show(this.html);
        
        this.bindEvent();
        
        this.initContent();
        
        this.autoFocus();
    },
    statusReflect: function(editor) {
        var element = this.getRangeElement();
        
        if(null === element) {
            return;
        }
                
        if('A' === element.nodeName.toUpperCase()) {
            XEditor.tools.dom.addClass(this.button, 'active');
            
            return;
        }
        
        XEditor.tools.dom.removeClass(this.button, 'active');
    }
};
XEditor.registerWidgetController('link', XEditorLink);

/**
 * image
 */
function XEditorImage(button, editor) {
    this.button = button;
    this.editor = editor;
    this.html =
['<div class="xeditor-uploadimage-wrapper">',
    '<div class="xeditor-dialog-tabs">',
        '<a class="active" href="javascript:;" data-role="local">本地图片</a>',
        '<a href="javascript:;" data-role="remote">网络图片</a>',
    '</div>',
    '<div class="xeditor-uploadimage-content xeditor-uploadimage-content-local">',
        '<div class="xeditor-uploadimage-uploadlist">',
        '</div>',
        '<div class="xeditor-uploadimage-uploadbtn">',
            '<input id="xeditor-uploadimage-inputfile" type="file" class="xeditor-uploadimage-input">',
        '</div>',
        '<div class="xeditor-clear"></div>',
    '</div>',
    '<div style="display:none" class="xeditor-uploadimage-content xeditor-uploadimage-content-remote">',
        '<div class="xeditor-inputtext-wrapper active">',
            '<input type="text" placeholder="图片地址">',
        '</div>',
        '<div class="xeditor-uploadimage-remote-preview"><img src=""></div>',
    '</div>',
    '<div class="xeditor-dialog-footer">',
        '<button type="button" class="xeditor-btn xeditor-btn-primary" data-role="ok">插入图片</button>',
        '<span>&nbsp;</span>',
        '<button type="button" class="xeditor-btn" data-role="cancel">取消</button>',
    '</div>',
'</div>'].join('');

    this.defaultImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAoCAMAAAA/pq9xAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAzUExURUdwTFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUAdKVl8AAAAQdFJOUwAwzyAQYO9/v0Cfj3BQr9/suovOAAABcklEQVRIx+2Vy5KsIBAFEwGKQtTz/197F0q3fWfVxETMxlwYbCQp6gE8PDw8/BWeoAaI1X9px7XWWmvNdRCQgxza8dLaB/lbSTYzK8XN7DjMzOKQRF04pnpn/T6WRC8BYLl+viR18ZOECdKIaua+bOnaANB2l5jC3q4dTbgyAEE2Y9nVgXE3dkm2w/CmI18SmgxIZUkzkrQYoO7u7oudlSVPALGpXhK6GmkpM46RXDlWoRoQ/EYYErL2/cze103hrr4p3CVVb4yXhKyRtolgfBMfEgOixbEckibNZQSQt/2nxBU+Jakp52mLnIScvd0lXf4hSYsyTFvk56f0u6QWncsEJkIpG0DWnOU8cuiqkTVfkqxVwJpRx5TKqKs8V2BygFD2pfTXHFBzAeByTIT0HkMzzSg/d4VVewKiHbIr85ji/wOyfj1U6lEi+dAKsJWSbFFZI7CcndJ+jHqbGPUR8nifQmZbt3ejusfnFX94ePg7/gGnExM5f+TplgAAAABJRU5ErkJggg==';

    this.uploader = null;
}
XEditorImage.prototype = {
    constructor: XEditorImage,
    close: function() {
        XEditor.Lock.getInstance().unLock();
        XEditor.Dialog.getInstance().close();
    },
    bindEvent: function() {
        var _self = this;
        var wrapper = this.editor.doc.querySelector('.xeditor-uploadimage-wrapper');
        var contents = wrapper.querySelectorAll('.xeditor-uploadimage-content');
        var imageListWrapper = wrapper.querySelector('.xeditor-uploadimage-uploadlist');
        var remoteImageInput = wrapper.querySelector('input[type="text"]');
        var previewBox = remoteImageInput.parentNode.nextSibling;
        
        // 默认图
        previewBox.firstChild.src = this.defaultImage;
        
        // tab 切换 确定取消 删除图片
        wrapper.onclick = function(e) {
            var target = e.target;
            var role = target.getAttribute('data-role');
            
            if(null === role) {
                return;
            }
            
            if('local' === role || 'remote' === role) {
                var tabs = target.parentNode.querySelectorAll('a');
                
                for(var i=0,len=contents.length; i<len; i++) {
                    contents[i].style.display = 'none';
                }
                for(var i=0,len=tabs.length; i<len; i++) {
                    tabs[i].className = '';
                }
                
                contents['local' === role ? 0 : 1].style.display = 'block';
                target.className = 'active';
                
                return;
            }
            
            if('del' === role) {
                target.parentNode.parentNode.removeChild(target.parentNode);
                
                return;
            }
            
            if('cancel' === role) {
                _self.close();
                
                return;
            }
            
            if('ok' === role) {
                var images = imageListWrapper.querySelectorAll('img');
                
                var ret = '';
                
                var firstTab = wrapper.querySelector('a');
                
                // 添加图片
                if(firstTab.className.indexOf('active') >= 0) {
                    for(var i=0,len=images.length; i<len; i++) {
                        ret += '<p><img src="'+ images[i].getAttribute('src') +'"></p>';
                    }
                    
                } else {
                    ret = '<p><img src="'+ remoteImageInput.value +'"></p>';
                }
                
                if('' !== ret) {
                    ret += '<p><br></p>';
                    _self.editor.execCommand('insertHTML', false, ret);
                }
                
                _self.close();
            }
        };
    
        // 远程图片
        remoteImageInput.onkeyup = function(e) {
            var value = this.value;
            
            previewBox.firstChild.src = '' === value ? _self.defaultImage : value;
        };
    },
    onClick: function(editor) {
        var dialog = XEditor.Dialog.getInstance();
        dialog.show(this.html);
        
        this.bindEvent();
        
        this.initUpload();
    },
    initUpload: function() {
        if(undefined === window.XFileUpload) {
            return;
        }
        
        var _self = this;
        
        this.uploader = new XFileUpload('xeditor-uploadimage-inputfile', {
            server: this.editor.configs.server
        });
        
        this.uploader.fileQueuedHandler = function(file) {
            _self.renderProgressView(file);
        };
        // 选完文件手动调用上传
        this.uploader.filesQueuedCompleteHandler = function(obj) {
            // todo some other things
            // eg. 设置一些 post 参数
            // _self.uploader.setPostParam('token', 'xxxxx');
            _self.uploader.startUpload();
        };
        this.uploader.uploadProgressHandler = function(file, percent) {
            var wrapper = _self.editor.doc.getElementById(file.id);
            
            wrapper.firstChild.firstChild.style.width = percent * 100 + '%';
        };
        this.uploader.uploadSuccessHandler = function(file, serverData) {
            //console.log(serverData);
            var data = JSON.parse(serverData);
            
            _self.renderImageView(file, data);
        };
        this.uploader.uploadCompleteHandler = function() {
            //console.log('done');
        };
    },
    renderProgressView: function(file) {
        /*
        <div class="xeditor-uploadimage-imageitem">
            <span class="xeditor-uploadimage-progress">
                <span class="xeditor-uploadimage-percent"></span>
            </span>
        </div>
        */
        
        var doc = this.editor.doc;
        var wrapper = doc.querySelector('.xeditor-uploadimage-wrapper');
        var listWrapper = wrapper.querySelector('.xeditor-uploadimage-uploadlist');
        
        var div = doc.createElement('div');
        div.className = 'xeditor-uploadimage-imageitem';
        div.id = file.id;
        div.innerHTML = '<span class="xeditor-uploadimage-progress">'
            + '<span class="xeditor-uploadimage-percent"></span>'
            + '</span>';
        
        listWrapper.appendChild(div);
    },
    renderImageView: function(file, data) {
        /*
        <div class="xeditor-uploadimage-imageitem">
            <a href="javascript:;" class="xeditor-uploadimage-delete">&times;</a>
            <img src="">
        </div>
        */
        
        var doc = this.editor.doc;
        var wrapper = doc.querySelector('.xeditor-uploadimage-wrapper');
        var listWrapper = wrapper.querySelector('.xeditor-uploadimage-uploadlist');
        
        var old = doc.getElementById(file.id);
        var div = doc.createElement('div');
        div.className = 'xeditor-uploadimage-imageitem';
        div.innerHTML = '<a data-role="del" href="javascript:;" class="xeditor-uploadimage-delete">&times;</a>'
            + '<img src="'+ data.data +'">';
        
        listWrapper.insertBefore(div, old);
        listWrapper.removeChild(old);
    },
};
XEditor.registerWidgetController('image', XEditorImage);

/**
 * blockquote
 */
function XEditorBlockQuote(button) {
    this.button = button;
}
XEditorBlockQuote.prototype = {
    constructor: XEditorBlockQuote,
    onClick: function(editor) {
        var range = XEditor.editing.currentRange;

        if(null === range) {
            return;
        }

        var container = range.getOutermostElement();
        var node = null;

        // 有格式
        if('BLOCKQUOTE' === container.nodeName.toUpperCase()) {
            node = editor.doc.createElement('p');
            node.innerHTML = 'P' === container.firstChild.nodeName.toUpperCase()
                ? container.firstChild.innerHTML
                : container.innerHTML;
            
        } else {
            node = editor.doc.createElement('blockquote');
            node.innerHTML = '<p>' + container.innerHTML + '</p>';
        }
        
        container.parentNode.replaceChild(node, container);
        
        XEditor.editing.resetRangeAt(node, true);
        
        this.statusReflect(editor);
    },
    statusReflect: function(editor) {
        var range = XEditor.editing.currentRange;
        
        if(null === range) {
            return;
        }
        
        var blocked = range.currentInNode('blockquote');
        
        if(blocked) {
            XEditor.tools.dom.addClass(this.button, 'active');
            
        } else {
            XEditor.tools.dom.removeClass(this.button, 'active');
        }
    }
};
XEditor.registerWidgetController('blockquote', XEditorBlockQuote);

/**
 * italic
 */
function XEditorItalic(button) {
    this.button = button;
}
XEditorItalic.prototype = {
    constructor: XEditorItalic,
    onClick: function(editor) {
        var range = XEditor.editing.currentRange;

        if(null === range) {
            return;
        }

        if(range.collapsed) {
            return;
        }
        editor.execCommand('italic', false, null);
        
        this.statusReflect(editor);
    },
    statusReflect: function(editor) {
        var ret = editor.queryCommandState('italic');
        if(true === ret) {
            XEditor.tools.dom.addClass(this.button, 'active');
            
            return;
        }
        
        XEditor.tools.dom.removeClass(this.button, 'active');
    }
};
XEditor.registerWidgetController('italic', XEditorItalic);

/**
 * code
 */
function XEditorCode(button) {
    this.button = button;
}
XEditorCode.prototype = {
    constructor: XEditorCode,
    onClick: function(editor) {
        var range = XEditor.editing.currentRange;

        if(null === range) {
            return;
        }

        var container = range.getOutermostElement();
        var node = null;
        
        if('PRE' === container.nodeName.toUpperCase()) {
            node = editor.doc.createElement('p');
            
        } else {
            node = editor.doc.createElement('pre');
        }
        
        node.innerHTML = container.innerHTML;
        container.parentNode.replaceChild(node, container);
        
        XEditor.editing.resetRangeAt(node, true);
        
        this.statusReflect(editor);
    },
    statusReflect: function(editor) {
        var range = XEditor.editing.currentRange;
        
        if(null === range) {
            return;
        }
        
        var blocked = range.currentInNode('pre');
        
        if(blocked) {
            XEditor.tools.dom.addClass(this.button, 'active');
            
        } else {
            XEditor.tools.dom.removeClass(this.button, 'active');
        }
    }
};
XEditor.registerWidgetController('code', XEditorCode);

/**
 * align
 */
function XEditorAlign(button) {
    this.button = button;
    this.dropWrapper = null;
    
    this.init();
    this.bindEvent();
}
XEditorAlign.prototype = {
    constructor: XEditorAlign,
    init: function() {
        var doc = this.button.ownerDocument;
        var item = null;
        var text = ['左对齐', '居中', '右对齐'];
        var role = ['left', 'center', 'right'];
        this.dropWrapper = doc.createElement('div');
        this.dropWrapper.className = 'xeditor-dropdown-wrapper';
        
        for(var i=0; i<3; i++) {
            item = doc.createElement('span');
            item.setAttribute('data-role', role[i]);
            item.className = 'xeditor-align-item';
            item.innerHTML = text[i];
            
            this.dropWrapper.appendChild(item);
        }
        
        this.button.appendChild(this.dropWrapper);
    },
    bindEvent: function() {
        var _self = this;
        
        this.dropWrapper.onclick = function(e) {
            var target = e.target;
            var range = XEditor.editing.currentRange;
            
            if(null === range) {
                return;
            }
            if(undefined === target) {
                return;
            }
            
            var ele = range.getOutermostElement();
            var role = target.getAttribute('data-role');
            
            if('left' === role) {
                ele.style.textAlign = 'left';
                
            } else if('center' === role) {
                ele.style.textAlign = 'center';
                
            } else if('right' === role) {
                ele.style.textAlign = 'right';
            }
        };
    },
    onClick: function(editor) {},
    statusReflect: function(editor) {}
};
XEditor.registerWidgetController('align', XEditorAlign);

/**
 * separator
 */
function XEditorSeparator(button, editor) {
    this.button = button;
    this.editor = editor;
    this.dropWrapper = null;
    
    this.init();
    this.bindEvent();
}
XEditorSeparator.prototype = {
    constructor: XEditorSeparator,
    init: function() {
        var doc = this.button.ownerDocument;
        this.dropWrapper = doc.createElement('div');
        this.dropWrapper.className = 'xeditor-dropdown-wrapper';
        
        var item = doc.createElement('div');
        item.setAttribute('data-role', 'solid');
        item.className = 'xeditor-separator-item';
        item.innerHTML = '——————';
        
        this.dropWrapper.appendChild(item);
        this.button.appendChild(this.dropWrapper);
    },
    bindEvent: function() {
        var _self = this;
        
        this.dropWrapper.onclick = function(e) {
            var target = e.target;
            var range = XEditor.editing.currentRange;
            
            if(null === range) {
                return;
            }
            if(undefined === target) {
                return;
            }
            
            var role = target.getAttribute('data-role');
            
            // 先插入一个空行
            XEditor.editing.execCommand('insertHTML', false,
                '<p><br /></p>');
            
            if('solid' === role) {
                XEditor.editing.execCommand('insertHTML', false,
                '<figure><hr /></figure>');
            }
            
            // 光标移动末尾
            _self.editor.resetRangeAtEndElement(true);
        };
    },
    onClick: function(editor) {},
    statusReflect: function(editor) {}
};
XEditor.registerWidgetController('separator', XEditorSeparator);
