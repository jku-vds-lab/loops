import React from 'react';
import { CodeCellDiff } from './Diffs/CodeCellDiff';


export function State({ }) {
    return (
        <div className='state'>
            <CodeCellDiff content={"1\n2"}/>
            <CodeCellDiff content={" "}/>
            <CodeCellDiff content={" "}/>
        </div>
    );
}