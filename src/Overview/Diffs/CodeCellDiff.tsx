import React from 'react';


export function CodeCellDiff({content} : {content: string}) {
    return (
        <div className="cell CodeMirror">{content}</div>
    );
}