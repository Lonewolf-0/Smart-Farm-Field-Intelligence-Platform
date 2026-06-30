import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useField } from "../context/FieldContext";
import { useState, useEffect } from "react";
import CurrentTasksWidget from "../components/Dashboard/CurrentTasksWidget";
import UpcomingWeekWidget from "../components/Dashboard/UpcomingWeekWidget";
import FieldSummaryCard from "../components/Dashboard/FieldSummaryCard";
import WeatherWidget from "../components/Dashboard/WeatherWidget";
import AddTaskModal from "../components/Dashboard/AddTaskModal";
import type { TaskInput } from "../components/Dashboard/AddTaskModal";
import type { Task } from "../types";
import FarmMap from "../components/Map/FarmMap";
import api from "../services/api";

function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const { fields: savedFields, selectedFieldId, setSelectedFieldId } = useField();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  
  // Fetch branches for the map
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get("/branches");
        if (res.data && res.data.data) {
          setBranches(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch branches", err);
      }
    };
    fetchBranches();
  }, []);

  // Load tasks from localStorage or use mock data
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("dashboard_tasks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { 
        id: "1", 
        userId: "u1", 
        title: "Scheduled spraying was not performed.", 
        completed: false, 
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'Plowing'
      },
      { 
        id: "2", 
        userId: "u1", 
        title: "Field fertilization required in the 3 days. Wheat #2", 
        completed: false, 
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'Fertilization'
      },
      {
        id: "3",
        userId: "u1",
        title: "Delivery pickup scheduled.",
        completed: false,
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'Shipment'
      }
    ];
  });

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("dashboard_tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleSaveTask = (input: TaskInput) => {
    const linkedField = savedFields.find(f => f.id === input.fieldId);
    if (taskToEdit) {
      // Edit mode
      setTasks(tasks.map(t => t.id === taskToEdit.id ? {
        ...t,
        title: input.title,
        dueDate: input.dueDate,
        category: input.category,
        fieldId: input.fieldId,
        fieldName: linkedField ? linkedField.name : undefined,
      } : t));
      setTaskToEdit(null);
    } else {
      // Add mode
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user?.id || "u1",
        title: input.title,
        dueDate: input.dueDate,
        category: input.category,
        completed: false,
        fieldId: input.fieldId,
        fieldName: linkedField ? linkedField.name : undefined,
      };
      setTasks([...tasks, newTask]);
    }
    setIsModalOpen(false);
  };

  const handleEditTaskClick = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleCompleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  if (isAuthenticated && user) {
    return (
      <div className="w-full h-[calc(100vh-8rem)] flex overflow-hidden">
        <div className="w-full h-full flex rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl overflow-hidden gap-6">
          <div className="flex w-full gap-6">
            {/* Left Column: Weather */}
            <div className="hidden lg:flex flex-col w-[300px] shrink-0 h-full">
              <WeatherWidget />
            </div>

            {/* Middle Column: Dashboard Widgets */}
            <div className="flex-1 flex flex-col h-full gap-6">
              {/* Header */}
              <div className="flex items-center justify-between shrink-0 h-8">
                <h2 className="text-3xl font-bold text-white tracking-tight leading-none">Dashboard</h2>
              </div>

              {/* Top Row: Tasks & Your Fields */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0">
                <div className="h-full min-h-0">
                  <CurrentTasksWidget 
                    tasks={tasks} 
                    onAddTaskClick={() => setIsModalOpen(true)}
                    onCompleteTask={handleCompleteTask}
                    onEditTaskClick={handleEditTaskClick}
                  />
                </div>
                <div className="h-full min-h-0">
                  <FieldSummaryCard 
                    fields={savedFields} 
                    onSelectField={setSelectedFieldId}
                    selectedFieldId={selectedFieldId}
                  />
                </div>
              </div>

              {/* Bottom Row: Upcoming Week */}
              <div className="h-80 shrink-0">
                <UpcomingWeekWidget tasks={tasks} />
              </div>
            </div>

            {/* Right Column: Dashboard Map */}
            <div className="hidden lg:flex flex-col w-[525px] shrink-0 h-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50">
              <FarmMap 
                savedFields={savedFields} 
                selectedFieldId={selectedFieldId} 
                readOnly={true} 
                branches={branches} 
                showFieldMarkers={true}
              />
            </div>
          </div>
        </div>
        <AddTaskModal 
          isOpen={isModalOpen}
          onSave={handleSaveTask}
          onCancel={() => {
            setIsModalOpen(false);
            setTaskToEdit(null);
          }}
          taskToEdit={taskToEdit}
        />
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            A clean routed start for the Smart Farm platform.
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/map" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/20">
              Open the map <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomePage;
