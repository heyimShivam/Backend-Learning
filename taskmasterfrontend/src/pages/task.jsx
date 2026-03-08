import { useEffect, useState } from "react";

const Task = () => {
    const [task, setTask] = useState({
        title: '',
        description: ''
    });

    const [taskData, setTaskData] = useState([]);

    const addTask = async (event) => {
        event.preventDefault();
        let payload = JSON.stringify(task);

        await fetch("http://localhost:4444/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: payload,
            credentials: "include"
        }).then(
            res => res.json()
        ).then((res) => {
            console.log(res);
            fetchDataFromBackend();
        }).catch(err => {
            console.log(err);
        });
    };

    function updateTask(event) {
        const { name, value } = event.target;

        setTask((prevDetails) => {
            return {
                ...prevDetails,
                [name]: value
            }
        });
    };

    async function fetchDataFromBackend() {
        console.log('fetcj');

        await fetch("http://localhost:4444/tasks", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        }).then(
            res => res.json()
        ).then((res) => {
            setTaskData(res);
            console.log(res);
        }).catch(err => {
            console.log(err);
        });
    }

    async function updateRow(event) {
        console.log(event.target);
        const { id, checked, dataset } = event.target;
        console.log('is checked ', checked, id, dataset);
        let payload = {
            is_completed: checked
        }

        await fetch(`http://localhost:4444/tasks/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
            credentials: "include"
        }).then(
            res => res.json()
        ).then((res) => {
            console.log(res);

            setTaskData((prevvalue) => {
                prevvalue[dataset.rowno].is_completed = checked;
                return [...prevvalue];
            });
        }).catch(err => {
            console.log(err);
        });

    }
    async function deleteTask(event) {
        const { dataset } = event.target;
        const row = dataset.rowno;
        const id = dataset.id;

        await fetch(`http://localhost:4444/tasks/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        }).then(
            res => res.json()
        ).then((res) => {
            console.log('delete', res);
            setTaskData((prevValue) => {
                const newArray = [...prevValue];
                newArray.splice(row, 1);
                return newArray;
            });
        }).catch(err => {
            console.log(err);
        });
    }
    useEffect(() => {
        fetchDataFromBackend();
    }, []);

    return (<>
        <form onSubmit={addTask}>
            <input type="text" name="title" placeholder="Enter Title here." onChange={updateTask} value={task.title} />
            <textarea type="textarea" name="description" placeholder="Enter Description here." onChange={updateTask} value={task.description} />
            <button type="submit">Submit</button>
        </form>
        {
            taskData.length > 0 ?
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Delete</th>
                        </tr>
                    </thead>

                    <tbody>
                        {
                            taskData.map((value, idx) => (<tr key={value.id}>
                                <td>{value.title}</td>
                                <td>{value.description}</td>
                                <td><input type="checkbox" id={value.id} onChange={updateRow} checked={value.is_completed} data-rowno={idx} /></td>
                                <td>{new Date(value.created_at).toLocaleDateString()}</td>
                                <td><span data-id={value.id} data-rowno={idx} onClick={deleteTask}>🗑️</span></td>
                            </tr>))
                        }
                    </tbody>
                </table> :
                <h3>Add new task</h3>
        }
    </>);
}

export default Task;