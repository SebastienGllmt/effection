import React, { useState } from 'react';
import { State } from 'effection';
import { InspectState } from '@effection/inspect-utils';

const ICONS = {
  completing: "✓",
  completed: "✓",
  halting: "◇",
  halted: "◇",
  erroring: "𐄂",
  errored: "𐄂",
};

function taskIcon(state: State): JSX.Element {
  if(state === 'halting' || state === 'halted') {
    return (
      <div className="task--title--icon">
        <img src={(new URL("halted.svg", import.meta.url)).toString()}/>
      </div>
    );
  } else if(state === 'completing' || state === 'completed') {
    return (
      <div className="task--title--icon">
        <img src={(new URL("completed.svg", import.meta.url)).toString()}/>
      </div>
    );
  } else if(state === 'erroring' || state === 'errored') {
    return (
      <div className="task--title--icon">
        <img src={(new URL("failed.svg", import.meta.url)).toString()}/>
      </div>
    );
  } else {
    return null;
  }

}

type TreeProps = {
  task: InspectState;
  isYielding?: boolean;
}

export function TaskTree({ task, isYielding }: TreeProps): JSX.Element {
  let [isOpen, setOpen] = useState<boolean>((task.labels.expand != null) ? !!task.labels.expand : true);
  let name = task.labels.name || 'task';
  let labels = Object.entries(task.labels).filter(([key, value]) => key !== 'name' && key !== 'expand' && value != null);
  return (
    <div className={`task ${task.state}`}>
      <div className="task--title">
        {
          task.yieldingTo || task.children.length ?
            <button className="task--title--expand" title={(isOpen ? 'Collapse' : 'Expand') + ' ' + name} onClick={() => setOpen(!isOpen)}>
              {isOpen ? '-' : '+'}
            </button>
          :
            <button disabled className="task--title--expand disabled"></button>
        }
        {isYielding ? <div className="task--title--yield">yield</div> : null}
        {taskIcon(task.state)}
        <div className="task--title--name">
          {name}
        </div>
        {
          labels.map(([key, value]) => {
            return (
              <div className="task--label" key={key}>
                <div className="task--label--title">{key}</div>
                <div className="task--label--value">{value}</div>
              </div>
            );
          })
        }
        <div className="task--title--type">{task.type} </div>
        <div className="task--title--id">[id: {task.id}] </div>
      </div>

      {isOpen ? <>
        <div className="task--details">
          {task.yieldingTo ? <>
            <div className="task--yielding-to">
              <TaskTree task={task.yieldingTo} isYielding={true}/>
            </div>
          </> : null}

          {task.children.length ? <>
            <ol className="task--list">
              {
                task.children.map((child) => {
                  return (
                    <li className="task--list--element" key={child.id}>
                      <TaskTree task={child}/>
                    </li>
                  );
                })
              }
            </ol>
          </> : null}
        </div>
      </> : null}
    </div>
  );
}
