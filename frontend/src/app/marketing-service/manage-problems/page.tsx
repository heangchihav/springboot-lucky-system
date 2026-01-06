"use client";

import { useEffect, useState } from "react";
import { MarketingServiceGuard } from "@/components/marketing-service/MarketingServiceGuard";
import { problemService, type MarketingProblem, type ProblemPayload } from "@/services/marketing-service/problemService";

type Problem = MarketingProblem;

export default function ManageProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [newProblemName, setNewProblemName] = useState("");
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    tone: "success" | "error" = "success",
  ) => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3000);
  };

  // Load problems from API
  const loadProblems = async () => {
    setLoading(true);
    try {
      const data = await problemService.listProblems();
      setProblems(data);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to load problems",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProblems();
  }, []);

  const handleAddProblem = async () => {
    if (!newProblemName.trim()) {
      showToast("Problem name is required", "error");
      return;
    }

    setLoading(true);
    try {
      const payload: ProblemPayload = {
        name: newProblemName.trim(),
      };
      
      const createdProblem = await problemService.createProblem(payload);
      setProblems(prev => [createdProblem, ...prev]);
      setNewProblemName("");
      showToast("Problem added successfully");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to add problem",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditProblem = async () => {
    if (!editName.trim() || !editingProblem) {
      showToast("Problem name is required", "error");
      return;
    }

    setLoading(true);
    try {
      const payload: ProblemPayload = {
        name: editName.trim(),
      };

      const updatedProblem = await problemService.updateProblem(editingProblem.id, payload);
      
      setProblems(prev =>
        prev.map(problem =>
          problem.id === editingProblem.id ? updatedProblem : problem
        )
      );

      setEditingProblem(null);
      setEditName("");
      showToast("Problem updated successfully");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to update problem",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProblem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this problem? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      await problemService.deleteProblem(id);
      setProblems(prev => prev.filter(problem => problem.id !== id));
      showToast("Problem deleted successfully");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete problem",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const startEdit = (problem: Problem) => {
    setEditingProblem(problem);
    setEditName(problem.name);
  };

  const cancelEdit = () => {
    setEditingProblem(null);
    setEditName("");
  };

  return (
    <MarketingServiceGuard>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">
            Marketing · Management
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Problem Management
          </h1>
          <p className="text-sm text-slate-300">
            Track and manage problems or issues in the marketing operations.
          </p>
        </header>

        {toast && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              toast.tone === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Add Problem Form */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Add Problem
            </p>
            <h2 className="text-xl font-semibold text-white">
              Create New Problem Entry
            </h2>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-slate-300 mb-2">
                Problem Name
              </label>
              <input
                type="text"
                value={newProblemName}
                onChange={(e) => setNewProblemName(e.target.value)}
                placeholder="Enter problem description..."
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-400 focus:border-amber-400/60 focus:outline-none"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    handleAddProblem();
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddProblem}
                disabled={loading || !newProblemName.trim()}
                className="rounded-2xl bg-linear-to-r from-amber-500/90 to-orange-500/90 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:from-amber-400 hover:to-orange-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Adding..." : "Add Problem"}
              </button>
            </div>
          </div>
        </section>

        {/* Problems Table */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Problems List
              </p>
              <h2 className="text-xl font-semibold text-white">
                Current Problems ({problems.length})
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Created At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Updated At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {problems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <div className="text-slate-500">
                        <p className="text-lg font-medium">No problems found</p>
                        <p className="text-sm mt-1">Add your first problem using the form above.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  problems.map((problem) => (
                    <tr key={problem.id} className="hover:bg-white/5">
                      <td className="px-4 py-4 text-sm text-slate-300">
                        #{problem.id}
                      </td>
                      <td className="px-4 py-4">
                        {editingProblem?.id === problem.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white focus:border-amber-400/60 focus:outline-none"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !loading) {
                                handleEditProblem();
                              } else if (e.key === "Escape") {
                                cancelEdit();
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium text-white">
                            {problem.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">
                        {formatDate(problem.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">
                        {formatDate(problem.updatedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {editingProblem?.id === problem.id ? (
                            <>
                              <button
                                onClick={handleEditProblem}
                                disabled={loading}
                                className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={loading}
                                className="rounded-lg bg-slate-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-slate-700"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(problem)}
                                disabled={loading}
                                className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProblem(problem.id)}
                                disabled={loading}
                                className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MarketingServiceGuard>
  );
}