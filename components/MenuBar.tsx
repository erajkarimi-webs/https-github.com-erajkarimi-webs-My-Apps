import React, { useState, useEffect, useRef } from 'react';

interface MenuBarProps {
    onNew: () => void;
    onOpen: () => void;
    onSave: () => void;
    onExport: () => void;
    onExit: () => void;
    onBack: () => void;
    onStartOver: () => void;
    showNavigationButtons: boolean;
}

const MenuBar: React.FC<MenuBarProps> = ({ onNew, onOpen, onSave, onExport, onExit, onBack, onStartOver, showNavigationButtons }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMenuItemClick = (action: () => void) => {
        action();
        setIsMenuOpen(false);
    };

    return (
        <nav className="bg-gray-200 rounded-md shadow-sm w-full mb-4 flex items-center px-1 py-1">
            <div className="relative inline-block text-left" ref={menuRef}>
                <div>
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="inline-flex justify-center w-full rounded-md px-4 py-2 bg-gray-200 text-sm font-medium text-gray-800 hover:bg-gray-300 focus:outline-none"
                    >
                        File
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                            <button
                                onClick={() => handleMenuItemClick(onNew)}
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                role="menuitem"
                            >
                                New
                            </button>
                            <button
                                onClick={() => handleMenuItemClick(onOpen)}
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                role="menuitem"
                            >
                                Open...
                            </button>
                            <button
                                onClick={() => handleMenuItemClick(onSave)}
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                role="menuitem"
                            >
                                Save
                            </button>
                             <button
                                onClick={() => handleMenuItemClick(onExport)}
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                role="menuitem"
                            >
                                Export...
                            </button>
                            <div className="border-t border-gray-100"></div>
                            <button
                                onClick={() => handleMenuItemClick(onExit)}
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                role="menuitem"
                            >
                                Exit
                            </button>
                        </div>
                    </div>
                )}
            </div>
             {showNavigationButtons && (
                <div className="flex items-center gap-2 ml-2">
                    <button
                        onClick={onBack}
                        className="px-3 py-1 bg-slate-400 hover:bg-slate-500 text-white text-sm font-medium rounded-md shadow-sm transition"
                    >
                        Back
                    </button>
                    <button
                        onClick={onStartOver}
                        className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-md shadow-sm transition"
                    >
                        Start Over
                    </button>
                </div>
            )}
        </nav>
    );
};

export default MenuBar;