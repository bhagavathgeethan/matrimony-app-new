// Renders an overlay at the top of the page, so a fixed sheet is never trapped under the tab bar or
// inside an animated card it was opened from.
import { createPortal } from 'react-dom';

export const Portal = ({ children }) => createPortal(children, document.body);
