/**
 * 插件接口
 */
export default abstract class IWidget {

    constructor(editor) {
        editor.on('selectionchange', this.statusReflect, this);
    }

    /**
     * 点击按钮执行的操作
     */
    public abstract onClick(editor: any): void;

    /**
     * 状态反射
     */
    public abstract statusReflect(): void;

}
