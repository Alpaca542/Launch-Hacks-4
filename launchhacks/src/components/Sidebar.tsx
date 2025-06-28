import { useState } from "react";
import { Handle, Position } from "reactflow";
import "./EditableNode.css";

function SideBar({ allBoards, currentBoard, onSwitchBoard, onCreateBoard, onSignOut }) {
    return (
        <>
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>Launch Hacks</h2>
                    <button onClick={onCreateBoard}>+ New Board</button>
                </div>
                <div className="sidebar-content">
                    <ul>
                        {allBoards?.map((board) => (
                            <li
                                key={board.id}
                                onClick={() => onSwitchBoard(board.id)}
                                className={currentBoard?.id === board.id ? 'active' : ''}
                            >
                                {board.name}
                                {board.isOpen && <span className="open-indicator">●</span>}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="sidebar-footer">
                    <button onClick={onSignOut}>Sign Out</button>
                </div>
            </div>
        </>
    );
}

export default SideBar;
