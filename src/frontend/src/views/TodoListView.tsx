import { useEffect, useState } from "react";
import { backendService } from "../services/backendService";
import { InputField, Button } from "../components";

interface Todo {
  id: bigint;
  text: string;
  completed: boolean;
}

export function TodoListView() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const result = await backendService.getTodos();
      setTodos(result);
    } catch (e: any) {
      setError(e.message || "Failed to fetch todos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAdd = async () => {
    if (!newTodo.trim()) return;
    setLoading(true);
    try {
      await backendService.addTodo(newTodo.trim());
      setNewTodo("");
      fetchTodos();
    } catch (e: any) {
      setError(e.message || "Failed to add todo");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: bigint) => {
    setLoading(true);
    try {
      await backendService.toggleTodo(id);
      fetchTodos();
    } catch (e: any) {
      setError(e.message || "Failed to toggle todo");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: bigint) => {
    setLoading(true);
    try {
      await backendService.deleteTodo(id);
      fetchTodos();
    } catch (e: any) {
      setError(e.message || "Failed to delete todo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-700 rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-bold mb-4">Todo List</h3>
      <div className="flex gap-2 mb-4">
        <InputField
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
        />
        <Button onClick={handleAdd} disabled={loading || !newTodo.trim()}>
          Add
        </Button>
      </div>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      <ul className="space-y-2">
        {todos.map(todo => (
          <li
            key={todo.id.toString()}
            className="flex items-center justify-between bg-gray-800 rounded px-3 py-2"
          >
            <span
              className={`flex-1 cursor-pointer ${todo.completed ? "line-through text-gray-400" : ""}`}
              onClick={() => handleToggle(todo.id)}
            >
              {todo.text}
            </span>
            <Button
              onClick={() => handleDelete(todo.id)}
              disabled={loading}
              className="ml-2 bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
      {loading && <div className="mt-2 text-gray-300">Loading...</div>}
    </div>
  );
} 