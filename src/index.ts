import Editor from './Editor';

import IWidget from './widgets/IWidget';
import Editable from './Editable';
import Tools from './Tools';

import Dialog from './com/Dialog';
import Pop from './com/Pop';

import Bold from './widgets/bold/Bold';
import Blockquote from './widgets/Blockquote/Blockquote';
import Font from './widgets/font/Font';
import Emotion from './widgets/emotion/Emotion';
import Image from './widgets/image/Image';

Editor.registerWidgetController('bold', Bold);
Editor.registerWidgetController('blockquote', Blockquote);
Editor.registerWidgetController('font', Font);
Editor.registerWidgetController('emotion', Emotion);
Editor.registerWidgetController('image', Image);

Editor.IWidget = IWidget;
Editor.Editable = Editable;
Editor.Tools = Tools;

Editor['Dialog'] = Dialog;
Editor['Pop'] = Pop;
export default Editor;
