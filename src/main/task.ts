interface Command {
    tasks: Task[];
    label: string;
    onError: Task;
    finally: Task;
    propagateErrors: boolean;
}

interface Task {
    type: string;
    command?: string;
    parallelTasks?: Task[];
    index?: number;
}

class TaskExecutionError extends Error {
    public lineNumber: number;
    constructor(errorMessage: string, lineNumber: number) {
        super(errorMessage);
        this.lineNumber = lineNumber;
    }
}

class NotYetSupportedError extends Error {}

export { Command, Task, TaskExecutionError, NotYetSupportedError };
