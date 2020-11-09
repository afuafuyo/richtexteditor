import Editable from '../../Editable';

import IWidget from '../IWidget';

import Dialog from '../../com/Dialog';
import FileUploader from '../../com/FileUploader';

/**
 * image
 *
 * widgetsOptions: {
 *      image: {
 *          fieldName: '服务端接收文件名',
 *          accept: 'image/jpg, image/jpeg, image/png',
 *          fileSizeLimit: 1024 * 1024,  // 字节
 *          server: 'someapi',  // 服务器地址 也可以通过 beforeUpload 返回
 *          beforeUpload: (callback) => {},  // 可选
 *          uploadSuccess: (serverData) => {},  // 上传一张图片成功
 *          uploadComplete: () => {}  // 可选
 *      }
 * }
 */
export default class Image extends IWidget {
    public button: any;
    public editor: any;

    private previewIcon: string;

    private uploader: any;
    private dialogRef: any;

    constructor(button: any, editor: any) {
        super(editor);

        this.button = button;
        this.editor = editor;

        this.previewIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAoCAMAAAA/pq9xAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAzUExURUdwTFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUAdKVl8AAAAQdFJOUwAwzyAQYO9/v0Cfj3BQr9/suovOAAABcklEQVRIx+2Vy5KsIBAFEwGKQtTz/197F0q3fWfVxETMxlwYbCQp6gE8PDw8/BWeoAaI1X9px7XWWmvNdRCQgxza8dLaB/lbSTYzK8XN7DjMzOKQRF04pnpn/T6WRC8BYLl+viR18ZOECdKIaua+bOnaANB2l5jC3q4dTbgyAEE2Y9nVgXE3dkm2w/CmI18SmgxIZUkzkrQYoO7u7oudlSVPALGpXhK6GmkpM46RXDlWoRoQ/EYYErL2/cze103hrr4p3CVVb4yXhKyRtolgfBMfEgOixbEckibNZQSQt/2nxBU+Jakp52mLnIScvd0lXf4hSYsyTFvk56f0u6QWncsEJkIpG0DWnOU8cuiqkTVfkqxVwJpRx5TKqKs8V2BygFD2pfTXHFBzAeByTIT0HkMzzSg/d4VVewKiHbIr85ji/wOyfj1U6lEi+dAKsJWSbFFZI7CcndJ+jHqbGPUR8nifQmZbt3ejusfnFX94ePg7/gGnExM5f+TplgAAAABJRU5ErkJggg==';
    }

    private getHtml(): string {
        const html =
            ['<div class="xeditor-uploadimage-wrapper">',
                '<div class="xeditor-tabs" style="text-align: center">',
                    '<a class="active" href="javascript:;" data-action="local">本地图片</a>',
                    //'<a href="javascript:;" data-action="remote">网络图片</a>',
                '</div>',
                '<div class="xeditor-uploadimage-content xeditor-uploadimage-content-local">',
                    '<div data-role="list" class="xeditor-uploadimage-uploadlist"></div>',
                    '<div data-role="btn" class="xeditor-uploadimage-uploadbtn">',
                        '<input id="xeditor-uploadimage-inputfile" type="file" class="xeditor-uploadimage-input">',
                    '</div>',
                    '<div class="xeditor-clear"></div>',
                '</div>',
                '<div style="display:none" class="xeditor-uploadimage-content xeditor-uploadimage-content-remote">',
                    '<div class="xeditor-inputtext-wrapper active">',
                        '<input type="text" placeholder="图片地址 http://">',
                    '</div>',
                    '<div class="xeditor-uploadimage-remote-preview"><img src="'+ this.previewIcon +'"></div>',
                '</div>',
            '</div>'].join('');

        return html;
    }

    private getWrapper() {
        return this.dialogRef.getContentDom().querySelector('.xeditor-uploadimage-wrapper');
    }

    private bindEvent(): void {
        let _self = this;
        let wrapper = this.getWrapper();
        let contents = wrapper.querySelectorAll('.xeditor-uploadimage-content');
        let remoteImageInput = wrapper.querySelector('input[type="text"]');
        let previewBox = remoteImageInput.parentNode.nextSibling;

        // 默认图
        previewBox.firstChild.src = this.previewIcon;

        this.dialogRef.onOk = () => {
            _self.insertImage();
        };

        // tab 切换 确定取消 删除图片
        wrapper.onclick = (e) => {
            let target = e.target;
            let action = target.getAttribute('data-action');

            if(null === action) {
                return;
            }

            if('local' === action || 'remote' === action) {
                let tabs = target.parentNode.querySelectorAll('a');

                for(let i=0,len=contents.length; i<len; i++) {
                    contents[i].style.display = 'none';
                }
                for(let i=0,len=tabs.length; i<len; i++) {
                    tabs[i].className = '';
                }

                contents['local' === action ? 0 : 1].style.display = 'block';
                target.className = 'active';

                return;
            }

            if('del' === action) {
                target.parentNode.parentNode.removeChild(target.parentNode);

                return;
            }
        };

        // 远程图片
        remoteImageInput.onkeyup = function(e) {
            let value = this.value;

            previewBox.firstChild.src = '' === value ? _self.previewIcon : value;
        };
    }

    private initUpload(): void {
        let _self = this;

        // configs
        let options = this.editor.configs.widgetsOptions;
        if(undefined === options || undefined === options.image) {
            throw new Error('The image widget miss configs');
        }

        this.uploader = new FileUploader({
            fileElement: this.editor.doc.getElementById('xeditor-uploadimage-inputfile'),
            fieldName: options.image.fieldName,
            accept: options.image.accept,
            fileSizeLimit: options.image.fileSizeLimit
        });
        this.uploader.fileQueuedHandler = (file) => {
            _self.renderProgressView(file);
        };
        // 选完文件手动调用上传
        this.uploader.filesQueuedCompleteHandler = (obj) => {
            if(undefined === options.image.beforeUpload) {
                _self.uploader.configs.server = options.image.server;
                _self.uploader.startUpload();
                return;
            }

            options.image.beforeUpload((ret) => {
                _self.uploader.configs.server = ret.server;
                _self.uploader.replacePostParams(ret.params);

                _self.uploader.startUpload();
            });
        };
        this.uploader.uploadProgressHandler = (file, percent) => {
            let wrapper = _self.editor.doc.getElementById(file.id);

            wrapper.firstChild.firstChild.style.width = percent * 100 + '%';
        };
        this.uploader.uploadSuccessHandler = (file, serverData) => {
            if(undefined === options.image.uploadSuccess) {
                return;
            }

            //  处理服务端数据 必须返回如下格式数据
            // {uri: 'somepath/name.jpg'}
            let data = options.image.uploadSuccess(serverData);

            _self.renderImageView(file, data.uri);
        };
        this.uploader.uploadCompleteHandler = () => {
            if(undefined !== options.image.uploadComplete) {
                options.image.uploadComplete();
            }
        };
    }

    private renderProgressView(file): void {
        /*
        <div class="xeditor-uploadimage-imageitem">
            <span class="xeditor-uploadimage-progress">
                <span class="xeditor-uploadimage-percent"></span>
            </span>
        </div>
        */

        let doc = this.editor.doc;
        let wrapper = this.getWrapper();
        let listWrapper = wrapper.querySelector('.xeditor-uploadimage-uploadlist');

        let div = doc.createElement('div');
        div.className = 'xeditor-uploadimage-imageitem';
        div.setAttribute('id', file.id);
        div.innerHTML = '<span class="xeditor-uploadimage-progress">'
            + '<span class="xeditor-uploadimage-percent"></span>'
            + '</span>';

        listWrapper.appendChild(div);
    }

    private renderImageView(file, src): void {
        /*
        <div class="xeditor-uploadimage-imageitem">
            <a href="javascript:;" class="xeditor-uploadimage-delete">&times;</a>
            <img src="">
        </div>
        */

        let doc = this.editor.doc;
        let wrapper = this.getWrapper();
        let listWrapper = wrapper.querySelector('.xeditor-uploadimage-uploadlist');

        let old = doc.getElementById(file.id);
        let div = doc.createElement('div');
        div.className = 'xeditor-uploadimage-imageitem';
        div.innerHTML = '<a data-action="del" href="javascript:;" class="xeditor-uploadimage-delete">&times;</a>'
            + '<img src="'+ src +'">';

        listWrapper.insertBefore(div, old);
        listWrapper.removeChild(old);
    }

    private insertImage() {
        let ret = '';
        let wrapper = this.getWrapper();
        let imageListWrapper = wrapper.querySelector('.xeditor-uploadimage-uploadlist');
        let images = imageListWrapper.querySelectorAll('img');
        let firstTab = wrapper.querySelector('a');
        let remoteImageInput = wrapper.querySelector('input[type="text"]');

        // 本地图片
        if(firstTab.className.indexOf('active') >= 0) {
            for(let i=0,len=images.length; i<len; i++) {
                ret += '<p><img src="'+ images[i].getAttribute('src') +'"></p>';
            }

        } else if(remoteImageInput.value) {
            ret = '<p><img src="'+ remoteImageInput.value +'"></p>';
        }

        if('' !== ret) {
            ret += '<p><br></p>';
            Editable.insertHtml(Editable.TYPE_HTML, ret);
        }

        this.dialogRef.close();
    }

    /**
     * @inheritdoc
     */
    onClick(editor: any) {
        this.dialogRef = Dialog.getInstance().open(this.getHtml(), '插入图片');

        this.bindEvent();
        this.initUpload();
    }

    /**
     * @inheritdoc
     */
    statusReflect() {}
}
