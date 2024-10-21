import React from 'react';
import '../index.css';
import { CheckCircleIcon } from '@heroicons/react/24/solid'; // Updated for Heroicons v2

const Task = ({ taskId, taskName, description, type, reward, link, onCheck, onJoin, isCompleted }) => {
    return (
        <div className="relative flex items-center gap-4 rounded-lg border border-gray-600 bg-gray-800 p-3 shadow-md hover:shadow-lg transition-shadow duration-300 w-96">
            <div className="grid grow gap-1.5">
                <span className="font-medium leading-tight text-lg text-white">{taskName}</span>
                <p className="text-sm text-gray-400">{description}</p>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-400">{reward} Coins</span>
                    {
                        !isCompleted && (
                            <span className="h-5 w-px bg-gray-600"></span>
                        )
                    }
                    {/* Conditionally render the Check button or nothing if task is completed */}
                    {!isCompleted && (
                        <button 
                            className="inline-flex items-center justify-center whitespace-nowrap font-medium 
                                    ring-offset-background transition-colors 
                                    focus-visible:outline-none focus-visible:ring-2 
                                    focus-visible:ring-gray-400 focus-visible:ring-offset-2 
                                    disabled:pointer-events-none disabled:opacity-50 
                                    border border-gray-600 bg-gray-700 hover:bg-gray-600 
                                    hover:text-white px-3 text-sm h-8 w-20 rounded-full" 
                            onClick={() => onCheck(taskId)} 
                        >
                            Check
                        </button>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {/* Conditionally render Join button or a checkmark icon if task is completed */}
                {isCompleted ? (
                    <CheckCircleIcon className="h-8 w-8 text-green-500" /> // Green checkmark icon
                ) : (
                    <button 
                        className="justify-center whitespace-nowrap font-medium 
                                ring-offset-background transition-colors 
                                focus-visible:outline-none focus-visible:ring-2 
                                focus-visible:ring-gray-400 focus-visible:ring-offset-2 
                                disabled:pointer-events-none disabled:opacity-50 
                                bg-blue-600 text-white hover:bg-blue-500 
                                flex h-8 w-20 items-center gap-1 rounded-full px-4 py-1 text-sm"
                        onClick={() => onJoin(link)} 
                    >
                        Join
                    </button>
                )}
            </div>
        </div>
    );
};

export default Task;
