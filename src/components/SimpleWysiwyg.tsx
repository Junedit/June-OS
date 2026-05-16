import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link, Heading1, Heading2, Type, PaintBucket, Type as TypeIcon, Quote, Minus, Strikethrough, Eraser, Image as ImageIcon } from 'lucide-react';

interface SimpleWysiwygProps {
    value: string;
    onChange: (value: string) => void;
    availableVariables?: string[];
    placeholder?: string;
}

export const SimpleWysiwyg: React.FC<SimpleWysiwygProps> = ({ value, onChange, availableVariables = [], placeholder = "Start typing your content here..." }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);
    const bgColorInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (editorRef.current && document.activeElement !== editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || "";
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command: string, arg?: string) => {
        document.execCommand(command, false, arg);
        editorRef.current?.focus();
        if (editorRef.current) {
             onChange(editorRef.current.innerHTML);
        }
    };

    const insertVariable = (variable: string) => {
        if (!variable) return;
        
        // Ensure editor is focused
        editorRef.current?.focus();
        
        // Insert text at cursor
        execCommand('insertText', variable);
    };

    return (
        <div className="border border-white/[0.06]/50 rounded-2xl overflow-hidden bg-[#000000]/40 flex flex-col focus-within:border-zinc-500 transition-colors">
            <div className="flex gap-1 items-center p-2 border-b border-white/[0.04] bg-[#000000] flex-wrap shrink-0">
                <button type="button" onClick={() => execCommand('bold')} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Bold"><Bold size={16} /></button>
                <button type="button" onClick={() => execCommand('italic')} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Italic"><Italic size={16} /></button>
                <button type="button" onClick={() => execCommand('underline')} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Underline"><Underline size={16} /></button>
                <button type="button" onClick={() => execCommand('strikeThrough')} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Strikethrough"><Strikethrough size={16} /></button>
                <div className="w-px h-6 bg-[#141414] mx-1"></div>
                <button type="button" onClick={() => execCommand('justifyLeft')} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Align Left"><AlignLeft size={16} /></button>
                <button type="button" onClick={() => execCommand('justifyCenter')} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Align Center"><AlignCenter size={16} /></button>
                <button type="button" onClick={() => execCommand('justifyRight')} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Align Right"><AlignRight size={16} /></button>
                <div className="w-px h-6 bg-[#141414] mx-1"></div>
                <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Bullet List"><List size={16} /></button>
                <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Numbered List"><ListOrdered size={16} /></button>
                <button type="button" onClick={() => { const url = prompt("URL:"); if(url) execCommand('createLink', url); }} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Link"><Link size={16} /></button>
                <button type="button" onClick={() => { const url = prompt("Image URL:"); if(url) execCommand('insertImage', url); }} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Image"><ImageIcon size={16} /></button>
                <button type="button" onClick={() => {
                    const tableHtml = '<table width="100%" border="1" style="border-collapse: collapse; width: 100%; border: 1px solid #d4d4d8;"><tbody><tr><td style="padding: 8px; border: 1px solid #d4d4d8;">Column 1</td><td style="padding: 8px; border: 1px solid #d4d4d8;">Column 2</td></tr><tr><td style="padding: 8px; border: 1px solid #d4d4d8;">Data 1</td><td style="padding: 8px; border: 1px solid #d4d4d8;">Data 2</td></tr></tbody></table><p><br></p>';
                    execCommand('insertHTML', tableHtml);
                }} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Insert Table">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-table"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
                </button>
                <button type="button" onClick={() => execCommand('formatBlock', 'BLOCKQUOTE')} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Quote"><Quote size={16} /></button>
                <button type="button" onClick={() => execCommand('insertHorizontalRule')} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Horizontal Line"><Minus size={16} /></button>
                <div className="w-px h-6 bg-[#141414] mx-1"></div>
                <button type="button" onClick={() => execCommand('formatBlock', 'H1')} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Heading 1"><Heading1 size={16} /></button>
                <button type="button" onClick={() => execCommand('formatBlock', 'H2')} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Heading 2"><Heading2 size={16} /></button>
                <button type="button" onClick={() => execCommand('formatBlock', 'P')} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Paragraph"><Type size={16} /></button>
                <div className="w-px h-6 bg-[#141414] mx-1"></div>
                
                {/* Text Color Picker */}
                <div className="relative group flex items-center">
                   <button type="button" onClick={() => colorInputRef.current?.click()} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Text Color"><TypeIcon size={16} /></button>
                   <input 
                      ref={colorInputRef}
                      type="color" 
                      onChange={(e) => execCommand('foreColor', e.target.value)} 
                      className="absolute opacity-0 w-0 h-0" 
                   />
                </div>
                
                {/* Background Color Picker */}
                <div className="relative group flex items-center">
                   <button type="button" onClick={() => bgColorInputRef.current?.click()} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Background Color"><PaintBucket size={16} /></button>
                   <input 
                      ref={bgColorInputRef}
                      type="color" 
                      onChange={(e) => execCommand('hiliteColor', e.target.value)} 
                      className="absolute opacity-0 w-0 h-0" 
                   />
                </div>
                
                <div className="w-px h-6 bg-[#141414] mx-1"></div>
                <select defaultValue="" onChange={(e) => execCommand('fontName', e.target.value)} className="bg-[#000000] border border-white/[0.06] text-white/80 text-xs rounded px-2 py-1 outline-none focus:border-white/20 mr-1">
                    <option value="" disabled>Font Family...</option>
                    <option value="Arial">Arial</option>
                    <option value="'Courier New'">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Tahoma">Tahoma</option>
                    <option value="'Times New Roman'">Times New Roman</option>
                    <option value="Verdana">Verdana</option>
                </select>
                <select defaultValue="" onChange={(e) => execCommand('fontSize', e.target.value)} className="bg-[#000000] border border-white/[0.06] text-white/80 text-xs rounded px-2 py-1 outline-none focus:border-white/20 mr-1">
                    <option value="" disabled>Size...</option>
                    <option value="1">Small</option>
                    <option value="3">Normal</option>
                    <option value="5">Large</option>
                    <option value="7">Huge</option>
                </select>
                <div className="w-px h-6 bg-[#141414] mx-1"></div>
                <button type="button" onClick={() => execCommand('removeFormat')} className="p-1.5 hover:bg-[#141414] rounded text-white/60 hover:text-white transition-colors" title="Clear Formatting"><Eraser size={16} /></button>

                {availableVariables.length > 0 && (
                    <>
                        <div className="w-px h-6 bg-[#141414] mx-1"></div>
                        <select 
                            onChange={(e) => insertVariable(e.target.value)}
                            value=""
                            className="bg-[#000000] border border-white/[0.06] text-white/80 text-xs rounded px-2 py-1 outline-none hover:border-zinc-500"
                        >
                            <option value="" disabled>Insert Variable...</option>
                            {availableVariables.map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                    </>
                )}
            </div>
            
            <style>{`
                .simple-wysiwyg-content p { margin-bottom: 0.75em; min-height: 1em; }
                .simple-wysiwyg-content h1 { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; margin-top: 1em; }
                .simple-wysiwyg-content h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; margin-top: 1em; }
                .simple-wysiwyg-content ul { list-style-type: disc; margin-left: 1.5em; margin-bottom: 1em; }
                .simple-wysiwyg-content ol { list-style-type: decimal; margin-left: 1.5em; margin-bottom: 1em; }
                .simple-wysiwyg-content blockquote { border-left: 4px solid #e4e4e7; padding-left: 1rem; background: #fafafa; border-radius: 4px; color: #52525b; font-style: italic; margin-bottom: 1em; margin-top: 1em; }
                .simple-wysiwyg-content hr { border: none; border-top: 1px solid #e4e4e7; margin: 2rem 0; }
                .simple-wysiwyg-content a { color: #007AFF; text-decoration: underline; }
                .simple-wysiwyg-content strike { text-decoration: line-through; }
                .simple-wysiwyg-content img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0; }
                .simple-wysiwyg-content table { border-collapse: collapse; width: 100%; border: 1px solid #d4d4d8; margin: 1rem 0; }
                .simple-wysiwyg-content td, .simple-wysiwyg-content th { border: 1px solid #d4d4d8; padding: 0.75rem; text-align: left; }
                .simple-wysiwyg-content:empty:before { content: attr(data-placeholder); color: #52525b; font-style: italic; }
            `}</style>
            
            <div 
                ref={editorRef}
                contentEditable 
                onInput={handleInput} 
                onBlur={handleInput}
                data-placeholder={placeholder}
                className="simple-wysiwyg-content p-5 min-h-[350px] flex-1 bg-[var(--brand-primary)] text-white focus:outline-none"
            ></div>
        </div>
    );
};
