/**
 * 选区
 */
export default class Range {

    public static TOP_ROLE: string = 'xeditor-root';

    public nativeRange: any;

    public collapsed: boolean;
    public startContainer: any;
    public endContainer: any;
    public startOffset: number;
    public endOffset: any;
    public commonAncestorContainer: any;

    constructor(nativeRange) {
        this.nativeRange = nativeRange;
    
        this.collapsed = nativeRange.collapsed;
        this.startContainer = nativeRange.startContainer;
        this.endContainer = nativeRange.endContainer;
        this.startOffset = nativeRange.startOffset;
        this.endOffset = nativeRange.endOffset;
        this.commonAncestorContainer  = nativeRange.commonAncestorContainer;
    }

    public static getSingleRangeFromNativeSelection(): any {
        let selection = null;
        
        if( null !== (selection = Range.getSelectionFromNative()) ) {        
            if(0 === selection.rangeCount) {
                return null;
            }
            
            return new Range(selection.getRangeAt(0));
        }
        
        return null;
    }

    public static createNativeRange(): any {
        if('function' === typeof document.createRange) {
            return document.createRange();
        }
        
        return null;
    }

    public static getSelectionFromNative(): any {
        if('function' === typeof window.getSelection) {
            return window.getSelection();
        }
        
        return null;
    }

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
    public getClosestContainerElement(): any {
        let node = this.startContainer;
        
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
    public getOutermostElement(basedOnEnd: boolean = false): any {
        let node: any = basedOnEnd
            ? this.endContainer
            : this.startContainer;
        
        // 文本直接在可编辑容器下面
        if(3 === node.nodeType && Range.TOP_ROLE === node.parentNode.getAttribute('data-role')) {
            return null;
        }
        // 选区直接在可编辑容器下面
        if(1 === node.nodeType && Range.TOP_ROLE === node.getAttribute('data-role')) {
            return null;
        }
        
        while( null !== node && Range.TOP_ROLE !== node.parentNode.getAttribute('data-role') ) {
            node = node.parentNode;
        }
        
        return node;
    }

    /**
     * 当前选区是否在某个元素中
     *
     * @param {String} nodeName 小写标签名
     * @param {Boolean} basedOnEnd
     */
    public currentInNode(nodeName: string, basedOnEnd: boolean = false): boolean {
        let ret = false;
        let node: any = basedOnEnd
            ? this.endContainer
            : this.startContainer;
        
        // 文本直接在可编辑容器下面
        if(3 === node.nodeType && Range.TOP_ROLE === node.parentNode.getAttribute('data-role')) {
            return false;
        }
        // 选区直接在可编辑容器下面
        if(1 === node.nodeType && Range.TOP_ROLE === node.getAttribute('data-role')) {
            return false;
        }
        
        while( null !== node ) {
            if(1 === node.nodeType && Range.TOP_ROLE === node.getAttribute('data-role')) {
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

    /**
     * 获取从可编辑元素到光标之前的节点路径
     */
    public pathInfo(basedOnEnd: boolean = false): any[] {
        let ret = [];

        let node: any = basedOnEnd
            ? this.endContainer
            : this.startContainer;

        ret.push(node);

        while( null !== node && Range.TOP_ROLE !== node.parentNode.getAttribute('data-role') ) {
            node = node.parentNode;

            ret.push(node);
        }

        return ret.reverse();
    }

    // public setStart(startNode: any, startOffset: number): void {
    //     this.nativeRange.setStart(startNode, startOffset);
        
    //     this.startContainer = startNode;
    //     this.startOffset = startOffset;
    // }
    
    // public setEnd(endNode: any, endOffset: number): void {
    //     this.nativeRange.setEnd(endNode, endOffset);
        
    //     this.endContainer = endNode;
    //     this.endOffset = endOffset;
    // }
    
    public insertNode(newNode): void {
        this.nativeRange.insertNode(newNode);
    }
    
    public collapse(toStart?: boolean): void {
        this.nativeRange.collapse(toStart);
        
        // this.collapsed = true;
    }
    
    public selectNode(referenceNode: any): void {
        this.nativeRange.selectNode(referenceNode);
        
    //     // 选中节点 属性会变更
    //     this.collapsed = false;
    //     this.startContainer = referenceNode.parentNode;
    //     this.endContainer = referenceNode.parentNode;
    //     this.commonAncestorContainer = referenceNode.parentNode;
        
    //     var i = 0;
    //     for(var len=referenceNode.parentNode.childNodes.length; i<len; i++) {
    //         if(referenceNode === referenceNode.parentNode.childNodes[i]) {
    //             break;
    //         }
    //     }
    //     this.startOffset = i;
    //     this.endOffset = i + 1;
    }
    
    // public selectNodeContents(referenceNode: any): void {
    //     this.nativeRange.selectNodeContents(referenceNode);
        
    //     this.collapsed = false;
    //     this.startContainer = referenceNode;
    //     this.endContainer = referenceNode;
    //     this.commonAncestorContainer = referenceNode;
        
    //     this.startOffset = 0;
    //     // If the nodeType of referenceNode is one of Text, Comment, or CDATASection
    //     // then the endOffset is the number of characters contained in the reference node.
    //     // For other Node types
    //     // endOffset is the number of child nodes.
    //     if(3 === referenceNode.nodeType || 4 === referenceNode.nodeType
    //         || 8 === referenceNode.nodeType) {
            
    //         this.endOffset = referenceNode.nodeValue.length;
            
    //     } else {
    //         this.endOffset = referenceNode.childNodes.length;
    //     }
    // }
    
    public deleteContents(): void {
        this.nativeRange.deleteContents();
    }

}
