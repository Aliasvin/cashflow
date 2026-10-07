import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({open,title,onClose,children}:{open:boolean;title:string;onClose:()=>void;children:ReactNode}){
 useEffect(()=>{if(!open)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';const key=(e:KeyboardEvent)=>e.key==='Escape'&&onClose();window.addEventListener('keydown',key);return()=>{document.body.style.overflow=old;window.removeEventListener('keydown',key)}},[open,onClose]);
 if(!open)return null;
 return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal-panel" role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><h2>{title}</h2><button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Sluiten"><X size={21}/></button></div>{children}</div></div>
}
